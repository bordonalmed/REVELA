'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Language } from '@/lib/i18n/translations';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
  ];

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-opacity hover:opacity-90"
        style={{
          backgroundColor: 'rgba(232, 220, 192, 0.1)',
          border: '1px solid rgba(232, 220, 192, 0.2)',
          color: '#E8DCC0',
        }}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">{currentLang.flag}</span>
        <span className="text-sm font-medium hidden md:inline">{currentLang.name}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 min-w-[160px] rounded-lg shadow-lg z-50"
          style={{
            backgroundColor: '#1A2B32',
            border: '1px solid rgba(232, 220, 192, 0.2)',
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                language === lang.code
                  ? 'opacity-100'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor:
                  language === lang.code
                    ? 'rgba(0, 168, 143, 0.2)'
                    : 'transparent',
                color: '#E8DCC0',
              }}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-xs" style={{ color: '#00A88F' }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

