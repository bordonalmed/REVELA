'use client';

// Criptografia da sincronização na nuvem (Premium).
// AES-GCM 256 com chave derivada da senha da nuvem do usuário (PBKDF2-SHA256).
// A senha e a chave nunca saem do aparelho: o servidor só recebe dados cifrados,
// o salt e o IV (que não são segredos).

export type Bytes = Uint8Array<ArrayBuffer>;

export const CLOUD_KDF_ITERATIONS = 200_000;
export const CLOUD_PASSWORD_MIN = 8;

export interface CloudKey {
  key: CryptoKey;
  salt: string; // base64
  iterations: number;
}

export function toBase64(bytes: Bytes): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function fromBase64(b64: string): Bytes {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function deriveCloudKey(
  password: string,
  salt?: string,
  iterations = CLOUD_KDF_ITERATIONS
): Promise<CloudKey> {
  const saltBytes = salt ? fromBase64(salt) : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return { key, salt: toBase64(saltBytes), iterations };
}

/** Cifra bytes; o resultado é IV (12 bytes) + texto cifrado. */
export async function encryptBytes(key: CryptoKey, data: Bytes): Promise<Bytes> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  const out = new Uint8Array(iv.length + cipher.length);
  out.set(iv, 0);
  out.set(cipher, iv.length);
  return out;
}

/** Inverso de encryptBytes. Lança erro com senha errada ou dado corrompido. */
export async function decryptBytes(key: CryptoKey, data: Bytes): Promise<Bytes> {
  const iv = data.slice(0, 12);
  const cipher = data.slice(12);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher));
}

export async function encryptJson(key: CryptoKey, value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return toBase64(await encryptBytes(key, bytes));
}

export async function decryptJson<T>(key: CryptoKey, b64: string): Promise<T> {
  const bytes = await decryptBytes(key, fromBase64(b64));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
