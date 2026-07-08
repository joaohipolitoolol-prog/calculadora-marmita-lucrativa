import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../public/postres');
mkdirSync(outDir, { recursive: true });

function cupSvg({ label, layers, accent = '#EC3F7A', bg = '#FFF0F6' }) {
  const layerMarkup = layers
    .map(
      (l, i) =>
        `<rect x="88" y="${148 - i * 28}" width="144" height="24" rx="4" fill="${l}"/>`
    )
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#FFF7EC"/>
    </linearGradient>
    <linearGradient id="cup" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.9)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.55)"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="url(#bg)"/>
  <ellipse cx="160" cy="248" rx="72" ry="10" fill="rgba(74,37,24,0.08)"/>
  <path d="M96 88 L224 88 L208 252 Q160 268 112 252 Z" fill="url(#cup)" stroke="#F6C9D8" stroke-width="2"/>
  ${layerMarkup}
  <ellipse cx="160" cy="88" rx="64" ry="10" fill="rgba(255,255,255,0.7)"/>
  <text x="160" y="292" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13" font-weight="700" fill="#4A2518">${label}</text>
</svg>`;
}

const assets = {
  'hero-postres.svg': cupSvg({
    label: 'Postres en Vaso',
    layers: ['#F04468', '#FFF7EC', '#FFB533', '#4A2518', '#FFE4B5'],
    accent: '#EC3F7A',
  }),
  'postre-fresa.svg': cupSvg({
    label: 'Fresa con crema',
    layers: ['#F04468', '#FFF7EC', '#FFB8C6', '#FFF7EC'],
  }),
  'postre-oreo.svg': cupSvg({
    label: 'Oreo cremoso',
    layers: ['#4A2518', '#FFF7EC', '#2A1712', '#FFF7EC'],
  }),
  'postre-chocolate.svg': cupSvg({
    label: 'Chocolate intenso',
    layers: ['#4A2518', '#6D4030', '#FFF7EC', '#3D2218'],
  }),
  'postre-maracuya.svg': cupSvg({
    label: 'Maracuyá',
    layers: ['#FFB533', '#FFF7EC', '#F5A623', '#FFF7EC'],
  }),
  'postre-dulce-leche.svg': cupSvg({
    label: 'Dulce de leche',
    layers: ['#C68642', '#FFF7EC', '#E8A54B', '#FFF7EC'],
  }),
  'postre-cheesecake.svg': cupSvg({
    label: 'Cheesecake en vaso',
    layers: ['#FFF7EC', '#F6C9D8', '#FFF7EC', '#F04468'],
  }),
  'postres-grid.svg': `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" aria-label="Variedad de postres en vaso">
  <rect width="640" height="640" fill="#FFF7FB"/>
  <rect x="24" y="24" width="280" height="280" rx="20" fill="#FFF0F6" stroke="#F6C9D8"/>
  <rect x="336" y="24" width="280" height="280" rx="20" fill="#FFF7EC" stroke="#F6C9D8"/>
  <rect x="24" y="336" width="280" height="280" rx="20" fill="#FFF0F6" stroke="#F6C9D8"/>
  <rect x="336" y="336" width="280" height="280" rx="20" fill="#FFF7EC" stroke="#F6C9D8"/>
  <circle cx="164" cy="164" r="48" fill="#F04468" opacity="0.85"/>
  <circle cx="476" cy="164" r="48" fill="#4A2518" opacity="0.85"/>
  <circle cx="164" cy="476" r="48" fill="#FFB533" opacity="0.9"/>
  <circle cx="476" cy="476" r="48" fill="#C68642" opacity="0.9"/>
  <text x="320" y="318" text-anchor="middle" font-family="Nunito, sans-serif" font-size="22" font-weight="800" fill="#2A1712">Postres en Vaso</text>
  <text x="320" y="348" text-anchor="middle" font-family="Nunito, sans-serif" font-size="14" fill="#6D5550">Recetas · Precios · Mensajes</text>
</svg>`,
  'mockup-kit-postres.svg': `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" role="img" aria-label="Mockup kit digital Postres en Vaso">
  <rect width="480" height="360" fill="#FFF7FB"/>
  <rect x="40" y="40" width="200" height="260" rx="12" fill="#FFF" stroke="#F6C9D8" stroke-width="2"/>
  <rect x="56" y="60" width="168" height="24" rx="6" fill="#EC3F7A" opacity="0.9"/>
  <rect x="56" y="96" width="140" height="8" rx="4" fill="#F6C9D8"/>
  <rect x="56" y="114" width="160" height="8" rx="4" fill="#F6C9D8"/>
  <rect x="56" y="132" width="120" height="8" rx="4" fill="#F6C9D8"/>
  <rect x="56" y="160" width="168" height="60" rx="8" fill="#FFF0F6"/>
  <text x="140" y="195" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" fill="#6D5550">Calculadora</text>
  <rect x="56" y="232" width="80" height="48" rx="8" fill="#FFF7EC" stroke="#F6C9D8"/>
  <rect x="144" y="232" width="80" height="48" rx="8" fill="#FFF7EC" stroke="#F6C9D8"/>
  <rect x="260" y="60" width="180" height="240" rx="16" fill="#2A1712"/>
  <rect x="272" y="80" width="156" height="200" rx="10" fill="#FFF7FB"/>
  <rect x="284" y="96" width="132" height="20" rx="6" fill="#EC3F7A" opacity="0.85"/>
  <rect x="284" y="128" width="100" height="6" rx="3" fill="#F6C9D8"/>
  <rect x="284" y="142" width="120" height="6" rx="3" fill="#F6C9D8"/>
  <rect x="284" y="170" width="132" height="80" rx="8" fill="#FFF0F6"/>
  <text x="350" y="218" text-anchor="middle" font-family="Nunito, sans-serif" font-size="10" fill="#6D5550">Menú WhatsApp</text>
  <text x="240" y="330" text-anchor="middle" font-family="Nunito, sans-serif" font-size="14" font-weight="700" fill="#4A2518">Kit digital completo</text>
</svg>`,
  'upsell-postres-premium.svg': `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" role="img" aria-label="Postres Premium y Combos">
  <rect width="480" height="320" fill="#FFF7FB"/>
  <rect x="24" y="40" width="140" height="200" rx="16" fill="#FFF" stroke="#F6C9D8"/>
  <rect x="170" y="24" width="140" height="216" rx="16" fill="#FFF0F6" stroke="#EC3F7A" stroke-width="2"/>
  <rect x="316" y="48" width="140" height="192" rx="16" fill="#FFF" stroke="#F6C9D8"/>
  <text x="240" y="278" text-anchor="middle" font-family="Nunito, sans-serif" font-size="16" font-weight="800" fill="#EC3F7A">Premium y Combos</text>
  <text x="240" y="300" text-anchor="middle" font-family="Nunito, sans-serif" font-size="12" fill="#6D5550">Complemento opcional</text>
</svg>`,
};

for (const [name, content] of Object.entries(assets)) {
  writeFileSync(resolve(outDir, name), content, 'utf8');
}

console.log(`Generated ${Object.keys(assets).length} SVG assets in public/postres/`);
