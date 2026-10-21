'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CONSENT_EVENT, hasAnalyticsConsent, isAppRoute } from '@/lib/consent';
import { 
  initMetaPixel, 
  initTwitterPixel, 
  initGoogleAds, 
  initTikTokPixel 
} from '@/lib/conversion-tracking';

interface PixelConfig {
  meta?: { pixelId: string };
  twitter?: { pixelId: string };
  google?: { conversionId: string };
  tiktok?: { pixelId: string };
}

export function ConversionPixels() {
  const [config, setConfig] = useState<PixelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => setConsented(hasAnalyticsConsent());
    check();
    window.addEventListener(CONSENT_EVENT, check);
    return () => window.removeEventListener(CONSENT_EVENT, check);
  }, []);

  // Pixels de anúncio: só com consentimento e só nas páginas públicas (nunca dentro do app)
  const allowed = consented && !isAppRoute(pathname);

  useEffect(() => {
    if (!allowed || config) return;
    // Buscar configuração de pixels da API (mantém IDs privados)
    const loadPixelConfig = async () => {
      try {
        const response = await fetch('/api/conversion-tracking');
        if (response.ok) {
          const pixelConfig = await response.json();
          setConfig(pixelConfig);
          
          // Inicializar pixels conforme disponível
          if (pixelConfig.meta?.pixelId) {
            initMetaPixel(pixelConfig.meta.pixelId);
          }
          
          if (pixelConfig.twitter?.pixelId) {
            initTwitterPixel(pixelConfig.twitter.pixelId);
          }
          
          if (pixelConfig.google?.conversionId) {
            initGoogleAds(pixelConfig.google.conversionId);
          }
          
          if (pixelConfig.tiktok?.pixelId) {
            initTikTokPixel(pixelConfig.tiktok.pixelId);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configuração de pixels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPixelConfig();
  }, [allowed, config]);

  // Este componente não renderiza nada visualmente
  return null;
}

