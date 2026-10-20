'use client';

/**
 * Agente do Cofre: roda em segundo plano nas telas logadas.
 * - Ao abrir o app (e ao voltar para a aba), sincroniza este aparelho com o cofre.
 * - Quando um projeto é criado/editado/apagado, envia a mudança sozinho.
 * Só age se o usuário é Premium e o cofre está aberto neste aparelho.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { PROJECT_CHANGED_EVENT, getProjectFromIndexedDB, type ProjectChangedDetail } from '@/lib/storage';
import { deleteFromVault, getVaultState, pushOneProject, syncVault, VaultError, type VaultSyncResult } from '@/lib/vault';
import type { CloudProgress } from '@/lib/cloud-project-backup';

export const VAULT_UPDATED_EVENT = 'revela:vault-updated';

export type VaultPhase = 'off' | 'none' | 'locked' | 'syncing' | 'ok' | 'error';

export interface VaultStatus {
  phase: VaultPhase;
  items: number;
  legacy: number;
  progress: CloudProgress | null;
  lastSync: string | null;
  error: string | null;
  lastResult: VaultSyncResult | null;
}

// ─── Estado compartilhado (uma instância por aba) ──────────────────────

let status: VaultStatus = { phase: 'off', items: 0, legacy: 0, progress: null, lastSync: null, error: null, lastResult: null };
const subs = new Set<() => void>();

function setStatus(patch: Partial<VaultStatus>) {
  status = { ...status, ...patch };
  subs.forEach((fn) => fn());
}

export function useVaultStatus(): VaultStatus {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => status,
    () => status
  );
}

// Uma operação de cada vez (evita dois envios do mesmo projeto ao mesmo tempo)
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const next = queue.then(job, job);
  queue = next.catch(() => {});
  return next;
}

let lastFullSync = 0;

/** Atualiza o estado do cofre e, se estiver aberto, sincroniza. Usado pelo agente e pela página /cofre. */
export function refreshVault(userId: string, ownerEmail?: string | null, opts: { force?: boolean } = {}): Promise<void> {
  return enqueue(async () => {
    try {
      const st = await getVaultState(userId);
      setStatus({ items: st.items, legacy: st.legacy, phase: st.state === 'unlocked' ? status.phase : st.state, error: null });
      if (st.state !== 'unlocked') return;
      if (!opts.force && Date.now() - lastFullSync < 60_000) {
        if (status.phase !== 'ok') setStatus({ phase: 'ok' });
        return;
      }
      setStatus({ phase: 'syncing', progress: null });
      const res = await syncVault(userId, (p) => setStatus({ progress: p }), ownerEmail);
      lastFullSync = Date.now();
      const after = await getVaultState(userId);
      setStatus({
        phase: res.failures.length ? 'error' : 'ok',
        items: after.items,
        progress: null,
        lastSync: new Date().toISOString(),
        lastResult: res,
        error: res.failures.length ? res.failures.map((f) => `${f.projectName || f.projectId}: ${f.error}`).join(' · ') : null,
      });
      if (res.received || res.deletedHere) window.dispatchEvent(new Event(VAULT_UPDATED_EVENT));
    } catch (e: any) {
      if (e instanceof VaultError && (e.code === 'locked' || e.code === 'no-vault')) {
        setStatus({ phase: e.code === 'locked' ? 'locked' : 'none', progress: null, error: e.message });
      } else {
        setStatus({ phase: 'error', progress: null, error: e?.message || String(e) });
      }
    }
  });
}

export function VaultAgent({ userId, ownerEmail, enabled }: { userId?: string; ownerEmail?: string | null; enabled: boolean }) {
  useEffect(() => {
    if (!enabled || !userId) {
      setStatus({ phase: 'off' });
      return;
    }
    void refreshVault(userId, ownerEmail);

    // Mudanças locais → envio automático (com uma pequena espera para juntar edições seguidas)
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const onChange = (ev: Event) => {
      const { id, deleted } = (ev as CustomEvent<ProjectChangedDetail>).detail || ({} as ProjectChangedDetail);
      if (!id || status.phase === 'off' || status.phase === 'none' || status.phase === 'locked') return;
      clearTimeout(timers.get(id));
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          void enqueue(async () => {
            try {
              setStatus({ phase: 'syncing' });
              if (deleted) {
                await deleteFromVault(userId, id);
              } else {
                const project = await getProjectFromIndexedDB(id);
                if (project) await pushOneProject(userId, project);
              }
              const st = await getVaultState(userId);
              setStatus({ phase: 'ok', items: st.items, lastSync: new Date().toISOString(), error: null });
            } catch (e: any) {
              setStatus({ phase: e instanceof VaultError && e.code === 'locked' ? 'locked' : 'error', error: e?.message || String(e) });
            }
          });
        }, deleted ? 0 : 1500)
      );
    };
    // Voltou para a aba: confere se algo mudou em outro aparelho
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshVault(userId, ownerEmail);
    };
    window.addEventListener(PROJECT_CHANGED_EVENT, onChange);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(PROJECT_CHANGED_EVENT, onChange);
      document.removeEventListener('visibilitychange', onVisible);
      timers.forEach(clearTimeout);
    };
  }, [enabled, userId, ownerEmail]);

  return null;
}
