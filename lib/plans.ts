import type { User } from '@supabase/supabase-js';

export type UserPlan = 'free' | 'pro' | 'premium';

export const FREE_MAX_PROJECTS = 3;
export const FREE_MAX_BEFORE_IMAGES = 3;
export const FREE_MAX_AFTER_IMAGES = 3;

// Acesso Premium permanente do dono do produto, sem depender de pagamento via Hotmart.
// Mantido intencionalmente (não é código de debug) — normalizado em minúsculas para
// não falhar por causa de maiúsculas/minúsculas no e-mail da conta.
const OWNER_PREMIUM_EMAILS = ['vasculargabriel@gmail.com', 'vasculagabriel@gmail.com'];

const DEV_PRO_EMAILS = OWNER_PREMIUM_EMAILS;
const DEV_PREMIUM_EMAILS: string[] = OWNER_PREMIUM_EMAILS;

const DEV_PLAN_OVERRIDE_EMAILS: string[] = OWNER_PREMIUM_EMAILS;

function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getDevPlanOverride(): UserPlan | null {
  if (typeof window === 'undefined') return null;
  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  if (!isDev) return null;
  const stored = window.localStorage.getItem('revela_dev_plan');
  if (stored === 'free' || stored === 'pro' || stored === 'premium') return stored;
  return null;
}

export function canOverridePlan(user: User | null): boolean {
  const email = user?.email || '';
  return !!email && DEV_PLAN_OVERRIDE_EMAILS.includes(normalizeUserEmail(email));
}

export function setDevPlanOverride(plan: UserPlan | null): void {
  if (typeof window === 'undefined') return;
  if (!plan) {
    window.localStorage.removeItem('revela_dev_plan');
    return;
  }
  window.localStorage.setItem('revela_dev_plan', plan);
}

/**
 * @param hotmartEntitlement — plano vindo da tabela `revela_entitlements` (fetch no cliente).
 */
export function getUserPlan(user: User | null, hotmartEntitlement?: UserPlan | null): UserPlan {
  const rawEmail = user?.email || '';
  if (!rawEmail) return 'free';
  const email = normalizeUserEmail(rawEmail);

  if (DEV_PLAN_OVERRIDE_EMAILS.includes(email)) {
    const override = getDevPlanOverride();
    if (override) return override;
  }

  if (hotmartEntitlement === 'premium' || hotmartEntitlement === 'pro') {
    return hotmartEntitlement;
  }

  if (DEV_PREMIUM_EMAILS.includes(email)) {
    return 'premium';
  }
  if (DEV_PRO_EMAILS.includes(email)) {
    return 'pro';
  }

  return 'free';
}

export function isPro(user: User | null, hotmartEntitlement?: UserPlan | null): boolean {
  const p = getUserPlan(user, hotmartEntitlement);
  return p === 'pro' || p === 'premium';
}

export function isPremium(user: User | null, hotmartEntitlement?: UserPlan | null): boolean {
  return getUserPlan(user, hotmartEntitlement) === 'premium';
}

/** Acesso ao plano Pro (inclui Premium). Use para recursos Pro. */
export function hasProAccess(user: User | null, hotmartEntitlement?: UserPlan | null): boolean {
  return isPro(user, hotmartEntitlement);
}

/** Acesso ao plano Premium. Use para recursos exclusivos Premium. */
export function hasPremiumAccess(user: User | null, hotmartEntitlement?: UserPlan | null): boolean {
  return isPremium(user, hotmartEntitlement);
}

