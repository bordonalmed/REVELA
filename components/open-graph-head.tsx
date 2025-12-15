'use client';

import { useEffect } from 'react';

/**
 * Componente para adicionar tags Open Graph adicionais via head
 * Garante melhor leitura em todas as plataformas sociais
 */
export function OpenGraphHead() {
  useEffect(() => {
    // Adiciona tags Open Graph adicionais que podem não estar no Metadata do Next.js
    const addMetaTag = (property: string, content: string) => {
      // Remove tag existente se houver
      const existing = document.querySelector(`meta[property="${property}"]`);
      if (existing) {
        existing.remove();
      }

      // Adiciona nova tag
      const meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    };

    // Open Graph básico (reforço)
    addMetaTag('og:type', 'website');
    addMetaTag('og:locale', 'pt_BR');
    addMetaTag('og:url', 'https://revela.app');
    addMetaTag('og:site_name', 'Revela');
    
    // Open Graph Image (com URL absoluta)
    addMetaTag('og:image', 'https://revela.app/revela3.png');
    addMetaTag('og:image:secure_url', 'https://revela.app/revela3.png');
    addMetaTag('og:image:width', '1200');
    addMetaTag('og:image:height', '630');
    addMetaTag('og:image:type', 'image/png');
    addMetaTag('og:image:alt', 'Revela - Comparação de Fotos Antes e Depois');

    // Twitter Card (reforço)
    addMetaTag('twitter:card', 'summary_large_image');
    addMetaTag('twitter:image', 'https://revela.app/revela3.png');
    addMetaTag('twitter:image:alt', 'Revela - Comparação de Fotos Antes e Depois');

    // Facebook específico
    addMetaTag('fb:app_id', ''); // Adicionar quando tiver App ID do Facebook

    // Limpeza ao desmontar
    return () => {
      // Não precisa limpar, as tags ficam no head
    };
  }, []);

  return null;
}

