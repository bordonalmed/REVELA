'use client';

/**
 * Aviso de cookies (LGPD / Guia da ANPD): Google Analytics e pixels de anúncio
 * só carregam depois de "Aceitar". Recusar não muda nada no uso do app.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { useTr } from '@/contexts/language-context';
import { CONSENT_EVENT, getConsent, setConsent, type ConsentValue } from '@/lib/consent';

export function CookieConsent() {
  const tr = useTr();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => setOpen(getConsent() === null);
    check();
    window.addEventListener(CONSENT_EVENT, check);
    return () => window.removeEventListener(CONSENT_EVENT, check);
  }, []);

  if (!open) return null;

  const choose = (value: ConsentValue) => {
    const wasAccepted = getConsent() === 'accepted';
    setConsent(value);
    // Scripts já carregados não saem da página sozinhos: recarrega ao recusar depois de aceitar
    if (value === 'rejected' && wasAccepted) window.location.reload();
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={tr('Aviso de cookies', 'Cookie notice')}
      data-testid="cookie-consent"
      className="fixed inset-x-0 bottom-0 z-[96] p-3 sm:p-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <div
        className="max-w-3xl mx-auto rounded-2xl border shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
        style={{ backgroundColor: '#1A2B32', borderColor: 'rgba(232,220,192,0.2)' }}
      >
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#00A88F' }} />
          <p className="text-sm" style={{ color: '#E8DCC0' }}>
            {tr(
              'Usamos cookies para medir o uso do site e para nossos anúncios (Google, Meta, TikTok e X). Eles só são ativados se você aceitar. Suas fotos e os dados dos seus pacientes nunca são enviados a essas empresas. ',
              'We use cookies to measure site usage and for our ads (Google, Meta, TikTok and X). They are only turned on if you accept. Your photos and patient data are never sent to these companies. '
            )}
            <Link href="/privacidade" className="underline" style={{ color: '#00A88F' }}>
              {tr('Política de Privacidade', 'Privacy Policy')}
            </Link>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => choose('rejected')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium border hover:bg-white/5"
            style={{ color: '#E8DCC0', borderColor: 'rgba(232,220,192,0.3)' }}
          >
            {tr('Recusar', 'Decline')}
          </button>
          <button
            onClick={() => choose('accepted')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
            style={{ backgroundColor: '#00A88F', color: '#fff' }}
          >
            {tr('Aceitar', 'Accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Botão para rever a escolha (usado na Política de Privacidade). */
export function CookiePreferencesButton({ className = '' }: { className?: string }) {
  const tr = useTr();
  return (
    <button
      type="button"
      onClick={() => setConsent(null)}
      className={`underline ${className}`}
      style={{ color: '#00A88F' }}
    >
      {tr('Alterar minhas preferências de cookies', 'Change my cookie preferences')}
    </button>
  );
}
