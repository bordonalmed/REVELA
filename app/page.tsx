'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/footer';
import { SafeImage } from '@/components/safe-image';
import { StructuredData } from '@/components/structured-data';
import { LandingHeader } from '@/components/landing-header';
import { ComparisonSlider } from '@/components/comparison-slider';
import { useLanguage } from '@/contexts/language-context';
import { getTranslations, defaultLanguage, type Translations } from '@/lib/i18n/translations';
import {
  Camera,
  Lock,
  Zap,
  Briefcase,
  Globe,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

const FAQ_ITEMS = [
  { qKey: 'faq1Question' as const, aKey: 'faq1Answer' as const },
  { qKey: 'faq2Question' as const, aKey: 'faq2Answer' as const },
  { qKey: 'faq3Question' as const, aKey: 'faq3Answer' as const },
  { qKey: 'faq4Question' as const, aKey: 'faq4Answer' as const },
  { qKey: 'faq5Question' as const, aKey: 'faq5Answer' as const },
] as const;

function HomeContent() {
  const { t } = useLanguage();
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-revela-dark min-h-screen">
      <LandingHeader />

      {/* Hero: container limitado, grid 2 colunas, conteúdo agrupado e visível sem scroll */}
      <section
        className="min-h-[80vh] flex items-center pt-16 sm:pt-20 pb-12 sm:pb-16"
        aria-label="Apresentação do Revela"
      >
        <div className="w-full max-w-[1200px] mx-auto px-6 py-10 sm:py-14 lg:py-[60px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            {/* Coluna esquerda: logo → título → subtítulo → texto → botões (espaçamento 16–24px) */}
            <div className="flex flex-col text-center lg:text-left space-y-4 sm:space-y-5">
              {/* 1. Logo Revela (pequeno, topo) */}
              <div className="flex justify-center lg:justify-start">
                <SafeImage
                  src="/revela3-transparent-processed.png"
                  alt="Revela"
                  width={200}
                  height={100}
                  className="w-[180px] sm:w-[200px] h-auto object-contain object-left"
                  priority
                  unoptimized
                  sizes="180px"
                />
              </div>
              {/* 2. Título principal */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-revela-cream leading-tight">
                {t.home.heroTitle}
              </h1>
              {/* 3. Subtítulo */}
              <p className="text-sm sm:text-base text-revela-cream opacity-90 leading-snug">
                {t.home.heroSubtitle}
              </p>
              {/* 4. Texto descritivo */}
              {t.home.heroSloganShort && (
                <p className="text-sm sm:text-base text-revela-cream opacity-80 italic">
                  {t.home.heroSloganShort}
                </p>
              )}
              {/* 5. Botões lado a lado */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-1">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-revela-teal text-white hover:opacity-90 border-0 rounded-lg px-5 py-2.5 text-sm font-medium"
                >
                  <Link href="/signup">{t.home.createAccount}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-revela-cream text-revela-cream bg-transparent hover:bg-revela-cream/10 rounded-lg px-5 py-2.5 text-sm font-medium"
                >
                  <Link href="/login">{t.home.login}</Link>
                </Button>
              </div>
            </div>

            {/* Coluna direita: mockup comparação antes/depois */}
            <div className="w-full">
              <div className="relative w-full aspect-[4/3] max-w-lg mx-auto lg:max-w-none rounded-xl overflow-hidden border border-revela-cream/10 bg-black/20 shadow-lg">
                <ComparisonSlider
                  beforeImage="/hero-before.png"
                  afterImage="/hero-after.png"
                  className="absolute inset-0"
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>
              <p className="mt-3 text-center lg:text-left text-xs text-revela-cream opacity-70">
                Imagens ilustrativas — arraste para comparar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Usado por profissionais da saúde - prova social */}
      <section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream mb-2">
              {t.home.usedByTitle}
            </h2>
            <p className="text-sm sm:text-base text-revela-cream/80 max-w-2xl mx-auto">
              {t.home.usedBySubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {[
              'Cirurgiões plásticos',
              'Dermatologistas',
              'Cirurgiões vasculares',
              'Dentistas',
              'Fisioterapeutas',
              'Clínicas estéticas',
            ].map((label) => (
              <div
                key={label}
                className="p-4 sm:p-5 rounded-lg bg-[rgba(232,220,192,0.05)] border border-[rgba(232,220,192,0.1)] hover:border-revela-cream/25 hover:bg-revela-cream/[0.07] transition-colors flex items-center gap-3"
              >
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-revela-teal/15 text-revela-teal">
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden />
                </div>
                <p className="text-sm sm:text-base text-revela-cream opacity-90">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que é o Revela? - 3 cards escaneáveis com ícones e títulos */}
      <section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream text-center mb-6 sm:mb-8">
            {t.home.whatIsRevela}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {/* Card 1 - Profissionais da saúde */}
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] backdrop-blur-sm p-7 sm:p-8 text-revela-cream">
              <div className="text-revela-teal mb-3">
                <Briefcase className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium mb-3">
                {t.home.whatIsCard1Title}
              </h3>
              <p className="text-sm sm:text-base opacity-90 leading-relaxed">
                {t.home.description1}
              </p>
            </div>

            {/* Card 2 - Comparação em segundos */}
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] backdrop-blur-sm p-7 sm:p-8 text-revela-cream">
              <div className="text-revela-teal mb-3">
                <Camera className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium mb-3">
                {t.home.whatIsCard2Title}
              </h3>
              <p className="text-sm sm:text-base opacity-90 leading-relaxed">
                {t.home.description2}
              </p>
            </div>

            {/* Card 3 - Privacidade total */}
            <div className="rounded-xl border border-revela-cream/10 bg-revela-cream/[0.03] backdrop-blur-sm p-7 sm:p-8 text-revela-cream">
              <div className="text-revela-teal mb-3">
                <Lock className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium mb-3">
                {t.home.whatIsCard3Title}
              </h3>
              <p className="text-sm sm:text-base opacity-90 leading-relaxed">
                {t.home.description3}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Por que Revela? - cards com ícones */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-14 px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream mb-2 sm:mb-3">
              {t.home.whyRevela}
            </h2>
            <p className="text-sm sm:text-base font-light text-revela-cream opacity-80 px-2 sm:px-4">
              {t.home.whyRevelaSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {[
              { Icon: Camera, titleKey: 'comparison' as const, descKey: 'comparisonDesc' as const },
              { Icon: Lock, titleKey: 'privacy' as const, descKey: 'privacyDesc' as const },
              { Icon: Zap, titleKey: 'fast' as const, descKey: 'fastDesc' as const },
              { Icon: Briefcase, titleKey: 'professionals' as const, descKey: 'professionalsDesc' as const },
              { Icon: Globe, titleKey: 'devices' as const, descKey: 'devicesDesc' as const },
            ].map(({ Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="p-3 sm:p-4 md:p-4 rounded-lg bg-[rgba(232,220,192,0.05)] border border-[rgba(232,220,192,0.1)] hover:border-revela-cream/20 transition-colors"
              >
                <div className="text-revela-teal mb-2 sm:mb-3">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-revela-cream mb-1.5 sm:mb-2">
                  {t.home[titleKey]}
                </h3>
                <p className="text-xs sm:text-sm font-light leading-relaxed text-revela-cream opacity-90">
                  {t.home[descKey]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      {t.home.plansTitle && (
        <section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream mb-2">
              {t.home.plansTitle}
            </h2>
            {t.home.plansSubtitle && (
              <p className="text-sm sm:text-base text-revela-cream opacity-80 mb-5 sm:mb-6">
                {t.home.plansSubtitle}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-revela-cream/15 bg-revela-cream/[0.03] p-4 sm:p-4 text-left">
                <h3 className="text-base sm:text-lg font-semibold text-revela-cream mb-1.5">
                  {t.home.planFreeName}
                </h3>
                <p className="text-[10px] uppercase tracking-wide text-revela-cream/70 mb-2">
                  Free – ideal para começar
                </p>
                {t.home.planFreeBullets?.length ? (
                  <ul className="text-xs sm:text-sm text-revela-cream/90 space-y-1">
                    {t.home.planFreeBullets.map((line, i) => (
                      <li key={`free-${i}`}>• {line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs sm:text-sm text-revela-cream/90">{t.home.planFreeDescription}</p>
                )}
              </div>

              <div className="rounded-xl border border-revela-teal/40 bg-revela-teal/10 p-4 sm:p-4 text-left relative">
                <span className="absolute -top-2.5 left-3 px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide bg-revela-teal text-white">
                  Mais escolhido
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-revela-cream mb-1.5">
                  {t.home.planProName}
                </h3>
                <p className="text-[10px] uppercase tracking-wide text-revela-cream/80 mb-2">
                  R$ 19,90 / mês
                </p>
                {t.home.planProBullets?.length ? (
                  <ul className="text-xs sm:text-sm text-revela-cream/95 space-y-1">
                    {t.home.planProBullets.map((line, i) => (
                      <li key={`pro-${i}`}>✔ {line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs sm:text-sm text-revela-cream/95">{t.home.planProDescription}</p>
                )}
              </div>

              <div className="rounded-xl border border-revela-cream/25 bg-revela-cream/[0.06] p-4 sm:p-4 text-left">
                <h3 className="text-base sm:text-lg font-semibold text-revela-cream mb-1.5">
                  {t.home.planPremiumName}
                </h3>
                <p className="text-[10px] uppercase tracking-wide text-revela-cream/80 mb-2">
                  R$ 49,00 / mês
                </p>
                {t.home.planPremiumBullets?.length ? (
                  <ul className="text-xs sm:text-sm text-revela-cream/90 space-y-1">
                    {t.home.planPremiumBullets.map((line, i) => (
                      <li key={`premium-${i}`}>
                        {i === 0 ? '✔' : '•'} {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs sm:text-sm text-revela-cream/90">
                    {t.home.planPremiumDescription}
                  </p>
                )}
              </div>
            </div>

            {t.home.viewPlans && (
              <div className="mt-5">
                <Button
                  asChild
                  className="px-4 py-2.5 rounded-lg bg-revela-teal text-white text-sm font-medium hover:opacity-90"
                >
                  <Link href="/planos">{t.home.viewPlans}</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Como Funciona */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-14 px-4 sm:px-6 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream mb-2 px-2">
            {t.home.howItWorks}
          </h2>
          <p className="text-sm text-revela-cream opacity-80 mb-5 sm:mb-6">
            {t.home.howItWorksSupport}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-5 sm:mb-6">
            {[
              { step: 1, titleKey: 'step1' as const, descKey: 'step1Desc' as const },
              { step: 2, titleKey: 'step2' as const, descKey: 'step2Desc' as const },
              { step: 3, titleKey: 'step3' as const, descKey: 'step3Desc' as const },
            ].map(({ step, titleKey, descKey }) => (
              <div key={step} className="space-y-2 sm:space-y-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto text-base sm:text-lg font-medium bg-revela-teal text-white">
                  {step}
                </div>
                <h3 className="text-sm sm:text-base font-medium text-revela-cream px-1">
                  {t.home[titleKey]}
                </h3>
                <p className="text-xs sm:text-sm font-light leading-relaxed text-revela-cream opacity-80 px-2">
                  {t.home[descKey]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream text-center mb-5 sm:mb-6">
            {t.home.faqTitle}
          </h2>
          <div className="space-y-1.5">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = faqOpenIndex === index;
              return (
                <div
                  key={item.qKey}
                  className="rounded-lg border border-[rgba(232,220,192,0.1)] bg-[rgba(232,220,192,0.05)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 sm:py-3 text-revela-cream font-medium hover:bg-revela-cream/5 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="text-xs sm:text-sm">{t.home[item.qKey]}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 flex-shrink-0 text-revela-teal" aria-hidden />
                    ) : (
                      <ChevronDown className="w-5 h-5 flex-shrink-0 text-revela-teal" aria-hidden />
                    )}
                  </button>
                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className={isOpen ? 'block' : 'hidden'}
                  >
                    <p className="px-3 pb-3 pt-0 text-xs sm:text-sm text-revela-cream opacity-90 leading-relaxed">
                      {t.home[item.aKey]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final - com destaque e linha de confiança */}
      <section className="py-10 sm:py-12 md:py-14 px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl mx-auto text-center rounded-xl border border-revela-teal/30 bg-revela-teal/5 py-8 px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-revela-cream mb-2 sm:mb-3">
            {t.home.ready}
          </h2>
          <p className="text-sm sm:text-base font-light text-revela-cream opacity-90 mb-5 sm:mb-6 leading-relaxed">
            {t.home.readySubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center max-w-sm sm:max-w-md mx-auto">
            <Button
              asChild
              className="w-full sm:flex-1 bg-revela-teal text-white hover:opacity-90 border-0 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium"
            >
              <Link href="/signup">{t.home.createFreeAccount}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:flex-1 border-2 border-revela-cream text-revela-cream bg-transparent hover:bg-revela-cream/10 rounded-lg px-4 py-2.5 sm:py-3 text-sm font-medium"
            >
              <Link href="/login">{t.home.alreadyHaveAccount}</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-revela-cream opacity-75">
            {t.home.trustLine}
          </p>
        </div>
      </section>

      <Footer />
      <StructuredData />
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [translations] = useState<Translations>(getTranslations(defaultLanguage));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-revela-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-2 border-revela-teal border-t-transparent mx-auto mb-4"
            aria-hidden
          />
          <p className="text-revela-cream">{translations.common.loading}</p>
        </div>
      </div>
    );
  }

  return <HomeContent />;
}
