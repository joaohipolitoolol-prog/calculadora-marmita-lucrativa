import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logoMarkFaviconDoc, logoMaskableSvg } from '../src/brand/logo-mark.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'public');
const iconsDir = resolve(publicDir, 'icons');

mkdirSync(iconsDir, { recursive: true });

writeFileSync(resolve(publicDir, 'favicon.svg'), logoMarkFaviconDoc());
writeFileSync(resolve(iconsDir, 'icon-maskable.svg'), logoMaskableSvg({ size: 512, markScale: 1 }));

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('sharp not installed — SVG icons written; run: npm i -D sharp && npm run icons');
  process.exit(0);
}

const anySvg = logoMaskableSvg({ size: 512, markScale: 1 });
const maskableSvg = logoMaskableSvg({ size: 512, markScale: 0.78 });

const sizes = [
  { name: 'icon-192.png', size: 192, svg: anySvg },
  { name: 'icon-512.png', size: 512, svg: anySvg },
  { name: 'icon-maskable-512.png', size: 512, svg: maskableSvg },
  { name: 'apple-touch-icon.png', size: 180, svg: anySvg },
];

for (const { name, size, svg } of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(resolve(iconsDir, name));
  console.log(`wrote icons/${name}`);
}
