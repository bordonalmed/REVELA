import { supabase } from '@/lib/supabase';
import type { Project, EvolutionImage } from './storage';
import { saveProjectToIndexedDB, getAllProjectsFromIndexedDB } from './storage';
import {
  CLOUD_PASSWORD_MIN,
  deriveCloudKey,
  decryptBytes,
  decryptJson,
  encryptBytes,
  encryptJson,
  fromBase64,
  toBase64,
  type Bytes,
  type CloudKey,
} from './cloud-crypto';
import { trNow as tr } from './i18n/current';

const BUCKET = 'project-backups';
const CLOUD_IMG_MAX_WIDTH = 1400;
const CLOUD_IMG_QUALITY = 0.65;

// ─── Helpers ───────────────────────────────────────────────────────────

function compressBase64ForCloud(base64: string): Promise<string> {
  return new Promise((resolve) => {
    if (!base64 || !base64.startsWith('data:image')) { resolve(base64); return; }
    if (base64.length < 130_000) { resolve(base64); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > CLOUD_IMG_MAX_WIDTH) {
          height = Math.round(height * (CLOUD_IMG_MAX_WIDTH / width));
          width = CLOUD_IMG_MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(base64); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', CLOUD_IMG_QUALITY);
        resolve(compressed.length < base64.length ? compressed : base64);
      } catch { resolve(base64); }
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',');
  const mime = header?.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(data || '');
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// O bucket só aceita tipos de imagem (allowed_mime_types). O conteúdo é cifrado e
// ilegível; o tipo declarado é só para passar por essa restrição.
const ENCRYPTED_UPLOAD_TYPE = 'image/jpeg';

function dataUrlToBytes(dataUrl: string): Bytes {
  return fromBase64(dataUrl.split(',')[1] || '');
}

function detectImageMime(bytes: Bytes): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp';
  return 'image/jpeg';
}

export async function uploadEncryptedImage(
  folder: string,
  imageKey: string,
  base64: string,
  key: CryptoKey
): Promise<string> {
  const compressed = await compressBase64ForCloud(base64);
  const cipher = await encryptBytes(key, dataUrlToBytes(compressed));
  const path = `${folder}/${imageKey}.enc.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([cipher], { type: ENCRYPTED_UPLOAD_TYPE }), { upsert: true, contentType: ENCRYPTED_UPLOAD_TYPE });
  if (error) throw new Error(`Upload (${imageKey}): ${error.message}`);
  return path;
}

async function downloadBytes(path: string): Promise<Bytes> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Download: ${error?.message || 'sem dados'}`);
  return new Uint8Array(await data.arrayBuffer());
}

export async function downloadEncryptedImage(path: string, key: CryptoKey): Promise<string> {
  const plain = await decryptBytes(key, await downloadBytes(path));
  return `data:${detectImageMime(plain)};base64,${toBase64(plain)}`;
}

// Formato antigo (sem criptografia): só leitura, para restaurar dados já enviados
async function downloadImageAsBase64(path: string): Promise<string> {
  const bytes = await downloadBytes(path);
  return `data:${detectImageMime(bytes)};base64,${toBase64(bytes)}`;
}

type StorageItem = { name: string; id?: string | null };

/** Lista os arquivos de uma pasta do bucket, entrando nas subpastas (o Storage não lista recursivamente). */
export async function listFilesRecursive(prefix: string): Promise<string[]> {
  const { data } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  const out: string[] = [];
  for (const item of (data || []) as StorageItem[]) {
    const path = `${prefix}/${item.name}`;
    // No Supabase, subpastas vêm sem id
    if (item.id === null || item.id === undefined) {
      if (item.name.includes('.')) out.push(path);
      else out.push(...(await listFilesRecursive(path)));
    } else {
      out.push(path);
    }
  }
  return out;
}

/**
 * Apaga os arquivos do projeto na nuvem. Com `keepPrefix`, preserva essa versão
 * (usado depois de um envio bem-sucedido para limpar só as versões antigas).
 */
export async function removeFiles(paths: string[]): Promise<void> {
  for (let i = 0; i < paths.length; i += 100) {
    await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100));
  }
}

export async function deleteProjectFiles(userId: string, projectId: string, keepPrefix?: string): Promise<void> {
  const files = await listFilesRecursive(`${userId}/${projectId}`);
  await removeFiles(keepPrefix ? files.filter((f) => !f.startsWith(keepPrefix)) : files);
}

// ─── Metadata (DB row — lightweight, no images) ───────────────────────

export interface CloudProjectMeta {
  projectId: string;
  name: string;
  date: string;
  createdAt: string;
  notes?: string;
  ownerEmail?: string;
  beforeCount: number;
  afterCount: number;
  evolutionMeta?: Array<{ id: string; date: string; label?: string; notes?: string; momentType?: string }>;
  measurements?: any[];
  folderId?: string;
  updatedAt?: string;
}

export function buildMeta(project: Project): CloudProjectMeta {
  return {
    projectId: project.id,
    name: project.name,
    date: project.date,
    createdAt: project.createdAt,
    notes: project.notes,
    ownerEmail: project.ownerEmail,
    beforeCount: project.beforeImages?.length ?? 0,
    afterCount: project.afterImages?.length ?? 0,
    evolutionMeta: project.evolutionImages?.map((ev) => ({
      id: ev.id, date: ev.date, label: ev.label, notes: ev.notes, momentType: ev.momentType,
    })),
    measurements: project.measurements,
    folderId: project.folderId,
    updatedAt: project.updatedAt,
  };
}

// ─── Public types ──────────────────────────────────────────────────────

export type CloudSyncFailure = { projectId: string; projectName?: string; error: string };

/** Progresso de envio/restauração, contado em fotos. */
export type CloudProgress = { done: number; total: number; projectName?: string };
export type ProgressFn = (p: CloudProgress) => void;

// ─── O que já está na nuvem (registro local, por aparelho) ─────────────
// Guarda, para cada projeto, a data de alteração da versão que está na nuvem.
// Serve para o selo "na nuvem ✓ / alterado depois do envio / só neste aparelho".

const SYNCED_KEY = 'revela_cloud_synced';

function readSynced(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SYNCED_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSynced(map: Record<string, string>) {
  try {
    localStorage.setItem(SYNCED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function markSynced(project: { id: string; updatedAt?: string; createdAt?: string }) {
  const map = readSynced();
  map[project.id] = project.updatedAt || project.createdAt || '';
  writeSynced(map);
}

function unmarkSynced(projectId: string) {
  const map = readSynced();
  delete map[projectId];
  writeSynced(map);
}

export type CloudSyncState = 'synced' | 'changed' | 'local';

/** synced = igual à nuvem; changed = alterado depois do último envio; local = nunca enviado deste aparelho */
export function getCloudSyncState(project: { id: string; updatedAt?: string; createdAt?: string }): CloudSyncState {
  const sent = readSynced()[project.id];
  if (sent === undefined) return 'local';
  return sent === (project.updatedAt || project.createdAt || '') ? 'synced' : 'changed';
}

export function isInCloud(projectId: string): boolean {
  return readSynced()[projectId] !== undefined;
}

// Último backup feito (arquivo exportado ou envio para a nuvem), para o lembrete
export function markExported() {
  try { localStorage.setItem('revela_last_export', new Date().toISOString()); } catch { /* ignore */ }
}

export function markCloudSync() {
  try { localStorage.setItem('revela_last_cloud_sync', new Date().toISOString()); } catch { /* ignore */ }
}

export function lastBackupAt(): string | null {
  try {
    const dates = [localStorage.getItem('revela_last_export'), localStorage.getItem('revela_last_cloud_sync')].filter(Boolean) as string[];
    return dates.sort().pop() || null;
  } catch {
    return null;
  }
}

export interface CloudSyncResult {
  uploaded: number;
  updated: number;
  skipped: number;
  failures: CloudSyncFailure[];
}

export interface CloudRestoreResult {
  restored: number;
  skipped: number;
  /** Já existiam no aparelho e foram atualizados com a versão mais nova da nuvem */
  alreadyExisted: number;
  /** A versão do aparelho era mais nova (ou igual): mantida, nada foi sobrescrito */
  keptLocal: number;
  failures: CloudSyncFailure[];
}

// ─── Sync (local → cloud) ─────────────────────────────────────────────

const ENCRYPTED_TYPE = 'revela_storage_v3_enc';

/** Envelope gravado no banco: só o ID aleatório do projeto e os parâmetros da chave ficam em claro. */
interface EncryptedEnvelope {
  __type: typeof ENCRYPTED_TYPE;
  projectId: string;
  kdf: 'PBKDF2';
  kdfSalt: string;
  kdfIterations: number;
  payload: string; // { meta, imagePaths } cifrado
}

export class CloudPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudPasswordError';
  }
}

function checkPassword(password: string) {
  if (!password || password.length < CLOUD_PASSWORD_MIN) {
    throw new CloudPasswordError(
      tr(
        `A senha da nuvem precisa ter pelo menos ${CLOUD_PASSWORD_MIN} caracteres.`,
        `The cloud password must be at least ${CLOUD_PASSWORD_MIN} characters.`
      )
    );
  }
}

export type Row = { id: string; description: string | null; created_at?: string; updated_at?: string };

export function parseRow(row: Row): any {
  try {
    return JSON.parse(row.description || '{}');
  } catch {
    return null;
  }
}

function rowProjectId(parsed: any): string | null {
  if (parsed?.__type === ENCRYPTED_TYPE) return parsed.projectId ?? null;
  if (parsed?.meta?.projectId) return parsed.meta.projectId;
  if (parsed?.__type === '__revela_project_backup_v1') return parsed?.project?.id ?? null;
  return null;
}

export async function listRows(userId: string): Promise<Row[]> {
  const { data, error } = await supabase
    .from('before_after_photos')
    .select('id,description,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]) || [];
}

/**
 * Agrupa os registros por projeto. O primeiro de cada grupo é o "principal":
 * criptografado antes do formato antigo; entre iguais, o mais recente (listRows já ordena).
 */
function groupRowsByProject(rows: Row[]): Map<string, { row: Row; parsed: any }[]> {
  const groups = new Map<string, { row: Row; parsed: any }[]>();
  for (const row of rows) {
    const parsed = parseRow(row);
    const pid = rowProjectId(parsed);
    if (!pid) continue;
    if (!groups.has(pid)) groups.set(pid, []);
    groups.get(pid)!.push({ row, parsed });
  }
  groups.forEach((list) => {
    list.sort((a, b) => Number(b.parsed?.__type === ENCRYPTED_TYPE) - Number(a.parsed?.__type === ENCRYPTED_TYPE));
  });
  return groups;
}

const keyCache = new Map<string, Promise<CloudKey>>();
function keyFor(password: string, salt: string, iterations: number): Promise<CloudKey> {
  const id = `${salt}:${iterations}`;
  if (!keyCache.has(id)) keyCache.set(id, deriveCloudKey(password, salt, iterations));
  return keyCache.get(id)!;
}

/** Confere a senha contra um projeto criptografado que já esteja na nuvem (se houver). */
async function verifyPasswordAgainstCloud(password: string, rows: Row[]): Promise<void> {
  const sample = rows.map(parseRow).find((p) => p?.__type === ENCRYPTED_TYPE) as EncryptedEnvelope | undefined;
  if (!sample) return;
  keyCache.clear();
  const { key } = await keyFor(password, sample.kdfSalt, sample.kdfIterations);
  try {
    await decryptJson(key, sample.payload);
  } catch {
    keyCache.clear();
    throw new CloudPasswordError(
      tr(
        'Senha da nuvem incorreta. Use a mesma senha das sincronizações anteriores.',
        'Wrong cloud password. Use the same password as in previous syncs.'
      )
    );
  }
}

/** Caminhos das fotos dentro do payload cifrado (formato v3.1). */
export interface ImagePaths {
  before: string[];
  after: string[];
  evolution: Record<string, string>;
}

export const photoCount = (p: Project) =>
  (p.beforeImages?.length || 0) + (p.afterImages?.length || 0) + (p.evolutionImages?.length || 0);

async function syncOneProject(
  userId: string,
  project: Project,
  cloudKey: CloudKey,
  existingRowId: string | null,
  tick: () => void = () => {}
): Promise<'inserted' | 'updated'> {
  const meta = buildMeta(project);

  // 1) Sobe tudo numa pasta NOVA. A versão anterior continua intacta até o fim:
  //    se a internet cair no meio, a cópia que já estava na nuvem não é perdida.
  const version = `v${Date.now()}`;
  const folder = `${userId}/${project.id}/${version}`;
  const paths: ImagePaths = { before: [], after: [], evolution: {} };
  try {
    for (let i = 0; i < (project.beforeImages || []).length; i++) {
      paths.before.push(await uploadEncryptedImage(folder, `before_${i}`, project.beforeImages[i], cloudKey.key));
      tick();
    }
    for (let i = 0; i < (project.afterImages || []).length; i++) {
      paths.after.push(await uploadEncryptedImage(folder, `after_${i}`, project.afterImages[i], cloudKey.key));
      tick();
    }
    for (const ev of project.evolutionImages || []) {
      paths.evolution[ev.id] = await uploadEncryptedImage(folder, `evo_${ev.id}`, ev.image, cloudKey.key);
      tick();
    }

    // 2) Só então aponta o registro para a versão nova
    const envelope: EncryptedEnvelope = {
      __type: ENCRYPTED_TYPE,
      projectId: project.id,
      kdf: 'PBKDF2',
      kdfSalt: cloudKey.salt,
      kdfIterations: cloudKey.iterations,
      payload: await encryptJson(cloudKey.key, { meta, paths }),
    };
    // Nome do projeto (muitas vezes o nome do paciente) não vai em claro
    const row = {
      title: 'Revela (encrypted)',
      before_image_url: 'encrypted',
      after_image_url: 'encrypted',
      description: JSON.stringify(envelope),
    };
    if (existingRowId) {
      const { error } = await supabase.from('before_after_photos').update(row).eq('id', existingRowId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('before_after_photos').insert({ user_id: userId, ...row });
      if (error) throw error;
    }
  } catch (e) {
    // Envio incompleto: descarta só a pasta nova; a versão anterior segue valendo
    await removeFiles(await listFilesRecursive(folder)).catch(() => {});
    throw e;
  }

  // 3) Com a versão nova gravada, remove as versões antigas (inclusive arquivos sem criptografia)
  await deleteProjectFiles(userId, project.id, `${folder}/`).catch(() => {});
  return existingRowId ? 'updated' : 'inserted';
}

/**
 * Envia para a nuvem, criptografados, apenas os projetos escolhidos pelo usuário.
 * Só roda quando o usuário pede (não há sincronização automática).
 */
export async function syncSelectedProjectsToCloud(
  userId: string,
  selectedProjects: Project[],
  password: string,
  onProgress?: ProgressFn
): Promise<CloudSyncResult> {
  checkPassword(password);
  const rows = await listRows(userId);
  await verifyPasswordAgainstCloud(password, rows);

  const groups = groupRowsByProject(rows);

  const cloudKey = await deriveCloudKey(password);
  const result: CloudSyncResult = { uploaded: 0, updated: 0, skipped: 0, failures: [] };

  const total = selectedProjects.reduce((n, p) => n + photoCount(p), 0);
  let done = 0;
  onProgress?.({ done, total });

  for (const project of selectedProjects) {
    const startDone = done;
    try {
      const group = groups.get(project.id) || [];
      const tick = () => onProgress?.({ done: ++done, total, projectName: project.name });
      const action = await syncOneProject(userId, project, cloudKey, group[0]?.row.id ?? null, tick);
      markSynced(project);
      markCloudSync();
      // Registros repetidos do mesmo projeto (formatos antigos) deixam de valer
      for (const dup of group.slice(1)) {
        await supabase.from('before_after_photos').delete().eq('id', dup.row.id);
      }
      if (action === 'inserted') result.uploaded += 1;
      else result.updated += 1;
    } catch (e: any) {
      done = startDone + photoCount(project);
      onProgress?.({ done, total, projectName: project.name });
      const msg = e?.message || 'Erro desconhecido';
      result.failures.push({
        projectId: project.id,
        projectName: project.name,
        error: msg.length > 200 ? msg.slice(0, 200) + '…' : msg,
      });
    }
  }

  return result;
}

// ─── Restore (cloud → local) ──────────────────────────────────────────

export class MissingImageError extends Error {}

export async function fetchAll<T>(items: T[], load: (item: T) => Promise<string>): Promise<string[]> {
  const out: string[] = [];
  for (const item of items) {
    try {
      out.push(await load(item));
    } catch {
      throw new MissingImageError();
    }
  }
  return out;
}

/** Monta o projeto a partir de um registro da nuvem. Lança MissingImageError se faltar qualquer foto. */
async function projectFromRow(
  userId: string,
  row: Row,
  parsed: any,
  password: string,
  ownerEmail: string | null | undefined
): Promise<Project> {
  // v3 (criptografado)
  if (parsed?.__type === ENCRYPTED_TYPE) {
    const env = parsed as EncryptedEnvelope;
    const { key } = await keyFor(password, env.kdfSalt, env.kdfIterations);
    const data = await decryptJson<{ meta: CloudProjectMeta; paths?: ImagePaths }>(key, env.payload);
    const meta = data.meta;
    // Envios feitos antes das pastas por versão guardavam as fotos direto na pasta do projeto
    const base = `${userId}/${meta.projectId}`;
    const paths: ImagePaths = data.paths ?? {
      before: Array.from({ length: meta.beforeCount }, (_, i) => `${base}/before_${i}.enc.jpg`),
      after: Array.from({ length: meta.afterCount }, (_, i) => `${base}/after_${i}.enc.jpg`),
      evolution: Object.fromEntries((meta.evolutionMeta || []).map((e) => [e.id, `${base}/evo_${e.id}.enc.jpg`])),
    };
    const load = (path: string) => downloadEncryptedImage(path, key);
    const beforeImages = await fetchAll(paths.before, load);
    const afterImages = await fetchAll(paths.after, load);
    const evoMeta = meta.evolutionMeta || [];
    const evoImages = await fetchAll(evoMeta, (e) => {
      const path = paths.evolution[e.id];
      if (!path) throw new MissingImageError();
      return load(path);
    });
    return {
      id: meta.projectId,
      name: meta.name,
      date: meta.date,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
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

  // v2 (Storage, sem criptografia — formato antigo)
  if (parsed?.__type === 'revela_storage_v2' && parsed.meta) {
    const meta: CloudProjectMeta = parsed.meta;
    const base = `${userId}/${meta.projectId}`;
    const beforeImages = await fetchAll(Array.from({ length: meta.beforeCount }, (_, i) => `${base}/before_${i}.jpg`), downloadImageAsBase64);
    const afterImages = await fetchAll(Array.from({ length: meta.afterCount }, (_, i) => `${base}/after_${i}.jpg`), downloadImageAsBase64);
    const evoMeta = meta.evolutionMeta || [];
    const evoImages = await fetchAll(evoMeta, (e) => downloadImageAsBase64(`${base}/evo_${e.id}.jpg`));
    return {
      id: meta.projectId,
      name: meta.name,
      date: meta.date,
      createdAt: meta.createdAt,
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

  // v1 (tudo dentro do registro — formato mais antigo)
  const proj = parsed.project as Project;
  return {
    ...proj,
    createdAt: proj.createdAt || row.updated_at || row.created_at || new Date().toISOString(),
    beforeImages: Array.isArray(proj.beforeImages) ? proj.beforeImages : [],
    afterImages: Array.isArray(proj.afterImages) ? proj.afterImages : [],
    evolutionImages: Array.isArray(proj.evolutionImages) ? proj.evolutionImages : undefined,
    notes: proj.notes || undefined,
    ownerEmail: ownerEmail || proj.ownerEmail || undefined,
  };
}

const lastChange = (p: { updatedAt?: string; createdAt?: string }) => p.updatedAt || p.createdAt || '';

/**
 * Traz da nuvem para este aparelho. Nunca troca uma versão do aparelho por uma igual
 * ou mais antiga, e nunca grava um projeto com fotos faltando.
 */
export async function restoreProjectsFromCloud(
  userId: string,
  ownerEmail: string | null | undefined,
  password: string,
  options: { onlyIds?: string[]; onProgress?: ProgressFn } = {}
): Promise<CloudRestoreResult> {
  const rows = await listRows(userId);
  const hasEncrypted = rows.some((r) => parseRow(r)?.__type === ENCRYPTED_TYPE);
  if (hasEncrypted) {
    checkPassword(password);
    await verifyPasswordAgainstCloud(password, rows);
  }
  const result: CloudRestoreResult = { restored: 0, skipped: 0, alreadyExisted: 0, keptLocal: 0, failures: [] };
  if (rows.length === 0) return result;

  const localById = new Map((await getAllProjectsFromIndexedDB()).map((p) => [p.id, p]));
  const groups = groupRowsByProject(rows);
  result.skipped += rows.filter((r) => {
    const parsed = parseRow(r);
    return !rowProjectId(parsed) && !String(parsed?.__type || '').startsWith('revela_vault');
  }).length;

  const entries = Array.from(groups.entries()).filter(([id]) => !options.onlyIds || options.onlyIds.includes(id));
  let done = 0;
  options.onProgress?.({ done, total: entries.length });

  for (const [projectId, group] of entries) {
    options.onProgress?.({ done: done++, total: entries.length, projectName: localById.get(projectId)?.name });
    // Só o registro principal de cada projeto (evita que um registro antigo sobrescreva o novo)
    const { row, parsed } = group[0];
    const local = localById.get(projectId);
    let name: string | undefined = local?.name;
    try {
      const project = await projectFromRow(userId, row, parsed, password, ownerEmail);
      name = project.name;
      if (local) {
        // Formatos antigos não têm data de alteração: na dúvida, o aparelho prevalece
        const cloudIsNewer = !!project.updatedAt && lastChange(project) > lastChange(local);
        if (!cloudIsNewer) {
          if (lastChange(project) === lastChange(local)) markSynced(local);
          result.keptLocal += 1;
          continue;
        }
        result.alreadyExisted += 1;
      }
      await saveProjectToIndexedDB(project);
      markSynced(project);
      result.restored += 1;
    } catch (e: any) {
      result.failures.push({
        projectId,
        projectName: name,
        error:
          e instanceof MissingImageError
            ? tr(
                'Uma ou mais fotos não puderam ser baixadas. Nada foi alterado neste aparelho; tente de novo.',
                'One or more photos could not be downloaded. Nothing was changed on this device; please try again.'
              )
            : e?.message || 'Erro desconhecido ao restaurar',
      });
    }
  }
  options.onProgress?.({ done: entries.length, total: entries.length });

  return result;
}

// ─── Lista e exclusão por projeto ─────────────────────────────────────

export interface CloudProjectInfo {
  projectId: string;
  name: string;
  updatedAt?: string;
  photos: number;
  encrypted: boolean;
}

/** Lista os projetos da nuvem (só os dados, sem baixar fotos). Precisa da senha para ler os nomes. */
export async function listCloudProjects(userId: string, password: string): Promise<CloudProjectInfo[]> {
  const rows = await listRows(userId);
  if (rows.some((r) => parseRow(r)?.__type === ENCRYPTED_TYPE)) {
    checkPassword(password);
    await verifyPasswordAgainstCloud(password, rows);
  }
  const out: CloudProjectInfo[] = [];
  for (const [projectId, group] of Array.from(groupRowsByProject(rows).entries())) {
    const { parsed } = group[0];
    try {
      if (parsed?.__type === ENCRYPTED_TYPE) {
        const env = parsed as EncryptedEnvelope;
        const { key } = await keyFor(password, env.kdfSalt, env.kdfIterations);
        const { meta } = await decryptJson<{ meta: CloudProjectMeta }>(key, env.payload);
        out.push({
          projectId,
          name: meta.name,
          updatedAt: meta.updatedAt || meta.createdAt,
          photos: meta.beforeCount + meta.afterCount + (meta.evolutionMeta?.length || 0),
          encrypted: true,
        });
      } else if (parsed?.__type === 'revela_storage_v2') {
        const m = parsed.meta as CloudProjectMeta;
        out.push({ projectId, name: m.name, updatedAt: m.createdAt, photos: m.beforeCount + m.afterCount + (m.evolutionMeta?.length || 0), encrypted: false });
      } else if (parsed?.project) {
        const pr = parsed.project as Project;
        out.push({ projectId, name: pr.name, updatedAt: pr.updatedAt || pr.createdAt, photos: photoCount(pr), encrypted: false });
      }
    } catch {
      out.push({ projectId, name: '?', photos: 0, encrypted: true });
    }
  }
  return out.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

/** Apaga um projeto da nuvem (registro e todas as fotos). O projeto no aparelho não muda. */
export async function deleteProjectFromCloud(userId: string, projectId: string): Promise<void> {
  const rows = await listRows(userId);
  for (const { row } of groupRowsByProject(rows).get(projectId) || []) {
    const { error } = await supabase.from('before_after_photos').delete().eq('id', row.id);
    if (error) throw error;
  }
  await deleteProjectFiles(userId, projectId);
  unmarkSynced(projectId);
}

// ─── Cópias antigas sem criptografia ──────────────────────────────────

function isUnencryptedRow(parsed: any): boolean {
  return parsed?.__type === 'revela_storage_v2' || parsed?.__type === '__revela_project_backup_v1';
}

export async function countUnencryptedCloudCopies(userId: string): Promise<number> {
  const rows = await listRows(userId);
  return rows.filter((r) => isUnencryptedRow(parseRow(r))).length;
}

/** Apaga da nuvem os projetos enviados no formato antigo (fotos e dados sem criptografia). */
export async function deleteUnencryptedCloudCopies(userId: string): Promise<number> {
  const rows = await listRows(userId);
  let deleted = 0;
  for (const r of rows) {
    const parsed = parseRow(r);
    if (!isUnencryptedRow(parsed)) continue;
    const pid = rowProjectId(parsed);
    if (pid) await deleteProjectFiles(userId, pid);
    const { error } = await supabase.from('before_after_photos').delete().eq('id', r.id);
    if (error) throw error;
    deleted += 1;
  }
  return deleted;
}

// ─── Utilities ─────────────────────────────────────────────────────────

export async function countCloudBackups(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('before_after_photos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return 0;
  return count ?? 0;
}

export async function listLocalProjectsForCloud(): Promise<Project[]> {
  const projects = await getAllProjectsFromIndexedDB();
  return Array.isArray(projects) ? projects : [];
}
