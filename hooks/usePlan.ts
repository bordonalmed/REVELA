'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchEntitlementPlanForEmail } from '@/lib/entitlements';
import {
  getUserPlan,
  hasProAccess as hasProAccessFn,
  hasPremiumAccess as hasPremiumAccessFn,
  type UserPlan,
} from '@/lib/plans';
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

/**
 * Hook para acesso ao plano do usuário e permissões (Pro/Premium).
 * Inclui plano Hotmart sincronizado via webhook (`revela_entitlements`).
 */
export function usePlan(): UsePlanReturn {
  const { user } = useAuth(false);
  const [dbPlan, setDbPlan] = useState<UserPlan | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(false);
  const [entitlementFetchError, setEntitlementFetchError] = useState(false);
  const [entitlementChecked, setEntitlementChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const email = user?.email;
    if (!email) {
      setDbPlan(null);
      setEntitlementLoading(false);
      setEntitlementFetchError(false);
      setEntitlementChecked(false);
      return;
    }

    const load = () => {
      setEntitlementLoading(true);
      fetchEntitlementPlanForEmail(email).then((result) => {
        if (cancelled) return;

        if (result.status === 'error') {
          // Mantém o último plano válido em dbPlan — não zera para Free
          setEntitlementFetchError(true);
        } else {
          setDbPlan(result.plan);
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
  }, [user?.email ?? null]);

  const userPlan = getUserPlan(user, dbPlan);

  const showPurchaseEmailHint =
    !!user?.email &&
    entitlementChecked &&
    !entitlementFetchError &&
    dbPlan === null &&
    getUserPlan(user, null) === 'free';

  return {
    userPlan,
    hasProAccess: hasProAccessFn(user, dbPlan),
    hasPremiumAccess: hasPremiumAccessFn(user, dbPlan),
    canUsePremiumFeature: (featureId: PremiumFeatureId) =>
      canUsePremiumFeature(userPlan, featureId),
    entitlementLoading,
    entitlementFetchError,
    showPurchaseEmailHint,
  };
}
