'use client';

/**
 * Cofre Revela (Premium) — sincronização criptografada entre aparelhos.
 *
 * Como funciona:
 * - O cofre tem uma CHAVE MESTRA aleatória (AES-GCM 256) que tranca fotos e dados.
 * - A chave mestra fica guardada no servidor "embrulhada" (criptografada) de dois jeitos:
 *   pela senha do cofre e pelo código de recuperação. O servidor nunca vê a chave aberta.
 * - Cada aparelho onde o cofre foi aberto guarda a chave mestra localmente (aparelho conectado).
 * - Trocar a senha só reembrulha a chave mestra: nenhuma foto precisa ser reenviada.
 *
 * No Supabase tudo fica na tabela before_after_photos (sem mudança de esquema):
 * - 1 registro de cabeçalho  { __type: 'revela_vault_v1', pw, rc }
 * - 1 registro por projeto   { __type: 'revela_vault_item_v1', projectId, updatedAt, payload }
 * - exclusões                { __type: 'revela_vault_tombstone_v1', projectId, deletedAt }
 * As fotos vão para o bucket em <userId>/<projectId>/v<timestamp>/*.enc.jpg.
 */

import { supabase } from '@/lib/supabase';
import {
  type Project,
  getAllProjectsFromIndexedDB,
  saveProjectToIndexedDB,
  moveProjectToTrash,
  getPendingDeletes,
  clearPendingDelete,
  getPendingPurges,
  clearPendingPurge,
  deleteProjectFromIndexedDB,
} from './storage';
import {
  buildMeta,
  deleteProjectFiles,
  downloadEncryptedImage,
  fetchAll,
  listFilesRecursive,
  listRows,
  markCloudSync,
  MissingImageError,
  parseRow,
  photoCount,
  removeFiles,
  uploadEncryptedImage,
  type CloudProjectMeta,
  type ImagePaths,
  type ProgressFn,
  type Row,
} from './cloud-project-backup';
import { decryptBytes, encryptBytes, fromBase64, toBase64, type Bytes } from './cloud-crypto';
import { trNow as tr } from './i18n/current';

export const VAULT_PASSWORD_MIN = 6;
const PASSWORD_ITERATIONS = 600_000; // recomendação OWASP para PBKDF2-SHA256
const RECOVERY_ITERATIONS = 100_000; // o código já é aleatório e longo
const HEADER_TYPE = 'revela_vault_v1';
const ITEM_TYPE = 'revela_vault_item_v1';
const TOMBSTONE_TYPE = 'revela_vault_tombstone_v1';
const TABLE = 'before_after_photos';

export class VaultError extends Error {
  constructor(message: string, public code: 'wrong-password' | 'wrong-code' | 'weak-password' | 'no-vault' | 'locked') {
    super(message);
    this.name = 'VaultError';
  }
}

// ─── Chaves ────────────────────────────────────────────────────────────

interface WrappedKey {
  salt: string;
  iterations: number;
  wrapped: string; // chave mestra criptografada (IV + texto cifrado), base64
}

interface VaultHeader {
  __type: typeof HEADER_TYPE;
  createdAt: string;
  pw: WrappedKey;
  rc: WrappedKey;
  /** Texto conhecido cifrado com a chave mestra: o aparelho confere se a chave dele ainda é a do cofre */
  check: string;
}

const CHECK_TEXT = 'revela-vault-check';

async function makeCheck(master: Bytes): Promise<string> {
  return toBase64(await encryptBytes(await importMaster(master), new TextEncoder().encode(CHECK_TEXT)));
}

async function masterMatches(master: Bytes, header: VaultHeader): Promise<boolean> {
  try {
    const plain = await decryptBytes(await importMaster(master), fromBase64(header.check));
    return new TextDecoder().decode(plain) === CHECK_TEXT;
  } catch {
    return false;
  }
}

async function deriveKek(secret: string, salt: Bytes, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function wrapMaster(master: Bytes, secret: string, iterations: number): Promise<WrappedKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kek = await deriveKek(secret, salt, iterations);
  return { salt: toBase64(salt), iterations, wrapped: toBase64(await encryptBytes(kek, master)) };
}

async function unwrapMaster(w: WrappedKey, secret: string): Promise<Bytes | null> {
  try {
    const kek = await deriveKek(secret, fromBase64(w.salt), w.iterations);
    return await decryptBytes(kek, fromBase64(w.wrapped));
  } catch {
    return null;
  }
}

function importMaster(raw: Bytes): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

// Código de recuperação: 16 caracteres sem letras/números que se confundem (O/0, I/1, L)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return chars.match(/.{4}/g)!.join('-');
}

/** Aceita o código com ou sem traços, espaços ou minúsculas. */
export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Indicador simples de força da senha (só informativo; o mínimo é 6 caracteres). */
export function passwordStrength(pw: string): 'weak' | 'ok' | 'strong' {
  if (pw.length < VAULT_PASSWORD_MIN) return 'weak';
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  if (pw.length >= 12 || (pw.length >= 9 && kinds >= 2)) return 'strong';
  if (pw.length >= 8 || kinds >= 2) return 'ok';
  return 'weak';
}

function checkPassword(pw: string) {
  if (!pw || pw.length < VAULT_PASSWORD_MIN) {
    throw new VaultError(
      tr(`A senha do cofre precisa ter pelo menos ${VAULT_PASSWORD_MIN} caracteres.`, `The vault password must be at least ${VAULT_PASSWORD_MIN} characters.`),
      'weak-password'
    );
  }
}

// ─── Chave neste aparelho ("aparelho conectado") ───────────────────────

const DEVICE_DB = 'RevelaVault';
const DEVICE_STORE = 'keys';

function deviceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DEVICE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DEVICE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deviceSet(userId: string, raw: Bytes | null): Promise<void> {
  const db = await deviceDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DEVICE_STORE, 'readwrite');
    if (raw) tx.objectStore(DEVICE_STORE).put(toBase64(raw), userId);
    else tx.objectStore(DEVICE_STORE).delete(userId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notify();
}

async function deviceGetRaw(userId: string): Promise<Bytes | null> {
  try {
    const db = await deviceDb();
    const value = await new Promise<string | undefined>((resolve, reject) => {
      const req = db.transaction(DEVICE_STORE).objectStore(DEVICE_STORE).get(userId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value ? fromBase64(value) : null;
  } catch {
    return null;
  }
}

export async function isDeviceConnected(userId: string): Promise<boolean> {
  return !!(await deviceGetRaw(userId));
}

async function deviceKey(userId: string, header?: VaultHeader): Promise<CryptoKey> {
  const raw = await deviceGetRaw(userId);
  if (!raw) throw new VaultError(tr('Cofre bloqueado neste aparelho.', 'Vault is locked on this device.'), 'locked');
  if (!header) {
    throw new VaultError(tr('Você ainda não tem um cofre.', 'You do not have a vault yet.'), 'no-vault');
  }
  if (!(await masterMatches(raw, header))) {
    // O cofre foi recriado em outro aparelho: esta chave não vale mais
    await forgetThisDevice(userId);
    throw new VaultError(
      tr('O cofre foi recriado em outro aparelho. Digite a senha nova do cofre.', 'The vault was recreated on another device. Enter the new vault password.'),
      'locked'
    );
  }
  return importMaster(raw);
}

/** Desconecta este aparelho: os projetos continuam aqui, mas o cofre volta a pedir a senha. */
export async function forgetThisDevice(userId: string): Promise<void> {
  await deviceSet(userId, null);
  writeSynced(userId, {});
}

// ─── Registros no servidor ─────────────────────────────────────────────

interface ItemEnvelope {
  __type: typeof ITEM_TYPE;
  projectId: string;
  updatedAt: string;
  payload: string; // { meta, paths } cifrado com a chave mestra
}

interface Tombstone {
  __type: typeof TOMBSTONE_TYPE;
  projectId: string;
  deletedAt: string;
  /** Apagado de vez (da lixeira): os outros aparelhos apagam também da lixeira deles */
  purgedAt?: string;
}

interface VaultRows {
  header?: { row: Row; data: VaultHeader };
  items: Map<string, { row: Row; data: ItemEnvelope }[]>;
  tombstones: Map<string, { row: Row; data: Tombstone }[]>;
  legacyCount: number;
}

async function readVaultRows(userId: string): Promise<VaultRows> {
  const rows = await listRows(userId);
  const out: VaultRows = { items: new Map(), tombstones: new Map(), legacyCount: 0 };
  const legacyIds = new Set<string>();
  for (const row of rows) {
    const data = parseRow(row);
    const type = data?.__type;
    if (type === HEADER_TYPE) {
      if (!out.header) out.header = { row, data };
    } else if (type === ITEM_TYPE) {
      const list = out.items.get(data.projectId) || [];
      list.push({ row, data });
      out.items.set(data.projectId, list);
    } else if (type === TOMBSTONE_TYPE) {
      const list = out.tombstones.get(data.projectId) || [];
      list.push({ row, data });
      out.tombstones.set(data.projectId, list);
    } else if (type === 'revela_storage_v3_enc' || type === 'revela_storage_v2' || type === '__revela_project_backup_v1') {
      // Conta projetos, não registros (a versão antiga às vezes guardava mais de um por projeto)
      legacyIds.add(data.projectId || data.meta?.projectId || data.project?.id || `row:${row.id}`);
    }
  }
  out.legacyCount = legacyIds.size;
  // O mais recente primeiro (por data de alteração)
  out.items.forEach((list) => list.sort((a, b) => b.data.updatedAt.localeCompare(a.data.updatedAt)));
  return out;
}

async function deleteRows(rows: Row[]) {
  for (const row of rows) {
    const { error } = await supabase.from(TABLE).delete().eq('id', row.id);
    if (error) throw error;
  }
}

async function insertRow(userId: string, description: object, title: string) {
  const { error } = await supabase.from(TABLE).insert({
    title,
    before_image_url: 'encrypted',
    after_image_url: 'encrypted',
    description: JSON.stringify(description),
    user_id: userId,
  });
  if (error) throw error;
}


// ─── Ciclo de vida do cofre ────────────────────────────────────────────

export type VaultState = 'none' | 'locked' | 'unlocked';

export async function getVaultState(userId: string): Promise<{ state: VaultState; items: number; legacy: number }> {
  const rows = await readVaultRows(userId);
  const items = Array.from(rows.items.keys()).filter((id) => !isDeleted(rows, id)).length;
  if (!rows.header) return { state: 'none', items: 0, legacy: rows.legacyCount };
  const raw = await deviceGetRaw(userId);
  const unlocked = !!raw && (await masterMatches(raw, rows.header.data));
  if (raw && !unlocked) await forgetThisDevice(userId);
  return { state: unlocked ? 'unlocked' : 'locked', items, legacy: rows.legacyCount };
}

function isDeleted(rows: VaultRows, projectId: string): boolean {
  const item = rows.items.get(projectId)?.[0]?.data;
  const tomb = rows.tombstones.get(projectId)?.[0]?.data;
  return !!tomb && (!item || tomb.deletedAt >= item.updatedAt);
}

/** Liga o cofre: cria a chave mestra, guarda neste aparelho e devolve o código de recuperação. */
export async function createVault(userId: string, password: string): Promise<{ recoveryCode: string }> {
  checkPassword(password);
  const existing = await readVaultRows(userId);
  if (existing.header) await deleteRows([existing.header.row]);

  const master = crypto.getRandomValues(new Uint8Array(32));
  const recoveryCode = generateRecoveryCode();
  const header: VaultHeader = {
    __type: HEADER_TYPE,
    createdAt: new Date().toISOString(),
    pw: await wrapMaster(master, password, PASSWORD_ITERATIONS),
    rc: await wrapMaster(master, normalizeRecoveryCode(recoveryCode), RECOVERY_ITERATIONS),
    check: await makeCheck(master),
  };
  await insertRow(userId, header, 'Revela vault');
  await deviceSet(userId, master);
  return { recoveryCode };
}

async function requireHeader(userId: string): Promise<{ row: Row; data: VaultHeader }> {
  const { header } = await readVaultRows(userId);
  if (!header) throw new VaultError(tr('Você ainda não tem um cofre.', 'You do not have a vault yet.'), 'no-vault');
  return header;
}

/** Abre o cofre neste aparelho com a senha. */
export async function unlockWithPassword(userId: string, password: string): Promise<void> {
  const header = await requireHeader(userId);
  const master = await unwrapMaster(header.data.pw, password);
  if (!master) throw new VaultError(tr('Senha do cofre incorreta.', 'Wrong vault password.'), 'wrong-password');
  await deviceSet(userId, master);
}

async function saveHeader(userId: string, row: Row, data: VaultHeader) {
  const { error } = await supabase.from(TABLE).update({ description: JSON.stringify(data) }).eq('id', row.id);
  if (error) throw error;
}

/** Esqueceu a senha: abre com o código de recuperação e define uma senha nova. */
export async function resetPasswordWithRecoveryCode(userId: string, code: string, newPassword: string): Promise<void> {
  checkPassword(newPassword);
  const header = await requireHeader(userId);
  const master = await unwrapMaster(header.data.rc, normalizeRecoveryCode(code));
  if (!master) throw new VaultError(tr('Código de recuperação incorreto.', 'Wrong recovery code.'), 'wrong-code');
  await saveHeader(userId, header.row, { ...header.data, pw: await wrapMaster(master, newPassword, PASSWORD_ITERATIONS) });
  await deviceSet(userId, master);
}

/** Troca a senha a partir de um aparelho conectado (não precisa da senha antiga). */
export async function changePassword(userId: string, newPassword: string): Promise<void> {
  checkPassword(newPassword);
  const header = await requireHeader(userId);
  const master = await deviceGetRaw(userId);
  if (!master) throw new VaultError(tr('Abra o cofre neste aparelho primeiro.', 'Unlock the vault on this device first.'), 'locked');
  await saveHeader(userId, header.row, { ...header.data, pw: await wrapMaster(master, newPassword, PASSWORD_ITERATIONS) });
}

/** Gera um código de recuperação novo (o antigo deixa de funcionar). */
export async function regenerateRecoveryCode(userId: string): Promise<string> {
  const header = await requireHeader(userId);
  const master = await deviceGetRaw(userId);
  if (!master) throw new VaultError(tr('Abra o cofre neste aparelho primeiro.', 'Unlock the vault on this device first.'), 'locked');
  const code = generateRecoveryCode();
  await saveHeader(userId, header.row, { ...header.data, rc: await wrapMaster(master, normalizeRecoveryCode(code), RECOVERY_ITERATIONS) });
  return code;
}

/** Apaga o cofre inteiro (projetos e fotos da nuvem). Os projetos dos aparelhos continuam. */
export async function deleteVault(userId: string): Promise<void> {
  const rows = await readVaultRows(userId);
  for (const projectId of Array.from(new Set([...Array.from(rows.items.keys()), ...Array.from(rows.tombstones.keys())]))) {
    await deleteProjectFiles(userId, projectId);
  }
  const all: Row[] = [];
  if (rows.header) all.push(rows.header.row);
  rows.items.forEach((l) => l.forEach((x) => all.push(x.row)));
  rows.tombstones.forEach((l) => l.forEach((x) => all.push(x.row)));
  await deleteRows(all);
  await forgetThisDevice(userId);
}

/**
 * Esqueceu a senha e não tem o código: recria o cofre do zero a partir deste aparelho.
 * O cofre antigo é apagado; os outros aparelhos precisarão da senha nova.
 */
export async function recreateVaultFromThisDevice(
  userId: string,
  password: string,
  onProgress?: ProgressFn
): Promise<{ recoveryCode: string }> {
  checkPassword(password);
  await deleteVault(userId);
  const result = await createVault(userId, password);
  await syncVault(userId, onProgress);
  return result;
}

// ─── Estado de sincronização por projeto (por aparelho) ────────────────

const syncedKey = (userId: string) => `revela_vault_synced_${userId}`;

function readSynced(userId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(syncedKey(userId)) || '{}');
  } catch {
    return {};
  }
}

function writeSynced(userId: string, map: Record<string, string>) {
  try {
    localStorage.setItem(syncedKey(userId), JSON.stringify(map));
  } catch {
    /* ignore */
  }
  notify();
}

const lastChange = (p: { updatedAt?: string; createdAt?: string }) => p.updatedAt || p.createdAt || '';

/** true se a versão deste projeto já está no cofre. */
export function isProjectInVault(userId: string, project: { id: string; updatedAt?: string; createdAt?: string }): boolean {
  return readSynced(userId)[project.id] === lastChange(project);
}

// ─── Enviar / baixar ───────────────────────────────────────────────────

async function pushProject(userId: string, project: Project, key: CryptoKey, rows: VaultRows, tick: () => void) {
  const updatedAt = lastChange(project);
  const folder = `${userId}/${project.id}/v${Date.now()}`;
  const paths: ImagePaths = { before: [], after: [], evolution: {} };
  try {
    for (let i = 0; i < project.beforeImages.length; i++) {
      paths.before.push(await uploadEncryptedImage(folder, `before_${i}`, project.beforeImages[i], key));
      tick();
    }
    for (let i = 0; i < project.afterImages.length; i++) {
      paths.after.push(await uploadEncryptedImage(folder, `after_${i}`, project.afterImages[i], key));
      tick();
    }
    for (const ev of project.evolutionImages || []) {
      paths.evolution[ev.id] = await uploadEncryptedImage(folder, `evo_${ev.id}`, ev.image, key);
      tick();
    }
    const payloadBytes = new TextEncoder().encode(JSON.stringify({ meta: buildMeta(project), paths }));
    const envelope: ItemEnvelope = {
      __type: ITEM_TYPE,
      projectId: project.id,
      updatedAt,
      payload: toBase64(await encryptBytes(key, payloadBytes)),
    };
    const previous = rows.items.get(project.id) || [];
    if (previous[0]) {
      const { error } = await supabase.from(TABLE).update({ description: JSON.stringify(envelope) }).eq('id', previous[0].row.id);
      if (error) throw error;
    } else {
      await insertRow(userId, envelope, 'Revela (encrypted)');
    }
    // Registros repetidos e exclusões antigas deste projeto deixam de valer
    await deleteRows([...previous.slice(1).map((x) => x.row), ...(rows.tombstones.get(project.id) || []).map((x) => x.row)]);
  } catch (e) {
    await removeFiles(await listFilesRecursive(folder)).catch(() => {});
    throw e;
  }
  await deleteProjectFiles(userId, project.id, `${folder}/`).catch(() => {});
  const map = readSynced(userId);
  map[project.id] = updatedAt;
  writeSynced(userId, map);
}

async function pullProject(userId: string, item: ItemEnvelope, key: CryptoKey, ownerEmail?: string | null): Promise<Project> {
  const { meta, paths } = JSON.parse(
    new TextDecoder().decode(await decryptBytes(key, fromBase64(item.payload)))
  ) as { meta: CloudProjectMeta; paths: ImagePaths };
  const load = (p: string) => downloadEncryptedImage(p, key);
  const beforeImages = await fetchAll(paths.before, load);
  const afterImages = await fetchAll(paths.after, load);
  const evoMeta = meta.evolutionMeta || [];
  const evoImages = await fetchAll(evoMeta, (e) => {
    if (!paths.evolution[e.id]) throw new MissingImageError();
    return load(paths.evolution[e.id]);
  });
  return {
    id: meta.projectId,
    name: meta.name,
    date: meta.date,
    createdAt: meta.createdAt,
    updatedAt: item.updatedAt,
    notes: meta.notes,
    ownerEmail: ownerEmail || meta.ownerEmail || undefined,
    folderId: meta.folderId,
    measurements: meta.measurements,
    beforeImages,
    afterImages,
    evolutionImages: evoMeta.length
      ? evoMeta.map((e, i) => ({ id: e.id, image: evoImages[i], date: e.date, label: e.label, notes: e.notes, momentType: e.momentType }))
      : undefined,
  };
}

export interface VaultSyncResult {
  sent: number;
  received: number;
  deletedHere: number;
  failures: { projectId: string; projectName?: string; error: string }[];
}

/**
 * Sincroniza este aparelho com o cofre nos dois sentidos.
 * Regra: vale a versão mais recente; exclusões feitas em outro aparelho são aplicadas aqui.
 */
export async function syncVault(userId: string, onProgress?: ProgressFn, ownerEmail?: string | null): Promise<VaultSyncResult> {
  let rows = await readVaultRows(userId);
  const key = await deviceKey(userId, rows.header?.data);

  // Exclusões feitas aqui enquanto o cofre estava trancado ou sem internet
  const pending = getPendingDeletes();
  let wrote = false;
  for (const [projectId, deletedAt] of Object.entries(pending)) {
    const item = rows.items.get(projectId)?.[0]?.data;
    const tomb = rows.tombstones.get(projectId)?.[0]?.data;
    // Editado em outro aparelho depois da exclusão: a edição vence (o projeto volta)
    const editedLater = item && item.updatedAt > deletedAt;
    if (!editedLater && !(tomb && !item)) {
      await deleteFromVault(userId, projectId, deletedAt);
      wrote = true;
    }
    clearPendingDelete(projectId);
  }
  // Apagados de vez aqui enquanto o cofre estava trancado ou sem internet
  for (const [projectId, purgedAt] of Object.entries(getPendingPurges())) {
    const item = rows.items.get(projectId)?.[0]?.data;
    if (!(item && item.updatedAt > purgedAt)) {
      await purgeInVault(userId, projectId, purgedAt);
      wrote = true;
    }
    clearPendingPurge(projectId);
  }
  if (wrote) rows = await readVaultRows(userId);

  const everything = await getAllProjectsFromIndexedDB({ includeTrash: true });
  const local = everything.filter((p) => !p.deletedAt);
  const trashed = everything.filter((p) => p.deletedAt);
  const localById = new Map(everything.map((p) => [p.id, p]));
  const synced = readSynced(userId);
  const result: VaultSyncResult = { sent: 0, received: 0, deletedHere: 0, failures: [] };

  const toPush: Project[] = [];
  const toPull: ItemEnvelope[] = [];
  const toDeleteHere: Project[] = [];
  const toPurgeHere: Project[] = [];
  const purgedFor = (p: Project) => {
    const tomb = rows.tombstones.get(p.id)?.[0]?.data;
    const item = rows.items.get(p.id)?.[0]?.data;
    return !!tomb?.purgedAt && tomb.purgedAt >= lastChange(p) && (!item || item.updatedAt <= tomb.purgedAt);
  };

  for (const p of local) {
    const item = rows.items.get(p.id)?.[0]?.data;
    const tomb = rows.tombstones.get(p.id)?.[0]?.data;
    const here = lastChange(p);
    // Apagado de vez em outro aparelho
    if (purgedFor(p)) {
      toPurgeHere.push(p);
    // Apagado em outro aparelho depois da última alteração feita aqui
    } else if (tomb && tomb.deletedAt >= here && (!item || tomb.deletedAt >= item.updatedAt)) {
      toDeleteHere.push(p);
    } else if (!item || item.updatedAt < here) {
      toPush.push(p);
    } else if (item.updatedAt > here) {
      toPull.push(item);
    } else if (synced[p.id] !== here) {
      synced[p.id] = here;
    }
  }
  // Na lixeira daqui, mas editado em outro aparelho depois: volta da lixeira
  for (const p of trashed) {
    if (purgedFor(p)) {
      toPurgeHere.push(p);
      continue;
    }
    const item = rows.items.get(p.id)?.[0]?.data;
    if (item && !isDeleted(rows, p.id) && item.updatedAt > (p.deletedAt as string) && item.updatedAt > lastChange(p)) toPull.push(item);
  }
  rows.items.forEach((list, projectId) => {
    if (!localById.has(projectId) && !isDeleted(rows, projectId)) toPull.push(list[0].data);
  });
  writeSynced(userId, synced);

  const total = toPush.reduce((n, p) => n + photoCount(p), 0) + toPull.length;
  let done = 0;
  onProgress?.({ done, total });

  for (const p of toPush) {
    try {
      await pushProject(userId, p, key, rows, () => onProgress?.({ done: ++done, total, projectName: p.name }));
      result.sent += 1;
    } catch (e: any) {
      result.failures.push({ projectId: p.id, projectName: p.name, error: e?.message || 'Erro ao enviar' });
    }
  }
  for (const item of toPull) {
    const name = localById.get(item.projectId)?.name;
    try {
      const project = await pullProject(userId, item, key, ownerEmail);
      await saveProjectToIndexedDB(project);
      const map = readSynced(userId);
      map[project.id] = item.updatedAt;
      writeSynced(userId, map);
      result.received += 1;
    } catch (e: any) {
      result.failures.push({
        projectId: item.projectId,
        projectName: name,
        error:
          e instanceof MissingImageError
            ? tr('Uma ou mais fotos não puderam ser baixadas. Tente de novo.', 'One or more photos could not be downloaded. Please try again.')
            : e?.message || 'Erro ao baixar',
      });
    }
    onProgress?.({ done: ++done, total, projectName: name });
  }
  // Apagado em outro aparelho: aqui vai para a lixeira (pode ser restaurado por 30 dias)
  for (const p of toDeleteHere) {
    const tomb = rows.tombstones.get(p.id)?.[0]?.data;
    await moveProjectToTrash(p.id, { silent: true, deletedAt: tomb?.deletedAt });
    const map = readSynced(userId);
    delete map[p.id];
    writeSynced(userId, map);
    result.deletedHere += 1;
  }

  // Apagado de vez em outro aparelho: some daqui também (inclusive da lixeira)
  for (const p of toPurgeHere) {
    await deleteProjectFromIndexedDB(p.id, { silent: true });
    const map = readSynced(userId);
    delete map[p.id];
    writeSynced(userId, map);
    result.deletedHere += 1;
  }

  markCloudSync();
  return result;
}

/** Envia só um projeto (usado logo depois de criar/editar). */
export async function pushOneProject(userId: string, project: Project): Promise<void> {
  const rows = await readVaultRows(userId);
  const key = await deviceKey(userId, rows.header?.data);
  const item = rows.items.get(project.id)?.[0]?.data;
  if (item && item.updatedAt >= lastChange(project)) return;
  await pushProject(userId, project, key, rows, () => {});
  markCloudSync();
}

/** Registra a exclusão no cofre (remove fotos e dados; os outros aparelhos apagam na próxima sincronização). */
export async function deleteFromVault(userId: string, projectId: string, deletedAt?: string): Promise<void> {
  const rows = await readVaultRows(userId);
  await deviceKey(userId, rows.header?.data); // só quem tem a chave do cofre atual pode apagar
  await deleteProjectFiles(userId, projectId);
  await deleteRows([...(rows.items.get(projectId) || []), ...(rows.tombstones.get(projectId) || [])].map((x) => x.row));
  const tomb: Tombstone = { __type: TOMBSTONE_TYPE, projectId, deletedAt: deletedAt || new Date().toISOString() };
  await insertRow(userId, tomb, 'Revela (deleted)');
  clearPendingDelete(projectId);
  const map = readSynced(userId);
  delete map[projectId];
  writeSynced(userId, map);
}

/** Registra no cofre que o projeto foi apagado de vez (os outros aparelhos apagam até da lixeira). */
export async function purgeInVault(userId: string, projectId: string, purgedAt?: string): Promise<void> {
  const rows = await readVaultRows(userId);
  await deviceKey(userId, rows.header?.data);
  const at = purgedAt || new Date().toISOString();
  const previous = rows.tombstones.get(projectId)?.[0]?.data;
  await deleteProjectFiles(userId, projectId);
  await deleteRows([...(rows.items.get(projectId) || []), ...(rows.tombstones.get(projectId) || [])].map((x) => x.row));
  const tomb: Tombstone = { __type: TOMBSTONE_TYPE, projectId, deletedAt: previous?.deletedAt || at, purgedAt: at };
  await insertRow(userId, tomb, 'Revela (deleted)');
  clearPendingDelete(projectId);
  clearPendingPurge(projectId);
  const map = readSynced(userId);
  delete map[projectId];
  writeSynced(userId, map);
}

// ─── Assinatura simples para a interface reagir a mudanças ─────────────

const listeners = new Set<() => void>();
export function subscribeVault(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

// ─── Projetos da versão anterior da nuvem ──────────────────────────────

/**
 * Apaga da nuvem os registros do formato anterior (antes do Cofre), sem tocar nas fotos do cofre.
 * Precisa do cofre aberto neste aparelho para saber quais fotos são do cofre.
 */
export async function deleteLegacyCloudCopies(userId: string): Promise<number> {
  const rowsAll = await listRows(userId);
  const vaultRows = await readVaultRows(userId);
  // Sem cofre ainda não há fotos do cofre para preservar
  const key = vaultRows.header ? await deviceKey(userId, vaultRows.header.data) : null;
  const keep: string[] = [];
  for (const list of key ? Array.from(vaultRows.items.values()) : []) {
    try {
      const { paths } = JSON.parse(new TextDecoder().decode(await decryptBytes(key!, fromBase64(list[0].data.payload)))) as {
        paths: ImagePaths;
      };
      const first = [...paths.before, ...paths.after, ...Object.values(paths.evolution)][0];
      if (first) keep.push(first.split('/').slice(0, 3).join('/') + '/');
    } catch {
      /* ignore */
    }
  }
  let deleted = 0;
  for (const row of rowsAll) {
    const data = parseRow(row);
    const type = data?.__type;
    if (type !== 'revela_storage_v3_enc' && type !== 'revela_storage_v2' && type !== '__revela_project_backup_v1') continue;
    const pid: string | undefined = data.projectId || data.meta?.projectId || data.project?.id;
    if (pid) {
      const files = await listFilesRecursive(`${userId}/${pid}`);
      await removeFiles(files.filter((f) => !keep.some((k) => f.startsWith(k))));
    }
    await deleteRows([row]);
    deleted += 1;
  }
  return deleted;
}
