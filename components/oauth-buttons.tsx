'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getAuthRedirectUrl } from '@/lib/auth-redirect';
import { trackLogin } from '@/lib/analytics';

type OAuthProvider = 'google' | 'apple';

export interface OAuthButtonsStrings {
  orDivider: string;
  continueWithGoogle: string;
  continueWithApple: string;
  oauthError: string;
}

/**
 * Botões de login social (Google / Apple) via Supabase Auth.
 * Requer os provedores configurados no painel do Supabase (Authentication → Providers) —
 * ver docs/SOCIAL_LOGIN_SETUP.md.
 */
export function OAuthButtons({
  redirectPath = '/dashboard',
  strings,
}: {
  redirectPath?: string;
  strings: OAuthButtonsStrings;
}) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (isDemoMode) return null;

  const handleOAuth = async (provider: OAuthProvider) => {
    setError('');
    setLoadingProvider(provider);
    try {
      trackLogin(provider);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getAuthRedirectUrl(redirectPath) },
      });
      if (oauthError) throw oauthError;
      // Em caso de sucesso o navegador é redirecionado para o provedor;
      // o loading só é desfeito se algo falhar antes disso.
    } catch (err: any) {
      setError(err?.message || strings.oauthError);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(232, 220, 192, 0.2)' }} />
        <span
          className="text-xs uppercase tracking-wide"
          style={{ color: '#E8DCC0', opacity: 0.6 }}
        >
          {strings.orDivider}
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(232, 220, 192, 0.2)' }} />
      </div>

      {error && (
        <div
          className="p-2 text-xs rounded-md border text-center"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={loadingProvider !== null}
        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium border transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#FFFFFF', color: '#1A2B32', borderColor: 'transparent' }}
      >
        <GoogleIcon />
        {strings.continueWithGoogle}
      </button>

      <button
        type="button"
        onClick={() => handleOAuth('apple')}
        disabled={loadingProvider !== null}
        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
      >
        <AppleIcon />
        {strings.continueWithApple}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="#FFFFFF" aria-hidden focusable="false">
      <path d="M13.14 9.6c-.02-2.02 1.65-2.99 1.73-3.04-.94-1.38-2.4-1.57-2.92-1.59-1.24-.13-2.44.74-3.07.74-.64 0-1.61-.73-2.65-.71-1.36.02-2.62.8-3.32 2.02-1.42 2.46-.36 6.1 1.02 8.09.67.97 1.47 2.06 2.52 2.02 1.02-.04 1.4-.66 2.63-.66 1.22 0 1.57.66 2.64.64 1.09-.02 1.78-.99 2.44-1.97.77-1.13 1.09-2.22 1.1-2.28-.02-.01-2.1-.8-2.12-3.26zM11.1 3.5c.55-.67.92-1.6.82-2.53-.79.03-1.75.53-2.32 1.19-.51.59-.96 1.54-.84 2.44.88.07 1.79-.44 2.34-1.1z" />
    </svg>
  );
}
