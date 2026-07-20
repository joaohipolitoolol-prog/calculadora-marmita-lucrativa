/** Configuración LP Paletas — Método 2 Bases */

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

export const CHECKOUT_URL = 'https://pay.hotmart.com/L106739688G?checkoutMode=10';
export const POST_PURCHASE_URL = POST_PURCHASE_UPSELL_URL;

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

export const MAIN_PRICE = 7.49;
export const MAIN_PRICE_LABEL = 'US$ 7,49';
export const PRICE_ACCESS_LABEL = 'Todo el método por US$ 7,49';
export const GUARANTEE_DAYS = 30;

export { SITE_URL, LOGIN_URL, MEMBERS_URL };

export const OG_IMAGE = `${SITE_URL}/paletas/og-paletas-whatsapp.webp?v=2`;

/** CTA principal recurrente */
export const HERO_CTA_LABEL = 'Quiero empezar a vender paletas';
export const PRICE_CTA_LABEL = 'Quiero empezar a vender paletas';
export const OFFER_CTA_LABEL = 'Quiero empezar a vender paletas';
export const FINAL_CTA_LABEL = 'Quiero empezar a vender paletas';
export const STICKY_CTA_LABEL = 'Quiero empezar a vender paletas';
export const GUARANTEE_CTA_LABEL = 'Quiero acceder con garantía';
export const SECONDARY_CTA_LABEL = 'Quiero aprender las 2 bases';
export const CALC_CTA_LABEL = 'Quiero calcular antes de vender';
export const TRUST_CTA_LABEL = 'Quiero empezar a vender paletas';
export const CTA_LABEL = HERO_CTA_LABEL;

export const PRODUCT_NAME = 'Método 2 Bases';
export const PRODUCT_LINE_NAME = 'Paletas Heladas Sin Molde';

/** Demo defaults already used in the in-page calculator (not income promises) */
export const DEMO_UNIT_PRICE = 2.5;
export const DEMO_UNIT_COST = 0.85;
