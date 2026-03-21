'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

export function Footer({ className = "" }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <footer
      className={`border-t border-revela-cream/10 py-4 sm:py-5 bg-revela-dark ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-6" aria-label="Links do rodapé">
            <Link
              href="/para-medicos"
              className="text-xs sm:text-sm text-revela-cream opacity-80 hover:opacity-100 transition-opacity"
            >
              Para médicos
            </Link>
            <span className="text-revela-cream opacity-50" aria-hidden>|</span>
            <Link
              href="/faq"
              className="text-xs sm:text-sm text-revela-cream opacity-80 hover:opacity-100 transition-opacity"
            >
              {t.footer.faq}
            </Link>
            <span className="text-revela-cream opacity-50" aria-hidden>|</span>
            <Link
              href="/sobre"
              className="text-xs sm:text-sm text-revela-cream opacity-80 hover:opacity-100 transition-opacity"
            >
              {t.footer.about}
            </Link>
            <span className="text-revela-cream opacity-50" aria-hidden>|</span>
            <Link
              href="/contato"
              className="text-xs sm:text-sm text-revela-cream opacity-80 hover:opacity-100 transition-opacity"
            >
              {t.footer.contact}
            </Link>
          </nav>
          <p className="text-xs sm:text-sm text-revela-cream opacity-70 text-center sm:text-right">
            {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}


