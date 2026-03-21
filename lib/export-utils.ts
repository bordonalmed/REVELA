/**
 * Utilitários para exportação de projetos
 * Gera imagens de comparação e PDFs
 */

'use client';

import { resolveEffectiveBranding } from '@/lib/branding';
import { fetchEntitlementPlanForEmail } from '@/lib/entitlements';
import { isPro } from '@/lib/plans';
import { supabase } from '@/lib/supabase';

/**
 * Converte base64 para Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Carrega imagem de base64 e retorna HTMLImageElement
 */
function loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
}

async function getExportBranding(): Promise<{ enabled: boolean; logo: HTMLImageElement }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    const entitlement = await fetchEntitlementPlanForEmail(user?.email);
    const effective = resolveEffectiveBranding({
      ownerEmail: user?.email || null,
      hasProAccess: isPro(user, entitlement),
    });

    if (!effective.watermarkEnabled) {
      const emptyImg = new Image();
      emptyImg.width = 0;
      emptyImg.height = 0;
      return { enabled: false, logo: emptyImg };
    }

    const img = await loadImageFromBase64(effective.watermarkLogoDataUrl);
    return { enabled: true, logo: img };
  } catch {
    // fallback: Revela logo
    const logo = await loadLogo();
    return { enabled: true, logo };
  }
}

/**
 * Carrega logo do Revela
 */
function loadLogo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Se não conseguir carregar o logo, cria uma imagem vazia
      const emptyImg = new Image();
      emptyImg.width = 0;
      emptyImg.height = 0;
      resolve(emptyImg);
    };
    // Usar caminho absoluto para garantir que funcione
    img.src = window.location.origin + '/revela3-transparent-processed.png';
  });
}

/**
 * Exporta comparação antes/depois como imagem única
 * @param beforeImage - Base64 da imagem antes
 * @param afterImage - Base64 da imagem depois
 * @param projectName - Nome do projeto
 * @param projectDate - Data do projeto
 * @param options - Opções de exportação
 */
export async function exportComparisonImage(
  beforeImage: string,
  afterImage: string,
  projectName: string,
  projectDate: string,
  options: {
    format?: 'png' | 'jpeg';
    quality?: number;
    layout?: 'side-by-side' | 'vertical';
    includeLabels?: boolean;
    includeInfo?: boolean;
  } = {}
): Promise<void> {
  const {
    format = 'png',
    quality = 0.95,
    layout = 'side-by-side',
    includeLabels = true,
    includeInfo = true,
  } = options;

  try {
    // Carregar ambas as imagens e o logo (com regras de plano)
    const [beforeImg, afterImg, branding] = await Promise.all([
      loadImageFromBase64(beforeImage),
      loadImageFromBase64(afterImage),
      getExportBranding(),
    ]);
    const logoImg = branding.logo;

    // Calcular dimensões
    const maxWidth = 1920;
    const maxHeight = 1080;
    const padding = 40;
    const labelHeight = includeLabels ? 60 : 0;
    const infoHeight = includeInfo ? 80 : 0;
    // Marca d'água: 18% da largura do bloco de imagem, opacidade 0.75
    const logoCornerPadding = 14; // Espaçamento do logo dos cantos
    const spacing = 20;

    let canvasWidth: number;
    let canvasHeight: number;
    let beforeWidth: number;
    let beforeHeight: number;
    let afterWidth: number;
    let afterHeight: number;

    if (layout === 'side-by-side') {
      // Lado a lado
      const availableWidth = maxWidth - (padding * 2) - spacing;
      const availableHeight = maxHeight - (padding * 2) - labelHeight - infoHeight;

      // Calcular tamanho mantendo proporção
      const beforeAspect = beforeImg.width / beforeImg.height;
      const afterAspect = afterImg.width / afterImg.height;

      // Cada imagem ocupa metade da largura disponível
      const singleWidth = availableWidth / 2;
      beforeHeight = singleWidth / beforeAspect;
      afterHeight = singleWidth / afterAspect;

      // Ajustar se exceder altura disponível
      const maxSingleHeight = availableHeight;
      if (beforeHeight > maxSingleHeight || afterHeight > maxSingleHeight) {
        const scale = maxSingleHeight / Math.max(beforeHeight, afterHeight);
        beforeHeight *= scale;
        afterHeight *= scale;
      }

      beforeWidth = beforeHeight * beforeAspect;
      afterWidth = afterHeight * afterAspect;

      canvasWidth = maxWidth;
      canvasHeight = Math.max(beforeHeight, afterHeight) + labelHeight + infoHeight + (padding * 2);
    } else {
      // Vertical (empilhado)
      const availableWidth = maxWidth - (padding * 2);
      const availableHeight = (maxHeight - (padding * 2) - labelHeight - infoHeight - spacing) / 2;

      const beforeAspect = beforeImg.width / beforeImg.height;
      const afterAspect = afterImg.width / afterImg.height;

      beforeWidth = Math.min(availableWidth, availableHeight * beforeAspect);
      beforeHeight = beforeWidth / beforeAspect;
      if (beforeHeight > availableHeight) {
        beforeHeight = availableHeight;
        beforeWidth = beforeHeight * beforeAspect;
      }

      afterWidth = Math.min(availableWidth, availableHeight * afterAspect);
      afterHeight = afterWidth / afterAspect;
      if (afterHeight > availableHeight) {
        afterHeight = availableHeight;
        afterWidth = afterHeight * afterAspect;
      }

      canvasWidth = maxWidth;
      canvasHeight = beforeHeight + afterHeight + labelHeight + infoHeight + spacing + (padding * 2);
    }

    // Criar canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }

    // Fundo preto para maior nitidez
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let currentY = padding;

    // Informações do projeto (topo)
    if (includeInfo) {
      ctx.fillStyle = '#E8DCC0'; // Cor clara para contraste com fundo preto
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(projectName, canvasWidth / 2, currentY + 30);
      
      ctx.fillStyle = '#CCCCCC'; // Cor clara para contraste com fundo preto
      ctx.font = '20px Arial';
      const dateStr = new Date(projectDate).toLocaleDateString('pt-BR');
      ctx.fillText(`Data: ${dateStr}`, canvasWidth / 2, currentY + 60);
      
      currentY += infoHeight;
    }

    if (layout === 'side-by-side') {
      // Desenhar imagens lado a lado
      const startX = (canvasWidth - beforeWidth - afterWidth - spacing) / 2;
      const imageY = currentY + labelHeight;

      // Imagem Antes
      ctx.drawImage(beforeImg, startX, imageY, beforeWidth, beforeHeight);
      // Labels "ANTES" e "DEPOIS" removidos conforme solicitado

      // Logo no canto inferior direito da imagem ANTES
      if (branding.enabled && logoImg.width > 0 && logoImg.height > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayWidth = Math.max(70, Math.min(180, beforeWidth * 0.18));
        const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);
        const logoX = startX + beforeWidth - logoDisplayWidth - logoCornerPadding;
        const logoY = imageY + beforeHeight - logoDisplayHeight - logoCornerPadding;
        
        ctx.globalAlpha = 0.75;
        ctx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;
      }

      // Imagem Depois
      ctx.drawImage(afterImg, startX + beforeWidth + spacing, imageY, afterWidth, afterHeight);
      // Labels "ANTES" e "DEPOIS" removidos conforme solicitado

      // Logo no canto inferior direito da imagem DEPOIS
      if (branding.enabled && logoImg.width > 0 && logoImg.height > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayWidth = Math.max(70, Math.min(180, afterWidth * 0.18));
        const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);
        const logoX = startX + beforeWidth + spacing + afterWidth - logoDisplayWidth - logoCornerPadding;
        const logoY = imageY + afterHeight - logoDisplayHeight - logoCornerPadding;
        
        ctx.globalAlpha = 0.75;
        ctx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;
      }
    } else {
      // Desenhar imagens verticalmente
      const imageX = (canvasWidth - Math.max(beforeWidth, afterWidth)) / 2;
      const beforeImageY = currentY + labelHeight;

      // Imagem Antes
      ctx.drawImage(beforeImg, imageX, beforeImageY, beforeWidth, beforeHeight);
      // Labels "ANTES" e "DEPOIS" removidos conforme solicitado

      // Logo no canto inferior direito da imagem ANTES
      if (branding.enabled && logoImg.width > 0 && logoImg.height > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayWidth = Math.max(70, Math.min(180, beforeWidth * 0.18));
        const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);
        const logoX = imageX + beforeWidth - logoDisplayWidth - logoCornerPadding;
        const logoY = beforeImageY + beforeHeight - logoDisplayHeight - logoCornerPadding;
        
        ctx.globalAlpha = 0.75;
        ctx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;
      }

      currentY += beforeHeight + labelHeight + spacing;
      const afterImageY = currentY + labelHeight;

      // Imagem Depois
      ctx.drawImage(afterImg, imageX, afterImageY, afterWidth, afterHeight);
      // Labels "ANTES" e "DEPOIS" removidos conforme solicitado

      // Logo no canto inferior direito da imagem DEPOIS
      if (branding.enabled && logoImg.width > 0 && logoImg.height > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayWidth = Math.max(70, Math.min(180, afterWidth * 0.18));
        const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);
        const logoX = imageX + afterWidth - logoDisplayWidth - logoCornerPadding;
        const logoY = afterImageY + afterHeight - logoDisplayHeight - logoCornerPadding;
        
        ctx.globalAlpha = 0.75;
        ctx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;
      }
    }

    // Converter para blob e download
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error('Erro ao gerar imagem');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_comparacao.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      mimeType,
      quality
    );
  } catch (error) {
    console.error('Erro ao exportar imagem:', error);
    throw new Error('Não foi possível exportar a imagem. Verifique se as imagens estão carregadas.');
  }
}

/**
 * Exporta todas as imagens do projeto como ZIP
 */
export async function exportProjectAsZip(
  project: { name: string; beforeImages: string[]; afterImages: string[] }
): Promise<void> {
  // Para ZIP, precisaríamos de uma biblioteca como JSZip
  // Por enquanto, vamos fazer download individual ou implementar depois
  throw new Error('Exportação ZIP ainda não implementada. Use a exportação individual.');
}

/**
 * Tipos de formato para redes sociais
 */
export type SocialMediaFormat = 
  | 'instagram-feed-1x1'      // 1080x1080px (quadrado)
  | 'instagram-feed-4x5'       // 1080x1350px (retangular)
  | 'instagram-stories'        // 1080x1920px (vertical - 2 imagens separadas)
  | 'instagram-stories-single'; // 1080x1920px (vertical - 1 imagem com antes/depois)

/**
 * Especificações de formato para redes sociais
 */
const SOCIAL_FORMATS = {
  'instagram-feed-1x1': {
    width: 1080,
    height: 1080,
    name: 'Instagram Feed (1:1)',
    description: 'Formato quadrado ideal para feed do Instagram',
    layout: 'side-by-side' as const,
  },
  'instagram-feed-4x5': {
    width: 1080,
    height: 1350,
    name: 'Instagram Feed (4:5)',
    description: 'Formato retangular para feed do Instagram',
    layout: 'side-by-side' as const,
  },
  'instagram-stories': {
    width: 1080,
    height: 1920,
    name: 'Instagram Stories',
    description: 'Duas imagens separadas (antes e depois)',
    layout: 'separate' as const,
  },
  'instagram-stories-single': {
    width: 1080,
    height: 1920,
    name: 'Instagram Stories (Única)',
    description: 'Uma imagem com antes e depois empilhados',
    layout: 'vertical' as const,
  },
};

/**
 * Exporta comparação formatada para redes sociais
 */
export async function exportForSocialMedia(
  beforeImage: string,
  afterImage: string,
  projectName: string,
  format: SocialMediaFormat,
  options: {
    includeLogo?: boolean;
    includeInfo?: boolean;
  } = {}
): Promise<void> {
  const { includeLogo = true, includeInfo = false } = options;
  const formatSpec = SOCIAL_FORMATS[format];

  try {
    const branding = await getExportBranding();
    const canInclude = includeLogo && branding.enabled;
    const [beforeImg, afterImg] = await Promise.all([
      loadImageFromBase64(beforeImage),
      loadImageFromBase64(afterImage),
    ]);
    const logoImg = canInclude ? branding.logo : new Image();

    const canvas = document.createElement('canvas');
    canvas.width = formatSpec.width;
    canvas.height = formatSpec.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }

    // Fundo preto
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 20;
    // Marca d'água: 18% da largura do canvas, opacidade 0.75
    const logoPadding = 10;

    if (formatSpec.layout === 'separate') {
      // Para Stories: gerar duas imagens separadas
      // Primeiro, gerar imagem ANTES
      const beforeCanvas = document.createElement('canvas');
      beforeCanvas.width = formatSpec.width;
      beforeCanvas.height = formatSpec.height;
      const beforeCtx = beforeCanvas.getContext('2d');
      
      if (!beforeCtx) throw new Error('Erro ao criar canvas');

      beforeCtx.fillStyle = '#000000';
      beforeCtx.fillRect(0, 0, beforeCanvas.width, beforeCanvas.height);

      // Calcular dimensões da imagem ANTES
      const imgAspect = beforeImg.width / beforeImg.height;
      const canvasAspect = formatSpec.width / formatSpec.height;
      
      let imgWidth: number, imgHeight: number, imgX: number, imgY: number;

      if (imgAspect > canvasAspect) {
        // Imagem mais larga - ajustar pela altura
        imgHeight = formatSpec.height - (padding * 2);
        imgWidth = imgHeight * imgAspect;
        imgX = (formatSpec.width - imgWidth) / 2;
        imgY = padding;
      } else {
        // Imagem mais alta - ajustar pela largura
        imgWidth = formatSpec.width - (padding * 2);
        imgHeight = imgWidth / imgAspect;
        imgX = padding;
        imgY = (formatSpec.height - imgHeight) / 2;
      }

      beforeCtx.drawImage(beforeImg, imgX, imgY, imgWidth, imgHeight);

      // Logo na imagem ANTES
      if (canInclude && logoImg.width > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayWidth = Math.max(70, Math.min(180, formatSpec.width * 0.18));
        const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);
        const logoX = formatSpec.width - logoDisplayWidth - logoPadding;
        const logoY = formatSpec.height - logoDisplayHeight - logoPadding;
        
        beforeCtx.globalAlpha = 0.75;
        beforeCtx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        beforeCtx.globalAlpha = 1.0;
      }

      // Download da imagem ANTES
      beforeCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_ANTES_${formatSpec.name.replace(/[^a-z0-9]/gi, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);

      // Agora gerar imagem DEPOIS
      const afterCanvas = document.createElement('canvas');
      afterCanvas.width = formatSpec.width;
      afterCanvas.height = formatSpec.height;
      const afterCtx = afterCanvas.getContext('2d');
      
      if (!afterCtx) throw new Error('Erro ao criar canvas');

      afterCtx.fillStyle = '#000000';
      afterCtx.fillRect(0, 0, afterCanvas.width, afterCanvas.height);

      // Calcular dimensões da imagem DEPOIS
      const afterImgAspect = afterImg.width / afterImg.height;
      
      let afterImgWidth: number, afterImgHeight: number, afterImgX: number, afterImgY: number;

      if (afterImgAspect > canvasAspect) {
        afterImgHeight = formatSpec.height - (padding * 2);
        afterImgWidth = afterImgHeight * afterImgAspect;
        afterImgX = (formatSpec.width - afterImgWidth) / 2;
        afterImgY = padding;
      } else {
        afterImgWidth = formatSpec.width - (padding * 2);
        afterImgHeight = afterImgWidth / afterImgAspect;
        afterImgX = padding;
        afterImgY = (formatSpec.height - afterImgHeight) / 2;
      }

      afterCtx.drawImage(afterImg, afterImgX, afterImgY, afterImgWidth, afterImgHeight);

      // Logo na imagem DEPOIS
      if (canInclude && logoImg.width > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayWidth = Math.max(70, Math.min(180, formatSpec.width * 0.18));
        const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);
        const logoX = formatSpec.width - logoDisplayWidth - logoPadding;
        const logoY = formatSpec.height - logoDisplayHeight - logoPadding;
        
        afterCtx.globalAlpha = 0.75;
        afterCtx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        afterCtx.globalAlpha = 1.0;
      }

      // Download da imagem DEPOIS (com pequeno delay para não conflitar)
      setTimeout(() => {
        afterCanvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_DEPOIS_${formatSpec.name.replace(/[^a-z0-9]/gi, '_')}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.95);
      }, 500);

      return;
    }

    // Para layouts side-by-side ou vertical
    let beforeWidth: number, beforeHeight: number, afterWidth: number, afterHeight: number;
    let startX: number, startY: number, spacing: number;

    if (formatSpec.layout === 'side-by-side') {
      spacing = 15;
      const availableWidth = formatSpec.width - (padding * 2) - spacing;
      const availableHeight = formatSpec.height - (padding * 2);

      const beforeAspect = beforeImg.width / beforeImg.height;
      const afterAspect = afterImg.width / afterImg.height;

      const singleWidth = availableWidth / 2;
      beforeHeight = singleWidth / beforeAspect;
      afterHeight = singleWidth / afterAspect;

      const maxHeight = availableHeight;
      if (beforeHeight > maxHeight || afterHeight > maxHeight) {
        const scale = maxHeight / Math.max(beforeHeight, afterHeight);
        beforeHeight *= scale;
        afterHeight *= scale;
      }

      beforeWidth = beforeHeight * beforeAspect;
      afterWidth = afterHeight * afterAspect;

      startX = (formatSpec.width - beforeWidth - afterWidth - spacing) / 2;
      startY = (formatSpec.height - Math.max(beforeHeight, afterHeight)) / 2;

      // Desenhar imagens
      ctx.drawImage(beforeImg, startX, startY, beforeWidth, beforeHeight);
      ctx.drawImage(afterImg, startX + beforeWidth + spacing, startY, afterWidth, afterHeight);

      // Logos
      if (canInclude && logoImg.width > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayWidth = Math.max(70, Math.min(180, beforeWidth * 0.18));
        const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);

        // Logo na imagem ANTES
        const logoBeforeX = startX + beforeWidth - logoDisplayWidth - logoPadding;
        const logoBeforeY = startY + beforeHeight - logoDisplayHeight - logoPadding;
        ctx.globalAlpha = 0.75;
        ctx.drawImage(logoImg, logoBeforeX, logoBeforeY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;

        // Logo na imagem DEPOIS
        const logoAfterX = startX + beforeWidth + spacing + afterWidth - logoDisplayWidth - logoPadding;
        const logoAfterY = startY + afterHeight - logoDisplayHeight - logoPadding;
        ctx.globalAlpha = 0.75;
        ctx.drawImage(logoImg, logoAfterX, logoAfterY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;
      }
    } else {
      // Layout vertical (empilhado)
      spacing = 15;
      const availableWidth = formatSpec.width - (padding * 2);
      const availableHeight = (formatSpec.height - (padding * 2) - spacing) / 2;

      const beforeAspect = beforeImg.width / beforeImg.height;
      const afterAspect = afterImg.width / afterImg.height;

      beforeWidth = Math.min(availableWidth, availableHeight * beforeAspect);
      beforeHeight = beforeWidth / beforeAspect;
      if (beforeHeight > availableHeight) {
        beforeHeight = availableHeight;
        beforeWidth = beforeHeight * beforeAspect;
      }

      afterWidth = Math.min(availableWidth, availableHeight * afterAspect);
      afterHeight = afterWidth / afterAspect;
      if (afterHeight > availableHeight) {
        afterHeight = availableHeight;
        afterWidth = afterHeight * afterAspect;
      }

      startX = (formatSpec.width - Math.max(beforeWidth, afterWidth)) / 2;
      const beforeY = padding;
      const afterY = padding + beforeHeight + spacing;

      ctx.drawImage(beforeImg, startX, beforeY, beforeWidth, beforeHeight);
      ctx.drawImage(afterImg, startX, afterY, afterWidth, afterHeight);

      // Logos
      if (canInclude && logoImg.width > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayWidth = Math.max(70, Math.min(180, beforeWidth * 0.18));
        const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);

        // Logo na imagem ANTES
        const logoBeforeX = startX + beforeWidth - logoDisplayWidth - logoPadding;
        const logoBeforeY = beforeY + beforeHeight - logoDisplayHeight - logoPadding;
        ctx.globalAlpha = 0.75;
        ctx.drawImage(logoImg, logoBeforeX, logoBeforeY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;

        // Logo na imagem DEPOIS
        const logoAfterX = startX + afterWidth - logoDisplayWidth - logoPadding;
        const logoAfterY = afterY + afterHeight - logoDisplayHeight - logoPadding;
        ctx.globalAlpha = 0.75;
        ctx.drawImage(logoImg, logoAfterX, logoAfterY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;
      }
    }

    // Converter para blob e download
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error('Erro ao gerar imagem');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${formatSpec.name.replace(/[^a-z0-9]/gi, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      'image/jpeg',
      0.95
    );
  } catch (error) {
    console.error('Erro ao exportar para rede social:', error);
    throw new Error('Não foi possível exportar a imagem. Verifique se as imagens estão carregadas.');
  }
}

/**
 * Gera preview de formato para redes sociais (retorna data URL)
 */
export async function generateSocialMediaPreview(
  beforeImage: string,
  afterImage: string,
  format: SocialMediaFormat
): Promise<string> {
  const formatSpec = SOCIAL_FORMATS[format];
  
  // Reutilizar lógica similar, mas retornar data URL ao invés de download
  const branding = await getExportBranding();
  const [beforeImg, afterImg] = await Promise.all([
    loadImageFromBase64(beforeImage),
    loadImageFromBase64(afterImage),
  ]);
  const logoImg = branding.enabled ? branding.logo : new Image();

  const canvas = document.createElement('canvas');
  canvas.width = formatSpec.width;
  canvas.height = formatSpec.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  // Fundo preto
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 20;
  const logoPadding = 10;

  // Lógica similar à exportForSocialMedia, mas simplificada para preview
  if (formatSpec.layout === 'separate') {
    // Para preview de stories, mostrar apenas a primeira imagem
    const imgAspect = beforeImg.width / beforeImg.height;
    const canvasAspect = formatSpec.width / formatSpec.height;
    
    let imgWidth: number, imgHeight: number, imgX: number, imgY: number;

    if (imgAspect > canvasAspect) {
      imgHeight = formatSpec.height - (padding * 2);
      imgWidth = imgHeight * imgAspect;
      imgX = (formatSpec.width - imgWidth) / 2;
      imgY = padding;
    } else {
      imgWidth = formatSpec.width - (padding * 2);
      imgHeight = imgWidth / imgAspect;
      imgX = padding;
      imgY = (formatSpec.height - imgHeight) / 2;
    }

    ctx.drawImage(beforeImg, imgX, imgY, imgWidth, imgHeight);
    if (branding.enabled && logoImg.width > 0) {
      const logoAspect = logoImg.width / logoImg.height;
      const logoDisplayWidth = Math.max(70, Math.min(180, formatSpec.width * 0.18));
      const logoDisplayHeight = logoDisplayWidth / (logoAspect || 1);
      const logoX = formatSpec.width - logoDisplayWidth - logoPadding;
      const logoY = formatSpec.height - logoDisplayHeight - logoPadding;
      ctx.globalAlpha = 0.75;
      ctx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
      ctx.globalAlpha = 1.0;
    }
  } else if (formatSpec.layout === 'side-by-side') {
    const spacing = 15;
    const availableWidth = formatSpec.width - (padding * 2) - spacing;
    const availableHeight = formatSpec.height - (padding * 2);

    const beforeAspect = beforeImg.width / beforeImg.height;
    const afterAspect = afterImg.width / afterImg.height;

    const singleWidth = availableWidth / 2;
    let beforeHeight = singleWidth / beforeAspect;
    let afterHeight = singleWidth / afterAspect;

    const maxHeight = availableHeight;
    if (beforeHeight > maxHeight || afterHeight > maxHeight) {
      const scale = maxHeight / Math.max(beforeHeight, afterHeight);
      beforeHeight *= scale;
      afterHeight *= scale;
    }

    const beforeWidth = beforeHeight * beforeAspect;
    const afterWidth = afterHeight * afterAspect;

    const startX = (formatSpec.width - beforeWidth - afterWidth - spacing) / 2;
    const startY = (formatSpec.height - Math.max(beforeHeight, afterHeight)) / 2;

    ctx.drawImage(beforeImg, startX, startY, beforeWidth, beforeHeight);
    ctx.drawImage(afterImg, startX + beforeWidth + spacing, startY, afterWidth, afterHeight);
    if (branding.enabled && logoImg.width > 0) {
      const logoAspect = logoImg.width / logoImg.height;
      const logoBeforeW = Math.max(70, Math.min(180, beforeWidth * 0.18));
      const logoBeforeH = logoBeforeW / (logoAspect || 1);
      ctx.globalAlpha = 0.75;
      ctx.drawImage(
        logoImg,
        startX + beforeWidth - logoBeforeW - logoPadding,
        startY + beforeHeight - logoBeforeH - logoPadding,
        logoBeforeW,
        logoBeforeH,
      );
      const logoAfterW = Math.max(70, Math.min(180, afterWidth * 0.18));
      const logoAfterH = logoAfterW / (logoAspect || 1);
      ctx.drawImage(
        logoImg,
        startX + beforeWidth + spacing + afterWidth - logoAfterW - logoPadding,
        startY + afterHeight - logoAfterH - logoPadding,
        logoAfterW,
        logoAfterH,
      );
      ctx.globalAlpha = 1.0;
    }
  } else {
    // Vertical
    const spacing = 15;
    const availableWidth = formatSpec.width - (padding * 2);
    const availableHeight = (formatSpec.height - (padding * 2) - spacing) / 2;

    const beforeAspect = beforeImg.width / beforeImg.height;
    const afterAspect = afterImg.width / afterImg.height;

    let beforeWidth = Math.min(availableWidth, availableHeight * beforeAspect);
    let beforeHeight = beforeWidth / beforeAspect;
    if (beforeHeight > availableHeight) {
      beforeHeight = availableHeight;
      beforeWidth = beforeHeight * beforeAspect;
    }

    let afterWidth = Math.min(availableWidth, availableHeight * afterAspect);
    let afterHeight = afterWidth / afterAspect;
    if (afterHeight > availableHeight) {
      afterHeight = availableHeight;
      afterWidth = afterHeight * afterAspect;
    }

    const startX = (formatSpec.width - Math.max(beforeWidth, afterWidth)) / 2;
    const beforeY = padding;
    const afterY = padding + beforeHeight + spacing;

    ctx.drawImage(beforeImg, startX, beforeY, beforeWidth, beforeHeight);
    ctx.drawImage(afterImg, startX, afterY, afterWidth, afterHeight);
    if (branding.enabled && logoImg.width > 0) {
      const logoAspect = logoImg.width / logoImg.height;
      const logoBeforeW = Math.max(70, Math.min(180, beforeWidth * 0.18));
      const logoBeforeH = logoBeforeW / (logoAspect || 1);
      ctx.globalAlpha = 0.75;
      ctx.drawImage(
        logoImg,
        startX + beforeWidth - logoBeforeW - logoPadding,
        beforeY + beforeHeight - logoBeforeH - logoPadding,
        logoBeforeW,
        logoBeforeH,
      );
      const logoAfterW = Math.max(70, Math.min(180, afterWidth * 0.18));
      const logoAfterH = logoAfterW / (logoAspect || 1);
      ctx.drawImage(
        logoImg,
        startX + afterWidth - logoAfterW - logoPadding,
        afterY + afterHeight - logoAfterH - logoPadding,
        logoAfterW,
        logoAfterH,
      );
      ctx.globalAlpha = 1.0;
    }
  }

  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Retorna informações sobre os formatos disponíveis
 */
export function getSocialMediaFormats() {
  return Object.entries(SOCIAL_FORMATS).map(([key, spec]) => ({
    id: key as SocialMediaFormat,
    ...spec,
  }));
}

/**
 * Templates clínicos profissionais (Revela Premium)
 */
export type ClinicTemplateId =
  | 'before-after'
  | 'before-30-90'
  | 'vertical-compare'
  | 'before-after-clinic-brand'
  | 'timeline-summary';

export interface ClinicTemplateParams {
  templateId: ClinicTemplateId;
  images: string[]; // Base64 das imagens em ordem requerida pelo template
  labels?: string[]; // Rótulos por imagem (ex: 'Antes', '30 dias', '90 dias')
  clinicName?: string;
  clinicLogoBase64?: string | null;
  title?: string;
  subtitle?: string;
  date?: string;
}

async function composeClinicTemplateCanvas(params: ClinicTemplateParams): Promise<HTMLCanvasElement> {
  const {
    templateId,
    images,
    labels = [],
    clinicName,
    clinicLogoBase64,
    title,
    subtitle,
    date,
  } = params;

  if (!images.length) {
    throw new Error('Nenhuma imagem selecionada para o template.');
  }

  // Canvas padrão 1920x1080 (HD)
  const width = 1920;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  // Fundo premium: gradiente suave
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#020617'); // slate-950
  gradient.addColorStop(0.5, '#0f172a'); // slate-900
  gradient.addColorStop(1, '#020617');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Header com informações da clínica
  const headerHeight = 160;
  ctx.save();
  ctx.fillStyle = 'rgba(15,23,42,0.9)';
  ctx.fillRect(0, 0, width, headerHeight);

  ctx.font = '32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#E5E7EB';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const headerMarginX = 80;
  let headerY = 36;

  if (title) {
    ctx.font = 'bold 36px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(title, headerMarginX, headerY);
    headerY += 46;
  }

  if (subtitle) {
    ctx.font = '24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText(subtitle, headerMarginX, headerY);
    headerY += 34;
  }

  if (clinicName || date) {
    ctx.font = '20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#6B7280';
    const infoParts = [];
    if (clinicName) infoParts.push(clinicName);
    if (date) infoParts.push(date);
    ctx.fillText(infoParts.join(' • '), headerMarginX, headerY + 6);
  }

  // Logo da clínica à direita (se fornecido)
  if (clinicLogoBase64) {
    try {
      const logoImg = await loadImageFromBase64(clinicLogoBase64);
      const logoMaxHeight = 80;
      const logoAspect = logoImg.width / logoImg.height || 1;
      const logoHeight = logoMaxHeight;
      const logoWidth = logoHeight * logoAspect;
      const logoX = width - logoWidth - 80;
      const logoY = headerHeight / 2 - logoHeight / 2;

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
      ctx.restore();
    } catch {
      // Se falhar, apenas ignora logo customizado
    }
  }

  ctx.restore();

  // Área de conteúdo
  const contentTop = headerHeight + 40;
  const contentHeight = height - contentTop - 60;
  const contentLeft = 80;
  const contentRight = width - 80;
  const contentWidth = contentRight - contentLeft;

  // Carregar imagens selecionadas
  const loadedImages = await Promise.all(images.map((img) => loadImageFromBase64(img)));

  const drawLabeledImage = (
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    label?: string
  ) => {
    // Área da imagem com leve borda
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.9)';
    const radius = 18;
    const rectX = x;
    const rectY = y;
    const rectW = w;
    const rectH = h;

    ctx.beginPath();
    ctx.moveTo(rectX + radius, rectY);
    ctx.lineTo(rectX + rectW - radius, rectY);
    ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius);
    ctx.lineTo(rectX + rectW, rectY + rectH - radius);
    ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH);
    ctx.lineTo(rectX + radius, rectY + rectH);
    ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius);
    ctx.lineTo(rectX, rectY + radius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
    ctx.closePath();
    ctx.fill();

    // Ajustar imagem dentro do card mantendo proporção
    const availableW = rectW - 40;
    const availableH = rectH - 70;
    const imgAspect = img.width / img.height || 1;
    const cardAspect = availableW / availableH;
    let drawW: number;
    let drawH: number;
    if (imgAspect > cardAspect) {
      drawW = availableW;
      drawH = drawW / imgAspect;
    } else {
      drawH = availableH;
      drawW = drawH * imgAspect;
    }
    const imgX = rectX + (rectW - drawW) / 2;
    const imgY = rectY + (rectH - drawH) / 2 - 8;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rectX + radius - 1, rectY + 4);
    ctx.lineTo(rectX + rectW - radius + 1, rectY + 4);
    ctx.quadraticCurveTo(rectX + rectW - 1, rectY + 4, rectX + rectW - 1, rectY + radius + 2);
    ctx.lineTo(rectX + rectW - 1, rectY + rectH - radius - 2);
    ctx.quadraticCurveTo(rectX + rectW - 1, rectY + rectH - 4, rectX + rectW - radius + 1, rectY + rectH - 4);
    ctx.lineTo(rectX + radius - 1, rectY + rectH - 4);
    ctx.quadraticCurveTo(rectX + 1, rectY + rectH - 4, rectX + 1, rectY + rectH - radius - 2);
    ctx.lineTo(rectX + 1, rectY + radius + 2);
    ctx.quadraticCurveTo(rectX + 1, rectY + 4, rectX + radius - 1, rectY + 4);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, imgX, imgY, drawW, drawH);
    ctx.restore();

    // Label
    if (label) {
      ctx.font = 'bold 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#E5E7EB';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const labelY = rectY + rectH - 26;
      ctx.fillText(label, rectX + rectW / 2, labelY);
    }

    ctx.restore();
  };

  // Desenhar de acordo com o template
  if (templateId === 'before-after' || templateId === 'before-after-clinic-brand') {
    const [beforeImg, afterImg] = loadedImages;
    const marginX = 24;
    const gap = 32;
    const cardWidth = (contentWidth - gap - marginX * 2) / 2;
    const cardHeight = contentHeight;
    const leftX = contentLeft + marginX;
    const rightX = leftX + cardWidth + gap;

    drawLabeledImage(beforeImg, leftX, contentTop, cardWidth, cardHeight, labels[0] || 'ANTES');
    drawLabeledImage(afterImg, rightX, contentTop, cardWidth, cardHeight, labels[1] || 'DEPOIS');
  } else if (templateId === 'before-30-90') {
    const [img1, img2, img3] = loadedImages;
    const marginX = 24;
    const gap = 24;
    const cardWidth = (contentWidth - gap * 2 - marginX * 2) / 3;
    const cardHeight = contentHeight;
    const firstX = contentLeft + marginX;
    const secondX = firstX + cardWidth + gap;
    const thirdX = secondX + cardWidth + gap;

    drawLabeledImage(img1, firstX, contentTop, cardWidth, cardHeight, labels[0] || 'ANTES');
    drawLabeledImage(img2, secondX, contentTop, cardWidth, cardHeight, labels[1] || '30 dias');
    drawLabeledImage(img3, thirdX, contentTop, cardWidth, cardHeight, labels[2] || '90 dias');
  } else if (templateId === 'vertical-compare') {
    const [topImg, bottomImg] = loadedImages;
    const marginY = 16;
    const gap = 24;
    const cardHeight = (contentHeight - gap - marginY * 2) / 2;
    const cardWidth = contentWidth;
    const topY = contentTop + marginY;
    const bottomY = topY + cardHeight + gap;

    drawLabeledImage(topImg, contentLeft, topY, cardWidth, cardHeight, labels[0] || 'ANTES');
    drawLabeledImage(bottomImg, contentLeft, bottomY, cardWidth, cardHeight, labels[1] || 'DEPOIS');
  } else if (templateId === 'timeline-summary') {
    const maxItems = Math.min(5, loadedImages.length);
    const itemWidth = contentWidth / maxItems - 16;
    const itemHeight = contentHeight * 0.8;
    const baseY = contentTop + (contentHeight - itemHeight) / 2;

    for (let i = 0; i < maxItems; i++) {
      const img = loadedImages[i];
      const label = labels[i] || `Sessão ${i + 1}`;
      const x = contentLeft + i * (itemWidth + 16);
      drawLabeledImage(img, x, baseY, itemWidth, itemHeight, label);
    }

    // Linha conectando centros (efeito timeline)
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const centerY = contentTop + contentHeight - 10;
    ctx.moveTo(contentLeft + 8, centerY);
    ctx.lineTo(contentRight - 8, centerY);
    ctx.stroke();
    ctx.restore();
  }

  return canvas;
}

/**
 * Gera preview do template clínico (PNG base64)
 */
export async function generateClinicTemplatePreview(
  params: ClinicTemplateParams
): Promise<string> {
  const canvas = await composeClinicTemplateCanvas(params);
  return canvas.toDataURL('image/png');
}

/**
 * Exporta template clínico em PNG ou JPG
 */
export async function exportClinicTemplate(
  params: ClinicTemplateParams,
  format: 'png' | 'jpg',
  downloadName: string
): Promise<void> {
  const canvas = await composeClinicTemplateCanvas(params);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'png' ? 1 : 0.95;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Erro ao gerar imagem do template'));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${downloadName}.${format === 'png' ? 'png' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    }, mime, quality);
  });
}

