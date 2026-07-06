/** ═══ Configuración del upsell — editar aquí ═══ */

import { LOGIN_URL, MEMBERS_URL, SITE_URL } from '../site/config.js';

/**
 * FLUJO KIWIFY:
 * 1. Compra del kit → POST_PURCHASE_URL en src/landing/config.js (upsell)
 * 2. Cliente acepta → UPSELL_CHECKOUT_URL
 * 3. Cliente rechaza → ACCESS_URL (login para crear cuenta)
 * 4. Compra del upsell → UPSELL_POST_PURCHASE_URL (login + desbloqueio premium)
 */

/** Link de checkout del upsell (Kiwify one-click) */
export const UPSELL_CHECKOUT_URL = 'https://pay.kiwify.com/XblcKD0';

/** Login para acceder al kit después de rechazar el upsell */
export const ACCESS_URL = `${LOGIN_URL}?compra=1`;

/** Login después de comprar el complemento premium */
export const UPSELL_POST_PURCHASE_URL = `${LOGIN_URL}?compra=1&premium=1`;

/** Moneda: 'USD' o 'BRL' */
export const UPSELL_CURRENCY = 'USD';

export const UPSELL_PRICE_USD = 12;
export const UPSELL_PRICE_BRL = 47;

export const UPSELL_PRICE_LABEL =
  UPSELL_CURRENCY === 'BRL' ? `R$ ${UPSELL_PRICE_BRL}` : `US$ ${UPSELL_PRICE_USD}`;

export const UPSELL_NAME = 'Paletas Premium y Combos Rentables';

export const UPSELL_CTA_LABEL = 'Sí, quiero agregar Paletas Premium';

export const UPSELL_DECLINE_LABEL = 'No gracias, continuar al acceso del kit';

export const META_PIXEL_ID = '1369803401885896';

export { SITE_URL, MEMBERS_URL };
