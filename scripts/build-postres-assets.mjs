/**
 * Gera assets premium da LP Postres a partir dos PNG masters.
 * - WebPs nítidos
 * - Hero variedade (colagem landscape)
 * - Banner "qué recibes" (kit inside)
 * - OG image
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'public/postres');
mkdirSync(dir, { recursive: true });

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp required: npm i -D sharp');
  process.exit(1);
}

const flavors = [
  'postre-fresa',
  'postre-oreo',
  'postre-chocolate',
  'postre-maracuya',
  'postre-dulce-leche',
  'postre-cheesecake',
];

async function exportWebp(name, width = 900, quality = 84) {
  const src = resolve(dir, `${name}.png`);
  const out = resolve(dir, `${name}.webp`);
  await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(out);
  console.log(`webp ${name}`);
}

async function buildHeroVariety() {
  const W = 1200;
  const H = 800;
  const cardW = 340;
  const cardH = 520;
  const gap = 28;
  const total = cardW * 3 + gap * 2;
  const startX = Math.round((W - total) / 2);
  const y = Math.round((H - cardH) / 2) + 20;

  const picks = ['postre-fresa', 'postre-oreo', 'postre-chocolate'];
  const layers = [];

  for (let i = 0; i < picks.length; i++) {
    const buf = await sharp(resolve(dir, `${picks[i]}.png`))
      .resize(cardW, cardH, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();
    layers.push({
      input: buf,
      left: startX + i * (cardW + gap),
      top: y,
    });
  }

  const bg = await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r: 255, g: 232, b: 240 },
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="g1" cx="85%" cy="10%" r="45%">
                <stop offset="0" stop-color="#EC3F7A" stop-opacity="0.18"/>
                <stop offset="1" stop-color="#EC3F7A" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="g2" cx="10%" cy="90%" r="40%">
                <stop offset="0" stop-color="#F04468" stop-opacity="0.14"/>
                <stop offset="1" stop-color="#F04468" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="#FFE8F0"/>
            <rect width="100%" height="100%" fill="url(#g1)"/>
            <rect width="100%" height="100%" fill="url(#g2)"/>
          </svg>
        `),
        top: 0,
        left: 0,
      },
      ...layers.map((l, i) => {
        // rounded mask via SVG overlay frame
        return l;
      }),
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  // Re-composite with rounded corners using SVG masks
  const roundedLayers = [];
  for (let i = 0; i < picks.length; i++) {
    const x = startX + i * (cardW + gap);
    const img = await sharp(resolve(dir, `${picks[i]}.png`))
      .resize(cardW, cardH, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();

    const rounded = await sharp(img)
      .composite([
        {
          input: Buffer.from(`
            <svg width="${cardW}" height="${cardH}">
              <rect width="${cardW}" height="${cardH}" rx="28" ry="28" fill="#fff"/>
            </svg>
          `),
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();

    roundedLayers.push({ input: rounded, left: x, top: y });
  }

  await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r: 255, g: 232, b: 240 },
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="g1" cx="85%" cy="10%" r="45%">
                <stop offset="0" stop-color="#EC3F7A" stop-opacity="0.2"/>
                <stop offset="1" stop-color="#EC3F7A" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="g2" cx="12%" cy="88%" r="42%">
                <stop offset="0" stop-color="#F04468" stop-opacity="0.16"/>
                <stop offset="1" stop-color="#F04468" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="#FFE8F0"/>
            <rect width="100%" height="100%" fill="url(#g1)"/>
            <rect width="100%" height="100%" fill="url(#g2)"/>
          </svg>
        `),
      },
      ...roundedLayers,
    ])
    .webp({ quality: 86, effort: 5 })
    .toFile(resolve(dir, 'hero-variedad-postres.webp'));

  console.log('hero-variedad-postres.webp');
  void bg;
}

async function buildKitInside() {
  const W = 1200;
  const H = 675;

  const thumbNames = ['postre-fresa', 'postre-oreo', 'postre-chocolate', 'postre-cheesecake'];
  const thumbs = [];
  for (const name of thumbNames) {
    const buf = await sharp(resolve(dir, `${name}.png`))
      .resize(200, 240, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toBuffer();
    thumbs.push(`data:image/jpeg;base64,${buf.toString('base64')}`);
  }

  const cards = [
    { title: 'CALCULADORA', sub: 'Costo, precio y margen por vaso', tip: 'Deja de cobrar a ojo', img: thumbs[0], n: '1' },
    { title: 'MENÚ WHATSAPP', sub: 'Sabores y precios listos', tip: 'Copia y publica hoy', img: thumbs[1], n: '2' },
    { title: 'MENSAJES', sub: 'Textos para estados y clientes', tip: 'Vende sin improvisar', img: thumbs[2], n: '3' },
    { title: 'RECETAS', sub: 'Postres en vaso paso a paso', tip: 'Sabores que se venden', img: thumbs[3], n: '4' },
  ];

  const cardW = 250;
  const gap = 18;
  const total = cardW * 4 + gap * 3;
  const startX = Math.round((W - total) / 2);

  const cardSvgs = cards
    .map((c, i) => {
      const x = startX + i * (cardW + gap);
      return `
      <g transform="translate(${x} 118)">
        <rect width="${cardW}" height="470" rx="22" fill="#FFFFFF" stroke="#F6C9D8" stroke-width="1.5"/>
        <circle cx="28" cy="28" r="16" fill="#EC3F7A"/>
        <text x="28" y="34" text-anchor="middle" fill="#fff" font-family="Nunito, Arial, sans-serif" font-size="15" font-weight="800">${c.n}</text>
        <text x="54" y="34" fill="#EC3F7A" font-family="Nunito, Arial, sans-serif" font-size="13" font-weight="800">${c.title}</text>
        <image href="${c.img}" x="25" y="56" width="200" height="240" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round 16px)"/>
        <rect x="25" y="56" width="200" height="240" rx="16" fill="none" stroke="#F6C9D8"/>
        <text x="125" y="330" text-anchor="middle" fill="#2A1712" font-family="Nunito, Arial, sans-serif" font-size="15" font-weight="800">${c.sub.split(' ').slice(0, 3).join(' ')}</text>
        <text x="125" y="352" text-anchor="middle" fill="#6D5550" font-family="Nunito, Arial, sans-serif" font-size="13">${c.sub.split(' ').slice(3).join(' ') || ' '}</text>
        <rect x="28" y="380" width="194" height="54" rx="14" fill="#FFF0F6"/>
        <text x="125" y="412" text-anchor="middle" fill="#D42E68" font-family="Nunito, Arial, sans-serif" font-size="13" font-weight="800">${c.tip}</text>
      </g>`;
    })
    .join('');

  const svg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFF7FB"/>
        <stop offset="1" stop-color="#FFE0EC"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="28" fill="url(#bg)"/>
    <text x="600" y="48" text-anchor="middle" fill="#EC3F7A" font-family="Nunito, Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="2">KIT WHATSAPP</text>
    <text x="600" y="82" text-anchor="middle" fill="#2A1712" font-family="Nunito, Arial, sans-serif" font-size="28" font-weight="800">Postres en Vaso</text>
    ${cardSvgs}
    <rect x="40" y="610" width="1120" height="42" rx="14" fill="#FFF0F6"/>
    <text x="600" y="637" text-anchor="middle" fill="#D42E68" font-family="Nunito, Arial, sans-serif" font-size="16" font-weight="800">Prepara, calcula, publica y vende por WhatsApp</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png({ quality: 90 })
    .toFile(resolve(dir, 'kit-inside-cards.png'));

  await sharp(Buffer.from(svg))
    .webp({ quality: 86 })
    .toFile(resolve(dir, 'kit-inside-cards.webp'));

  console.log('kit-inside-cards.png / .webp');
}

async function buildOg() {
  const W = 1200;
  const H = 630;
  const hero = await sharp(resolve(dir, 'postre-fresa.png'))
    .resize(520, 520, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const rounded = await sharp(hero)
    .composite([
      {
        input: Buffer.from(`
          <svg width="520" height="520"><rect width="520" height="520" rx="36" fill="#fff"/></svg>
        `),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  const svgText = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFF0F6"/>
          <stop offset="1" stop-color="#FFD0E2"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="72" y="210" fill="#EC3F7A" font-family="Nunito, Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="2">KIT DIGITAL</text>
      <text x="72" y="280" fill="#2A1712" font-family="Nunito, Arial, sans-serif" font-size="54" font-weight="800">Postres en Vaso</text>
      <text x="72" y="340" fill="#2A1712" font-family="Nunito, Arial, sans-serif" font-size="54" font-weight="800">para WhatsApp</text>
      <text x="72" y="410" fill="#6D5550" font-family="Nunito, Arial, sans-serif" font-size="26">Recetas · Calculadora · Menú · Mensajes</text>
      <rect x="72" y="450" width="280" height="54" rx="27" fill="#EC3F7A"/>
      <text x="212" y="485" text-anchor="middle" fill="#fff" font-family="Nunito, Arial, sans-serif" font-size="22" font-weight="800">US$ 6,97</text>
    </svg>
  `);

  await sharp(svgText)
    .composite([{ input: rounded, left: 620, top: 55 }])
    .webp({ quality: 88 })
    .toFile(resolve(dir, 'og-postres-whatsapp.webp'));

  console.log('og-postres-whatsapp.webp');
}

for (const name of flavors) {
  await exportWebp(name, 900, 84);
}
await exportWebp('upsell-postres-premium', 1000, 84);
await buildHeroVariety();
await buildKitInside();
await buildOg();
console.log('done');
