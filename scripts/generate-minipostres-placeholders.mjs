/**
 * Generate simple SVG placeholders for Mini Postres flavors / hero / poster.
 * Run: node scripts/generate-minipostres-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'minipostres');

const flavors = [
  { id: 'tarta-alemana', label: 'Tarta alemana', c1: '#4A2B25', c2: '#C9854B', c3: '#F2DFC8' },
  { id: 'fresa', label: 'Fresa cremosa', c1: '#D94F70', c2: '#FFF8F2', c3: '#B92F4B' },
  { id: 'limon', label: 'Limón', c1: '#E8D44D', c2: '#FFF8F2', c3: '#C9854B' },
  { id: 'oreo', label: 'Oreo', c1: '#2F2725', c2: '#F2DFC8', c3: '#4A2B25' },
  { id: 'chocolate', label: 'Chocolate', c1: '#4A2B25', c2: '#6B3F36', c3: '#C9854B' },
  { id: 'maracuya', label: 'Maracuyá', c1: '#E8A317', c2: '#FFF8F2', c3: '#C9854B' },
  { id: 'dulce-leche', label: 'Dulce de leche', c1: '#C9854B', c2: '#F2DFC8', c3: '#8B5A2B' },
  { id: 'coco', label: 'Coco', c1: '#F2DFC8', c2: '#FFFFFF', c3: '#C9854B' },
  { id: 'cafe', label: 'Café', c1: '#6B4226', c2: '#F2DFC8', c3: '#4A2B25' },
  { id: 'tres-leches', label: 'Tres leches', c1: '#FFF8F2', c2: '#F2DFC8', c3: '#D94F70' },
  { id: 'banoffee', label: 'Banoffee', c1: '#E8C547', c2: '#C9854B', c3: '#F2DFC8' },
  { id: 'cheesecake', label: 'Cheesecake', c1: '#F2DFC8', c2: '#D94F70', c3: '#FFF8F2' },
];

function cupSvg({ label, c1, c2, c3, w = 640, h = 640 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF8F2"/>
      <stop offset="100%" stop-color="#F2DFC8"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="${w * 0.28}" y="${h * 0.22}" width="${w * 0.44}" height="${h * 0.58}" rx="18" fill="#FFFFFF" stroke="#E8D5C4" stroke-width="3"/>
  <rect x="${w * 0.3}" y="${h * 0.58}" width="${w * 0.4}" height="${h * 0.18}" fill="${c1}"/>
  <rect x="${w * 0.3}" y="${h * 0.42}" width="${w * 0.4}" height="${h * 0.16}" fill="${c2}"/>
  <rect x="${w * 0.3}" y="${h * 0.28}" width="${w * 0.4}" height="${h * 0.14}" fill="${c3}"/>
  <circle cx="${w * 0.5}" cy="${h * 0.26}" r="${h * 0.045}" fill="${c1}"/>
  <text x="50%" y="92%" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#2F2725">${label}</text>
</svg>`;
}

function heroSvg() {
  const cups = flavors.slice(0, 8);
  const cols = 4;
  const cell = 200;
  const pad = 24;
  const w = cols * cell + pad * 2;
  const h = 2 * cell + pad * 2 + 40;
  const items = cups
    .map((f, i) => {
      const x = pad + (i % cols) * cell;
      const y = pad + Math.floor(i / cols) * cell;
      return `<g transform="translate(${x},${y})">
        <rect width="180" height="180" rx="20" fill="#FFF" stroke="#E8D5C4"/>
        <rect x="50" y="40" width="80" height="110" rx="10" fill="#FFFFFF" stroke="#E8D5C4"/>
        <rect x="54" y="110" width="72" height="34" fill="${f.c1}"/>
        <rect x="54" y="80" width="72" height="30" fill="${f.c2}"/>
        <rect x="54" y="52" width="72" height="28" fill="${f.c3}"/>
        <text x="90" y="170" text-anchor="middle" font-size="12" fill="#6E5D59" font-family="system-ui">${f.label}</text>
      </g>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#FFF8F2"/>
  ${items}
  <text x="50%" y="${h - 12}" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#4A2B25">Mini postres fríos · placeholder</text>
</svg>`;
}

function posterSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF8F2"/>
      <stop offset="100%" stop-color="#F2DFC8"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#p)"/>
  <circle cx="320" cy="360" r="120" fill="#D94F70" opacity="0.85"/>
  <circle cx="520" cy="300" r="90" fill="#4A2B25" opacity="0.9"/>
  <circle cx="700" cy="400" r="100" fill="#C9854B" opacity="0.9"/>
  <circle cx="900" cy="320" r="85" fill="#B92F4B" opacity="0.85"/>
  <circle cx="640" cy="360" r="54" fill="#FFFFFF" opacity="0.95"/>
  <polygon points="625,330 675,360 625,390" fill="#D94F70"/>
  <text x="640" y="620" text-anchor="middle" font-family="Georgia, serif" font-size="48" fill="#2F2725">3 bases. 12 sabores.</text>
  <text x="640" y="670" text-anchor="middle" font-family="system-ui" font-size="22" fill="#6E5D59">Mini Postres Fríos Sin Horno</text>
</svg>`;
}

function mockupSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <rect width="900" height="700" fill="#FFF8F2"/>
  <rect x="80" y="80" width="280" height="520" rx="36" fill="#2F2725"/>
  <rect x="98" y="110" width="244" height="440" rx="12" fill="#FFF8F2"/>
  <text x="220" y="160" text-anchor="middle" font-family="system-ui" font-size="18" fill="#D94F70">Mini Postres</text>
  <rect x="120" y="190" width="200" height="80" rx="12" fill="#F2DFC8"/>
  <rect x="120" y="290" width="200" height="80" rx="12" fill="#F2DFC8"/>
  <rect x="120" y="390" width="200" height="80" rx="12" fill="#F2DFC8"/>
  <rect x="420" y="120" width="180" height="240" rx="12" fill="#FFFFFF" stroke="#E8D5C4"/>
  <text x="510" y="250" text-anchor="middle" font-size="16" fill="#4A2B25">PDF</text>
  <rect x="620" y="120" width="180" height="240" rx="12" fill="#FFFFFF" stroke="#E8D5C4"/>
  <text x="710" y="250" text-anchor="middle" font-size="16" fill="#4A2B25">Catálogo</text>
  <rect x="420" y="390" width="380" height="180" rx="12" fill="#FFFFFF" stroke="#E8D5C4"/>
  <text x="610" y="490" text-anchor="middle" font-size="16" fill="#4A2B25">Calculadora · Lista · Guías</text>
</svg>`;
}

function ogSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FFF8F2"/>
  <text x="80" y="260" font-family="Georgia, serif" font-size="64" fill="#2F2725">Mini Postres Fríos</text>
  <text x="80" y="340" font-family="Georgia, serif" font-size="64" fill="#D94F70">Sin Horno</text>
  <text x="80" y="420" font-family="system-ui" font-size="28" fill="#6E5D59">3 bases · 12 sabores · Vender por WhatsApp</text>
</svg>`;
}

const dirs = ['hero', 'flavors', 'mockups', 'proofs', 'icons', 'video'];
for (const d of dirs) mkdirSync(join(root, d), { recursive: true });

for (const f of flavors) {
  writeFileSync(join(root, 'flavors', `${f.id}.svg`), cupSvg(f));
}
writeFileSync(join(root, 'hero', 'hero-composition.svg'), heroSvg());
writeFileSync(join(root, 'video', 'vsl-poster.svg'), posterSvg());
writeFileSync(join(root, 'mockups', 'product-stack.svg'), mockupSvg());
writeFileSync(join(root, 'og-minipostres.svg'), ogSvg());
// webp placeholder note, real webp after generation; keep svg as og fallback via html
writeFileSync(join(root, 'proofs', '.gitkeep'), '');
writeFileSync(join(root, 'icons', 'heart.svg'), `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 21s-6.5-4.35-9.2-8.2C.8 9.8 2.05 6 5.4 6c1.86 0 3.1 1.1 3.85 2.2C10. 7.1 11.24 6 13.1 6c3.35 0 4.6 3.8 2.6 6.8C18.5 16.65 12 21 12 21z" fill="#D94F70"/>
</svg>`);

console.log('Mini Postres placeholders written to public/minipostres');
