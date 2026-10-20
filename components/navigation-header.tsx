'use client';

import { clearLastPlan } from '@/lib/plan-cache';
import { notify } from '@/lib/notify';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { VaultAgent, useVaultStatus } from '@/components/vault-agent';
import { useTr } from '@/contexts/language-context';
import { supabase } from '@/lib/supabase';
import { SafeImage } from '@/components/safe-image';
import { LanguageSelector } from '@/components/language-selector';
import { useLanguage } from '@/contexts/language-context';
import { trackLogout } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { getActiveDevPlanOverride } from '@/lib/plans';
import { PlanEntitlementAlerts } from '@/components/plan-entitlement-alerts';

export function NavigationHeader() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';
  const { user } = useAuth(false);
  const {
    userPlan: plan,
    hasPremiumAccess,
    entitlementLoading,
    entitlementFetchError,
    showPurchaseEmailHint,
  } = usePlan();

  const tr = useTr();
  const vault = useVaultStatus();
  const [simulated, setSimulated] = useState(false);
  const planPending = entitlementLoading && plan === 'free';
  useEffect(() => setSimulated(!!getActiveDevPlanOverride(user)), [user]);
  const vaultDot =
    vault.phase === 'ok' ? '#2dd4bf' : vault.phase === 'syncing' ? '#60a5fa' : vault.phase === 'locked' || vault.phase === 'error' ? '#fbbf24' : null;
  const vaultLabel =
    vault.phase === 'ok'
      ? tr('Cofre: sincronizado', 'Vault: synced')
      : vault.phase === 'syncing'
        ? tr('Cofre: sincronizando…', 'Vault: syncing…')
        : vault.phase === 'locked'
          ? tr('Cofre: bloqueado neste aparelho', 'Vault: locked on this device')
          : vault.phase === 'error'
            ? tr('Cofre: precisa de atenção', 'Vault: needs attention')
            : tr('Cofre Revela', 'Revela Vault');

  const fullPlanName =
    plan === 'premium'
      ? t.home.planPremiumName ?? 'Revela Premium'
      : plan === 'pro'
        ? t.home.planProName ?? 'Revela Pro'
        : t.home.planFreeName ?? 'Revela Free';
  const shortPlanName =
    plan === 'premium'
      ? t.common.navPlanShortPremium
      : plan === 'pro'
        ? t.common.navPlanShortPro
        : t.common.navPlanShortFree;

  const handleLogout = async () => {
    try {
      // Trackear logout antes de sair
      trackLogout();
      
      clearLastPlan();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      notify.error(t.common.logoutError);
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 border-b" 
      style={{ 
        backgroundColor: 'rgba(26, 43, 50, 0.95)', 
        backdropFilter: 'blur(10px)', 
        borderColor: 'rgba(232, 220, 192, 0.1)' 
      }}
    >
      <div className="container mx-auto px-3 py-1.5 sm:py-2">
        <div className="flex items-center justify-between">
          {/* Logotipo à esquerda */}
          <Link href="/dashboard">
            <div className="relative w-[36px] sm:w-[56px] h-auto">
              <SafeImage 
                src="/revela3-transparent-processed.png" 
                alt="Revela Logo" 
                width={56} 
                height={32} 
                className="w-full h-auto object-contain" 
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Plano + Ícones à direita */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Badge do plano — sempre visível; texto curto no mobile, completo a partir de sm */}
            <Link
              href="/planos"
              aria-label={`${fullPlanName}. ${t.common.navPlanBadgeAria}`}
              className="inline-flex items-center justify-center min-h-[32px] sm:min-h-0 px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-semibold sm:font-medium transition-opacity hover:opacity-90 shrink-0"
              style={{
                backgroundColor:
                  plan === 'premium'
                    ? 'rgba(234, 179, 8, 0.18)'
                    : plan === 'pro'
                      ? 'rgba(34, 197, 94, 0.18)'
                      : 'rgba(148, 163, 184, 0.18)',
                color:
                  plan === 'premium'
                    ? '#facc15'
                    : plan === 'pro'
                      ? '#4ade80'
                      : '#cbd5f5',
                borderColor:
                  plan === 'premium'
                    ? 'rgba(250, 204, 21, 0.4)'
                    : plan === 'pro'
                      ? 'rgba(34, 197, 94, 0.4)'
                      : 'rgba(148, 163, 184, 0.4)',
                borderWidth: 1,
                borderStyle: simulated ? 'dashed' : 'solid',
              }}
              title={simulated ? tr('Plano simulado (modo desenvolvedor). Toque para voltar ao plano real.', 'Simulated plan (developer mode). Tap to return to your real plan.') : undefined}
            >
              {planPending ? (
                // Plano ainda carregando: não mostrar "Free" por engano
                <span className="inline-block w-12 sm:w-20 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(148, 163, 184, 0.35)' }} aria-hidden />
              ) : (
                <>
                  <span className="sm:hidden truncate text-center leading-tight">{shortPlanName}{simulated ? ' 🧪' : ''}</span>
                  <span className="hidden sm:inline">{fullPlanName}{simulated ? ` · ${tr('simulado', 'simulated')} 🧪` : ''}</span>
                </>
              )}
            </Link>

            {/* Seletor de Idioma */}
            <LanguageSelector />
            
            {/* Cofre Revela (escudo) com bolinha de status */}
            <button
              onClick={() => router.push('/cofre')}
              className="relative p-1 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={vaultLabel}
              title={vaultLabel}
              style={{ color: '#E8DCC0' }}
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              {vaultDot && (
                <span
                  className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${vault.phase === 'syncing' ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: vaultDot }}
                />
              )}
            </button>
            <VaultAgent userId={user?.id} ownerEmail={user?.email} enabled={!!user?.id && hasPremiumAccess} />

            {/* Configurações (engrenagem) sempre visível */}
            <button
              onClick={() => router.push('/settings')}
              className="p-1 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={t.common.settings}
              style={{ color: '#E8DCC0' }}
            >
              <Settings className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>

            {/* Home/Dashboard quando não estiver na dashboard */}
            {!isDashboard && (
              <button
                onClick={() => router.push('/dashboard')}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label={t.common.dashboard}
                style={{ color: '#E8DCC0' }}
              >
                <Home className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Botão Sair */}
            <button
              onClick={handleLogout}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label={t.common.logout}
                style={{ color: '#E8DCC0' }}
            >
              <LogOut className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        <PlanEntitlementAlerts
          compact
          email={user?.email}
          entitlementLoading={entitlementLoading}
          entitlementFetchError={entitlementFetchError}
          showPurchaseEmailHint={showPurchaseEmailHint}
        />
      </div>
    </header>
  );
}

