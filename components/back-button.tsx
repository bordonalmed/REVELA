'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTr } from '@/contexts/language-context';

const NAV_KEY = 'revela_nav_count';

/** Conta as páginas abertas dentro do app nesta aba, para o Voltar saber se há para onde voltar. */
export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      // Guarda as páginas vistas; repetir a mesma (ex.: efeito rodando duas vezes) não conta
      const seen: string[] = JSON.parse(sessionStorage.getItem(NAV_KEY) || '[]');
      if (seen[seen.length - 1] !== pathname) sessionStorage.setItem(NAV_KEY, JSON.stringify([...seen, pathname].slice(-20)));
    } catch {}
  }, [pathname]);
  return null;
}

function cameFromApp(): boolean {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_KEY) || '[]').length > 1;
  } catch {
    return false;
  }
}

export function BackButton({ fallback = '/dashboard', className = '' }: { fallback?: string; className?: string }) {
  const router = useRouter();
  const tr = useTr();
  return (
    <button
      type="button"
      onClick={() => (cameFromApp() ? router.back() : router.push(fallback))}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5 ${className}`}
      style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', color: '#E8DCC0', borderColor: 'rgba(232, 220, 192, 0.15)' }}
      data-testid="back-button"
    >
      <ArrowLeft className="w-4 h-4" />
      {tr('Voltar', 'Back')}
    </button>
  );
}
