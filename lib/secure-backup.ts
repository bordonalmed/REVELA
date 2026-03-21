'use client';

import { exportBackup, type BackupData } from './storage';

/**
 * Payload de backup criptografado pronto para envio ao backend.
 * A chave NUNCA é enviada, apenas os metadados para derivação (salt, iterações).
 */
export interface EncryptedBackupPayload {
  version: number;
  createdAt: string;
  kdf: 'PBKDF2';
  kdfSalt: string; // base64
  kdfIterations: number;
  cipher: 'AES-GCM';
  iv: string; // base64
  ciphertext: string; // base64
}

function encodeBase64(data: ArrayBuffer): string {
  if (typeof window === 'undefined') return '';
  const bytes = new Uint8Array(data);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}

async function deriveKeyFromPassword(
  password: string,
  salt: ArrayBuffer,
  iterations: number
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cria um backup criptografado (AES-GCM + PBKDF2) a partir dos dados locais atuais.
 * A senha NUNCA sai do cliente.
 */
export async function createEncryptedBackup(
  password: string
): Promise<{ payload: EncryptedBackupPayload; rawBackup: BackupData }> {
  if (!password || password.length < 8) {
    throw new Error('Senha de backup muito curta. Use pelo menos 8 caracteres.');
  }

  const backup = await exportBackup();
  const json = JSON.stringify(backup);

  const enc = new TextEncoder();
  const data = enc.encode(json);

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = 120_000;

  const key = await deriveKeyFromPassword(password, salt.buffer, iterations);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const payload: EncryptedBackupPayload = {
    version: 1,
    createdAt: new Date().toISOString(),
    kdf: 'PBKDF2',
    kdfSalt: encodeBase64(salt.buffer),
    kdfIterations: iterations,
    cipher: 'AES-GCM',
    iv: encodeBase64(iv.buffer),
    ciphertext: encodeBase64(ciphertext),
  };

  return { payload, rawBackup: backup };
}

/**
 * Stub de envio para backend.
 * Hoje apenas chama uma rota local que poderá ser implementada futuramente.
 */
export async function sendEncryptedBackupToServer(
  payload: EncryptedBackupPayload
): Promise<void> {
  try {
    await fetch('/api/secure-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Erro ao enviar backup seguro:', error);
    throw new Error('Falha ao enviar backup seguro. Verifique sua conexão.');
  }
}

