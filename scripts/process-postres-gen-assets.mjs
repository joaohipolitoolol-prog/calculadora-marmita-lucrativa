/**
 * Processa assets gerados + monta kit-inside estilo Paletas (calculadora, menú, WhatsApp, receta).
 */
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, copyFileSync } from 'fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'public/postres');
const assetsDir = resolve(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor/projects/c-Users-Joaoh-Downloads-Marmita/assets'
);

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp required');
  process.exit(1);
}

async function toWebp(src, dest, width, quality = 86) {
  await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(dest);
  console.log('wrote', dest);
}

const heroGen = resolve(assetsDir, 'hero-variedad-postres-gen.png');
const kitGen = resolve(assetsDir, 'kit-inside-postres-gen.png');

if (existsSync(heroGen)) {
  await toWebp(heroGen, resolve(dir, 'hero-variedad-postres.webp'), 1200, 88);
  await sharp(heroGen).resize({ width: 1200 }).png().toFile(resolve(dir, 'hero-variedad-postres.png'));
}

if (existsSync(kitGen)) {
  await toWebp(kitGen, resolve(dir, 'kit-inside-cards.webp'), 1400, 88);
  await sharp(kitGen).resize({ width: 1400 }).png().toFile(resolve(dir, 'kit-inside-cards.png'));
}

// Kit inside premium: 4 cards como Paletas (calc + menu fotos + WA bubble + receta)
const W = 1400;
const H = 788;

const thumb = async (name, w, h) => {
  const buf = await sharp(resolve(dir, `${name}.png`))
    .resize(w, h, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
};

const tFresa = await thumb('postre-fresa', 220, 220);
const tOreo = await thumb('postre-oreo', 220, 220);
const tChoco = await thumb('postre-chocolate', 220, 220);
const tReceta = await thumb('postre-fresa', 280, 340);

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF7FB"/>
      <stop offset="0.5" stop-color="#FFE8F2"/>
      <stop offset="1" stop-color="#FFD6E8"/>
    </linearGradient>
    <filter id="shadow" x="-8%" y="-6%" width="116%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#2A1712" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="700" y="52" text-anchor="middle" fill="#EC3F7A" font-family="Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="3">KIT WHATSAPP</text>
  <text x="700" y="92" text-anchor="middle" fill="#2A1712" font-family="Arial, sans-serif" font-size="34" font-weight="800">Postres en Vaso</text>

  <!-- Card 1 Calculadora -->
  <g filter="url(#shadow)" transform="translate(40 120)">
    <rect width="310" height="560" rx="24" fill="#fff"/>
    <circle cx="36" cy="36" r="18" fill="#EC3F7A"/>
    <text x="36" y="42" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="800">1</text>
    <text x="64" y="42" fill="#EC3F7A" font-family="Arial" font-size="15" font-weight="800">CALCULADORA</text>
    <g font-family="Arial">
      <rect x="24" y="78" width="262" height="72" rx="14" fill="#FFF0F6"/>
      <text x="44" y="108" fill="#6D5550" font-size="13">Costo unitario</text>
      <text x="44" y="134" fill="#2A1712" font-size="22" font-weight="800">US$ 0,85</text>
      <rect x="24" y="162" width="262" height="72" rx="14" fill="#FFF0F6"/>
      <text x="44" y="192" fill="#6D5550" font-size="13">Precio de venta</text>
      <text x="44" y="218" fill="#2A1712" font-size="22" font-weight="800">US$ 1,80</text>
      <rect x="24" y="246" width="262" height="72" rx="14" fill="#FFF0F6"/>
      <text x="44" y="276" fill="#6D5550" font-size="13">Utilidad</text>
      <text x="44" y="302" fill="#EC3F7A" font-size="22" font-weight="800">US$ 0,95</text>
      <rect x="24" y="330" width="262" height="72" rx="14" fill="#FFF0F6"/>
      <text x="44" y="360" fill="#6D5550" font-size="13">Margen</text>
      <text x="44" y="386" fill="#2A1712" font-size="22" font-weight="800">52,8%</text>
    </g>
    <rect x="24" y="430" width="262" height="96" rx="16" fill="#FFF0F6"/>
    <text x="155" y="470" text-anchor="middle" fill="#D42E68" font-family="Arial" font-size="14" font-weight="800">Deja de cobrar a ojo</text>
    <text x="155" y="496" text-anchor="middle" fill="#6D5550" font-family="Arial" font-size="13">Sabe cuánto ganar por vaso</text>
  </g>

  <!-- Card 2 Menú -->
  <g filter="url(#shadow)" transform="translate(376 120)">
    <rect width="310" height="560" rx="24" fill="#fff"/>
    <circle cx="36" cy="36" r="18" fill="#EC3F7A"/>
    <text x="36" y="42" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="800">2</text>
    <text x="64" y="42" fill="#EC3F7A" font-family="Arial" font-size="15" font-weight="800">MENÚ WHATSAPP</text>
    <image href="${tFresa}" x="24" y="78" width="80" height="80" preserveAspectRatio="xMidYMid slice"/>
    <text x="118" y="110" fill="#2A1712" font-family="Arial" font-size="16" font-weight="800">Fresa</text>
    <text x="118" y="136" fill="#EC3F7A" font-family="Arial" font-size="15" font-weight="800">US$ 1,80</text>
    <image href="${tOreo}" x="24" y="178" width="80" height="80" preserveAspectRatio="xMidYMid slice"/>
    <text x="118" y="210" fill="#2A1712" font-family="Arial" font-size="16" font-weight="800">Oreo</text>
    <text x="118" y="236" fill="#EC3F7A" font-family="Arial" font-size="15" font-weight="800">US$ 2,00</text>
    <image href="${tChoco}" x="24" y="278" width="80" height="80" preserveAspectRatio="xMidYMid slice"/>
    <text x="118" y="310" fill="#2A1712" font-family="Arial" font-size="16" font-weight="800">Chocolate</text>
    <text x="118" y="336" fill="#EC3F7A" font-family="Arial" font-size="15" font-weight="800">US$ 2,20</text>
    <rect x="24" y="430" width="262" height="96" rx="16" fill="#FFF0F6"/>
    <text x="155" y="470" text-anchor="middle" fill="#D42E68" font-family="Arial" font-size="14" font-weight="800">Copia y publica hoy</text>
    <text x="155" y="496" text-anchor="middle" fill="#6D5550" font-family="Arial" font-size="13">Sabores y precios listos</text>
  </g>

  <!-- Card 3 Mensaje WhatsApp -->
  <g filter="url(#shadow)" transform="translate(712 120)">
    <rect width="310" height="560" rx="24" fill="#fff"/>
    <circle cx="36" cy="36" r="18" fill="#EC3F7A"/>
    <text x="36" y="42" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="800">3</text>
    <text x="64" y="42" fill="#EC3F7A" font-family="Arial" font-size="15" font-weight="800">MENSAJE WHATSAPP</text>
    <rect x="24" y="78" width="262" height="320" rx="18" fill="#E7F8EF"/>
    <rect x="40" y="98" width="230" height="270" rx="16" fill="#DCF8C6"/>
    <text x="55" y="130" fill="#075E54" font-family="Arial" font-size="13" font-weight="700">Postres en vaso 🍨</text>
    <text x="55" y="158" fill="#111B21" font-family="Arial" font-size="13">Hoy tengo:</text>
    <text x="55" y="186" fill="#111B21" font-family="Arial" font-size="13">✅ Fresa</text>
    <text x="55" y="210" fill="#111B21" font-family="Arial" font-size="13">✅ Oreo</text>
    <text x="55" y="234" fill="#111B21" font-family="Arial" font-size="13">✅ Chocolate</text>
    <text x="55" y="268" fill="#111B21" font-family="Arial" font-size="13">Escríbeme para pedir</text>
    <text x="55" y="292" fill="#111B21" font-family="Arial" font-size="13">o ver el menú completo 💕</text>
    <rect x="24" y="430" width="262" height="96" rx="16" fill="#FFF0F6"/>
    <text x="155" y="470" text-anchor="middle" fill="#D42E68" font-family="Arial" font-size="14" font-weight="800">Copia, pega y vende</text>
    <text x="155" y="496" text-anchor="middle" fill="#6D5550" font-family="Arial" font-size="13">Mensajes listos para WhatsApp</text>
  </g>

  <!-- Card 4 Receta -->
  <g filter="url(#shadow)" transform="translate(1048 120)">
    <rect width="310" height="560" rx="24" fill="#fff"/>
    <circle cx="36" cy="36" r="18" fill="#EC3F7A"/>
    <text x="36" y="42" text-anchor="middle" fill="#fff" font-family="Arial" font-size="16" font-weight="800">4</text>
    <text x="64" y="42" fill="#EC3F7A" font-family="Arial" font-size="15" font-weight="800">RECETA</text>
    <image href="${tReceta}" x="15" y="78" width="280" height="330" preserveAspectRatio="xMidYMid slice"/>
    <rect x="24" y="430" width="262" height="96" rx="16" fill="#FFF0F6"/>
    <text x="155" y="470" text-anchor="middle" fill="#D42E68" font-family="Arial" font-size="14" font-weight="800">Paso a paso</text>
    <text x="155" y="496" text-anchor="middle" fill="#6D5550" font-family="Arial" font-size="13">Sabores que se venden</text>
  </g>

  <rect x="40" y="710" width="1320" height="48" rx="16" fill="#FFF0F6"/>
  <text x="700" y="740" text-anchor="middle" fill="#D42E68" font-family="Arial" font-size="18" font-weight="800">Prepara, calcula, publica y vende postres en vaso por WhatsApp</text>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(resolve(dir, 'kit-inside-cards.png'));
await sharp(Buffer.from(svg))
  .webp({ quality: 88 })
  .toFile(resolve(dir, 'kit-inside-cards.webp'));
console.log('kit-inside-cards rebuilt');

// OG from hero
if (existsSync(resolve(dir, 'hero-variedad-postres.webp'))) {
  const heroBuf = await sharp(resolve(dir, 'hero-variedad-postres.webp'))
    .resize(560, 420, { fit: 'cover' })
    .png()
    .toBuffer();
  const rounded = await sharp(heroBuf)
    .composite([{
      input: Buffer.from(`<svg width="560" height="420"><rect width="560" height="420" rx="28" fill="#fff"/></svg>`),
      blend: 'dest-in',
    }])
    .png()
    .toBuffer();

  const ogSvg = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFF0F6"/>
        <stop offset="1" stop-color="#FFD0E2"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <text x="72" y="200" fill="#EC3F7A" font-family="Arial" font-size="26" font-weight="800" letter-spacing="2">KIT DIGITAL</text>
    <text x="72" y="270" fill="#2A1712" font-family="Arial" font-size="52" font-weight="800">Postres en Vaso</text>
    <text x="72" y="330" fill="#2A1712" font-family="Arial" font-size="52" font-weight="800">para WhatsApp</text>
    <text x="72" y="400" fill="#6D5550" font-family="Arial" font-size="24">Recetas · Calculadora · Menú · Mensajes</text>
    <rect x="72" y="440" width="260" height="52" rx="26" fill="#EC3F7A"/>
    <text x="202" y="474" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22" font-weight="800">US$ 5,97</text>
  </svg>`);

  await sharp(ogSvg)
    .composite([{ input: rounded, left: 580, top: 105 }])
    .webp({ quality: 88 })
    .toFile(resolve(dir, 'og-postres-whatsapp.webp'));
  console.log('og updated');
}

console.log('done');
