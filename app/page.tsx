import { Suspense } from 'react';
import Link from 'next/link';
import { StructuredData } from '@/components/structured-data';
import { getTranslations, defaultLanguage } from '@/lib/i18n/translations';
import { HomeClient } from '@/components/home-client';

const t = getTranslations(defaultLanguage);

function StaticFallbackContent() {
  return (
    <div className="bg-revela-dark min-h-screen">
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
              <img
                src="/revela3-transparent-processed.png"
                alt="Revela Logo"
                width={56}
                height={32}
                className="w-[36px] sm:w-[56px] h-auto object-contain"
              />
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
            </nav>
          </div>
        </div>
      </header>

      <section className="min-h-[80vh] flex items-center pt-16 sm:pt-20 pb-12 sm:pb-16" aria-label="Apresentação do Revela">
        <div className="w-full max-w-[1200px] mx-auto px-6 py-10 sm:py-14 lg:py-[60px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <div className="flex flex-col text-center lg:text-left space-y-4 sm:space-y-5">
              <div className="flex justify-center lg:justify-start">
                <img
                  src="/revela3-transparent-processed.png"
                  alt="Revela"
                  width={200}
                  height={100}
                  className="w-[180px] sm:w-[200px] h-auto object-contain object-left"
                />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-revela-cream leading-tight">
                {t.home.heroTitle}
              </h1>
              <p className="text-sm sm:text-base text-revela-cream opacity-90 leading-snug">
                {t.home.heroSubtitle}
              </p>
              {t.home.heroSloganShort && (
                <p className="text-sm sm:text-base text-revela-cream opacity-80 italic">
                  {t.home.heroSloganShort}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-1">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto bg-revela-teal text-white hover:opacity-90 rounded-lg px-5 py-2.5 text-sm font-medium text-center"
                >
                  {t.home.createAccount}
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto border-2 border-revela-cream text-revela-cream bg-transparent hover:bg-revela-cream/10 rounded-lg px-5 py-2.5 text-sm font-medium text-center"
                >
                  {t.home.login}
                </Link>
              </div>
            </div>
            <div className="w-full">
              <div className="relative w-full aspect-[4/3] max-w-lg mx-auto lg:max-w-none rounded-xl overflow-hidden border border-revela-cream/10 bg-black/20 shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream text-center mb-6 sm:mb-8">
            {t.home.whatIsRevela}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-7 sm:p-8 text-revela-cream">
              <h3 className="text-sm sm:text-base md:text-lg font-medium mb-3">{t.home.whatIsCard1Title}</h3>
              <p className="text-sm sm:text-base opacity-90 leading-relaxed">{t.home.description1}</p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-7 sm:p-8 text-revela-cream">
              <h3 className="text-sm sm:text-base md:text-lg font-medium mb-3">{t.home.whatIsCard2Title}</h3>
              <p className="text-sm sm:text-base opacity-90 leading-relaxed">{t.home.description2}</p>
            </div>
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] p-7 sm:p-8 text-revela-cream">
              <h3 className="text-sm sm:text-base md:text-lg font-medium mb-3">{t.home.whatIsCard3Title}</h3>
              <p className="text-sm sm:text-base opacity-90 leading-relaxed">{t.home.description3}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10 md:py-12 lg:py-14 px-4 sm:px-6 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream mb-2 px-2">
            {t.home.howItWorks}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-5 sm:mb-6 mt-5">
            <div className="space-y-2 sm:space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto text-base sm:text-lg font-medium bg-revela-teal text-white">1</div>
              <h3 className="text-sm sm:text-base font-medium text-revela-cream px-1">{t.home.step1}</h3>
              <p className="text-xs sm:text-sm font-light leading-relaxed text-revela-cream opacity-80 px-2">{t.home.step1Desc}</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto text-base sm:text-lg font-medium bg-revela-teal text-white">2</div>
              <h3 className="text-sm sm:text-base font-medium text-revela-cream px-1">{t.home.step2}</h3>
              <p className="text-xs sm:text-sm font-light leading-relaxed text-revela-cream opacity-80 px-2">{t.home.step2Desc}</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto text-base sm:text-lg font-medium bg-revela-teal text-white">3</div>
              <h3 className="text-sm sm:text-base font-medium text-revela-cream px-1">{t.home.step3}</h3>
              <p className="text-xs sm:text-sm font-light leading-relaxed text-revela-cream opacity-80 px-2">{t.home.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream text-center mb-5 sm:mb-6">
            {t.home.faqTitle}
          </h2>
          <div className="space-y-1.5">
            <div className="rounded-lg border border-[rgba(232,220,192,0.1)] bg-[rgba(232,220,192,0.05)] p-3">
              <p className="text-xs sm:text-sm font-medium text-revela-cream">{t.home.faq1Question}</p>
              <p className="text-xs sm:text-sm text-revela-cream opacity-90 mt-1">{t.home.faq1Answer}</p>
            </div>
            <div className="rounded-lg border border-[rgba(232,220,192,0.1)] bg-[rgba(232,220,192,0.05)] p-3">
              <p className="text-xs sm:text-sm font-medium text-revela-cream">{t.home.faq2Question}</p>
              <p className="text-xs sm:text-sm text-revela-cream opacity-90 mt-1">{t.home.faq2Answer}</p>
            </div>
            <div className="rounded-lg border border-[rgba(232,220,192,0.1)] bg-[rgba(232,220,192,0.05)] p-3">
              <p className="text-xs sm:text-sm font-medium text-revela-cream">{t.home.faq3Question}</p>
              <p className="text-xs sm:text-sm text-revela-cream opacity-90 mt-1">{t.home.faq3Answer}</p>
            </div>
            <div className="rounded-lg border border-[rgba(232,220,192,0.1)] bg-[rgba(232,220,192,0.05)] p-3">
              <p className="text-xs sm:text-sm font-medium text-revela-cream">{t.home.faq4Question}</p>
              <p className="text-xs sm:text-sm text-revela-cream opacity-90 mt-1">{t.home.faq4Answer}</p>
            </div>
            <div className="rounded-lg border border-[rgba(232,220,192,0.1)] bg-[rgba(232,220,192,0.05)] p-3">
              <p className="text-xs sm:text-sm font-medium text-revela-cream">{t.home.faq5Question}</p>
              <p className="text-xs sm:text-sm text-revela-cream opacity-90 mt-1">{t.home.faq5Answer}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 md:py-14 px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl mx-auto text-center rounded-xl border border-revela-teal/30 bg-revela-teal/5 py-8 px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream mb-2 sm:mb-3">
            {t.home.ready}
          </h2>
          <p className="text-sm sm:text-base font-light text-revela-cream opacity-90 mb-5 sm:mb-6 leading-relaxed">
            {t.home.readySubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center max-w-sm sm:max-w-md mx-auto">
            <Link
              href="/signup"
              className="w-full sm:flex-1 bg-revela-teal text-white hover:opacity-90 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium text-center"
            >
              {t.home.createFreeAccount}
            </Link>
            <Link
              href="/login"
              className="w-full sm:flex-1 border-2 border-revela-cream text-revela-cream bg-transparent hover:bg-revela-cream/10 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium text-center"
            >
              {t.home.alreadyHaveAccount}
            </Link>
          </div>
          <p className="mt-4 text-xs text-revela-cream opacity-75">
            {t.home.trustLine}
          </p>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <StructuredData />
      <Suspense fallback={<StaticFallbackContent />}>
        <HomeClient />
      </Suspense>
    </>
  );
}
