import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Domínios de scripts de terceiros carregados dinamicamente (pixels de conversão).
const THIRD_PARTY_SCRIPT_HOSTS = [
  'https://www.googletagmanager.com', // Google Analytics / Google Ads (gtag)
  'https://connect.facebook.net', // Meta Pixel
  'https://static.ads-twitter.com', // X/Twitter Pixel
  'https://analytics.tiktok.com', // TikTok Pixel
].join(' ');

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CSP — 'unsafe-inline' continua necessário: o App Router do Next.js injeta
  // scripts inline (self.__next_f...) para hidratação/streaming de RSC sem
  // aplicar nonce automaticamente (testado em produção nesta versão do Next —
  // um CSP com nonce + 'strict-dynamic' bloqueia os próprios chunks do Next.js).
  // 'unsafe-eval' foi removido em produção (build não precisa) — mas o `next dev`
  // usa eval internamente (webpack/HMR) e trava a app inteira sem essa permissão,
  // então mantemos em desenvolvimento (isso nunca chega no build publicado).
  const scriptSrc =
    process.env.NODE_ENV === 'production'
      ? `'self' 'unsafe-inline' blob: ${THIRD_PARTY_SCRIPT_HOSTS}`
      : `'self' 'unsafe-inline' 'unsafe-eval' blob: ${THIRD_PARTY_SCRIPT_HOSTS}`;
  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.supabase.io wss://*.supabase.co wss://*.supabase.in https://*.netlify.app https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://analytics.tiktok.com",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
  ].join('; ');

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS - Apenas em produção e com preload opcional
  if (process.env.NODE_ENV === 'production') {
    // Não usar includeSubDomains se não tiver certeza de que todos os subdomínios suportam HTTPS
    response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  }

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
