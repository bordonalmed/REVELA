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

async function uploadEncryptedImage(
  userId: string,
  projectId: string,
  imageKey: string,
  base64: string,
  key: CryptoKey
): Promise<string> {
  const compressed = await compressBase64ForCloud(base64);
  const cipher = await encryptBytes(key, dataUrlToBytes(compressed));
  const path = `${userId}/${projectId}/${imageKey}.enc.jpg`;
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

async function downloadEncryptedImage(path: string, key: CryptoKey): Promise<string> {
  const plain = await decryptBytes(key, await downloadBytes(path));
  return `data:${detectImageMime(plain)};base64,${toBase64(plain)}`;
}

// Formato antigo (sem criptografia): só leitura, para restaurar dados já enviados
async function downloadImageAsBase64(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Download falhou: ${error?.message || 'sem dados'}`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao converter blob'));
    reader.readAsDataURL(data);
  });
}

async function deleteProjectFolder(userId: string, projectId: string): Promise<void> {
  const prefix = `${userId}/${projectId}/`;
  const { data } = await supabase.storage.from(BUCKET).list(prefix.replace(/\/$/, ''), { limit: 200 });
  if (data && data.length > 0) {
    const paths = data.map((f: { name: string }) => `${prefix}${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
}

// ─── Metadata (DB row — lightweight, no images) ───────────────────────

interface CloudProjectMeta {
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
}

function buildMeta(project: Project): CloudProjectMeta {
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
  };
}

// ─── Public types ──────────────────────────────────────────────────────

export type CloudSyncFailure = { projectId: string; projectName?: string; error: string };

export interface CloudSyncResult {
  uploaded: number;
  updated: number;
  skipped: number;
  failures: CloudSyncFailure[];
}

export interface CloudRestoreResult {
  restored: number;
  skipped: number;
  alreadyExisted: number;
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

type Row = { id: string; description: string | null; created_at?: string; updated_at?: string };

function parseRow(row: Row): any {
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

async function listRows(userId: string): Promise<Row[]> {
  const { data, error } = await supabase
    .from('before_after_photos')
    .select('id,description,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]) || [];
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

async function syncOneProject(
  userId: string,
  project: Project,
  cloudKey: CloudKey,
  existingRowId: string | null
): Promise<'inserted' | 'updated'> {
  const meta = buildMeta(project);

  // Remove o que houver na pasta (inclusive cópias antigas sem criptografia)
  await deleteProjectFolder(userId, project.id);

  const imagePaths: string[] = [];
  for (let i = 0; i < (project.beforeImages || []).length; i++) {
    imagePaths.push(await uploadEncryptedImage(userId, project.id, `before_${i}`, project.beforeImages[i], cloudKey.key));
  }
  for (let i = 0; i < (project.afterImages || []).length; i++) {
    imagePaths.push(await uploadEncryptedImage(userId, project.id, `after_${i}`, project.afterImages[i], cloudKey.key));
  }
  for (const ev of project.evolutionImages || []) {
    imagePaths.push(await uploadEncryptedImage(userId, project.id, `evo_${ev.id}`, ev.image, cloudKey.key));
  }

  const envelope: EncryptedEnvelope = {
    __type: ENCRYPTED_TYPE,
    projectId: project.id,
    kdf: 'PBKDF2',
    kdfSalt: cloudKey.salt,
    kdfIterations: cloudKey.iterations,
    payload: await encryptJson(cloudKey.key, { meta, imagePaths }),
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
    return 'updated';
  }
  const { error } = await supabase.from('before_after_photos').insert({ user_id: userId, ...row });
  if (error) throw error;
  return 'inserted';
}

/**
 * Envia para a nuvem, criptografados, apenas os projetos escolhidos pelo usuário.
 * Só roda quando o usuário pede (não há sincronização automática).
 */
export async function syncSelectedProjectsToCloud(
  userId: string,
  selectedProjects: Project[],
  password: string
): Promise<CloudSyncResult> {
  checkPassword(password);
  const rows = await listRows(userId);
  await verifyPasswordAgainstCloud(password, rows);

  const rowIdByProject = new Map<string, string>();
  for (const r of rows) {
    const pid = rowProjectId(parseRow(r));
    if (pid && !rowIdByProject.has(pid)) rowIdByProject.set(pid, r.id);
  }

  const cloudKey = await deriveCloudKey(password);
  const result: CloudSyncResult = { uploaded: 0, updated: 0, skipped: 0, failures: [] };

  for (const project of selectedProjects) {
    try {
      const action = await syncOneProject(userId, project, cloudKey, rowIdByProject.get(project.id) ?? null);
      if (action === 'inserted') result.uploaded += 1;
      else result.updated += 1;
    } catch (e: any) {
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

export async function restoreProjectsFromCloud(
  userId: string,
  ownerEmail: string | null | undefined,
  password: string
): Promise<CloudRestoreResult> {
  const rows = await listRows(userId);
  const hasEncrypted = rows.some((r) => parseRow(r)?.__type === ENCRYPTED_TYPE);
  if (hasEncrypted) {
    checkPassword(password);
    await verifyPasswordAgainstCloud(password, rows);
  }
  const result: CloudRestoreResult = { restored: 0, skipped: 0, alreadyExisted: 0, failures: [] };
  if (!rows || rows.length === 0) return result;

  const existingLocal = await getAllProjectsFromIndexedDB();
  const existingIds = new Set(existingLocal.map((p) => p.id));

  for (const row of rows) {
    try {
      let parsed: any;
      try { parsed = JSON.parse(row.description || '{}'); } catch { result.skipped += 1; continue; }

      // v3 (criptografado)
      if (parsed?.__type === ENCRYPTED_TYPE) {
        const env = parsed as EncryptedEnvelope;
        const { key } = await keyFor(password, env.kdfSalt, env.kdfIterations);
        const { meta } = await decryptJson<{ meta: CloudProjectMeta; imagePaths: string[] }>(key, env.payload);
        const base = `${userId}/${meta.projectId}`;
        const beforeImages: string[] = [];
        const afterImages: string[] = [];
        const evolutionImages: EvolutionImage[] = [];
        for (let i = 0; i < meta.beforeCount; i++) {
          try { beforeImages.push(await downloadEncryptedImage(`${base}/before_${i}.enc.jpg`, key)); } catch { /* imagem ausente */ }
        }
        for (let i = 0; i < meta.afterCount; i++) {
          try { afterImages.push(await downloadEncryptedImage(`${base}/after_${i}.enc.jpg`, key)); } catch { /* imagem ausente */ }
        }
        for (const evMeta of meta.evolutionMeta || []) {
          try {
            evolutionImages.push({
              id: evMeta.id, image: await downloadEncryptedImage(`${base}/evo_${evMeta.id}.enc.jpg`, key), date: evMeta.date,
              label: evMeta.label, notes: evMeta.notes, momentType: evMeta.momentType,
            });
          } catch { /* imagem ausente */ }
        }
        const project: Project = {
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
          evolutionImages: evolutionImages.length > 0 ? evolutionImages : undefined,
        };
        if (existingIds.has(project.id)) result.alreadyExisted += 1;
        await saveProjectToIndexedDB(project);
        result.restored += 1;
        continue;
      }

      // v2 (Storage-based, sem criptografia — formato antigo)
      if (parsed?.__type === 'revela_storage_v2' && parsed.meta) {
        const meta: CloudProjectMeta = parsed.meta;
        const beforeImages: string[] = [];
        const afterImages: string[] = [];
        const evolutionImages: EvolutionImage[] = [];

        for (let i = 0; i < meta.beforeCount; i++) {
          try {
            const img = await downloadImageAsBase64(`${userId}/${meta.projectId}/before_${i}.jpg`);
            beforeImages.push(img);
          } catch { /* image missing, skip */ }
        }
        for (let i = 0; i < meta.afterCount; i++) {
          try {
            const img = await downloadImageAsBase64(`${userId}/${meta.projectId}/after_${i}.jpg`);
            afterImages.push(img);
          } catch { /* image missing, skip */ }
        }
        if (meta.evolutionMeta) {
          for (const evMeta of meta.evolutionMeta) {
            try {
              const img = await downloadImageAsBase64(`${userId}/${meta.projectId}/evo_${evMeta.id}.jpg`);
              evolutionImages.push({
                id: evMeta.id, image: img, date: evMeta.date,
                label: evMeta.label, notes: evMeta.notes, momentType: evMeta.momentType,
              });
            } catch { /* image missing, skip */ }
          }
        }

        const project: Project = {
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
          evolutionImages: evolutionImages.length > 0 ? evolutionImages : undefined,
        };

        if (existingIds.has(project.id)) result.alreadyExisted += 1;
        await saveProjectToIndexedDB(project);
        result.restored += 1;
        continue;
      }

      // v1 legacy (all-in-description)
      if (parsed?.__type === '__revela_project_backup_v1' && parsed.project) {
        const proj = parsed.project as Project;
        const normalized: Project = {
          ...proj,
          createdAt: proj.createdAt || row.updated_at || row.created_at || new Date().toISOString(),
          beforeImages: Array.isArray(proj.beforeImages) ? proj.beforeImages : [],
          afterImages: Array.isArray(proj.afterImages) ? proj.afterImages : [],
          evolutionImages: Array.isArray(proj.evolutionImages) ? proj.evolutionImages : undefined,
          notes: proj.notes || undefined,
          ownerEmail: ownerEmail || proj.ownerEmail || undefined,
        };
        if (existingIds.has(normalized.id)) result.alreadyExisted += 1;
        await saveProjectToIndexedDB(normalized);
        result.restored += 1;
        continue;
      }

      result.skipped += 1;
    } catch (e: any) {
      result.failures.push({
        projectId: 'unknown',
        error: e?.message || 'Erro desconhecido ao restaurar',
      });
    }
  }

  return result;
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
    if (pid) await deleteProjectFolder(userId, pid);
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
