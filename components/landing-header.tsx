'use client';

import Link from 'next/link';
import { SafeImage } from '@/components/safe-image';
import { LanguageSelector } from '@/components/language-selector';
import { useLanguage } from '@/contexts/language-context';

export function LandingHeader() {
  const { t } = useLanguage();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backgroundColor: 'rgba(26, 43, 50, 0.95)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(232, 220, 192, 0.1)',
      }}
    >
      <div className="container mx-auto px-3 py-1.5 sm:py-2">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex-shrink-0" aria-label="Revela - Início">
            <div className="relative w-[36px] sm:w-[56px] h-auto">
              <SafeImage
                src="/revela3-transparent-processed.png"
                alt="Revela Logo"
                width={56}
                height={32}
                className="w-full h-auto object-contain"
                priority
                unoptimized
              />
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navegação principal">
            <Link
              href="/login"
              className="text-sm font-medium rounded-lg px-3 py-2 transition-opacity hover:opacity-90 text-revela-cream opacity-90"
            >
              {t.home.login}
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium rounded-lg px-3 py-2 bg-revela-teal text-white transition-opacity hover:opacity-90"
            >
              {t.home.createAccount}
            </Link>
            <LanguageSelector />
          </nav>
        </div>
      </div>
    </header>
  );
}
