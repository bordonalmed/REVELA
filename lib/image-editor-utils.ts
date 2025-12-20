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
 * Baseada na função padrão da biblioteca
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

  // Definir tamanho do canvas para suportar rotação
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Traduzir para o centro do canvas
  ctx.translate(safeArea / 2, safeArea / 2);
  
  // Aplicar rotação
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  
  // Traduzir de volta e desenhar imagem
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Criar novo canvas para o crop
  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d');

  if (!outputCtx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  outputCanvas.width = pixelCrop.width;
  outputCanvas.height = pixelCrop.height;

  // Ajustar coordenadas de crop considerando a rotação
  const cropX = pixelCrop.x;
  const cropY = pixelCrop.y;

  outputCtx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - cropX),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - cropY)
  );

  return new Promise((resolve) => {
    outputCanvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Erro ao criar blob');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.95);
  });
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

