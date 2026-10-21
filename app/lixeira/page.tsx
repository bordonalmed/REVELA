'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Trash2, Clock, Info } from 'lucide-react';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import { SafeBase64Image } from '@/components/safe-image';
import { useAuth } from '@/hooks/useAuth';
import { useTr } from '@/contexts/language-context';
import { notify, confirmDialog } from '@/lib/notify';
import { VAULT_UPDATED_EVENT, useVaultStatus } from '@/components/vault-agent';
import {
  purgeProjectFromTrash, getTrashedProjects, purgeExpiredTrash, restoreProjectFromTrash, trashDaysLeft, TRASH_DAYS,
  type Project,
} from '@/lib/storage';

const C = {
  bg: '#1A2B32',
  cream: '#E8DCC0',
  teal: '#00A88F',
  muted: '#94a3b8',
  panel: 'rgba(232, 220, 192, 0.05)',
  border: 'rgba(232, 220, 192, 0.12)',
  warn: '#fbbf24',
  danger: '#f87171',
};

export default function LixeiraPage() {
  const tr = useTr();
  const router = useRouter();
  const { user, loading } = useAuth(true);
  const [items, setItems] = useState<Project[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const vault = useVaultStatus();
  const vaultOn = ['ok', 'syncing', 'error', 'locked'].includes(vault.phase);
  const everywhere = vaultOn ? tr(' Ele será apagado deste aparelho e de todos os seus aparelhos.', ' It will be deleted from this device and all your devices.') : '';

  const load = useCallback(async () => {
    await purgeExpiredTrash().catch(() => 0);
    setItems(await getTrashedProjects(user?.email || null).catch(() => []));
  }, [user?.email]);

  useEffect(() => {
    if (!user) return;
    void load();
    const reload = () => { void load(); };
    window.addEventListener(VAULT_UPDATED_EVENT, reload);
    return () => window.removeEventListener(VAULT_UPDATED_EVENT, reload);
  }, [user, load]);

  const restore = async (p: Project) => {
    setBusy(p.id);
    try {
      await restoreProjectFromTrash(p.id);
      notify.success(tr(`"${p.name}" voltou para seus projetos.`, `"${p.name}" is back in your projects.`), { label: tr('Abrir', 'Open'), href: `/projects/${p.id}` });
      await load();
    } catch {
      notify.error(tr('Não foi possível restaurar. Tente de novo.', 'Could not restore. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  const removeForever = async (p: Project) => {
    const ok = await confirmDialog(
      tr(`Apagar "${p.name}" para sempre?`, `Delete "${p.name}" forever?`) + everywhere + tr(' Não será possível recuperar.', ' It cannot be recovered.'),
      { confirmLabel: tr('Apagar para sempre', 'Delete forever'), danger: true }
    );
    if (!ok) return;
    setBusy(p.id);
    try {
      await purgeProjectFromTrash(p.id);
      notify.success(tr('Projeto apagado para sempre.', 'Project deleted forever.'));
      await load();
    } finally {
      setBusy(null);
    }
  };

  const emptyAll = async () => {
    if (!items?.length) return;
    const ok = await confirmDialog(
      tr(
        `Esvaziar a lixeira? ${items.length} projeto(s) serão apagados para sempre${vaultOn ? ', deste aparelho e de todos os seus aparelhos' : ''}.`,
        `Empty the trash? ${items.length} project(s) will be deleted forever${vaultOn ? ', from this device and all your devices' : ''}.`
      ),
      { confirmLabel: tr('Esvaziar lixeira', 'Empty trash'), danger: true }
    );
    if (!ok) return;
    setBusy('all');
    try {
      for (const p of items) await purgeProjectFromTrash(p.id);
      notify.success(tr('Lixeira vazia.', 'Trash emptied.'));
      await load();
    } finally {
      setBusy(null);
    }
  };

  const deletedLabel = (p: Project) => {
    const days = Math.floor((Date.now() - new Date(p.deletedAt || 0).getTime()) / 86_400_000);
    if (days < 1) return tr('Apagado hoje', 'Deleted today');
    if (days === 1) return tr('Apagado ontem', 'Deleted yesterday');
    return tr(`Apagado há ${days} dias`, `Deleted ${days} days ago`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.bg }}>
      <NavigationHeader />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-3xl pt-20 sm:pt-24">
        <button onClick={() => router.push('/projects')} className="inline-flex items-center gap-1.5 text-sm mb-5 hover:opacity-80" style={{ color: C.muted }}>
          <ArrowLeft className="w-4 h-4" /> {tr('Projetos', 'Projects')}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light flex items-center gap-3" style={{ color: C.cream }}>
              <Trash2 className="w-7 h-7" style={{ color: C.teal }} /> {tr('Lixeira', 'Trash')}
            </h1>
            <p className="text-sm mt-1" style={{ color: C.cream, opacity: 0.75 }}>
              {tr(
                `Projetos apagados ficam aqui por ${TRASH_DAYS} dias. Depois disso, somem para sempre.`,
                `Deleted projects stay here for ${TRASH_DAYS} days. After that, they are gone forever.`
              )}
            </p>
          </div>
          {!!items?.length && (
            <button
              onClick={emptyAll}
              disabled={busy !== null}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors hover:bg-white/5 disabled:opacity-50"
              style={{ color: C.danger, borderColor: 'rgba(248,113,113,0.4)' }}
            >
              <Trash2 className="w-4 h-4" /> {tr('Esvaziar lixeira', 'Empty trash')}
            </button>
          )}
        </div>

        {loading || items === null ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: C.teal, borderTopColor: 'transparent' }} />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: C.panel, borderColor: C.border }}>
            <Trash2 className="w-10 h-10 mx-auto mb-3" style={{ color: C.muted }} />
            <p className="text-base" style={{ color: C.cream }}>{tr('A lixeira está vazia.', 'The trash is empty.')}</p>
            <Link href="/projects" className="inline-block mt-4 text-sm underline" style={{ color: C.teal }}>
              {tr('Voltar para os projetos', 'Back to projects')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((p) => {
              const left = trashDaysLeft(p);
              const thumb = p.afterImages?.[0] || p.beforeImages?.[0];
              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border p-4"
                  style={{ backgroundColor: C.panel, borderColor: C.border }}
                  data-testid="trash-item"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      {thumb && <SafeBase64Image src={thumb} alt={p.name} className="w-full h-full object-cover opacity-70" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base truncate" style={{ color: C.cream }}>{p.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                        {deletedLabel(p)} · {(p.beforeImages?.length || 0) + (p.afterImages?.length || 0)} {tr('fotos', 'photos')}
                      </p>
                      <p className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: left <= 3 ? C.warn : C.muted }}>
                        <Clock className="w-3.5 h-3.5" />
                        {left <= 1
                          ? tr('Some amanhã', 'Gone tomorrow')
                          : tr(`Some em ${left} dias`, `Gone in ${left} days`)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex gap-2">
                    <button
                      onClick={() => restore(p)}
                      disabled={busy !== null}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: C.teal, color: '#fff' }}
                    >
                      <RotateCcw className="w-4 h-4" /> {tr('Restaurar', 'Restore')}
                    </button>
                    <button
                      onClick={() => removeForever(p)}
                      disabled={busy !== null}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors hover:bg-white/5 disabled:opacity-50"
                      style={{ color: C.danger, borderColor: 'rgba(248,113,113,0.4)' }}
                      aria-label={tr('Apagar para sempre', 'Delete forever')}
                    >
                      <Trash2 className="w-4 h-4" /> {tr('Apagar', 'Delete')}
                    </button>
                  </div>
                </div>
              );
            })}
            <p className="text-xs flex items-start gap-1.5 pt-2" style={{ color: C.muted }}>
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {tr(
                'Com o Cofre ligado: restaurar traz o projeto de volta em todos os seus aparelhos, e apagar aqui apaga em todos eles.',
                'With the Vault on: restoring brings the project back on all your devices, and deleting here deletes it on all of them.'
              )}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
