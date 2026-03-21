/**
 * Utilitários para edição de imagens
 * Rotação e corte usando Canvas API
 */

/**
 * Cria uma imagem a partir de base64
 */
export function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export type PrivacyMaskShape = 'rect' | 'circle';

export interface PrivacyMask {
  // Coordenadas em fração relativa à largura/altura da imagem final (0–1)
  x: number;
  y: number;
  width: number;
  height: number;
  shape: PrivacyMaskShape;
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
  } | null,
  masks: PrivacyMask[] = []
): Promise<string> {
  // 1) Aplicar crop/rotação como antes
  let baseImage: string;

  if (!pixelCrop) {
    if (rotation === 0) {
      baseImage = imageSrc;
    } else {
      baseImage = await rotateImage(imageSrc, rotation);
    }
  } else {
    baseImage = await getCroppedImg(imageSrc, pixelCrop, rotation);
  }

  // 2) Aplicar tarjas de privacidade, se houver
  if (!masks.length) {
    return baseImage;
  }

  const img = await createImage(baseImage);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = '#000000';

  masks.forEach((mask) => {
    const x = mask.x * img.width;
    const y = mask.y * img.height;
    const w = mask.width * img.width;
    const h = mask.height * img.height;

    if (w <= 0 || h <= 0) return;

    if (mask.shape === 'circle') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rx = w / 2;
      const ry = h / 2;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
  });

  return canvas.toDataURL('image/jpeg', 0.95);
}

/** Cor do traço (lápis) nas anotações clínicas Premium */
export type AnnotationStrokeColor = 'black' | 'white';

/** Traço livre em coordenadas normalizadas 0–1 sobre a imagem fonte (antes do crop/rotação) */
export interface AnnotationStroke {
  points: { x: number; y: number }[];
  color: AnnotationStrokeColor;
  /** Espessura relativa a min(largura, altura) da imagem em pixels (ex.: 0.003) */
  widthRel: number;
}

/** Caixa de texto em coordenadas normalizadas 0–1 sobre a imagem fonte */
export interface AnnotationTextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

function wrapTextForCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        if (ctx.measureText(word).width > maxWidth) {
          let chunk = '';
          for (const ch of word) {
            const t = chunk + ch;
            if (ctx.measureText(t).width <= maxWidth) chunk = t;
            else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [' '];
}

/**
 * Desenha anotações (lápis + textos) sobre a imagem fonte inteira.
 * Deve ser chamado **antes** de `applyImageTransformations` para que crop/rotação/tarjas se apliquem depois.
 */
export async function rasterizeClinicalAnnotationsOnSource(
  imageSrc: string,
  strokes: AnnotationStroke[],
  textBoxes: AnnotationTextBox[]
): Promise<string> {
  if (!strokes.length && !textBoxes.length) {
    return imageSrc;
  }

  const img = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const minDim = Math.min(img.width, img.height);

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.strokeStyle = stroke.color === 'white' ? '#ffffff' : '#000000';
    ctx.lineWidth = Math.max(1, stroke.widthRel * minDim);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const p0 = stroke.points[0];
    ctx.moveTo(p0.x * img.width, p0.y * img.height);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = stroke.points[i];
      ctx.lineTo(p.x * img.width, p.y * img.height);
    }
    ctx.stroke();
  }

  const fontBase = Math.max(14, minDim * 0.028);
  ctx.textBaseline = 'top';

  for (const box of textBoxes) {
    const bx = box.x * img.width;
    const by = box.y * img.height;
    const bw = Math.max(48, box.width * img.width);
    const bh = Math.max(32, box.height * img.height);
    const pad = 6;
    ctx.font = `${fontBase}px sans-serif`;
    const lines = wrapTextForCanvas(ctx, (box.text || ' ').trim() || ' ', bw - pad * 2);
    let ty = by + pad;
    for (const line of lines) {
      if (ty + fontBase > by + bh) break;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(2, fontBase * 0.12);
      ctx.lineJoin = 'round';
      ctx.strokeText(line, bx + pad, ty);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, bx + pad, ty);
      ty += fontBase * 1.28;
    }
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}
