// Consentimento para cookies de análise e anúncios (Google Analytics e pixels).
// Sem resposta ou "recusado": nada é carregado.

export type ConsentValue = 'accepted' | 'rejected';

const KEY = 'revela_cookie_consent';
export const CONSENT_EVENT = 'revela:consent-changed';

export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'accepted' || v === 'rejected' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'accepted';
}

// Área logada: lá ficam dados de pacientes, então pixels de anúncio nunca rodam nela
const APP_ROUTES = ['/dashboard', '/projects', '/new-project', '/settings', '/cofre', '/lixeira'];

export function isAppRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}
