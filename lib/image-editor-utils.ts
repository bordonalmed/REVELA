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
 * Função helper para obter imagem cortada do react-easy-crop
 * Implementação baseada na função oficial do react-easy-crop
 * Suporta rotação e crop corretamente
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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // Canvas para rotação
  const rotatedCanvas = document.createElement('canvas');
  const rotatedCtx = rotatedCanvas.getContext('2d');

  if (!rotatedCtx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  rotatedCanvas.width = safeArea;
  rotatedCanvas.height = safeArea;

  // Aplicar rotação
  rotatedCtx.translate(safeArea / 2, safeArea / 2);
  rotatedCtx.rotate((rotation * Math.PI) / 180);
  rotatedCtx.translate(-safeArea / 2, -safeArea / 2);
  rotatedCtx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  // Canvas final para crop
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Extrair a área cortada da imagem rotacionada
  ctx.drawImage(
    rotatedCanvas,
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

