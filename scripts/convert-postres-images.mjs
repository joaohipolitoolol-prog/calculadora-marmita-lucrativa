import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '../public/postres');

const sizes = {
  'mockup-kit-postres': 800,
  'upsell-postres-premium': 800,
  'postre-fresa': 500,
  'postre-oreo': 500,
  'postre-chocolate': 500,
  'postre-maracuya': 500,
  'postre-dulce-leche': 500,
  'postre-cheesecake': 500,
};

const files = await readdir(dir);
const pngs = files.filter((f) => extname(f).toLowerCase() === '.png');

for (const file of pngs) {
  const base = basename(file, '.png');
  const max = sizes[base] ?? 700;
  const input = join(dir, file);
  const output = join(dir, `${base}.webp`);

  const meta = await sharp(input).metadata();
  const info = await sharp(input)
    .resize(max, max, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(output);

  console.log(`${file} -> ${base}.webp (${info.size} bytes, max ${max}px)`);
}

console.log(`Optimized ${pngs.length} images`);
