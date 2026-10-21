// "Restaurar original": guarda a primeira versão de cada foto editada.
// A chave é uma impressão digital do conteúdo da foto editada, assim continua
// valendo mesmo se as fotos forem reordenadas ou removidas.

/** Impressão digital rápida (FNV-1a) de uma foto em base64. */
export function imageKey(dataUrl: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < dataUrl.length; i++) {
    h ^= dataUrl.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${dataUrl.length.toString(36)}-${(h >>> 0).toString(36)}`;
}

/** Original de uma foto (se ela foi editada neste aparelho). */
export function findOriginal(originals: Record<string, string> | undefined, current: string): string | undefined {
  if (!originals || !current) return undefined;
  return originals[imageKey(current)];
}

/**
 * Atualiza o mapa ao trocar `previous` por `next`.
 * - edição: o original continua sendo a primeira versão da foto;
 * - restaurar (`next` é o original): o vínculo é removido.
 */
export function recordEdit(
  originals: Record<string, string> | undefined,
  previous: string,
  next: string
): Record<string, string> {
  const map = { ...(originals || {}) };
  const prevKey = imageKey(previous);
  const original = map[prevKey] ?? previous;
  delete map[prevKey];
  if (next !== original) map[imageKey(next)] = original;
  return map;
}

/** Remove originais de fotos que não existem mais no projeto. */
export function pruneOriginals(
  originals: Record<string, string> | undefined,
  images: string[]
): Record<string, string> | undefined {
  if (!originals) return undefined;
  const alive = new Set(images.map(imageKey));
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(originals)) if (alive.has(k)) out[k] = v;
  return Object.keys(out).length ? out : undefined;
}
