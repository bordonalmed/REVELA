'use client';

import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Trash2 } from 'lucide-react';
import { useTr } from '@/contexts/language-context';
import { notify, confirmDialog } from '@/lib/notify';
import {
  CloudPasswordError,
  deleteProjectFromCloud,
  getCloudSyncState,
  listCloudProjects,
  restoreProjectsFromCloud,
  type CloudProgress,
  type CloudProjectInfo,
  type CloudRestoreResult,
} from '@/lib/cloud-project-backup';
import type { Project } from '@/lib/storage';

const cream = '#E8DCC0';
const muted = '#94a3b8';

/** Selo por projeto: na nuvem ✓ / alterado depois do envio / só neste aparelho. */
export function CloudSyncBadge({ project }: { project: Pick<Project, 'id' | 'updatedAt' | 'createdAt'> }) {
  const tr = useTr();
  const state = getCloudSyncState(project);
  const style = {
    synced: { color: '#5eead4', border: 'rgba(94, 234, 212, 0.4)', label: tr('na nuvem ✓', 'in the cloud ✓') },
    changed: { color: '#fde68a', border: 'rgba(253, 230, 138, 0.45)', label: tr('alterado depois do envio', 'changed since last upload') },
    local: { color: muted, border: 'rgba(148, 163, 184, 0.35)', label: tr('só neste aparelho', 'this device only') },
  }[state];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border whitespace-nowrap"
      style={{ color: style.color, borderColor: style.border }}
    >
      {state === 'local' ? <CloudOff className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
      {style.label}
    </span>
  );
}

/** Barra de progresso em fotos. */
export function CloudProgressBar({ progress, label }: { progress: CloudProgress | null; label: string }) {
  if (!progress || progress.total === 0) return null;
  const pct = Math.round((progress.done / progress.total) * 100);
  return (
    <div className="space-y-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex justify-between text-[11px]" style={{ color: muted }}>
        <span className="truncate">
          {label} {progress.projectName ? `— ${progress.projectName}` : ''}
        </span>
        <span>
          {progress.done}/{progress.total}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)' }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#00A88F' }} />
      </div>
    </div>
  );
}

/**
 * Lista o que está na nuvem e permite restaurar só os escolhidos ou apagar um projeto da nuvem.
 */
export function CloudProjectsBrowser({
  userId,
  ownerEmail,
  password,
  localProjects,
  onChanged,
}: {
  userId: string;
  ownerEmail?: string | null;
  password: string;
  localProjects: Project[];
  onChanged: (summary?: CloudRestoreResult) => void;
}) {
  const tr = useTr();
  const [items, setItems] = useState<CloudProjectInfo[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<CloudProgress | null>(null);

  const localById = new Map(localProjects.map((p) => [p.id, p]));
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(tr('pt-BR', 'en-US')) : '—');

  const handleError = (err: any, fallback: string) => {
    console.error(err);
    notify.error(err instanceof CloudPasswordError ? err.message : err?.message || fallback);
  };

  const load = async () => {
    try {
      setLoading(true);
      const list = await listCloudProjects(userId, password);
      setItems(list);
      setSelected(Object.fromEntries(list.map((i) => [i.projectId, true])));
    } catch (err) {
      handleError(err, tr('Erro ao ler a nuvem.', 'Could not read the cloud.'));
    } finally {
      setLoading(false);
    }
  };

  const restoreSelected = async () => {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (ids.length === 0) return;
    try {
      setRestoring(true);
      const res = await restoreProjectsFromCloud(userId, ownerEmail, password, {
        onlyIds: ids,
        onProgress: setProgress,
      });
      onChanged(res);
    } catch (err) {
      handleError(err, tr('Erro ao restaurar da nuvem.', 'Could not restore from the cloud.'));
    } finally {
      setRestoring(false);
      setProgress(null);
    }
  };

  const remove = async (item: CloudProjectInfo) => {
    const onDevice = localById.has(item.projectId);
    const ok = await confirmDialog(
      tr(
        `Apagar "${item.name}" da nuvem? ${onDevice ? 'O projeto continua neste aparelho.' : 'Atenção: este projeto não está neste aparelho e será perdido.'}`,
        `Delete "${item.name}" from the cloud? ${onDevice ? 'The project stays on this device.' : 'Warning: this project is not on this device and will be lost.'}`
      ),
      { confirmLabel: tr('Apagar da nuvem', 'Delete from cloud'), danger: true }
    );
    if (!ok) return;
    try {
      setDeletingId(item.projectId);
      await deleteProjectFromCloud(userId, item.projectId);
      setItems((prev) => (prev || []).filter((i) => i.projectId !== item.projectId));
      notify.success(tr(`"${item.name}" apagado da nuvem.`, `"${item.name}" deleted from the cloud.`));
      onChanged();
    } catch (err) {
      handleError(err, tr('Erro ao apagar da nuvem.', 'Could not delete from the cloud.'));
    } finally {
      setDeletingId(null);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const boxStyle = { backgroundColor: 'rgba(2, 6, 23, 0.45)', borderColor: 'rgba(0, 168, 143, 0.2)' };

  if (!items) {
    return (
      <div className="rounded-lg border p-3" style={boxStyle}>
        <p className="text-xs mb-2" style={{ color: cream, opacity: 0.85 }}>
          {tr(
            'Usar em outro dispositivo? Veja os projetos da nuvem e restaure os que quiser neste aparelho.',
            'Using another device? See your cloud projects and restore the ones you want to this device.'
          )}
        </p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
          style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)', color: cream, border: '1px solid rgba(232, 220, 192, 0.2)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? tr('Lendo a nuvem...', 'Reading the cloud...') : tr('Ver projetos na nuvem', 'View cloud projects')}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 space-y-2" style={boxStyle}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium" style={{ color: cream }}>
          {tr(`Na nuvem (${items.length})`, `In the cloud (${items.length})`)}
        </p>
        <button type="button" onClick={load} className="text-[11px] underline" style={{ color: muted }}>
          {tr('Atualizar', 'Refresh')}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs" style={{ color: muted }}>
          {tr('Nenhum projeto salvo na nuvem ainda.', 'No projects saved in the cloud yet.')}
        </p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {items.map((item) => {
            const local = localById.get(item.projectId);
            const localTime = local ? local.updatedAt || local.createdAt : undefined;
            const relation = !local
              ? tr('não está neste aparelho', 'not on this device')
              : (item.updatedAt || '') > (localTime || '')
                ? tr('nuvem mais nova que o aparelho', 'cloud is newer than this device')
                : tr('aparelho igual ou mais novo (será mantido)', 'device is same or newer (will be kept)');
            return (
              <div
                key={item.projectId}
                className="flex items-center gap-2 px-2 py-2 rounded-lg border"
                style={{ backgroundColor: 'rgba(232, 220, 192, 0.04)', borderColor: 'rgba(148, 163, 184, 0.2)' }}
              >
                <input
                  type="checkbox"
                  checked={!!selected[item.projectId]}
                  onChange={() => setSelected((s) => ({ ...s, [item.projectId]: !s[item.projectId] }))}
                  className="w-4 h-4 rounded shrink-0"
                  style={{ accentColor: '#00A88F' }}
                  aria-label={tr(`Restaurar ${item.name}`, `Restore ${item.name}`)}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate" style={{ color: cream }}>
                    {item.name}
                    {!item.encrypted && (
                      <span className="ml-1 text-[10px]" style={{ color: '#fde68a' }}>
                        {tr('(sem criptografia)', '(unencrypted)')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px]" style={{ color: muted }}>
                    {tr(`${item.photos} foto(s) · ${fmt(item.updatedAt)} · ${relation}`, `${item.photos} photo(s) · ${fmt(item.updatedAt)} · ${relation}`)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  disabled={deletingId === item.projectId}
                  className="p-1.5 rounded hover:bg-white/10 disabled:opacity-50 shrink-0"
                  style={{ color: '#fca5a5' }}
                  aria-label={tr(`Apagar ${item.name} da nuvem`, `Delete ${item.name} from the cloud`)}
                  title={tr('Apagar da nuvem', 'Delete from cloud')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <CloudProgressBar progress={progress} label={tr('Restaurando', 'Restoring')} />

      {items.length > 0 && (
        <button
          type="button"
          onClick={restoreSelected}
          disabled={restoring || selectedCount === 0}
          className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'rgba(232, 220, 192, 0.1)', color: cream, border: '1px solid rgba(232, 220, 192, 0.2)' }}
        >
          {restoring
            ? tr('Restaurando...', 'Restoring...')
            : tr(`Restaurar selecionados (${selectedCount})`, `Restore selected (${selectedCount})`)}
        </button>
      )}
    </div>
  );
}
