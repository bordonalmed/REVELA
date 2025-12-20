/**
 * Utilitários para edição de imagens
 * Rotação e corte usando Canvas API
 */

/**
 * Cria uma imagem a partir de base64
 */
function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Rotaciona uma imagem
 */
export async function rotateImage(
  imageSrc: string,
  degrees: number
): Promise<string> {
  const img = await createImage(imageSrc);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  // Calcular novo tamanho após rotação
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  
  const newWidth = img.width * cos + img.height * sin;
  const newHeight = img.width * sin + img.height * cos;
  
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  // Centralizar e rotacionar
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Corta uma imagem baseado em área de pixels
 */
export async function cropImage(
  imageSrc: string,
  pixelCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  rotation: number = 0
): Promise<string> {
  const img = await createImage(imageSrc);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  // Se houver rotação, precisamos ajustar
  if (rotation !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    
    const rotatedWidth = img.width * cos + img.height * sin;
    const rotatedHeight = img.width * sin + img.height * cos;
    
    canvas.width = rotatedWidth;
    canvas.height = rotatedHeight;
    
    ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    
    // Agora cortar da imagem rotacionada
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    
    if (!croppedCtx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }
    
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;
    
    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    
    return croppedCanvas.toDataURL('image/jpeg', 0.95);
  } else {
    // Sem rotação, corte direto
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    
    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    
    return canvas.toDataURL('image/jpeg', 0.95);
  }
}

/**
 * Função helper para obter imagem cortada do react-image-crop
 * Suporta rotação e crop corretamente
 * Estratégia: primeiro cortar, depois rotacionar (mais simples e confiável)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  rotation: number = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  
  // Primeiro: fazer o crop na imagem original
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  // Validar e ajustar coordenadas do crop
  let cropX = Math.max(0, Math.floor(pixelCrop.x));
  let cropY = Math.max(0, Math.floor(pixelCrop.y));
  let cropWidth = Math.min(Math.floor(pixelCrop.width), image.width - cropX);
  let cropHeight = Math.min(Math.floor(pixelCrop.height), image.height - cropY);

  // Garantir que não ultrapasse os limites
  if (cropX + cropWidth > image.width) {
    cropWidth = image.width - cropX;
  }
  if (cropY + cropHeight > image.height) {
    cropHeight = image.height - cropY;
  }

  if (cropWidth <= 0 || cropHeight <= 0 || cropX < 0 || cropY < 0) {
    console.error('Área de crop inválida:', { cropX, cropY, cropWidth, cropHeight, imageWidth: image.width, imageHeight: image.height });
    throw new Error('Área de crop inválida');
  }

  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;

  // Fazer o crop
  croppedCtx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  // Se não há rotação, retornar o crop direto
  if (rotation === 0) {
    return croppedCanvas.toDataURL('image/jpeg', 0.95);
  }

  // Segundo: rotacionar a imagem cortada
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  
  const rotatedWidth = cropWidth * cos + cropHeight * sin;
  const rotatedHeight = cropWidth * sin + cropHeight * cos;

  const finalCanvas = document.createElement('canvas');
  const finalCtx = finalCanvas.getContext('2d');

  if (!finalCtx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  finalCanvas.width = rotatedWidth;
  finalCanvas.height = rotatedHeight;

  // Aplicar rotação
  finalCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
  finalCtx.rotate(rad);
  finalCtx.drawImage(croppedCanvas, -cropWidth / 2, -cropHeight / 2);

  return finalCanvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Aplica rotação e corte combinados
 */
export async function applyImageTransformations(
  imageSrc: string,
  rotation: number,
  pixelCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null
): Promise<string> {
  // Se não há crop, apenas rotacionar
  if (!pixelCrop) {
    if (rotation === 0) {
      return imageSrc;
    }
    return await rotateImage(imageSrc, rotation);
  }

  // Se há crop, usar função combinada
  return await getCroppedImg(imageSrc, pixelCrop, rotation);
}

