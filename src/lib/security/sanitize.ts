/**
 * Funções de sanitização para segurança
 * Previne XSS e outras vulnerabilidades
 */

/**
 * Remove caracteres HTML perigosos de uma string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Remove caracteres especiais que podem ser usados em SQL injection
 * (Embora o Supabase use prepared statements, é uma camada extra de segurança)
 */
export function sanitizeForSQL(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove caracteres perigosos comuns
  return input.replace(/['";\\]/g, '');
}

/**
 * Valida se uma URL é segura e permite apenas HTTPS
 */
export function isValidSecureUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitiza uma URL para uso seguro
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    
    // Apenas permite HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return null;
    }

    // Apenas permite domínios permitidos (pode ser expandido)
    const allowedDomains = [
      'supabase.co',
      'supabase.in',
      'supabase.storage',
    ];

    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname.endsWith(domain)
    );

    if (!isAllowed) {
      // Para desenvolvimento, permite localhost
      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
        return url;
      }
      return null;
    }

    return url;
  } catch {
    return null;
  }
}
