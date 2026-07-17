/** Diagnóstico WhatsApp, config de oferta e tracking */

export const CHECKOUT_URL = 'https://pay.hotmart.com/L106739688G?checkoutMode=10';

export const MAIN_PRICE = 7.49;
export const MAIN_PRICE_LABEL = 'US$ 7,49';
export const BRAND = 'Paletas Heladas Sin Molde';
export const KIT_NAME = 'Método 2 Bases';
export const META_PIXEL_ID = '1369803401885896';
export const GUARANTEE_DAYS = 30;

export const KIT_ITEMS = [
  { id: 'recetas', label: 'Método 2 Bases', icon: 'recipe' },
  { id: 'precios', label: 'Calculadora de precios', icon: 'calc' },
  { id: 'mensajes', label: 'Mensajes listos', icon: 'chat' },
  { id: 'menu', label: 'Menú de sabores', icon: 'menu' },
  { id: 'proveedores', label: 'Guía de proveedores', icon: 'box' },
  { id: 'pedidos', label: 'Primeros pedidos', icon: 'check' },
  { id: 'manual', label: 'Manual de inicio', icon: 'book' },
];

/** Prints WA, crops só das mensagens (mais leves na página) */
export const WA_REVIEWS = {
  alejandra: {
    id: 'alejandra',
    src: '/paletas/reviews/crops/wa-alejandra.webp?v=2',
    srcMsg: '/paletas/reviews/crops/wa-alejandra-msg.webp',
    alt: 'Alejandra: primer pedido de vecinas por WhatsApp',
    label: 'Alejandra',
  },
  yadira: {
    id: 'yadira',
    src: '/paletas/reviews/crops/wa-yadira.webp?v=2',
    srcMsg: '/paletas/reviews/crops/wa-yadira-msg.webp',
    alt: 'Yadira: primeros pedidos con mensajes listos',
    label: 'Yadira',
  },
  norma: {
    id: 'norma',
    src: '/paletas/reviews/crops/wa-norma.webp?v=2',
    srcMsg: '/paletas/reviews/crops/wa-norma-msg.webp',
    alt: 'Norma: precios correctos y pedidos por estado',
    label: 'Norma',
  },
  vecinas: {
    id: 'vecinas',
    src: '/paletas/reviews/crops/wa-vecinas.webp?v=2',
    srcMsg: '/paletas/reviews/crops/wa-vecinas-msg.webp',
    alt: 'Mary: menú, calculadora y ventas a vecinas',
    label: 'Mary',
  },
  luciana: {
    id: 'luciana',
    src: '/paletas/reviews/crops/wa-luciana.webp?v=2',
    srcMsg: '/paletas/reviews/crops/wa-luciana-msg.webp',
    alt: 'Luciana: calculadora para costos y meta de ventas',
    label: 'Luciana',
  },
};

/** Reviews alinhadas ao bloqueio, uma única fonte de verdade */
export function diagnosisReviewIds(diagnosisId) {
  const map = {
    precio: ['norma', 'luciana'],
    confianza: ['alejandra', 'norma'],
    recetas: ['luciana', 'vecinas'],
    whatsapp: ['alejandra', 'yadira'],
    inicio: ['yadira', 'alejandra'],
  };
  return map[diagnosisId] || map.inicio;
}

export function reviewsForDiagnosis(diagnosisId) {
  return diagnosisReviewIds(diagnosisId)
    .map((id) => WA_REVIEWS[id])
    .filter(Boolean);
}

/** Print no affirm_1, por experiência (nunca/family = Yadira, não Alejandra) */
export function reviewForExperience(experience) {
  if (experience === 'never' || experience === 'family') return WA_REVIEWS.yadira;
  if (experience === 'tried') return WA_REVIEWS.vecinas;
  if (experience === 'selling') return WA_REVIEWS.luciana;
  return WA_REVIEWS.norma;
}

/**
 * Escolhe review evitando as já usadas no funil.
 * @param {string[]} preferredIds
 * @param {Set<string>|string[]} used
 */
export function pickReview(preferredIds, used = []) {
  const usedSet = used instanceof Set ? used : new Set(used);
  const pool = preferredIds.length
    ? preferredIds
    : Object.keys(WA_REVIEWS);
  for (const id of pool) {
    if (!usedSet.has(id) && WA_REVIEWS[id]) return WA_REVIEWS[id];
  }
  for (const id of Object.keys(WA_REVIEWS)) {
    if (!usedSet.has(id)) return WA_REVIEWS[id];
  }
  return null;
}

/** Até N reviews ainda não usadas (sem reusar). Preferidos primeiro. */
export function pickUnusedReviews(preferredIds = [], used = [], count = 2) {
  const usedSet = used instanceof Set ? used : new Set(used);
  const out = [];
  const seen = new Set();
  const tryIds = [...preferredIds, ...Object.keys(WA_REVIEWS)];
  for (const id of tryIds) {
    if (out.length >= count) break;
    if (usedSet.has(id) || seen.has(id) || !WA_REVIEWS[id]) continue;
    seen.add(id);
    out.push(WA_REVIEWS[id]);
  }
  return out;
}
