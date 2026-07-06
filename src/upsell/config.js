/** ═══ Configuración del upsell — editar aquí ═══ */

/**
 * FLUJO KIWIFY:
 * 1. Compra del kit → POST_PURCHASE_URL en src/landing/config.js (esta página de upsell)
 * 2. Cliente acepta → UPSELL_CHECKOUT_URL (checkout one-click del upsell en Kiwify)
 * 3. Cliente rechaza → ACCESS_URL (entrega del kit principal)
 * 4. Compra del upsell → UPSELL_POST_PURCHASE_URL (entrega del complemento premium)
 */

/** Link de checkout del upsell (Kiwify one-click — crear producto US$17 / R$67) */
export const UPSELL_CHECKOUT_URL = 'https://pay.kiwify.com/XblcKD0';

/** Página de acceso al kit principal después de rechazar el upsell */
export const ACCESS_URL =
  'https://calculadora-marmita-lucrativa.vercel.app/paletas-de-whatsapp/entrega.html';

/** Página de entrega del complemento premium después de comprar el upsell */
export const UPSELL_POST_PURCHASE_URL =
  'https://calculadora-marmita-lucrativa.vercel.app/paletas-premium/entrega.html';

/** Moneda: 'USD' o 'BRL' */
export const UPSELL_CURRENCY = 'USD';

export const UPSELL_PRICE_USD = 17;
export const UPSELL_PRICE_BRL = 67;

export const UPSELL_PRICE_LABEL =
  UPSELL_CURRENCY === 'BRL' ? `R$ ${UPSELL_PRICE_BRL}` : `US$ ${UPSELL_PRICE_USD}`;

export const UPSELL_NAME = 'Paletas Premium y Combos Rentables';

export const UPSELL_CTA_LABEL = 'Sí, quiero agregar Paletas Premium';

export const UPSELL_DECLINE_LABEL = 'No gracias, continuar al acceso del kit';

export const META_PIXEL_ID = '1369803401885896';
