// Último plano conhecido de cada conta, guardado neste navegador.
// Serve só para não "cair" para Free enquanto a sessão ou o plano ainda estão
// carregando, ou quando a conexão com o servidor falha por um instante.

import type { UserPlan } from './plans';

const LAST_PLAN_KEY = 'revela_last_plan';
const ENTITLEMENT_KEY = 'revela_entitlement_cache';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface Cached {
  email: string;
  plan: UserPlan | null;
  at: number;
}

function read(key: string): Cached | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = JSON.parse(window.localStorage.getItem(key) || 'null') as Cached | null;
    if (!data || Date.now() - data.at > MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function write(key: string, value: Cached | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(key, JSON.stringify(value));
    else window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const norm = (email: string) => email.trim().toLowerCase();

/** Último plano exibido. Com e-mail, só vale se for da mesma conta. */
export function getLastPlan(email?: string | null): UserPlan | null {
  const data = read(LAST_PLAN_KEY);
  if (!data || (email && data.email !== norm(email))) return null;
  return data.plan;
}

export function setLastPlan(email: string, plan: UserPlan): void {
  write(LAST_PLAN_KEY, { email: norm(email), plan, at: Date.now() });
}

export function clearLastPlan(): void {
  write(LAST_PLAN_KEY, null);
  write(ENTITLEMENT_KEY, null);
}

/** Plano da Hotmart guardado para este e-mail (undefined = nunca consultado aqui). */
export function getCachedEntitlement(email: string): UserPlan | null | undefined {
  const data = read(ENTITLEMENT_KEY);
  return data && data.email === norm(email) ? data.plan : undefined;
}

export function setCachedEntitlement(email: string, plan: UserPlan | null): void {
  write(ENTITLEMENT_KEY, { email: norm(email), plan, at: Date.now() });
}
