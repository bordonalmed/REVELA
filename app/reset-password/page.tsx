'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SafeImage } from '@/components/safe-image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Footer } from '@/components/footer';
import { LanguageSelector } from '@/components/language-selector';
import { useLanguage } from '@/contexts/language-context';
import type { AuthChangeEvent } from '@supabase/supabase-js';

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    let mounted = true;

    const verifyRecoverySession = async () => {
      if (isDemoMode) {
        if (mounted) {
          setHasRecoverySession(true);
          setLoading(false);
        }
        return;
      }

      const hashParams = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.hash.slice(1) : '',
      );
      const isRecoveryLink =
        hashParams.get('type') === 'recovery' || hashParams.has('access_token');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message);
        setHasRecoverySession(false);
      } else if (session || isRecoveryLink) {
        setHasRecoverySession(true);
      } else {
        setHasRecoverySession(false);
      }

      setLoading(false);
    };

    verifyRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY' && mounted) {
        setHasRecoverySession(true);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isDemoMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError(t.resetPassword.passwordMismatch);
      return;
    }

    if (newPassword.length < 6) {
      setError(t.resetPassword.passwordTooShort);
      return;
    }

    setSubmitting(true);

    try {
      if (isDemoMode) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut();

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.resetPassword.error;
      setError(message || t.resetPassword.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-5 md:p-6"
      style={{ backgroundColor: '#1A2B32' }}
    >
      <div className="fixed top-3 right-3 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4 sm:mb-5">
          <div className="relative w-[160px] sm:w-[180px] md:w-[200px] h-auto">
            <SafeImage
              src="/revela3-transparent-processed.png"
              alt="Revela Logo"
              width={200}
              height={110}
              className="w-full h-auto object-contain"
              priority
              unoptimized
              sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
            />
          </div>
        </div>

        <div
          className="w-full rounded-lg p-4 sm:p-5 md:p-6"
          style={{
            backgroundColor: 'rgba(232, 220, 192, 0.05)',
            border: '1px solid rgba(232, 220, 192, 0.1)',
          }}
        >
          <div className="text-center mb-4">
            <h1 className="text-xl sm:text-2xl font-light mb-1.5" style={{ color: '#E8DCC0' }}>
              {t.resetPassword.title}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              {t.resetPassword.subtitle}
            </p>
          </div>

          {loading ? (
            <p className="text-center text-sm" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              {t.common.loading}
            </p>
          ) : !hasRecoverySession ? (
            <div className="space-y-4 text-center">
              <p className="text-sm" style={{ color: '#fca5a5' }}>
                {t.resetPassword.invalidLink}
              </p>
              <Link href="/forgot-password" className="text-sm underline" style={{ color: '#00A88F' }}>
                {t.forgotPassword.title}
              </Link>
              <div>
                <Link href="/login" className="text-sm" style={{ color: '#E8DCC0', opacity: 0.7 }}>
                  {t.resetPassword.backToLogin}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {error && (
                  <div
                    className="p-3 text-sm rounded-md border"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                    }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    className="p-3 text-sm rounded-md border"
                    style={{
                      backgroundColor: 'rgba(0, 168, 143, 0.1)',
                      borderColor: 'rgba(0, 168, 143, 0.3)',
                      color: '#86efac',
                    }}
                  >
                    {t.resetPassword.success}
                  </div>
                )}

                {!success && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" style={{ color: '#E8DCC0' }}>
                        {t.resetPassword.newPassword}
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder={t.resetPassword.passwordPlaceholder}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={submitting}
                        className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" style={{ color: '#E8DCC0' }}>
                        {t.resetPassword.confirmPassword}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder={t.resetPassword.passwordPlaceholder}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={submitting}
                        className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-lg px-4 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: '#00A88F',
                        color: '#FFFFFF',
                      }}
                    >
                      {submitting ? t.resetPassword.submitting : t.resetPassword.submit}
                    </button>
                  </>
                )}

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-sm hover:opacity-80 transition-opacity inline-block"
                    style={{ color: '#E8DCC0', opacity: 0.7 }}
                  >
                    {t.resetPassword.backToLogin}
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
