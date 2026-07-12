/** Diagnóstico WhatsApp — config de oferta e tracking */

export const CHECKOUT_URL = 'https://pay.hotmart.com/A106645076Y?checkoutMode=10';

export const MAIN_PRICE = 6.99;
export const MAIN_PRICE_LABEL = 'US$ 6,99';
export const BRAND = 'Paletas para WhatsApp';
export const KIT_NAME = 'Kit Paletas para WhatsApp';
export const META_PIXEL_ID = '1369803401885896';
export const GUARANTEE_DAYS = 30;

export const KIT_ITEMS = [
  { id: 'recetas', label: 'Recetas listas', icon: 'recipe' },
  { id: 'precios', label: 'Calculadora de precios', icon: 'calc' },
  { id: 'mensajes', label: 'Mensajes listos', icon: 'chat' },
  { id: 'menu', label: 'Menú para WhatsApp', icon: 'menu' },
  { id: 'proveedores', label: 'Guía de proveedores', icon: 'box' },
  { id: 'pedidos', label: 'Primeros pedidos', icon: 'check' },
  { id: 'manual', label: 'Manual de inicio', icon: 'book' },
];

/** Prints WA — crops só das mensagens (mais leves na página) */
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

/** Reviews alinhadas ao bloqueio do diagnóstico */
export function reviewsForDiagnosis(diagnosisId) {
  const map = {
    precio: ['norma', 'luciana'],
    confianza: ['alejandra', 'yadira'],
    recetas: ['vecinas', 'alejandra'],
    whatsapp: ['yadira', 'alejandra'],
    inicio: ['vecinas', 'norma'],
  };
  const ids = map[diagnosisId] || map.inicio;
  return ids.map((id) => WA_REVIEWS[id]).filter(Boolean);
}
