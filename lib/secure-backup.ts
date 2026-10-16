'use client';

import { exportBackup, importBackup, type BackupData } from './storage';
import { supabase } from './supabase';

/** Bucket privado no Supabase Storage — RLS restringe cada usuário à própria pasta {user_id}/. */
const SECURE_BACKUP_BUCKET = 'secure-backups';

function secureBackupPath(userId: string): string {
  return `${userId}/backup.json`;
}

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

function decodeBase64(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
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
 * Descriptografa um payload de backup usando a senha original.
 * Lança erro se a senha estiver errada ou o payload estiver corrompido.
 */
export async function decryptBackupPayload(
  payload: EncryptedBackupPayload,
  password: string
): Promise<BackupData> {
  const salt = decodeBase64(payload.kdfSalt);
  const iv = decodeBase64(payload.iv);
  const ciphertext = decodeBase64(payload.ciphertext);

  const key = await deriveKeyFromPassword(password, salt, payload.kdfIterations);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      ciphertext
    );
  } catch {
    throw new Error('Senha incorreta ou backup corrompido.');
  }

  const json = new TextDecoder().decode(plaintext);
  return JSON.parse(json) as BackupData;
}

/**
 * Envia o backup criptografado para o Storage do Supabase, isolado por usuário via RLS
 * (bucket privado `secure-backups`, política restringe cada usuário à própria pasta).
 * A senha nunca sai do cliente — o backend só guarda o ciphertext.
 */
export async function sendEncryptedBackupToServer(
  userId: string,
  payload: EncryptedBackupPayload
): Promise<void> {
  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const { error } = await supabase.storage
    .from(SECURE_BACKUP_BUCKET)
    .upload(secureBackupPath(userId), blob, { upsert: true, contentType: 'application/json' });

  if (error) {
    console.error('Erro ao enviar backup seguro:', error);
    throw new Error('Falha ao enviar backup seguro. Verifique sua conexão.');
  }
}

/**
 * Baixa o backup criptografado salvo na nuvem para este usuário, se existir.
 */
export async function fetchEncryptedBackupFromServer(
  userId: string
): Promise<EncryptedBackupPayload | null> {
  if (!userId) return null;
  const { data, error } = await supabase.storage
    .from(SECURE_BACKUP_BUCKET)
    .download(secureBackupPath(userId));

  if (error || !data) return null;

  const text = await data.text();
  try {
    return JSON.parse(text) as EncryptedBackupPayload;
  } catch {
    return null;
  }
}

/**
 * Baixa, descriptografa e restaura o backup seguro da nuvem para o armazenamento local.
 */
export async function restoreEncryptedBackupFromServer(
  userId: string,
  password: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const payload = await fetchEncryptedBackupFromServer(userId);
  if (!payload) {
    throw new Error('Nenhum backup seguro encontrado na nuvem.');
  }
  const backup = await decryptBackupPayload(payload, password);
  return importBackup(backup);
}

