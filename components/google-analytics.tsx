'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { initGA, trackPageView, isGAEnabled } from '@/lib/analytics';
import { CONSENT_EVENT, hasAnalyticsConsent } from '@/lib/consent';

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => setConsented(hasAnalyticsConsent());
    check();
    window.addEventListener(CONSENT_EVENT, check);
    return () => window.removeEventListener(CONSENT_EVENT, check);
  }, []);

  useEffect(() => {
    // Só carrega o Google Analytics depois que o usuário aceitar os cookies
    if (consented) initGA();
  }, [consented]);

  useEffect(() => {
    // Trackear mudanças de página
    if (consented && isGAEnabled() && pathname) {
      trackPageView(pathname);
    }
  }, [pathname, consented]);

  return null;
}
