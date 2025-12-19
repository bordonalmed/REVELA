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

    // Fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let currentY = padding;

    // Informações do projeto (topo)
    if (includeInfo) {
      ctx.fillStyle = '#1A2B32';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(projectName, canvasWidth / 2, currentY + 30);
      
      ctx.fillStyle = '#666666';
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
      if (includeLabels) {
        ctx.fillStyle = '#1A2B32';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ANTES', startX + beforeWidth / 2, imageY - 10);
      }

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
      if (includeLabels) {
        ctx.fillText('DEPOIS', startX + beforeWidth + spacing + afterWidth / 2, imageY - 10);
      }

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
      if (includeLabels) {
        ctx.fillStyle = '#1A2B32';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ANTES', canvasWidth / 2, currentY + 30);
      }

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
      if (includeLabels) {
        ctx.fillText('DEPOIS', canvasWidth / 2, currentY + 30);
      }

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

