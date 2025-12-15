'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/footer';
import { SafeImage } from '@/components/safe-image';
import { StructuredData } from '@/components/structured-data';
import { OpenGraphHead } from '@/components/open-graph-head';
import { LanguageSelector } from '@/components/language-selector';
import { useLanguage } from '@/contexts/language-context';
import { getTranslations, defaultLanguage, type Translations } from '@/lib/i18n/translations';

// Componente interno que usa o hook
function HomeContent() {
  const { t } = useLanguage();
  
  return (
    <div style={{ backgroundColor: '#1A2B32', minHeight: '100vh' }}>
      {/* Language Selector - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="text-center w-full max-w-5xl px-2 sm:px-4 md:px-6">
          {/* Logo - DESTAQUE PRINCIPAL */}
          <div className="flex justify-center mb-6 sm:mb-8 md:mb-10">
            <div
              className="relative w-[50vw] sm:w-[40vw] md:w-[35vw] lg:w-[280px] h-auto"
              style={{
                minHeight: '100px'
              }}
            >
              <SafeImage
                src="/revela3.png"
                alt="Revela Logo"
                width={280}
                height={160}
                className="w-full h-auto object-contain"
                priority
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 40vw, (max-width: 1024px) 35vw, 280px"
              />
            </div>
          </div>
          
          {/* Slogan */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl italic px-2" style={{ color: '#E8DCC0', opacity: 0.9 }}>
              {t.home.slogan}
            </p>
          </div>
          
          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-sm sm:max-w-md mx-auto mb-12 sm:mb-16 px-4">
            <Link href="/signup" className="w-full sm:flex-1">
              <button 
                className="w-full rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 md:px-4 md:py-2.5 text-xs sm:text-sm md:text-sm font-medium transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF'
                }}
              >
                {t.home.createAccount}
              </button>
            </Link>
            <Link href="/login" className="w-full sm:flex-1">
              <button 
                className="w-full rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 md:px-4 md:py-2.5 text-xs sm:text-sm md:text-sm font-medium transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: '#E8E0D0',
                  color: '#1A2B32'
                }}
              >
                {t.home.login}
              </button>
            </Link>
          </div>
          
          {/* Descrição Envolvente - Depois dos Botões */}
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8 px-4 sm:px-6">
            <div className="space-y-4 sm:space-y-5">
              <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed px-2" style={{ color: '#E8DCC0', opacity: 0.9 }}>
                {t.home.description1}
              </p>
              
              <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed px-2" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {t.home.description2}
              </p>
              
              <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed px-2" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {t.home.description3}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Por que Revela? */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-3 sm:mb-4 px-2" style={{ color: '#E8DCC0' }}>
              {t.home.whyRevela}
            </h2>
            <p className="text-sm sm:text-base md:text-lg font-light px-4 sm:px-6" style={{ color: '#E8DCC0', opacity: 0.8 }}>
              {t.home.whyRevelaSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {/* Card 1 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">📸</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                {t.home.comparison}
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {t.home.comparisonDesc}
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">🔒</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                {t.home.privacy}
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {t.home.privacyDesc}
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">⚡</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                {t.home.fast}
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {t.home.fastDesc}
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">💼</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                {t.home.professionals}
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {t.home.professionalsDesc}
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-4 sm:p-5 md:p-6 rounded-lg" style={{ backgroundColor: 'rgba(232, 220, 192, 0.05)', border: '1px solid rgba(232, 220, 192, 0.1)' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">🌎</div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3" style={{ color: '#E8DCC0' }}>
                {t.home.devices}
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed" style={{ color: '#E8DCC0', opacity: 0.85 }}>
                {t.home.devicesDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Como Funciona */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-8 sm:mb-10 md:mb-12 px-2" style={{ color: '#E8DCC0' }}>
            {t.home.howItWorks}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mb-8 sm:mb-10 md:mb-12">
            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto text-lg sm:text-xl md:text-2xl font-medium" style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}>
                1
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium px-2" style={{ color: '#E8DCC0' }}>
                {t.home.step1}
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed px-4 sm:px-2" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                {t.home.step1Desc}
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto text-lg sm:text-xl md:text-2xl font-medium" style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}>
                2
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium px-2" style={{ color: '#E8DCC0' }}>
                {t.home.step2}
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed px-4 sm:px-2" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                {t.home.step2Desc}
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto text-lg sm:text-xl md:text-2xl font-medium" style={{ backgroundColor: '#00A88F', color: '#FFFFFF' }}>
                3
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-medium px-2" style={{ color: '#E8DCC0' }}>
                {t.home.step3}
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-light leading-relaxed px-4 sm:px-2" style={{ color: '#E8DCC0', opacity: 0.8 }}>
                {t.home.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção CTA Final */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 px-2" style={{ color: '#E8DCC0' }}>
            {t.home.ready}
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light mb-8 sm:mb-10 md:mb-12 leading-relaxed px-4 sm:px-6" style={{ color: '#E8DCC0', opacity: 0.9 }}>
            {t.home.readySubtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center items-center w-full max-w-md sm:max-w-lg mx-auto px-4">
            <Link href="/signup" className="w-full sm:flex-1">
              <button 
                className="w-full rounded-lg px-5 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-medium transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: '#00A88F',
                  color: '#FFFFFF'
                }}
              >
                {t.home.createFreeAccount}
              </button>
            </Link>
            <Link href="/login" className="w-full sm:flex-1">
              <button 
                className="w-full rounded-lg px-5 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-medium transition-opacity hover:opacity-90 border-2"
                style={{ 
                  borderColor: '#E8E0D0',
                  color: '#E8E0D0',
                  backgroundColor: 'transparent'
                }}
              >
                {t.home.alreadyHaveAccount}
              </button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
      <StructuredData />
      <OpenGraphHead />
    </div>
  );
}

// Componente wrapper que renderiza apenas no cliente
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [translations, setTranslations] = useState<Translations>(getTranslations(defaultLanguage));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR, renderizar com traduções padrão
  if (!mounted) {
    return (
      <div style={{ backgroundColor: '#1A2B32', minHeight: '100vh' }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#00A88F', borderTopColor: 'transparent' }}></div>
            <p style={{ color: '#E8DCC0' }}>{translations.common.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  // Após montar, renderizar conteúdo completo com contexto
  return <HomeContent />;
}
