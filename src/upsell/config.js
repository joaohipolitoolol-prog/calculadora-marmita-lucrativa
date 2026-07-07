/** ═══ Configuración del upsell — editar aquí ═══ */

import { SITE_URL } from '../site/config.js';

/**
 * FLUJO (URLs relativas — funcionan en paletasparawhatsapp.vercel.app):
 * 1. Compra kit → upsell
 * 2. Acepta → checkout Hotmart
 * 3. Rechaza → /cadastrar?compra=1
 * 4. Compra upsell → /cadastrar?compra=1&premium=1
 */

export const UPSELL_CHECKOUT_URL = 'https://pay.hotmart.com/O106646563E';

/** Rutas relativas — siempre en el dominio actual */
export const ACCESS_URL = '/cadastrar?compra=1';
export const UPSELL_POST_PURCHASE_URL = '/cadastrar?compra=1&premium=1';

export const UPSELL_CURRENCY = 'USD';
export const UPSELL_PRICE_USD = 12;
export const UPSELL_PRICE_BRL = 47;

export const UPSELL_PRICE_LABEL =
  UPSELL_CURRENCY === 'BRL' ? `R$ ${UPSELL_PRICE_BRL}` : `US$ ${UPSELL_PRICE_USD}`;

export const UPSELL_NAME = 'Paletas Premium y Combos Rentables';
export const UPSELL_CTA_LABEL = 'Sí, agregar Paletas Premium';
export const UPSELL_DECLINE_LABEL = 'No gracias, continuar al acceso del kit';

/** Duración de la oferta única en la página de upsell (ms) */
export const UPSELL_TIMER_MS = 10 * 60 * 1000;
export const UPSELL_TIMER_STORAGE_KEY = 'upsell_offer_deadline_v1';
export const UPSELL_VALUE_STACK = [
  '20 recetas premium (bañadas, rellenas, postre)',
  '10 combos con precio guía y mensaje de venta',
  'Menú premium editable para WhatsApp',
  'Mensajes para combos y fechas especiales',
  'Guía de fotos, empaque y nombres',
  'Ideas por temporada (Mamá, San Valentín, Navidad)',
];
export const META_PIXEL_ID = '1369803401885896';

export { SITE_URL };
