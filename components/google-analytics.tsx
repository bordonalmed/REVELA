'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGA, trackPageView, isGAEnabled } from '@/lib/analytics';

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Inicializar Google Analytics apenas no cliente
    if (typeof window !== 'undefined') {
      initGA();
    }
  }, []);

  useEffect(() => {
    // Trackear mudanças de página
    if (isGAEnabled() && pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}

