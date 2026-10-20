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

// Simulação de plano do desenvolvedor: vale só para a aba atual (sessionStorage) e
// some ao fechá-la, para não ficar "preso" em Free/Pro sem perceber.
const DEV_PLAN_KEY = 'revela_dev_plan';

function getDevPlanOverride(): UserPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    // Versões antigas guardavam no localStorage (para sempre). Limpa.
    window.localStorage.removeItem(DEV_PLAN_KEY);
  } catch {
    /* ignore */
  }
  try {
    const stored = window.sessionStorage.getItem(DEV_PLAN_KEY);
    if (stored === 'free' || stored === 'pro' || stored === 'premium') return stored;
  } catch {
    /* ignore */
  }
  return null;
}

/** Plano simulado ativo nesta aba (só para os e-mails do dono), ou null. */
export function getActiveDevPlanOverride(user: User | null): UserPlan | null {
  return canOverridePlan(user) ? getDevPlanOverride() : null;
}

export function canOverridePlan(user: User | null): boolean {
  const email = user?.email || '';
  return !!email && DEV_PLAN_OVERRIDE_EMAILS.includes(normalizeUserEmail(email));
}

export function setDevPlanOverride(plan: UserPlan | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DEV_PLAN_KEY);
    if (!plan) window.sessionStorage.removeItem(DEV_PLAN_KEY);
    else window.sessionStorage.setItem(DEV_PLAN_KEY, plan);
  } catch {
    /* ignore */
  }
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

  // Dono do produto é sempre Premium, mesmo que exista uma compra Pro de teste no e-mail
  if (DEV_PREMIUM_EMAILS.includes(email)) {
    return 'premium';
  }

  if (hotmartEntitlement === 'premium' || hotmartEntitlement === 'pro') {
    return hotmartEntitlement;
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

