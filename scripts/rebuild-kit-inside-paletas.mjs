/**
 * Rebuild kit-inside banner for Paletas (same style as postres mini kit).
 */
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'public/paletas');
mkdirSync(dir, { recursive: true });

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp required: npm i -D sharp');
  process.exit(1);
}

function asset(...names) {
  for (const name of names) {
    const p = resolve(dir, name);
    if (existsSync(p)) return p;
  }
  throw new Error(`Missing asset: ${names.join(' | ')}`);
}

async function roundedJpeg(src, w, h, radius, position = 'attention') {
  const resized = await sharp(src)
    .resize(w, h, { fit: 'cover', position })
    .png()
    .toBuffer();

  const rounded = await sharp(resized)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  const jpeg = await sharp(rounded).jpeg({ quality: 90 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
}

const mango = asset('sabor-mango.webp', 'sabor-mango.png');
const choco = asset('sabor-chocolate.webp', 'sabor-chocolate.png');
const limon = asset('sabor-limon-coco.webp', 'sabor-limon-coco.png');
const hero = asset('hero-paletas-fresas.webp', 'hero-resultado-paletas.webp', 'preparacion-vasos.webp');

const W = 1400;
const H = 788;

const tMango = await roundedJpeg(mango, 80, 80, 14);
const tChoco = await roundedJpeg(choco, 80, 80, 14);
const tLimon = await roundedJpeg(limon, 80, 80, 14);
const tReceta = await roundedJpeg(hero, 280, 250, 18, 'centre');
const tSide1 = await roundedJpeg(mango, 120, 84, 12);
const tSide2 = await roundedJpeg(choco, 120, 84, 12);

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF7FB"/>
      <stop offset="0.55" stop-color="#FFE8F2"/>
      <stop offset="1" stop-color="#FFD6E8"/>
    </linearGradient>
    <filter id="shadow" x="-8%" y="-6%" width="116%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#2A1712" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="700" y="48" text-anchor="middle" fill="#E8437A" font-family="Arial, sans-serif" font-size="20" font-weight="800" letter-spacing="3">KIT DIGITAL</text>
  <text x="700" y="86" text-anchor="middle" fill="#2A1712" font-family="Arial, sans-serif" font-size="32" font-weight="800">2 Bases, Paletas</text>

  <!-- Card 1 Calculadora -->
  <g filter="url(#shadow)" transform="translate(40 110)">
    <rect width="310" height="560" rx="24" fill="#fff"/>
    <circle cx="36" cy="36" r="18" fill="#E8437A"/>
    <text x="36" y="42" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="800">1</text>
    <text x="64" y="42" fill="#E8437A" font-family="Arial" font-size="15" font-weight="800">CALCULADORA</text>
    <g font-family="Arial">
      <rect x="24" y="78" width="262" height="72" rx="14" fill="#FFF0F6"/>
      <text x="44" y="108" fill="#6D5550" font-size="13">Costo unitario</text>
      <text x="44" y="134" fill="#2A1712" font-size="22" font-weight="800">US$ 0,85</text>
      <rect x="24" y="162" width="262" height="72" rx="14" fill="#FFF0F6"/>
      <text x="44" y="192" fill="#6D5550" font-size="13">Precio de venta</text>
      <text x="44" y="218" fill="#2A1712" font-size="22" font-weight="800">US$ 2,50</text>
      <rect x="24" y="246" width="262" height="72" rx="14" fill="#FFF0F6"/>
      <text x="44" y="276" fill="#6D5550" font-size="13">Utilidad</text>
      <text x="44" y="302" fill="#E8437A" font-size="22" font-weight="800">US$ 1,65</text>
      <rect x="24" y="330" width="262" height="72" rx="14" fill="#FFF0F6"/>
      <text x="44" y="360" fill="#6D5550" font-size="13">Margen</text>
      <text x="44" y="386" fill="#2A1712" font-size="22" font-weight="800">66%</text>
    </g>
    <rect x="24" y="430" width="262" height="96" rx="16" fill="#FFF0F6"/>
    <text x="155" y="470" text-anchor="middle" fill="#C7376A" font-family="Arial" font-size="14" font-weight="800">Deja de cobrar a ojo</text>
    <text x="155" y="496" text-anchor="middle" fill="#6D5550" font-family="Arial" font-size="13">Sabe cuánto ganar por paleta</text>
  </g>

  <!-- Card 2 Menú -->
  <g filter="url(#shadow)" transform="translate(376 110)">
    <rect width="310" height="560" rx="24" fill="#fff"/>
    <circle cx="36" cy="36" r="18" fill="#E8437A"/>
    <text x="36" y="42" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="800">2</text>
    <text x="64" y="42" fill="#E8437A" font-family="Arial" font-size="15" font-weight="800">MENÚ WHATSAPP</text>
    <image href="${tMango}" x="24" y="78" width="80" height="80"/>
    <text x="118" y="110" fill="#2A1712" font-family="Arial" font-size="16" font-weight="800">Mango</text>
    <text x="118" y="136" fill="#E8437A" font-family="Arial" font-size="15" font-weight="800">US$ 2,50</text>
    <image href="${tChoco}" x="24" y="178" width="80" height="80"/>
    <text x="118" y="210" fill="#2A1712" font-family="Arial" font-size="16" font-weight="800">Chocolate</text>
    <text x="118" y="236" fill="#E8437A" font-family="Arial" font-size="15" font-weight="800">US$ 2,50</text>
    <image href="${tLimon}" x="24" y="278" width="80" height="80"/>
    <text x="118" y="310" fill="#2A1712" font-family="Arial" font-size="16" font-weight="800">Limón coco</text>
    <text x="118" y="336" fill="#E8437A" font-family="Arial" font-size="15" font-weight="800">US$ 2,50</text>
    <rect x="24" y="430" width="262" height="96" rx="16" fill="#FFF0F6"/>
    <text x="155" y="470" text-anchor="middle" fill="#C7376A" font-family="Arial" font-size="14" font-weight="800">Paletas caseras en vaso</text>
    <text x="155" y="496" text-anchor="middle" fill="#6D5550" font-family="Arial" font-size="13">Sabores y precios listos</text>
  </g>

  <!-- Card 3 Mensaje WhatsApp -->
  <g filter="url(#shadow)" transform="translate(712 110)">
    <rect width="310" height="560" rx="24" fill="#fff"/>
    <circle cx="36" cy="36" r="18" fill="#E8437A"/>
    <text x="36" y="42" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="800">3</text>
    <text x="64" y="42" fill="#E8437A" font-family="Arial" font-size="15" font-weight="800">MENSAJE WHATSAPP</text>
    <rect x="24" y="78" width="262" height="320" rx="18" fill="#E7F8EF"/>
    <rect x="40" y="98" width="230" height="270" rx="16" fill="#DCF8C6"/>
    <text x="55" y="130" fill="#075E54" font-family="Arial" font-size="13" font-weight="700">Paletas caseras 🍓</text>
    <text x="55" y="158" fill="#111B21" font-family="Arial" font-size="13">Hoy tengo:</text>
    <text x="55" y="186" fill="#111B21" font-family="Arial" font-size="13">✅ Mango</text>
    <text x="55" y="210" fill="#111B21" font-family="Arial" font-size="13">✅ Chocolate</text>
    <text x="55" y="234" fill="#111B21" font-family="Arial" font-size="13">✅ Limón coco</text>
    <text x="55" y="268" fill="#111B21" font-family="Arial" font-size="13">Escríbeme para pedir</text>
    <text x="55" y="292" fill="#111B21" font-family="Arial" font-size="13">o ver el menú completo</text>
    <rect x="24" y="430" width="262" height="96" rx="16" fill="#FFF0F6"/>
    <text x="155" y="470" text-anchor="middle" fill="#C7376A" font-family="Arial" font-size="14" font-weight="800">Copia, pega y vende</text>
    <text x="155" y="496" text-anchor="middle" fill="#6D5550" font-family="Arial" font-size="13">Mensajes listos para WhatsApp</text>
  </g>

  <!-- Card 4 Receta -->
  <g filter="url(#shadow)" transform="translate(1048 110)">
    <rect width="310" height="560" rx="24" fill="#fff"/>
    <circle cx="36" cy="36" r="18" fill="#E8437A"/>
    <text x="36" y="42" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="800">4</text>
    <text x="64" y="42" fill="#E8437A" font-family="Arial" font-size="15" font-weight="800">RECETA</text>
    <image href="${tReceta}" x="15" y="72" width="280" height="250"/>
    <image href="${tSide1}" x="24" y="334" width="120" height="84"/>
    <image href="${tSide2}" x="156" y="334" width="120" height="84"/>
    <rect x="24" y="430" width="262" height="96" rx="16" fill="#FFF0F6"/>
    <text x="155" y="470" text-anchor="middle" fill="#C7376A" font-family="Arial" font-size="14" font-weight="800">Paso a paso · 2 bases</text>
    <text x="155" y="496" text-anchor="middle" fill="#6D5550" font-family="Arial" font-size="13">Frutal + cremosa</text>
  </g>

  <rect x="40" y="700" width="1320" height="52" rx="16" fill="#E8437A"/>
  <text x="700" y="733" text-anchor="middle" fill="#fff" font-family="Arial" font-size="18" font-weight="800">Prepara fácil, ofrece más, vende paletas por WhatsApp</text>
</svg>`;

const pngPath = resolve(dir, 'kit-inside-cards.png');
const webpPath = resolve(dir, 'kit-inside-cards.webp');

await sharp(Buffer.from(svg)).png().toFile(pngPath);
await sharp(Buffer.from(svg)).webp({ quality: 90, effort: 5 }).toFile(webpPath);

console.log('rebuilt:', webpPath);
