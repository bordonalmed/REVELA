'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslations, Translations, defaultLanguage } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'revela-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Carregar idioma salvo do localStorage
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (savedLanguage && (savedLanguage === 'pt-BR' || savedLanguage === 'en-US')) {
      setLanguageState(savedLanguage);
    } else {
      // Detectar idioma do navegador
      const browserLang = navigator.language || (navigator as any).userLanguage;
      if (browserLang.startsWith('en')) {
        setLanguageState('en-US');
      } else {
        setLanguageState('pt-BR');
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      // Ignora erros de localStorage (modo privado, etc)
    }
    // Atualizar atributo lang do HTML de forma segura
    if (typeof document !== 'undefined' && document.documentElement) {
      try {
        document.documentElement.lang = lang;
      } catch (e) {
        // Ignora erros de manipulação do DOM
      }
    }
  };

  // Atualizar lang do HTML quando o idioma mudar
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement && mounted) {
      try {
        document.documentElement.lang = language;
      } catch (e) {
        // Ignora erros de manipulação do DOM
      }
    }
  }, [language, mounted]);

  // Não renderizar até montar para evitar hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: getTranslations(language),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

