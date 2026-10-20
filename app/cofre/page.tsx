'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Lock, Smartphone, Laptop, RefreshCw, KeyRound, Copy, Download, Printer, Eye, EyeOff,
  CheckCircle2, AlertTriangle, ArrowLeft, Cloud, LogOut, Trash2, Sparkles, ChevronRight, X,
} from 'lucide-react';
import { NavigationHeader } from '@/components/navigation-header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { useTr } from '@/contexts/language-context';
import { notify, confirmDialog } from '@/lib/notify';
import { CloudProgressBar } from '@/components/cloud-sync-panels';
import { refreshVault, useVaultStatus, VAULT_UPDATED_EVENT } from '@/components/vault-agent';
import {
  changePassword, createVault, deleteLegacyCloudCopies, deleteVault, forgetThisDevice, passwordStrength,
  recreateVaultFromThisDevice, regenerateRecoveryCode, resetPasswordWithRecoveryCode, unlockWithPassword,
  VAULT_PASSWORD_MIN, VaultError,
} from '@/lib/vault';
import { restoreProjectsFromCloud, type CloudProgress } from '@/lib/cloud-project-backup';

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

// ─── Peças de interface ────────────────────────────────────────────────

function Panel({ children, className = '', tone }: { children: React.ReactNode; className?: string; tone?: 'teal' | 'warn' }) {
  const border = tone === 'teal' ? 'rgba(0, 168, 143, 0.45)' : tone === 'warn' ? 'rgba(251, 191, 36, 0.45)' : C.border;
  const bg = tone === 'teal' ? 'rgba(0, 168, 143, 0.08)' : tone === 'warn' ? 'rgba(251, 191, 36, 0.06)' : C.panel;
  return (
    <div className={`rounded-2xl border p-5 sm:p-6 ${className}`} style={{ backgroundColor: bg, borderColor: border }}>
      {children}
    </div>
  );
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ backgroundColor: C.teal, color: '#fff', ...(props.style || {}) }}
    />
  );
}

function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  const { className = '', danger, ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors hover:bg-white/5 disabled:opacity-50 ${className}`}
      style={{ color: danger ? C.danger : C.cream, borderColor: danger ? 'rgba(248,113,113,0.4)' : C.border }}
    />
  );
}

function PasswordField({
  value, onChange, placeholder, autoFocus, showStrength, id, onEnter,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean; showStrength?: boolean; id?: string; onEnter?: () => void;
}) {
  const tr = useTr();
  const [show, setShow] = useState(false);
  const strength = passwordStrength(value);
  const meter = {
    weak: { w: '33%', c: C.danger, t: tr('fraca', 'weak') },
    ok: { w: '66%', c: C.warn, t: tr('boa', 'good') },
    strong: { w: '100%', c: '#2dd4bf', t: tr('forte', 'strong') },
  }[strength];
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.(); }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full px-4 py-3 pr-12 rounded-xl border text-base outline-none focus:ring-2"
          style={{ backgroundColor: 'rgba(2, 6, 23, 0.5)', borderColor: C.border, color: C.cream }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10"
          style={{ color: C.muted }}
          aria-label={show ? tr('Ocultar senha', 'Hide password') : tr('Mostrar senha', 'Show password')}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(148,163,184,0.2)' }}>
            <div className="h-full transition-all" style={{ width: value.length < VAULT_PASSWORD_MIN ? '15%' : meter.w, backgroundColor: meter.c }} />
          </div>
          <span className="text-xs w-24 text-right" style={{ color: meter.c }}>
            {value.length < VAULT_PASSWORD_MIN ? tr(`mín. ${VAULT_PASSWORD_MIN} caracteres`, `min. ${VAULT_PASSWORD_MIN} characters`) : meter.t}
          </span>
        </div>
      )}
    </div>
  );
}

function RecoveryCodeCard({ code, onDone }: { code: string; onDone: () => void }) {
  const tr = useTr();
  const [saved, setSaved] = useState(false);
  const text = tr(
    `Revela — Código de recuperação do Cofre\n\n${code}\n\nGuarde este código em um lugar seguro. Ele serve para abrir o cofre se você esquecer a senha.`,
    `Revela — Vault recovery code\n\n${code}\n\nKeep this code somewhere safe. It opens your vault if you forget the password.`
  );
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); notify.success(tr('Código copiado.', 'Code copied.')); } catch { /* ignore */ }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'revela-codigo-de-recuperacao.txt'; a.click();
    URL.revokeObjectURL(url);
  };
  const print = () => {
    const w = window.open('', '_blank', 'width=480,height=400');
    if (!w) return;
    w.document.write(`<pre style="font:16px/1.6 system-ui;padding:24px;white-space:pre-wrap">${text.replace(/</g, '&lt;')}</pre>`);
    w.document.close(); w.focus(); w.print();
  };
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: C.cream, opacity: 0.85 }}>
        {tr(
          'Esta é a sua chave reserva. Se esquecer a senha do cofre, é com ela que você entra. Guarde num lugar seguro — ela aparece só agora.',
          'This is your spare key. If you forget the vault password, this is how you get in. Keep it somewhere safe — it is shown only now.'
        )}
      </p>
      <div
        className="rounded-xl border-2 border-dashed py-5 px-3 text-center font-mono text-xl sm:text-2xl tracking-widest select-all"
        style={{ borderColor: 'rgba(0,168,143,0.6)', color: '#fff', backgroundColor: 'rgba(0,168,143,0.08)' }}
        data-testid="recovery-code"
      >
        {code}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <GhostButton onClick={copy}><Copy className="w-4 h-4" />{tr('Copiar', 'Copy')}</GhostButton>
        <GhostButton onClick={download}><Download className="w-4 h-4" />{tr('Baixar', 'Download')}</GhostButton>
        <GhostButton onClick={print}><Printer className="w-4 h-4" />{tr('Imprimir', 'Print')}</GhostButton>
      </div>
      <label className="flex items-start gap-3 cursor-pointer text-sm" style={{ color: C.cream }}>
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 w-5 h-5" style={{ accentColor: C.teal }} />
        {tr('Guardei meu código de recuperação', 'I saved my recovery code')}
      </label>
      <PrimaryButton className="w-full" disabled={!saved} onClick={onDone}>
        {tr('Continuar', 'Continue')} <ChevronRight className="w-4 h-4" />
      </PrimaryButton>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-6 max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: '#1B3C45', borderColor: C.border }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium" style={{ color: C.cream }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: C.muted }} aria-label="X"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-5" aria-hidden>
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: n <= step ? C.teal : 'rgba(148,163,184,0.25)' }} />
      ))}
    </div>
  );
}

const errorText = (e: any) => (e instanceof VaultError ? e.message : e?.message || String(e));

// ─── Página ────────────────────────────────────────────────────────────

type Dialog = null | 'setup' | 'change' | 'newcode' | 'forgot' | 'legacy';

export default function CofrePage() {
  const tr = useTr();
  const { user, loading } = useAuth(true);
  const { hasPremiumAccess, entitlementLoading } = usePlan();
  const vault = useVaultStatus();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [checked, setChecked] = useState(false);

  const userId = user?.id;
  const refresh = (force = false) => userId && refreshVault(userId, user?.email, { force });

  useEffect(() => {
    if (!userId || !hasPremiumAccess) return;
    void Promise.resolve(refresh()).finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasPremiumAccess]);

  if (loading || (hasPremiumAccess && !checked && vault.phase === 'off') || entitlementLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: C.teal, borderTopColor: 'transparent' }} />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm mb-5 hover:opacity-80" style={{ color: C.muted }}>
        <ArrowLeft className="w-4 h-4" /> {tr('Configurações', 'Settings')}
      </Link>

      {!hasPremiumAccess ? (
        <Upsell />
      ) : vault.phase === 'none' ? (
        <Intro onStart={() => setDialog('setup')} legacy={vault.legacy} />
      ) : vault.phase === 'locked' ? (
        <Unlock userId={userId!} items={vault.items} message={vault.error} onForgot={() => setDialog('forgot')} onUnlocked={() => refresh(true)} />
      ) : (
        <Dashboard
          userId={userId!}
          onSync={() => refresh(true)}
          onDialog={setDialog}
        />
      )}

      {dialog === 'setup' && userId && <SetupWizard userId={userId} onClose={() => { setDialog(null); refresh(true); }} />}
      {dialog === 'change' && userId && <ChangePasswordDialog userId={userId} onClose={() => setDialog(null)} />}
      {dialog === 'newcode' && userId && <NewCodeDialog userId={userId} onClose={() => setDialog(null)} />}
      {dialog === 'forgot' && userId && <ForgotDialog userId={userId} onClose={(changed) => { setDialog(null); if (changed) refresh(true); }} />}
      {dialog === 'legacy' && userId && <LegacyDialog userId={userId} email={user?.email} onClose={() => { setDialog(null); refresh(true); }} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.bg }}>
      <NavigationHeader />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-2xl pt-20 sm:pt-24">{children}</main>
      <Footer />
    </div>
  );
}

function Hero({ title, subtitle, icon }: { title: string; subtitle: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center mb-6">
      <div className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,168,143,0.15)', color: C.teal }}>
        {icon ?? <ShieldCheck className="w-8 h-8" />}
      </div>
      <h1 className="text-2xl sm:text-3xl font-light mb-2" style={{ color: C.cream }}>{title}</h1>
      <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: C.cream, opacity: 0.8 }}>{subtitle}</p>
    </div>
  );
}

function Benefits() {
  const tr = useTr();
  const items = [
    { icon: <><Laptop className="w-5 h-5" /><Smartphone className="w-4 h-4 -ml-1" /></>, t: tr('Em todos os seus aparelhos', 'On all your devices'), d: tr('Entre com seu e-mail e senha em qualquer aparelho e seus projetos aparecem.', 'Sign in on any device and your projects show up.') },
    { icon: <Lock className="w-5 h-5" />, t: tr('Só você abre', 'Only you can open it'), d: tr('As fotos vão trancadas. Nem a equipe do Revela consegue ver.', 'Photos travel locked. Not even the Revela team can see them.') },
    { icon: <RefreshCw className="w-5 h-5" />, t: tr('Sincroniza sozinho', 'Syncs by itself'), d: tr('Criou ou editou um projeto? Ele vai para o cofre sem você apertar nada.', 'Created or edited a project? It goes to the vault without any clicks.') },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3 mb-6">
      {items.map((i) => (
        <div key={i.t} className="rounded-2xl border p-4" style={{ backgroundColor: C.panel, borderColor: C.border }}>
          <div className="flex items-center mb-2" style={{ color: C.teal }}>{i.icon}</div>
          <p className="text-sm font-medium mb-1" style={{ color: C.cream }}>{i.t}</p>
          <p className="text-xs" style={{ color: C.muted }}>{i.d}</p>
        </div>
      ))}
    </div>
  );
}

function Upsell() {
  const tr = useTr();
  return (
    <>
      <Hero title={tr('Cofre Revela', 'Revela Vault')} subtitle={tr('Seus projetos em todos os seus aparelhos, trancados com uma senha que só você sabe.', 'Your projects on all your devices, locked with a password only you know.')} />
      <Benefits />
      <Panel tone="teal" className="text-center">
        <p className="text-sm mb-4" style={{ color: C.cream }}>
          {tr('O Cofre é exclusivo do ', 'The Vault is part of ')}<strong>Revela Premium</strong>.{' '}
          {tr('Sem ele, seus projetos continuam seguros, só neste aparelho.', 'Without it, your projects stay safe, on this device only.')}
        </p>
        <Link href="/planos"><PrimaryButton>{tr('Conhecer o Premium', 'See Premium')}</PrimaryButton></Link>
      </Panel>
    </>
  );
}

function Intro({ onStart, legacy }: { onStart: () => void; legacy: number }) {
  const tr = useTr();
  return (
    <>
      <Hero title={tr('Cofre Revela', 'Revela Vault')} subtitle={tr('Seus projetos em todos os seus aparelhos, trancados com uma senha que só você sabe.', 'Your projects on all your devices, locked with a password only you know.')} />
      <Benefits />
      <Panel className="text-center">
        <PrimaryButton className="w-full sm:w-auto" onClick={onStart}>
          <ShieldCheck className="w-5 h-5" /> {tr('Ligar meu cofre', 'Turn on my vault')}
        </PrimaryButton>
        <p className="text-xs mt-3" style={{ color: C.muted }}>
          {tr('Leva 1 minuto. Você pode desligar quando quiser.', 'Takes 1 minute. You can turn it off anytime.')}
        </p>
        {legacy > 0 && (
          <p className="text-xs mt-3" style={{ color: C.warn }}>
            {tr(`Você tem ${legacy} projeto(s) da nuvem antiga. Depois de ligar o cofre, dá para trazê-los.`, `You have ${legacy} project(s) from the old cloud. After turning on the vault you can bring them in.`)}
          </p>
        )}
      </Panel>
    </>
  );
}

function Unlock({ userId, items, message, onForgot, onUnlocked }: { userId: string; items: number; message: string | null; onForgot: () => void; onUnlocked: () => void }) {
  const tr = useTr();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!pw) return;
    try {
      setBusy(true); setErr('');
      await unlockWithPassword(userId, pw);
      notify.success(tr('Cofre aberto neste aparelho.', 'Vault unlocked on this device.'));
      onUnlocked();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Hero
        icon={<Lock className="w-8 h-8" />}
        title={tr('Abra seu cofre neste aparelho', 'Unlock your vault on this device')}
        subtitle={items > 0
          ? tr(`Você tem ${items} projeto(s) guardados no cofre. Digite a senha do cofre para vê-los aqui.`, `You have ${items} project(s) in your vault. Enter the vault password to see them here.`)
          : tr('Digite a senha do cofre para conectar este aparelho.', 'Enter the vault password to connect this device.')}
      />
      <Panel>
        {message && !err && <p className="text-sm mb-3" style={{ color: C.warn }}>{message}</p>}
        <label className="block text-sm mb-2" style={{ color: C.cream }} htmlFor="vault-unlock">{tr('Senha do cofre', 'Vault password')}</label>
        <PasswordField id="vault-unlock" value={pw} onChange={setPw} placeholder={tr('Sua senha do cofre', 'Your vault password')} autoFocus onEnter={submit} />
        {err && <p className="text-sm mt-2" style={{ color: C.danger }} role="alert">{err}</p>}
        <PrimaryButton className="w-full mt-4" disabled={busy || !pw} onClick={submit}>
          {busy ? tr('Abrindo…', 'Unlocking…') : tr('Abrir cofre', 'Unlock vault')}
        </PrimaryButton>
        <button onClick={onForgot} className="w-full mt-3 text-sm underline" style={{ color: C.muted }}>
          {tr('Esqueci a senha do cofre', 'I forgot my vault password')}
        </button>
      </Panel>
      <p className="text-xs text-center mt-4" style={{ color: C.muted }}>
        {tr('Este aparelho vai lembrar da senha. Você só digita uma vez.', 'This device will remember. You only type it once.')}
      </p>
    </>
  );
}

function relTime(iso: string | null, tr: (pt: string, en: string) => string) {
  if (!iso) return '—';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return tr('agora mesmo', 'just now');
  if (min < 60) return tr(`há ${min} min`, `${min} min ago`);
  const h = Math.round(min / 60);
  if (h < 24) return tr(`há ${h} h`, `${h} h ago`);
  return new Date(iso).toLocaleDateString(tr('pt-BR', 'en-US'));
}

function Dashboard({ userId, onSync, onDialog }: { userId: string; onSync: () => void; onDialog: (d: Dialog) => void }) {
  const tr = useTr();
  const vault = useVaultStatus();
  const syncing = vault.phase === 'syncing';

  useEffect(() => {
    const onUpdated = () => { /* os números já vêm do status */ };
    window.addEventListener(VAULT_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(VAULT_UPDATED_EVENT, onUpdated);
  }, []);

  const disconnect = async () => {
    const ok = await confirmDialog(
      tr('Desconectar este aparelho do cofre? Os projetos continuam aqui; para voltar a sincronizar, basta digitar a senha do cofre de novo.', 'Disconnect this device from the vault? Projects stay here; to sync again, just enter the vault password.'),
      { confirmLabel: tr('Desconectar', 'Disconnect') }
    );
    if (!ok) return;
    await forgetThisDevice(userId);
    onSync();
  };
  const removeVault = async () => {
    const ok = await confirmDialog(
      tr('Apagar o cofre? Todas as cópias da nuvem serão apagadas para sempre. Os projetos que estão em cada aparelho continuam lá.', 'Delete the vault? All cloud copies will be permanently deleted. Projects on each device stay there.'),
      { confirmLabel: tr('Apagar cofre', 'Delete vault'), danger: true }
    );
    if (!ok) return;
    try {
      await deleteVault(userId);
      notify.success(tr('Cofre apagado. Seus projetos continuam neste aparelho.', 'Vault deleted. Your projects remain on this device.'));
      onSync();
    } catch (e) {
      notify.error(errorText(e));
    }
  };

  const actions: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; danger?: boolean }[] = [
    { icon: <KeyRound className="w-5 h-5" />, title: tr('Trocar senha do cofre', 'Change vault password'), desc: tr('Não precisa da senha antiga neste aparelho.', 'No need for the old password on this device.'), onClick: () => onDialog('change') },
    { icon: <Sparkles className="w-5 h-5" />, title: tr('Novo código de recuperação', 'New recovery code'), desc: tr('Perdeu o papel? Gere outro; o antigo deixa de valer.', 'Lost it? Make a new one; the old one stops working.'), onClick: () => onDialog('newcode') },
    { icon: <LogOut className="w-5 h-5" />, title: tr('Desconectar este aparelho', 'Disconnect this device'), desc: tr('Útil em computador emprestado ou compartilhado.', 'Useful on a borrowed or shared computer.'), onClick: disconnect },
    { icon: <Trash2 className="w-5 h-5" />, title: tr('Apagar meu cofre', 'Delete my vault'), desc: tr('Remove tudo da nuvem. Os aparelhos mantêm seus projetos.', 'Removes everything from the cloud. Devices keep their projects.'), onClick: removeVault, danger: true },
  ];

  return (
    <>
      <Panel tone={vault.phase === 'error' ? 'warn' : 'teal'} className="mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,168,143,0.18)', color: vault.phase === 'error' ? C.warn : C.teal }}>
            {vault.phase === 'error' ? <AlertTriangle className="w-6 h-6" /> : syncing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-light" style={{ color: C.cream }}>{tr('Cofre ligado', 'Vault on')}</h1>
            <p className="text-sm mt-0.5" style={{ color: C.cream, opacity: 0.85 }}>
              {syncing
                ? tr('Sincronizando…', 'Syncing…')
                : tr(`${vault.items} projeto(s) no cofre · atualizado ${relTime(vault.lastSync, tr)}`, `${vault.items} project(s) in the vault · updated ${relTime(vault.lastSync, tr)}`)}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.muted }}>
              <Cloud className="w-3.5 h-3.5" /> {tr('Este aparelho está conectado e sincroniza sozinho.', 'This device is connected and syncs automatically.')}
            </p>
          </div>
        </div>
        {vault.progress && <div className="mt-4"><CloudProgressBar progress={vault.progress as CloudProgress} label={tr('Sincronizando', 'Syncing')} /></div>}
        {vault.phase === 'error' && vault.error && <p className="text-xs mt-3" style={{ color: C.warn }}>{vault.error}</p>}
        <GhostButton className="w-full mt-4" onClick={onSync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {tr('Sincronizar agora', 'Sync now')}
        </GhostButton>
      </Panel>

      {vault.legacy > 0 && (
        <Panel tone="warn" className="mb-4">
          <p className="text-sm mb-3" style={{ color: C.cream }}>
            {tr(`Encontramos ${vault.legacy} projeto(s) da nuvem antiga (antes do Cofre).`, `We found ${vault.legacy} project(s) from the old cloud (before the Vault).`)}
          </p>
          <GhostButton onClick={() => onDialog('legacy')}>{tr('Trazer para o cofre', 'Bring into the vault')} <ChevronRight className="w-4 h-4" /></GhostButton>
        </Panel>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
        {actions.map((a, i) => (
          <button
            key={a.title}
            onClick={a.onClick}
            className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors ${i ? 'border-t' : ''}`}
            style={{ borderColor: C.border, backgroundColor: C.panel }}
          >
            <span style={{ color: a.danger ? C.danger : C.teal }}>{a.icon}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium" style={{ color: a.danger ? C.danger : C.cream }}>{a.title}</span>
              <span className="block text-xs" style={{ color: C.muted }}>{a.desc}</span>
            </span>
            <ChevronRight className="w-4 h-4" style={{ color: C.muted }} />
          </button>
        ))}
      </div>

      <p className="text-xs text-center mt-5 px-4" style={{ color: C.muted }}>
        {tr(
          'Fotos e dados são trancados neste aparelho antes de ir para a nuvem. Sem a senha ou o código de recuperação, ninguém abre — nem a equipe do Revela.',
          'Photos and data are locked on this device before going to the cloud. Without the password or recovery code, nobody can open them — not even the Revela team.'
        )}
      </p>
    </>
  );
}

// ─── Diálogos ──────────────────────────────────────────────────────────

function NewPasswordForm({ submitLabel, onSubmit, busy, hint }: { submitLabel: string; onSubmit: (pw: string) => void; busy: boolean; hint?: string }) {
  const tr = useTr();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const mismatch = pw2.length > 0 && pw !== pw2;
  const valid = pw.length >= VAULT_PASSWORD_MIN && pw === pw2;
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: C.cream, opacity: 0.85 }}>
        {hint ?? tr('Pode ser simples: pelo menos 6 letras ou números. Dica: uma palavra + um número (ex.: girassol27).', 'It can be simple: at least 6 letters or numbers. Tip: a word + a number (e.g. sunflower27).')}
      </p>
      <PasswordField value={pw} onChange={setPw} placeholder={tr('Senha do cofre', 'Vault password')} autoFocus showStrength />
      <PasswordField value={pw2} onChange={setPw2} placeholder={tr('Repita a senha', 'Repeat the password')} onEnter={() => valid && onSubmit(pw)} />
      {mismatch && <p className="text-xs" style={{ color: C.danger }}>{tr('As senhas não são iguais.', 'Passwords do not match.')}</p>}
      <PrimaryButton className="w-full" disabled={!valid || busy} onClick={() => onSubmit(pw)}>{submitLabel}</PrimaryButton>
    </div>
  );
}

function SetupWizard({ userId, onClose }: { userId: string; onClose: () => void }) {
  const tr = useTr();
  const vault = useVaultStatus();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const create = async (pw: string) => {
    try {
      setBusy(true); setErr('');
      const { recoveryCode } = await createVault(userId, pw);
      setCode(recoveryCode);
      setStep(2);
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const finish = () => {
    setStep(3);
    void refreshVault(userId, undefined, { force: true });
  };
  const done = step === 3 && vault.phase !== 'syncing';

  return (
    <Modal title={step === 1 ? tr('Crie a senha do cofre', 'Create your vault password') : step === 2 ? tr('Guarde sua chave reserva', 'Save your spare key') : tr('Enviando seus projetos', 'Uploading your projects')} onClose={step === 2 ? () => {} : onClose}>
      <Steps step={step} />
      {step === 1 && (
        <>
          <NewPasswordForm submitLabel={busy ? tr('Criando…', 'Creating…') : tr('Continuar', 'Continue')} onSubmit={create} busy={busy} />
          {err && <p className="text-sm mt-2" style={{ color: C.danger }}>{err}</p>}
        </>
      )}
      {step === 2 && <RecoveryCodeCard code={code} onDone={finish} />}
      {step === 3 && (
        <div className="space-y-4 text-center">
          {done ? (
            <>
              <CheckCircle2 className="w-14 h-14 mx-auto" style={{ color: C.teal }} />
              <p className="text-base" style={{ color: C.cream }}>{tr('Pronto! Seu cofre está ligado.', 'Done! Your vault is on.')}</p>
              <p className="text-sm" style={{ color: C.muted }}>
                {tr('No celular ou em outro computador, entre com seu e-mail e senha e abra o cofre com a senha que você criou.', 'On your phone or another computer, sign in and unlock the vault with the password you created.')}
              </p>
              <PrimaryButton className="w-full" onClick={onClose}>{tr('Concluir', 'Finish')}</PrimaryButton>
            </>
          ) : (
            <>
              <RefreshCw className="w-10 h-10 mx-auto animate-spin" style={{ color: C.teal }} />
              <CloudProgressBar progress={vault.progress as CloudProgress} label={tr('Enviando fotos', 'Uploading photos')} />
              <p className="text-xs" style={{ color: C.muted }}>{tr('Pode continuar usando o Revela; o envio segue em segundo plano.', 'You can keep using Revela; uploading continues in the background.')}</p>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

function ChangePasswordDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const tr = useTr();
  const [busy, setBusy] = useState(false);
  const submit = async (pw: string) => {
    try {
      setBusy(true);
      await changePassword(userId, pw);
      notify.success(tr('Senha do cofre trocada. Use a nova senha nos próximos aparelhos.', 'Vault password changed. Use the new password on new devices.'));
      onClose();
    } catch (e) {
      notify.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={tr('Trocar senha do cofre', 'Change vault password')} onClose={onClose}>
      <NewPasswordForm submitLabel={busy ? tr('Salvando…', 'Saving…') : tr('Salvar nova senha', 'Save new password')} onSubmit={submit} busy={busy} />
      <p className="text-xs mt-3" style={{ color: C.muted }}>
        {tr('Os aparelhos já conectados continuam funcionando sem pedir a senha nova.', 'Devices already connected keep working without asking for the new password.')}
      </p>
    </Modal>
  );
}

function NewCodeDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const tr = useTr();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const generate = async () => {
    try {
      setBusy(true);
      setCode(await regenerateRecoveryCode(userId));
    } catch (e) {
      notify.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={tr('Novo código de recuperação', 'New recovery code')} onClose={code ? () => {} : onClose}>
      {code ? (
        <RecoveryCodeCard code={code} onDone={() => { notify.success(tr('Código novo salvo. O antigo não funciona mais.', 'New code saved. The old one no longer works.')); onClose(); }} />
      ) : (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: C.cream, opacity: 0.85 }}>
            {tr('Vamos gerar um código novo. O código antigo para de funcionar na hora.', 'We will create a new code. The old code stops working right away.')}
          </p>
          <PrimaryButton className="w-full" onClick={generate} disabled={busy}>{busy ? tr('Gerando…', 'Generating…') : tr('Gerar código novo', 'Generate new code')}</PrimaryButton>
        </div>
      )}
    </Modal>
  );
}

function ForgotDialog({ userId, onClose }: { userId: string; onClose: (changed: boolean) => void }) {
  const tr = useTr();
  const vault = useVaultStatus();
  const [mode, setMode] = useState<'choose' | 'code' | 'recreate' | 'newcode'>('choose');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [newCode, setNewCode] = useState('');

  const withCode = async (pw: string) => {
    try {
      setBusy(true); setErr('');
      await resetPasswordWithRecoveryCode(userId, code, pw);
      notify.success(tr('Senha nova criada. Cofre aberto neste aparelho.', 'New password set. Vault unlocked on this device.'));
      onClose(true);
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const recreate = async (pw: string) => {
    const ok = await confirmDialog(
      tr(
        'Recriar o cofre a partir deste aparelho? O cofre atual será apagado e um novo será criado só com os projetos que estão AQUI. Projetos que estejam só em outros aparelhos não entram. Os outros aparelhos vão pedir a senha nova.',
        'Recreate the vault from this device? The current vault will be deleted and a new one created with only the projects on THIS device. Projects that exist only on other devices are not included. Other devices will ask for the new password.'
      ),
      { confirmLabel: tr('Recriar cofre', 'Recreate vault'), danger: true }
    );
    if (!ok) return;
    try {
      setBusy(true); setErr('');
      const { recoveryCode } = await recreateVaultFromThisDevice(userId, pw);
      setNewCode(recoveryCode);
      setMode('newcode');
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={tr('Esqueci a senha do cofre', 'I forgot my vault password')} onClose={mode === 'newcode' ? () => {} : () => onClose(false)}>
      {mode === 'choose' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: C.cream, opacity: 0.85 }}>{tr('Sem problema. Escolha o que você tem:', 'No problem. Choose what you have:')}</p>
          <OptionCard
            icon={<KeyRound className="w-5 h-5" />}
            title={tr('Tenho o código de recuperação', 'I have my recovery code')}
            desc={tr('Aquele papel com 16 letras e números. Você cria uma senha nova.', 'The paper with 16 letters and numbers. You create a new password.')}
            onClick={() => setMode('code')}
          />
          <OptionCard
            icon={<Laptop className="w-5 h-5" />}
            title={tr('Tenho outro aparelho já conectado', 'I have another connected device')}
            desc={tr('Abra o Revela nele, toque no escudo › "Trocar senha do cofre". Não pede a senha antiga.', 'Open Revela there, tap the shield › "Change vault password". It does not ask for the old one.')}
          />
          <OptionCard
            icon={<RefreshCw className="w-5 h-5" />}
            title={tr('Não tenho nenhum dos dois', 'I have neither')}
            desc={tr('Recrie o cofre usando os projetos deste aparelho.', 'Recreate the vault using the projects on this device.')}
            onClick={() => setMode('recreate')}
          />
        </div>
      )}
      {mode === 'code' && (
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: C.cream }}>{tr('Código de recuperação', 'Recovery code')}</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border font-mono tracking-widest uppercase outline-none"
            style={{ backgroundColor: 'rgba(2, 6, 23, 0.5)', borderColor: C.border, color: C.cream }}
          />
          <NewPasswordForm
            submitLabel={busy ? tr('Abrindo…', 'Unlocking…') : tr('Criar senha nova e abrir', 'Set new password and unlock')}
            onSubmit={withCode}
            busy={busy || code.replace(/[^a-z0-9]/gi, '').length < 16}
            hint={tr('Agora escolha a senha nova do cofre (mín. 6 caracteres):', 'Now choose your new vault password (min. 6 characters):')}
          />
          {err && <p className="text-sm" style={{ color: C.danger }} role="alert">{err}</p>}
        </div>
      )}
      {mode === 'recreate' && (
        <div className="space-y-3">
          <Panel tone="warn" className="!p-4">
            <p className="text-xs" style={{ color: C.cream }}>
              {tr(
                `O cofre atual (${vault.items} projeto(s)) será apagado e recriado só com os projetos deste aparelho. Os projetos deste aparelho não são afetados.`,
                `The current vault (${vault.items} project(s)) will be deleted and recreated with only this device's projects. Projects on this device are not affected.`
              )}
            </p>
          </Panel>
          <NewPasswordForm submitLabel={busy ? tr('Recriando…', 'Recreating…') : tr('Recriar cofre', 'Recreate vault')} onSubmit={recreate} busy={busy} />
          {err && <p className="text-sm" style={{ color: C.danger }}>{err}</p>}
        </div>
      )}
      {mode === 'newcode' && <RecoveryCodeCard code={newCode} onDone={() => onClose(true)} />}
    </Modal>
  );
}

function OptionCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left ${onClick ? 'hover:bg-white/5' : ''}`}
      style={{ borderColor: C.border, backgroundColor: C.panel }}
    >
      <span style={{ color: C.teal }} className="mt-0.5">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-medium" style={{ color: C.cream }}>{title}</span>
        <span className="block text-xs mt-0.5" style={{ color: C.muted }}>{desc}</span>
      </span>
      {onClick && <ChevronRight className="w-4 h-4 mt-0.5" style={{ color: C.muted }} />}
    </Tag>
  );
}

function LegacyDialog({ userId, email, onClose }: { userId: string; email?: string | null; onClose: () => void }) {
  const tr = useTr();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const importAll = async () => {
    try {
      setBusy(true); setErr('');
      const res = await restoreProjectsFromCloud(userId, email, pw);
      if (res.failures.length) {
        setErr(res.failures.map((f) => `${f.projectName || f.projectId}: ${f.error}`).join(' · '));
        return;
      }
      await deleteLegacyCloudCopies(userId);
      notify.success(tr(`${res.restored + res.keptLocal} projeto(s) trazidos. Eles vão para o cofre agora.`, `${res.restored + res.keptLocal} project(s) brought in. They are going into the vault now.`));
      onClose();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={tr('Projetos da nuvem antiga', 'Projects from the old cloud')} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm" style={{ color: C.cream, opacity: 0.85 }}>
          {tr(
            'Se você usou a "senha da nuvem" na versão anterior, digite-a. Se nunca usou, deixe em branco.',
            'If you used a "cloud password" in the previous version, enter it. If you never did, leave it blank.'
          )}
        </p>
        <PasswordField value={pw} onChange={setPw} placeholder={tr('Senha da nuvem antiga (se tiver)', 'Old cloud password (if any)')} />
        {err && <p className="text-sm" style={{ color: C.danger }}>{err}</p>}
        <PrimaryButton className="w-full" onClick={importAll} disabled={busy}>{busy ? tr('Trazendo…', 'Bringing in…') : tr('Trazer para o cofre', 'Bring into the vault')}</PrimaryButton>
      </div>
    </Modal>
  );
}
