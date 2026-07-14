/**
 * Clean emoji marker for recipes — no photos / SVGs.
 */

const EMOJI_RULES = [
  { test: /fresa|strawberry|frutos rojos|mora|ar[aá]ndano|cereza|red.?velvet/i, emoji: '🍓' },
  { test: /mango/i, emoji: '🥭' },
  { test: /lim[oó]n|lime|key.?lime/i, emoji: '🍋' },
  { test: /piña|pineapple/i, emoji: '🍍' },
  { test: /sand[ií]a|watermelon/i, emoji: '🍉' },
  { test: /kiwi/i, emoji: '🥝' },
  { test: /maracuy|guan[aá]bana|guayaba|durazno/i, emoji: '🍈' },
  { test: /coco/i, emoji: '🥥' },
  { test: /banana|banano|banoffee/i, emoji: '🍌' },
  { test: /manzana|apple/i, emoji: '🍎' },
  { test: /chocolate|cacao|brownie|choco|oreo|cookie/i, emoji: '🍫' },
  { test: /caf[eé]|tiramis/i, emoji: '☕' },
  { test: /vainilla|vanilla/i, emoji: '🍦' },
  { test: /dulce de leche|caramelo|flan|churro|alfajor/i, emoji: '🍮' },
  { test: /cheesecake|queso/i, emoji: '🧀' },
  { test: /nutella|man[ií]|avellana|pistacho|nuez/i, emoji: '🥜' },
  { test: /yogur|granola/i, emoji: '🥣' },
  { test: /menta|hierbabuena/i, emoji: '🌿' },
];

const TIPO_EMOJI = {
  Frutal: '🍓',
  Cremosa: '🍦',
  Cremoso: '🍨',
  Rellena: '🍫',
  Bañada: '✨',
  'Estilo postre': '🍮',
};

export function resolveRecipeEmoji(lineId, item) {
  const blob = `${item?.nombre || ''} ${item?.tipo || ''} ${item?.id || ''}`;
  for (const rule of EMOJI_RULES) {
    if (rule.test.test(blob)) return rule.emoji;
  }
  if (lineId === 'postres') return TIPO_EMOJI[item?.tipo] || '🍨';
  return TIPO_EMOJI[item?.tipo] || '🍭';
}

/** @deprecated use resolveRecipeEmoji */
export function resolveRecipeVisual(lineId, item) {
  const emoji = resolveRecipeEmoji(lineId, item);
  return { kind: 'emoji', emoji, alt: item?.nombre || 'Receta' };
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
