import { supabase } from '@/lib/supabase';
import type { UserPlan } from '@/lib/plans';

export type EntitlementFetchResult =
  | { status: 'ok'; plan: UserPlan | null }
  | { status: 'error' };

/**
 * Busca plano ativo vinculado ao e-mail (Hotmart → tabela revela_entitlements).
 * Em erro de rede/Supabase retorna `status: 'error'` (não confundir com "sem plano").
 */
export async function fetchEntitlementPlanForEmail(
  email: string | null | undefined,
): Promise<EntitlementFetchResult> {
  if (!email?.trim()) return { status: 'ok', plan: null };
  const normalized = email.trim().toLowerCase();
  try {
    const { data, error } = await supabase
      .from('revela_entitlements')
      .select('plan, active')
      .eq('email', normalized)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[entitlements]', error.message);
      }
      return { status: 'error' };
    }
    if (!data?.active) return { status: 'ok', plan: null };
    if (data.plan === 'premium' || data.plan === 'pro') {
      return { status: 'ok', plan: data.plan as UserPlan };
    }
    return { status: 'ok', plan: null };
  } catch {
    return { status: 'error' };
  }
}
