/** Configuración del upsell Postres — editar aquí */

/** Upsell US$12 — https://pay.hotmart.com/Y106683338S?off=dq94mmmj */
export const UPSELL_CHECKOUT_URL = 'https://pay.hotmart.com/Y106683338S?off=dq94mmmj';

/** Downsell US$9,97 — https://pay.hotmart.com/Y106683338S?off=0dwxzf2m */
export const DOWNSELL_CHECKOUT_URL = 'https://pay.hotmart.com/Y106683338S?off=0dwxzf2m';

/** Cadastro com flag Postres — Hotmart thank-you do premium também pode apontar aqui */
export const ACCESS_URL = '/cadastrar?compra=1&postres=1&line=postres';
export const UPSELL_POST_PURCHASE_URL = '/cadastrar?compra=1&postres=1&postres_premium=1&line=postres';

export const UPSELL_PRICE_USD = 12;
export const UPSELL_PRICE_LABEL = 'US$12';
export const DOWNSELL_PRICE_USD = 9.97;
export const DOWNSELL_PRICE_LABEL = 'US$9,97';

export const UPSELL_NAME = 'Postres Premium y Combos Rentables';
export const UPSELL_CTA_LABEL = 'Sí, agregar por US$12';
export const UPSELL_DECLINE_LABEL = 'No gracias, continuar al acceso del kit';

export const UPSELL_TIMER_MS = 10 * 60 * 1000;
export const UPSELL_TIMER_STORAGE_KEY = 'postres_upsell_deadline_v1';
export const META_PIXEL_ID = '1369803401885896';
