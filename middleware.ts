import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

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

  // CSP - Política mais permissiva para evitar bloqueios de conexão
  // Ajustada para funcionar melhor com Next.js e Supabase
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.supabase.io wss://*.supabase.co wss://*.supabase.in https://*.netlify.app https://www.googletagmanager.com",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    // Não usar upgrade-insecure-requests se estiver causando problemas
    // "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
