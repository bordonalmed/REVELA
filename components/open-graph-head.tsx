'use client';

import { useEffect } from 'react';

/**
 * Componente para adicionar tags Open Graph adicionais via head
 * Garante melhor leitura em todas as plataformas sociais
 */
export function OpenGraphHead() {
  useEffect(() => {
    // Verificar se estamos no cliente e se document.head existe
    if (typeof document === 'undefined' || !document.head) {
      return;
    }

    // Adiciona tags Open Graph adicionais que podem não estar no Metadata do Next.js
    const addMetaTag = (property: string, content: string) => {
      try {
        // Verificar se document.head ainda existe
        if (!document.head) {
          return;
        }

        // Remove tag existente se houver e se tiver parentNode
        const existing = document.querySelector(`meta[property="${property}"]`);
        if (existing && existing.parentNode) {
          try {
            existing.parentNode.removeChild(existing);
          } catch (e) {
            // Se falhar ao remover, tenta usar remove() se disponível
            if (typeof existing.remove === 'function') {
              existing.remove();
            }
          }
        }

        // Adiciona nova tag apenas se document.head ainda existir
        if (document.head) {
          const meta = document.createElement('meta');
          meta.setAttribute('property', property);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      } catch (error) {
        // Silenciosamente ignora erros de manipulação do DOM
        console.warn(`Erro ao adicionar meta tag ${property}:`, error);
      }
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

    // Facebook específico (apenas se tiver conteúdo)
    // addMetaTag('fb:app_id', ''); // Comentado pois está vazio
  }, []);

  return null;
}

