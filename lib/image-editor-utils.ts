import { trNow as tr } from '@/lib/i18n/current';
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
  /** 'solid' = tarja preta (padrão); 'pixelate' = mosaico que borra o local escolhido */
  style?: 'solid' | 'pixelate';
}

/** Tamanho do bloco do mosaico (o mesmo na prévia e no resultado). */
export function pixelBlockSize(width: number, height: number): number {
  return Math.max(8, Math.round(Math.min(width, height) / 32));
}

/** Versão em mosaico da imagem inteira (usada nas tarjas de desfoque). */
export async function pixelateImage(imageSrc: string): Promise<string> {
  const img = await createImage(imageSrc);
  return pixelateCanvas(img).toDataURL('image/jpeg', 0.95);
}

function pixelateCanvas(img: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const W = img.width;
  const H = img.height;
  const block = pixelBlockSize(W, H);
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.ceil(W / block));
  small.height = Math.max(1, Math.ceil(H / block));
  const sctx = small.getContext('2d')!;
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(img, 0, 0, small.width, small.height);
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(small, 0, 0, small.width * block, small.height * block);
  return out;
}

/**
 * Brilho e contraste (-50 a +50). Mesma conta do filtro CSS usado na prévia:
 * brightness(b) e depois contrast(c).
 */
export async function adjustTones(imageSrc: string, brightness: number, contrast: number): Promise<string> {
  if (!brightness && !contrast) return imageSrc;
  const img = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = data.data;
  const b = 1 + brightness / 100;
  const c = 1 + contrast / 100;
  for (let i = 0; i < d.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      const v = (d[i + k] * b - 127.5) * c + 127.5;
      d[i + k] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
}

export function tonesCssFilter(brightness: number, contrast: number): string | undefined {
  if (!brightness && !contrast) return undefined;
  return `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100})`;
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
    throw new Error(tr('Não foi possível criar contexto do canvas', 'Could not create canvas context'));
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
    throw new Error(tr('Não foi possível criar contexto do canvas', 'Could not create canvas context'));
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
      throw new Error(tr('Não foi possível criar contexto do canvas', 'Could not create canvas context'));
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
    throw new Error(tr('Não foi possível criar contexto do canvas', 'Could not create canvas context'));
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
    throw new Error(tr('Área de crop inválida', 'Invalid crop area'));
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
    throw new Error(tr('Não foi possível criar contexto do canvas', 'Could not create canvas context'));
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
    throw new Error(tr('Não foi possível criar contexto do canvas', 'Could not create canvas context'));
  }

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = '#000000';
  const pixelated = masks.some((m) => m.style === 'pixelate') ? pixelateCanvas(img) : null;

  masks.forEach((mask) => {
    const x = mask.x * img.width;
    const y = mask.y * img.height;
    const w = mask.width * img.width;
    const h = mask.height * img.height;

    if (w <= 0 || h <= 0) return;

    if (mask.style === 'pixelate' && pixelated) {
      ctx.save();
      ctx.beginPath();
      if (mask.shape === 'circle') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      else ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(pixelated, 0, 0);
      ctx.restore();
      return;
    }

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
export type AnnotationStrokeColor = string; // 'black' | 'white' (antigos) ou cor hex

export const ANNOTATION_COLORS = ['#000000', '#ffffff', '#ef4444', '#facc15', '#22c55e', '#3b82f6'];

export function annotationColor(c: AnnotationStrokeColor): string {
  return c === 'white' ? '#ffffff' : c === 'black' ? '#000000' : c;
}

/** Seta ou círculo/elipse (coordenadas 0–1 da imagem) */
export interface AnnotationShape {
  id: string;
  kind: 'arrow' | 'ellipse';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: AnnotationStrokeColor;
  widthRel: number;
}

/** Pontas da seta (em pixels) — usado na prévia e no resultado */
export function arrowHeadPoints(x1: number, y1: number, x2: number, y2: number, lineWidth: number): [number, number, number, number] {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.max(12, lineWidth * 4.5);
  const a1 = ang + Math.PI - Math.PI / 7;
  const a2 = ang + Math.PI + Math.PI / 7;
  return [x2 + len * Math.cos(a1), y2 + len * Math.sin(a1), x2 + len * Math.cos(a2), y2 + len * Math.sin(a2)];
}

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
  textBoxes: AnnotationTextBox[],
  shapes: AnnotationShape[] = []
): Promise<string> {
  if (!strokes.length && !textBoxes.length && !shapes.length) {
    return imageSrc;
  }

  const img = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error(tr('Não foi possível criar contexto do canvas', 'Could not create canvas context'));
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const minDim = Math.min(img.width, img.height);

  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    if (stroke.points.length === 1) {
      // Toque único: vira um ponto (como aparece na prévia)
      const p = stroke.points[0];
      ctx.fillStyle = annotationColor(stroke.color);
      ctx.beginPath();
      ctx.arc(p.x * img.width, p.y * img.height, Math.max(1, stroke.widthRel * minDim) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.strokeStyle = annotationColor(stroke.color);
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

  for (const sh of shapes) {
    const lw = Math.max(1, sh.widthRel * minDim);
    ctx.strokeStyle = annotationColor(sh.color);
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const x1 = sh.x1 * img.width;
    const y1 = sh.y1 * img.height;
    const x2 = sh.x2 * img.width;
    const y2 = sh.y2 * img.height;
    ctx.beginPath();
    if (sh.kind === 'ellipse') {
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, Math.PI * 2);
    } else {
      const [hx1, hy1, hx2, hy2] = arrowHeadPoints(x1, y1, x2, y2, lw);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.moveTo(hx1, hy1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(hx2, hy2);
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
    void bh; // a caixa cresce com o texto: nenhuma linha é cortada
    for (const line of lines) {
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
