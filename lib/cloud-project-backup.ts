import { supabase } from '@/lib/supabase';
import type { Project, EvolutionImage } from './storage';
import { saveProjectToIndexedDB, getAllProjectsFromIndexedDB } from './storage';

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

async function uploadImage(userId: string, projectId: string, imageKey: string, base64: string): Promise<string> {
  const compressed = await compressBase64ForCloud(base64);
  const blob = base64ToBlob(compressed);
  const path = `${userId}/${projectId}/${imageKey}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

  if (error) throw new Error(`Upload falhou (${imageKey}): ${error.message}`);
  return path;
}

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

async function findExistingRowId(userId: string, projectId: string): Promise<string | null> {
  const { data } = await supabase
    .from('before_after_photos')
    .select('id,description')
    .eq('user_id', userId);

  if (!data) return null;
  for (const row of data) {
    try {
      const parsed = JSON.parse(row.description || '{}');
      if (parsed?.meta?.projectId === projectId) return row.id;
      if (parsed?.__type === '__revela_project_backup_v1' && parsed?.project?.id === projectId) return row.id;
    } catch { /* ignore */ }
  }
  return null;
}

async function syncOneProject(userId: string, project: Project): Promise<'inserted' | 'updated'> {
  const meta = buildMeta(project);

  // Upload images to Storage
  const imagePaths: string[] = [];
  for (let i = 0; i < (project.beforeImages || []).length; i++) {
    const path = await uploadImage(userId, project.id, `before_${i}`, project.beforeImages[i]);
    imagePaths.push(path);
  }
  for (let i = 0; i < (project.afterImages || []).length; i++) {
    const path = await uploadImage(userId, project.id, `after_${i}`, project.afterImages[i]);
    imagePaths.push(path);
  }
  if (project.evolutionImages) {
    for (const ev of project.evolutionImages) {
      const path = await uploadImage(userId, project.id, `evo_${ev.id}`, ev.image);
      imagePaths.push(path);
    }
  }

  const description = JSON.stringify({ __type: 'revela_storage_v2', meta, imagePaths });

  const existingRowId = await findExistingRowId(userId, project.id);

  const thumbBefore = project.beforeImages?.[0]?.slice(0, 200) || 'none';
  const thumbAfter = project.afterImages?.[0]?.slice(0, 200) || 'none';

  if (existingRowId) {
    const { error } = await supabase
      .from('before_after_photos')
      .update({
        before_image_url: thumbBefore,
        after_image_url: thumbAfter,
        title: project.name,
        description,
      })
      .eq('id', existingRowId);
    if (error) throw error;
    return 'updated';
  }

  const { error } = await supabase.from('before_after_photos').insert({
    user_id: userId,
    before_image_url: thumbBefore,
    after_image_url: thumbAfter,
    title: project.name,
    description,
  });
  if (error) throw error;
  return 'inserted';
}

export async function syncSelectedProjectsToCloud(
  userId: string,
  selectedProjects: Project[],
): Promise<CloudSyncResult> {
  const result: CloudSyncResult = { uploaded: 0, updated: 0, skipped: 0, failures: [] };

  for (const project of selectedProjects) {
    try {
      const action = await syncOneProject(userId, project);
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
  ownerEmail?: string | null,
): Promise<CloudRestoreResult> {
  const { data: rows, error } = await supabase
    .from('before_after_photos')
    .select('id,description,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  const result: CloudRestoreResult = { restored: 0, skipped: 0, alreadyExisted: 0, failures: [] };
  if (!rows || rows.length === 0) return result;

  const existingLocal = await getAllProjectsFromIndexedDB();
  const existingIds = new Set(existingLocal.map((p) => p.id));

  for (const row of rows) {
    try {
      let parsed: any;
      try { parsed = JSON.parse(row.description || '{}'); } catch { result.skipped += 1; continue; }

      // v2 (Storage-based)
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
