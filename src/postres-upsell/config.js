/** Configuración del upsell Postres — editar aquí */

import { authRegisterPath } from '../login/auth-lines.js';

/** Upsell Pack Premium US$9,97 */
export const UPSELL_CHECKOUT_URL = 'https://pay.hotmart.com/Y106683338S?off=dq94mmmj';

/** Downsell Mini Pack US$7 — actualiza el link de Hotmart si cambias el precio. */
export const DOWNSELL_CHECKOUT_URL = 'https://pay.hotmart.com/Y106683338S?off=0dwxzf2m';

export const ACCESS_URL = authRegisterPath('postres', { compra: '1' });
export const UPSELL_POST_PURCHASE_URL = authRegisterPath('postres', {
  compra: '1',
  postres_premium: '1',
});

export const UPSELL_PRICE_USD = 9.97;
export const UPSELL_PRICE_COMPARE_USD = 12;
export const UPSELL_PRICE_COMPARE_LABEL = 'US$12';
export const UPSELL_PRICE_LABEL = 'US$9,97';

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
export const UPSELL_TIMER_STORAGE_KEY = 'postres_upsell_deadline_v2';
export const META_PIXEL_ID = '1369803401885896';
