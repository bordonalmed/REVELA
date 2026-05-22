import { supabase } from '@/lib/supabase';
import type { Project } from './storage';
import { saveProjectToIndexedDB, getAllProjectsFromIndexedDB } from './storage';

const CLOUD_BACKUP_MARKER = '__revela_project_backup_v1';
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRElEQkSuQmCC';
const MAX_PAYLOAD_MB = 6;

function safeStringify(obj: unknown): string | null {
  try {
    return JSON.stringify(obj);
  } catch {
    return null;
  }
}

function estimatePayloadSizeMB(payload: string): number {
  return new Blob([payload]).size / (1024 * 1024);
}

function projectToCloudDescription(project: Project): string {
  return safeStringify({
    __type: CLOUD_BACKUP_MARKER,
    project,
  }) as string;
}

function cloudDescriptionToProject(description: string | null): Project | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description) as { __type?: string; project?: Project };
    if (parsed?.__type !== CLOUD_BACKUP_MARKER) return null;
    if (!parsed.project) return null;
    return parsed.project;
  } catch {
    return null;
  }
}

function pickBeforeImage(project: Project): string {
  return project.beforeImages?.[0] ?? PLACEHOLDER_IMAGE;
}

function pickAfterImage(project: Project): string {
  const after = project.afterImages ?? [];
  return after.length ? after[after.length - 1] : PLACEHOLDER_IMAGE;
}

export type CloudSyncFailure = { projectId: string; projectName?: string; error: string };

export interface CloudSyncResult {
  uploaded: number;
  updated: number;
  skipped: number;
  failures: CloudSyncFailure[];
}

async function listCloudBackupsForUser(userId: string): Promise<
  Array<{ id: string; description: string | null }>
> {
  const { data, error } = await supabase
    .from('before_after_photos')
    .select('id,description')
    .eq('user_id', userId);

  if (error) throw error;
  return (data as Array<{ id: string; description: string | null }>) ?? [];
}

async function upsertProjectBackupRow(userId: string, project: Project): Promise<
  { inserted: boolean } | { skipped: true; reason: string }
> {
  const description = projectToCloudDescription(project);
  if (!description) return { skipped: true, reason: 'Erro ao serializar projeto' };

  const sizeMB = estimatePayloadSizeMB(description);
  if (sizeMB > MAX_PAYLOAD_MB) {
    return {
      skipped: true,
      reason: `Projeto muito grande (${sizeMB.toFixed(1)} MB). Reduza o número ou tamanho das fotos.`,
    };
  }

  const beforeImageUrl = pickBeforeImage(project);
  const afterImageUrl = pickAfterImage(project);

  const existingRows = await listCloudBackupsForUser(userId);
  let existingRowId: string | null = null;
  for (const row of existingRows) {
    const p = cloudDescriptionToProject(row.description);
    if (p?.id === project.id) {
      existingRowId = row.id;
      break;
    }
  }

  if (existingRowId) {
    const { error } = await supabase
      .from('before_after_photos')
      .update({
        before_image_url: beforeImageUrl,
        after_image_url: afterImageUrl,
        title: project.name,
        description,
      })
      .eq('id', existingRowId);

    if (error) throw error;
    return { inserted: false };
  }

  const { error } = await supabase.from('before_after_photos').insert({
    user_id: userId,
    before_image_url: beforeImageUrl,
    after_image_url: afterImageUrl,
    title: project.name,
    description,
  });

  if (error) throw error;
  return { inserted: true };
}

export async function syncSelectedProjectsToCloud(
  userId: string,
  selectedProjects: Project[]
): Promise<CloudSyncResult> {
  const result: CloudSyncResult = {
    uploaded: 0,
    updated: 0,
    skipped: 0,
    failures: [],
  };

  for (const project of selectedProjects) {
    try {
      const upsert = await upsertProjectBackupRow(userId, project);
      if ('skipped' in upsert) {
        result.failures.push({
          projectId: project.id,
          projectName: project.name,
          error: upsert.reason,
        });
        result.skipped += 1;
        continue;
      }
      if (upsert.inserted) result.uploaded += 1;
      else result.updated += 1;
    } catch (e: any) {
      const msg = e?.message || 'Erro desconhecido ao sincronizar';
      result.failures.push({
        projectId: project.id,
        projectName: project.name,
        error: msg.length > 200 ? msg.slice(0, 200) + '…' : msg,
      });
    }
  }

  return result;
}

export interface CloudRestoreResult {
  restored: number;
  skipped: number;
  alreadyExisted: number;
  failures: CloudSyncFailure[];
}

async function fetchCloudBackups(userId: string): Promise<
  Array<{ id: string; created_at: string | null; updated_at: string | null; description: string | null }>
> {
  const { data, error } = await supabase
    .from('before_after_photos')
    .select('id,created_at,updated_at,description')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as any[]) ?? [];
}

/**
 * Restaura projetos da nuvem para o IndexedDB local.
 * @param ownerEmail — email do usuário logado; será gravado em cada projeto restaurado
 *                      para que getAllProjectsForUser() encontre os projetos.
 */
export async function restoreProjectsFromCloud(
  userId: string,
  ownerEmail?: string | null,
): Promise<CloudRestoreResult> {
  const backups = await fetchCloudBackups(userId);
  const result: CloudRestoreResult = { restored: 0, skipped: 0, alreadyExisted: 0, failures: [] };

  const existingLocal = await getAllProjectsFromIndexedDB();
  const existingIds = new Set(existingLocal.map((p) => p.id));

  for (const row of backups) {
    try {
      const project = cloudDescriptionToProject(row.description);
      if (!project) {
        result.skipped += 1;
        continue;
      }

      const normalized: Project = {
        ...(project as Project),
        createdAt: (project as any).createdAt || row.updated_at || row.created_at || new Date().toISOString(),
        beforeImages: Array.isArray(project.beforeImages) ? project.beforeImages : [],
        afterImages: Array.isArray(project.afterImages) ? project.afterImages : [],
        evolutionImages: Array.isArray((project as any).evolutionImages) ? (project as any).evolutionImages : undefined,
        notes: (project as any).notes || undefined,
        ownerEmail: ownerEmail || project.ownerEmail || undefined,
      };

      if (existingIds.has(normalized.id)) {
        result.alreadyExisted += 1;
      }

      await saveProjectToIndexedDB(normalized);
      result.restored += 1;
    } catch (e: any) {
      result.failures.push({
        projectId: 'unknown',
        error: e?.message || 'Erro desconhecido ao restaurar',
      });
    }
  }

  return result;
}

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
