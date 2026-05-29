'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getAuthRedirectUrl } from '@/lib/auth-redirect';
import { SafeImage } from '@/components/safe-image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Footer } from '@/components/footer';
import { LanguageSelector } from '@/components/language-selector';
import { useLanguage } from '@/contexts/language-context';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (isDemoMode) {
        setSuccess(true);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('/reset-password'),
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.forgotPassword.error;
      setError(message || t.forgotPassword.error);
    } finally {
      setLoading(false);
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
              {t.forgotPassword.title}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              {t.forgotPassword.subtitle}
            </p>
          </div>

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
                  {t.forgotPassword.success}
                </div>
              )}

              {!success && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" style={{ color: '#E8DCC0' }}>
                      {t.forgotPassword.email}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t.forgotPassword.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-transparent border-gray-600 text-white placeholder:text-gray-500 focus:border-[#00A88F]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg px-4 py-3 text-sm sm:text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: '#00A88F',
                      color: '#FFFFFF',
                    }}
                  >
                    {loading ? t.forgotPassword.submitting : t.forgotPassword.submit}
                  </button>
                </>
              )}

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-sm hover:opacity-80 transition-opacity inline-block"
                  style={{ color: '#00A88F' }}
                >
                  {t.forgotPassword.backToLogin}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
