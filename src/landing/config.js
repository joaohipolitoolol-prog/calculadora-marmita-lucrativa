import { BRAND_KIT } from '../site/brand.js';
import {
  LOGIN_URL,
  MEMBERS_URL,
  POST_PURCHASE_UPSELL_URL,
  SITE_URL,
} from '../site/config.js';
import {
  getWhatsAppDisplay,
  getWhatsAppNumber,
  getWhatsAppUrl,
} from '../lib/whatsapp-numbers.js';

/** Link de checkout — Hotmart */
export const CHECKOUT_URL = 'https://pay.hotmart.com/A106645076Y?checkoutMode=10';

/** Página pós-compra — upsell (antes da área de membros) */
export const POST_PURCHASE_URL = POST_PURCHASE_UPSELL_URL;

/** WhatsApp suporte pós-compra — registry id: paletas_support */
export const WHATSAPP_NUMBER_ID = 'paletas_support';
export const WHATSAPP_NUMBER = getWhatsAppNumber(WHATSAPP_NUMBER_ID).e164;
export const WHATSAPP_DISPLAY = getWhatsAppDisplay(WHATSAPP_NUMBER_ID);

export const WHATSAPP_PURCHASE_MESSAGE = `¡Hola! 👋 Acabo de comprar el ${BRAND_KIT}.

📧 Mi correo de compra: [escribe tu correo]

Quiero confirmar mi acceso y empezar con recetas, calculadora y menú.

¿Me ayudas si hace falta?

Gracias 🍓`;

export function getWhatsAppLink(message = WHATSAPP_PURCHASE_MESSAGE) {
  return getWhatsAppUrl(WHATSAPP_NUMBER_ID, message);
}

export const WHATSAPP_PURCHASE_LINK = getWhatsAppLink();

export const WHATSAPP_SUPPORT_MESSAGE = `¡Hola! 👋 Acabo de comprar el ${BRAND_KIT} y necesito ayuda para crear mi cuenta o acceder al kit.

📧 Mi correo de compra: [escribe tu correo]

Gracias 🍓`;

export const WHATSAPP_SUPPORT_LINK = getWhatsAppLink(WHATSAPP_SUPPORT_MESSAGE);

export const PRODUCT_ICON = '/favicon.svg';

export const META_PIXEL_ID = '1369803401885896';

/** Preço principal em USD — fonte única para LP e pixel */
export const MAIN_PRICE = 5.97;
export const MAIN_PRICE_LABEL = 'US$ 5,97';
export const PRICE_ACCESS_LABEL = 'Acceso completo por US$ 5,97';

export { SITE_URL, LOGIN_URL, MEMBERS_URL };

export const OG_IMAGE = `${SITE_URL}/paletas/og-paletas-whatsapp.webp?v=2`;

export const HERO_CTA_LABEL = 'Quiero preparar mi primera oferta';

export const CALC_CTA_LABEL = 'Quiero calcular antes de vender';

export const OFFER_CTA_LABEL = 'Acceder al kit ahora';

export const TRUST_CTA_LABEL = 'Quiero empezar con más claridad';

export const STICKY_CTA_LABEL = 'Acceder al kit ahora';

export const CTA_LABEL = HERO_CTA_LABEL;
