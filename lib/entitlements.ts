import { supabase } from '@/lib/supabase';
import type { UserPlan } from '@/lib/plans';

/**
 * Busca plano ativo vinculado ao e-mail (Hotmart → tabela revela_entitlements).
 */
export async function fetchEntitlementPlanForEmail(
  email: string | null | undefined,
): Promise<UserPlan | null> {
  if (!email?.trim()) return null;
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
      return null;
    }
    if (!data?.active) return null;
    if (data.plan === 'premium' || data.plan === 'pro') return data.plan as UserPlan;
  } catch {
    return null;
  }
  return null;
}
