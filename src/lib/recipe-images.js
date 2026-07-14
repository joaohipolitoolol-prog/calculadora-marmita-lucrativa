/**
 * Resolve a visual for each recipe: real product photo when we have one,
 * otherwise a compact brand art card (type color + label) so the kit never
 * looks like a plain text dump.
 */

const PALETAS_BY_KEYWORD = [
  { test: /fresa|strawberry/i, src: '/email/sabor-fresa.jpg' },
  { test: /mango/i, src: '/paletas/sabor-mango.webp' },
  { test: /chocolate|cacao|nutella|oreo/i, src: '/paletas/sabor-chocolate.webp' },
  { test: /lim[oó]n|coco|piña|sand[ií]a|hierbabuena/i, src: '/paletas/sabor-limon-coco.webp' },
  { test: /bañad/i, src: '/paletas/paleta-banada-salsa.webp' },
];

const POSTRES_BY_ID = {
  'postre-fresa': '/postres/postre-fresa.webp',
  'postre-oreo': '/postres/postre-oreo.webp',
  'postre-chocolate': '/postres/postre-chocolate.webp',
  'postre-maracuya': '/postres/postre-maracuya.webp',
  'postre-dulce-leche': '/postres/postre-dulce-leche.webp',
  'postre-cheesecake': '/postres/postre-cheesecake.webp',
};

const POSTRES_BY_KEYWORD = [
  { test: /fresa|berries|mora|ar[aá]ndano/i, src: '/postres/postre-fresa.webp' },
  { test: /oreo|galleta|cookie/i, src: '/postres/postre-oreo.webp' },
  { test: /chocolate|nutella|choco|cacao/i, src: '/postres/postre-chocolate.webp' },
  { test: /maracuy[aá]|guan[aá]bana|mango|piña|durazno|sand[ií]a/i, src: '/postres/postre-maracuya.webp' },
  { test: /dulce de leche|caramelo|flan|churro/i, src: '/postres/postre-dulce-leche.webp' },
  { test: /cheesecake|tiramis|vainilla|lim[oó]n|key.?lime/i, src: '/postres/postre-cheesecake.webp' },
];

const TONE_BY_TIPO = {
  Frutal: { hue: 340, emoji: '🍓', wash: '#FFE4EC' },
  Cremosa: { hue: 25, emoji: '🍦', wash: '#FFF0E0' },
  Cremoso: { hue: 25, emoji: '🍨', wash: '#FFF0E0' },
  Rellena: { hue: 15, emoji: '🍫', wash: '#FDE8D8' },
  Bañada: { hue: 30, emoji: '✨', wash: '#FFF4D6' },
  'Estilo postre': { hue: 320, emoji: '🍮', wash: '#FCE7F3' },
  default: { hue: 330, emoji: '🍭', wash: '#FFE8F0' },
};

function matchKeyword(list, text) {
  for (const row of list) {
    if (row.test.test(text)) return row.src;
  }
  return null;
}

function toneFor(item, lineId) {
  const base = TONE_BY_TIPO[item?.tipo] || TONE_BY_TIPO.default;
  const emoji =
    lineId === 'postres'
      ? base.emoji === '🍭' || base.emoji === '🍦'
        ? '🍨'
        : base.emoji
      : base.emoji;
  return { ...base, emoji };
}

/**
 * @returns {{ kind: 'img'|'art', src?: string, alt: string, emoji: string, wash: string, hue: number, label: string }}
 */
export function resolveRecipeVisual(lineId, item) {
  const name = String(item?.nombre || '');
  const blob = `${name} ${item?.tipo || ''} ${item?.id || ''}`;
  const alt = name || 'Receta';
  const tone = toneFor(item, lineId);
  const label = name.replace(/^Paleta de |^Postre /i, '').slice(0, 28);

  let src = null;
  if (lineId === 'postres') {
    src = (item?.id && POSTRES_BY_ID[item.id]) || matchKeyword(POSTRES_BY_KEYWORD, blob);
  } else {
    src = matchKeyword(PALETAS_BY_KEYWORD, blob);
  }

  if (src) {
    return { kind: 'img', src, alt, emoji: tone.emoji, wash: tone.wash, hue: tone.hue, label };
  }
  return { kind: 'art', alt, emoji: tone.emoji, wash: tone.wash, hue: tone.hue, label };
}

/** Infer allergen chips from ingredient text (informativo, no lab badge). */
export function inferAllergens(item) {
  const text = [...(item?.ingredientes || []), item?.nombre || ''].join(' ').toLowerCase();
  const found = [];
  if (/leche|crema|queso|condensada|evaporada|mantequilla|yogur|l[aá]cteo/i.test(text)) {
    found.push('Lácteos');
  }
  if (/galleta|harina|trigo|oreo|mar[ií]a|bizcocho|panqu[eé]/i.test(text)) {
    found.push('Gluten');
  }
  if (/man[ií]|nuez|avellana|almendra|pistacho|cacahuate|nutella/i.test(text)) {
    found.push('Frutos secos');
  }
  if (/huevo|yema/i.test(text)) found.push('Huevo');
  if (/soja|soya/i.test(text)) found.push('Soja');
  return found;
}
