'use client';

import { useLanguage } from '@/contexts/language-context';

export function Footer({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  
  return (
    <footer 
      className={`border-t py-4 sm:py-6 ${className}`}
      style={{ 
        borderColor: 'rgba(232, 220, 192, 0.1)' 
      }}
    >
      <div className="container mx-auto px-4">
        <p 
          className="text-xs sm:text-sm text-center"
          style={{ color: '#E8DCC0', opacity: 0.7 }}
        >
          {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}


