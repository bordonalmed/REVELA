'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchEntitlementPlanForEmail } from '@/lib/entitlements';
import { getActiveDevPlanOverride, getUserPlan, type UserPlan } from '@/lib/plans';
import { clearLastPlan, getCachedEntitlement, getLastPlan, setCachedEntitlement, setLastPlan } from '@/lib/plan-cache';
import {
  canUsePremiumFeature,
  type PremiumFeatureId,
} from '@/lib/premium-features';

export interface UsePlanReturn {
  userPlan: UserPlan;
  hasProAccess: boolean;
  hasPremiumAccess: boolean;
  /** Verifica se uma feature Premium está disponível para o plano atual. */
  canUsePremiumFeature: (featureId: PremiumFeatureId) => boolean;
  /** true enquanto busca entitlement no Supabase */
  entitlementLoading: boolean;
  /** Última busca no Supabase falhou (rede/RLS); plano exibido pode ser o cache anterior */
  entitlementFetchError: boolean;
  /**
   * Sem assinatura Hotmart neste e-mail — avisar quem comprou com outro e-mail.
   * Só após busca bem-sucedida, sem plano na tabela e sem Premium/Pro fixo no código.
   */
  showPurchaseEmailHint: boolean;
}

const noopSubscribe = () => () => {};

/**
 * Hook para acesso ao plano do usuário e permissões (Pro/Premium).
 * Inclui plano Hotmart sincronizado via webhook (`revela_entitlements`).
 */
export function usePlan(): UsePlanReturn {
  const { user, loading: authLoading, error: authError } = useAuth(false);
  const [dbPlan, setDbPlan] = useState<UserPlan | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(false);
  const [entitlementFetchError, setEntitlementFetchError] = useState(false);
  const [entitlementChecked, setEntitlementChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const email = user?.email;
    if (!email) {
      // Sessão ainda carregando ou falha de conexão: manter o que já se sabia
      if (authLoading || authError) return;
      // Saiu da conta
      setDbPlan(null);
      setEntitlementLoading(false);
      setEntitlementFetchError(false);
      setEntitlementChecked(false);
      clearLastPlan();
      return;
    }

    // Começa com o plano Hotmart guardado deste e-mail (a busca abaixo confirma em segundo plano)
    const cached = getCachedEntitlement(email);
    if (cached !== undefined) {
      setDbPlan(cached);
      setEntitlementChecked(true);
    }

    let first = cached === undefined;
    const load = () => {
      // Só a primeira busca mostra "carregando"; as de fundo (ao voltar para a aba) não piscam a tela
      if (first) setEntitlementLoading(true);
      first = false;
      fetchEntitlementPlanForEmail(email).then((result) => {
        if (cancelled) return;

        if (result.status === 'error') {
          // Mantém o último plano válido em dbPlan — não zera para Free
          setEntitlementFetchError(true);
        } else {
          setDbPlan(result.plan);
          setCachedEntitlement(email, result.plan);
          setEntitlementFetchError(false);
        }

        setEntitlementChecked(true);
        setEntitlementLoading(false);
      });
    };

    load();

    /** Após pagamento na Hotmart o usuário volta ao app: recarrega entitlement sem F5 */
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email ?? null, authLoading, !!authError]);

  const livePlan = getUserPlan(user, dbPlan);
  // Sem usuário só por um instante (carregando ou falha de rede) ou plano ainda não confirmado:
  // mostrar o último plano conhecido em vez de cair para Free.
  const transient = !user && (authLoading || !!authError);
  const unconfirmed = !!user?.email && !entitlementChecked && livePlan === 'free';
  // No servidor não há localStorage: só usar o plano guardado depois de montar no navegador
  const inBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const userPlan: UserPlan = !inBrowser
    ? livePlan
    : transient
      ? getLastPlan() ?? 'free'
      : unconfirmed
        ? getLastPlan(user?.email) ?? livePlan
        : livePlan;

  useEffect(() => {
    if (!user?.email || !entitlementChecked || getActiveDevPlanOverride(user)) return;
    setLastPlan(user.email, livePlan);
  }, [user, entitlementChecked, livePlan]);

  const showPurchaseEmailHint =
    !!user?.email &&
    entitlementChecked &&
    !entitlementFetchError &&
    dbPlan === null &&
    getUserPlan(user, null) === 'free';

  return {
    userPlan,
    hasProAccess: userPlan === 'pro' || userPlan === 'premium',
    hasPremiumAccess: userPlan === 'premium',
    canUsePremiumFeature: (featureId: PremiumFeatureId) =>
      canUsePremiumFeature(userPlan, featureId),
    // Enquanto a sessão ou o plano ainda não chegaram, não tratar a conta como Free
    entitlementLoading: authLoading || entitlementLoading || (!!user?.email && !entitlementChecked),
    entitlementFetchError,
    showPurchaseEmailHint,
  };
}
