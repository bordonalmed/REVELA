/**
 * Utilitários para exportação de projetos
 * Gera imagens de comparação e PDFs
 */

'use client';

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
    img.src = window.location.origin + '/revela3.png';
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
    // Carregar ambas as imagens e o logo
    const [beforeImg, afterImg, logoImg] = await Promise.all([
      loadImageFromBase64(beforeImage),
      loadImageFromBase64(afterImage),
      loadLogo(),
    ]);

    // Calcular dimensões
    const maxWidth = 1920;
    const maxHeight = 1080;
    const padding = 40;
    const labelHeight = includeLabels ? 60 : 0;
    const infoHeight = includeInfo ? 80 : 0;
    const logoSize = 40; // Tamanho do logo (pequeno para cantos)
    const logoCornerPadding = 10; // Espaçamento do logo dos cantos
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
      if (logoImg.width > 0 && logoImg.height > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayHeight = logoSize;
        const logoDisplayWidth = logoDisplayHeight * logoAspect;
        const logoX = startX + beforeWidth - logoDisplayWidth - logoCornerPadding;
        const logoY = imageY + beforeHeight - logoDisplayHeight - logoCornerPadding;
        
        // Logo com opacidade reduzida para ser sutil (marca d'água)
        ctx.globalAlpha = 0.3;
        ctx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;
      }

      // Imagem Depois
      ctx.drawImage(afterImg, startX + beforeWidth + spacing, imageY, afterWidth, afterHeight);
      // Labels "ANTES" e "DEPOIS" removidos conforme solicitado

      // Logo no canto inferior direito da imagem DEPOIS
      if (logoImg.width > 0 && logoImg.height > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayHeight = logoSize;
        const logoDisplayWidth = logoDisplayHeight * logoAspect;
        const logoX = startX + beforeWidth + spacing + afterWidth - logoDisplayWidth - logoCornerPadding;
        const logoY = imageY + afterHeight - logoDisplayHeight - logoCornerPadding;
        
        // Logo com opacidade reduzida para ser sutil (marca d'água)
        ctx.globalAlpha = 0.3;
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
      if (logoImg.width > 0 && logoImg.height > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayHeight = logoSize;
        const logoDisplayWidth = logoDisplayHeight * logoAspect;
        const logoX = imageX + beforeWidth - logoDisplayWidth - logoCornerPadding;
        const logoY = beforeImageY + beforeHeight - logoDisplayHeight - logoCornerPadding;
        
        // Logo com opacidade reduzida para ser sutil (marca d'água)
        ctx.globalAlpha = 0.3;
        ctx.drawImage(logoImg, logoX, logoY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;
      }

      currentY += beforeHeight + labelHeight + spacing;
      const afterImageY = currentY + labelHeight;

      // Imagem Depois
      ctx.drawImage(afterImg, imageX, afterImageY, afterWidth, afterHeight);
      // Labels "ANTES" e "DEPOIS" removidos conforme solicitado

      // Logo no canto inferior direito da imagem DEPOIS
      if (logoImg.width > 0 && logoImg.height > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayHeight = logoSize;
        const logoDisplayWidth = logoDisplayHeight * logoAspect;
        const logoX = imageX + afterWidth - logoDisplayWidth - logoCornerPadding;
        const logoY = afterImageY + afterHeight - logoDisplayHeight - logoCornerPadding;
        
        // Logo com opacidade reduzida para ser sutil (marca d'água)
        ctx.globalAlpha = 0.3;
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
    // Carregar imagens
    const [beforeImg, afterImg, logoImg] = await Promise.all([
      loadImageFromBase64(beforeImage),
      loadImageFromBase64(afterImage),
      includeLogo ? loadLogo() : Promise.resolve(new Image()),
    ]);

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
    const logoSize = 30;
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
      if (includeLogo && logoImg.width > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayHeight = logoSize;
        const logoDisplayWidth = logoDisplayHeight * logoAspect;
        const logoX = formatSpec.width - logoDisplayWidth - logoPadding;
        const logoY = formatSpec.height - logoDisplayHeight - logoPadding;
        
        beforeCtx.globalAlpha = 0.3;
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
      if (includeLogo && logoImg.width > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayHeight = logoSize;
        const logoDisplayWidth = logoDisplayHeight * logoAspect;
        const logoX = formatSpec.width - logoDisplayWidth - logoPadding;
        const logoY = formatSpec.height - logoDisplayHeight - logoPadding;
        
        afterCtx.globalAlpha = 0.3;
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
      if (includeLogo && logoImg.width > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayHeight = logoSize;
        const logoDisplayWidth = logoDisplayHeight * logoAspect;

        // Logo na imagem ANTES
        const logoBeforeX = startX + beforeWidth - logoDisplayWidth - logoPadding;
        const logoBeforeY = startY + beforeHeight - logoDisplayHeight - logoPadding;
        ctx.globalAlpha = 0.3;
        ctx.drawImage(logoImg, logoBeforeX, logoBeforeY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;

        // Logo na imagem DEPOIS
        const logoAfterX = startX + beforeWidth + spacing + afterWidth - logoDisplayWidth - logoPadding;
        const logoAfterY = startY + afterHeight - logoDisplayHeight - logoPadding;
        ctx.globalAlpha = 0.3;
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
      if (includeLogo && logoImg.width > 0) {
        const logoAspect = logoImg.width / logoImg.height;
        const logoDisplayHeight = logoSize;
        const logoDisplayWidth = logoDisplayHeight * logoAspect;

        // Logo na imagem ANTES
        const logoBeforeX = startX + beforeWidth - logoDisplayWidth - logoPadding;
        const logoBeforeY = beforeY + beforeHeight - logoDisplayHeight - logoPadding;
        ctx.globalAlpha = 0.3;
        ctx.drawImage(logoImg, logoBeforeX, logoBeforeY, logoDisplayWidth, logoDisplayHeight);
        ctx.globalAlpha = 1.0;

        // Logo na imagem DEPOIS
        const logoAfterX = startX + afterWidth - logoDisplayWidth - logoPadding;
        const logoAfterY = afterY + afterHeight - logoDisplayHeight - logoPadding;
        ctx.globalAlpha = 0.3;
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
  const [beforeImg, afterImg, logoImg] = await Promise.all([
    loadImageFromBase64(beforeImage),
    loadImageFromBase64(afterImage),
    loadLogo(),
  ]);

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
  const logoSize = 30;
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

