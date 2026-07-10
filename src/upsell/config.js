/** ═══ Configuración del upsell — editar aquí ═══ */

import { SITE_URL } from '../site/config.js';

/**
 * FLUJO (URLs relativas — funcionan en paletasparawhatsapp.vercel.app):
 * 1. Compra kit → upsell
 * 2. Acepta → checkout Hotmart
 * 3. Rechaza → downsell modal
 * 4. Rechaza downsell → /cadastrar?compra=1
 * 5. Compra upsell → /cadastrar?compra=1&premium=1
 */

export const UPSELL_CHECKOUT_URL = 'https://pay.hotmart.com/O106646563E';

/** Downsell Mini Pack (US$ 7) — actualiza el link de Hotmart si cambias el precio. */
export const DOWNSELL_CHECKOUT_URL = 'https://pay.hotmart.com/O106646563E?off=16xak8rd';

export const ACCESS_URL = '/cadastrar?compra=1&line=paletas';
export const UPSELL_POST_PURCHASE_URL = '/cadastrar?compra=1&premium=1&line=paletas';

export const UPSELL_CURRENCY = 'USD';
export const UPSELL_PRICE_USD = 9.97;
export const UPSELL_PRICE_BRL = 39;
export const UPSELL_PRICE_COMPARE_USD = 12;
export const UPSELL_PRICE_COMPARE_LABEL = 'US$12';

export const UPSELL_PRICE_LABEL =
  UPSELL_CURRENCY === 'BRL' ? `R$ ${UPSELL_PRICE_BRL}` : 'US$9,97';

export const DOWNSELL_PRICE_USD = 7;
export const DOWNSELL_PRICE_LABEL = 'US$7';

export const UPSELL_PACK_NAME = 'Pack Premium de Combos para WhatsApp';
export const DOWNSELL_PACK_NAME = 'Mini Pack de Combos para WhatsApp';

export const UPSELL_NAME = UPSELL_PACK_NAME;
export const UPSELL_CTA_LABEL = 'Sí, agregar Pack Premium por US$9,97';
export const STICKY_CTA_LABEL = 'Agregar Pack Premium';
export const DOWNSELL_CTA_LABEL = 'Sí, agregar Mini Pack por US$7';
export const UPSELL_DECLINE_LABEL = 'No gracias, continuar con mi kit básico';
export const DOWNSELL_DECLINE_LABEL = 'No gracias, continuar sin este pack';

export const UPSELL_TIMER_MS = 10 * 60 * 1000;
export const UPSELL_TIMER_STORAGE_KEY = 'upsell_offer_deadline_v2';

export const UPSELL_VALUE_STACK = [
  '20 recetas premium (6 bañadas + rellenas y estilo postre)',
  '10 combos con precio guía y mensaje de venta',
  'Menú premium editable para WhatsApp',
  'Mensajes para combos y fechas especiales',
  'Guía de fotos, empaque y nombres',
  'Ideas por temporada (Mamá, San Valentín, Navidad)',
];

export const META_PIXEL_ID = '1369803401885896';

export { SITE_URL };
