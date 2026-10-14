'use client';

import { supabase } from './supabase';

const SHARE_BUCKET = 'public-shares';
const SHARE_TABLE = 'revela_shared_cases';

export interface SharedCaseRecord {
  id: string;
  before_image_url: string;
  after_image_url: string;
  watermark_enabled: boolean;
  watermark_logo_url: string | null;
  created_at: string;
}

/** ID aleatório (12 chars) usado na URL pública — não sequencial, não adivinhável. */
function generateShareId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',');
  const mime = header?.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = window.atob(data || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function uploadShareImage(
  userId: string,
  shareId: string,
  key: 'before' | 'after',
  base64: string
): Promise<string> {
  const blob = base64ToBlob(base64);
  const path = `${userId}/${shareId}/${key}.jpg`;
  const { error } = await supabase.storage
    .from(SHARE_BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw new Error(`Falha ao enviar imagem (${key}): ${error.message}`);
  const { data } = supabase.storage.from(SHARE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export interface CreateSharedCaseParams {
  userId: string;
  projectId: string;
  beforeImageBase64: string;
  afterImageBase64: string;
  watermarkEnabled: boolean;
  watermarkLogoUrl: string;
}

/** Publica um caso antes/depois: sobe as 2 imagens pro bucket público e cria o registro. */
export async function createSharedCase(
  params: CreateSharedCaseParams
): Promise<{ id: string; url: string }> {
  const shareId = generateShareId();

  const [beforeUrl, afterUrl] = await Promise.all([
    uploadShareImage(params.userId, shareId, 'before', params.beforeImageBase64),
    uploadShareImage(params.userId, shareId, 'after', params.afterImageBase64),
  ]);

  const { error } = await supabase.from(SHARE_TABLE).insert({
    id: shareId,
    owner_user_id: params.userId,
    project_id: params.projectId,
    before_image_url: beforeUrl,
    after_image_url: afterUrl,
    watermark_enabled: params.watermarkEnabled,
    watermark_logo_url: params.watermarkLogoUrl || null,
    active: true,
  });

  if (error) throw new Error(`Falha ao criar link compartilhável: ${error.message}`);

  return { id: shareId, url: `${window.location.origin}/c/${shareId}` };
}

/** Desativa um link — fica inacessível imediatamente, mas o histórico não é apagado. */
export async function deactivateSharedCase(shareId: string): Promise<void> {
  const { error } = await supabase
    .from(SHARE_TABLE)
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', shareId);
  if (error) throw new Error(`Falha ao desativar link: ${error.message}`);
}

/** Busca o link ativo mais recente para um projeto (usado pra decidir o que mostrar no botão). */
export async function findActiveSharedCaseForProject(
  projectId: string,
  userId: string
): Promise<SharedCaseRecord | null> {
  try {
    const { data, error } = await supabase
      .from(SHARE_TABLE)
      .select('id, before_image_url, after_image_url, watermark_enabled, watermark_logo_url, created_at')
      .eq('project_id', projectId)
      .eq('owner_user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return (data as SharedCaseRecord) || null;
  } catch {
    return null;
  }
}

/** Busca pública (sem login) de um caso compartilhado pelo ID — usado em /c/[id]. */
export async function getSharedCase(shareId: string): Promise<SharedCaseRecord | null> {
  try {
    const { data, error } = await supabase
      .from(SHARE_TABLE)
      .select('id, before_image_url, after_image_url, watermark_enabled, watermark_logo_url, created_at')
      .eq('id', shareId)
      .eq('active', true)
      .maybeSingle();

    if (error) return null;
    return (data as SharedCaseRecord) || null;
  } catch {
    return null;
  }
}
