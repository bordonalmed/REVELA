const DEFAULT_SITE_URL = 'https://www.revela.fun';

/** URL absoluta para callbacks do Supabase Auth (recuperação de senha, etc.). */
export function getAuthRedirectUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalizedPath}`;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  return `${siteUrl}${normalizedPath}`;
}
