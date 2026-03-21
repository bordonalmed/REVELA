/**
 * Torna o fundo escuro do logo transparente (lê revela3-transparent.png, salva processado).
 * Uso: node scripts/make-logo-transparent.mjs
 */
import sharp from 'sharp';
import { existsSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const inputPath = path.join(root, 'public', 'revela3-transparent.png');
const outputPath = path.join(root, 'public', 'revela3-transparent-processed.png');
const finalPath = path.join(root, 'public', 'revela3-transparent.png');

const DARK_THRESHOLD = 55; // R,G,B abaixo disso = fundo escuro → transparente

async function main() {
  if (!existsSync(inputPath)) {
    console.error('Arquivo não encontrado:', inputPath);
    process.exit(1);
  }

  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const arr = new Uint8ClampedArray(data);

  for (let i = 0; i < arr.length; i += channels) {
    const r = arr[i];
    const g = arr[i + 1];
    const b = arr[i + 2];
    if (r <= DARK_THRESHOLD && g <= DARK_THRESHOLD && b <= DARK_THRESHOLD) {
      arr[i + 3] = 0; // alpha = transparente
    }
  }

  await sharp(arr, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  try {
    copyFileSync(outputPath, finalPath);
    console.log('Logo com fundo transparente aplicado em:', finalPath);
  } catch (e) {
    console.log('Versão com fundo transparente salva em:', outputPath);
    console.log('Use /revela3-transparent-processed.png no projeto ou substitua o arquivo quando nada estiver usando.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
