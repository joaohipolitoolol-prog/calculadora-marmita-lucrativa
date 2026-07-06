/** ═══ Configuración del upsell — editar aquí ═══ */

import { SITE_URL } from '../site/config.js';

/**
 * FLUJO (URLs relativas — funcionan en paletasparawhatsapp.vercel.app):
 * 1. Compra kit → upsell
 * 2. Acepta → checkout Kiwify
 * 3. Rechaza → /login?compra=1
 * 4. Compra upsell → /login?compra=1&premium=1
 */

export const UPSELL_CHECKOUT_URL = 'https://pay.kiwify.com/XblcKD0';

/** Rutas relativas — siempre en el dominio actual */
export const ACCESS_URL = '/login?compra=1';
export const UPSELL_POST_PURCHASE_URL = '/login?compra=1&premium=1';

export const UPSELL_CURRENCY = 'USD';
export const UPSELL_PRICE_USD = 12;
export const UPSELL_PRICE_BRL = 47;

export const UPSELL_PRICE_LABEL =
  UPSELL_CURRENCY === 'BRL' ? `R$ ${UPSELL_PRICE_BRL}` : `US$ ${UPSELL_PRICE_USD}`;

export const UPSELL_NAME = 'Paletas Premium y Combos Rentables';
export const UPSELL_CTA_LABEL = 'Sí, quiero agregar Paletas Premium';
export const UPSELL_DECLINE_LABEL = 'No gracias, ir a crear mi acceso';
export const META_PIXEL_ID = '1369803401885896';

export { SITE_URL };
