import type { Measurement } from './storage';

type ImageType = 'before' | 'after';

// Mantém as medidas presas à foto certa depois de reordenar/excluir fotos.
// Medidas de fotos que deixaram de existir são descartadas.
export function remapMeasurements(
  measurements: Measurement[] | undefined,
  oldImages: Record<ImageType, string[]>,
  newImages: Record<ImageType, string[]>
): Measurement[] | undefined {
  if (!measurements || measurements.length === 0) return measurements;
  const result: Measurement[] = [];
  for (const m of measurements) {
    const image = oldImages[m.imageType]?.[m.imageIndex];
    if (!image) continue;
    const newIndex = newImages[m.imageType].indexOf(image);
    if (newIndex < 0) continue;
    result.push(newIndex === m.imageIndex ? m : { ...m, imageIndex: newIndex });
  }
  return result;
}

function getImageSize(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Ao editar uma foto (recorte, rotação…), as medidas antigas deixam de bater com a imagem.
// Se o tamanho da foto mudou, descarta as medidas dela; se não mudou (ex.: só brilho), mantém.
export async function measurementsAfterImageEdit(
  measurements: Measurement[] | undefined,
  imageType: ImageType,
  imageIndex: number,
  oldImage: string,
  newImage: string
): Promise<Measurement[] | undefined> {
  if (!measurements?.some((m) => m.imageType === imageType && m.imageIndex === imageIndex)) {
    return measurements;
  }
  const [oldSize, newSize] = await Promise.all([getImageSize(oldImage), getImageSize(newImage)]);
  if (oldSize && newSize && oldSize.width === newSize.width && oldSize.height === newSize.height) {
    return measurements;
  }
  return measurements.filter((m) => !(m.imageType === imageType && m.imageIndex === imageIndex));
}

// Formata um comprimento em cm no padrão brasileiro (mm abaixo de 1 cm)
export function formatCm(cm: number): string {
  if (cm < 1) return `${(cm * 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm`;
  return `${cm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} cm`;
}
