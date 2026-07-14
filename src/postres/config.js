/** Configuración de la landing Postres en Vaso, editar aquí */

import { getWhatsAppUrl } from '../lib/whatsapp-numbers.js';

export const CHECKOUT_URL = 'https://pay.hotmart.com/I106646611G?checkoutMode=10';

export const WHATSAPP_NUMBER_ID = 'postres_sales';
export const WHATSAPP_URL = getWhatsAppUrl(WHATSAPP_NUMBER_ID);

export const PRODUCT_NAME = 'Postres en Vaso para WhatsApp';
export const META_PIXEL_ID = '1369803401885896';

export const MAIN_PRICE = 7.49;
export const MAIN_PRICE_LABEL = 'US$ 7,49';
export const PRICE_ACCESS_LABEL = 'Acceso completo por US$ 7,49';

export const HERO_CTA_LABEL = 'Quiero armar mi menú';
export const CALC_CTA_LABEL = 'Quiero calcular antes de vender';
export const OFFER_CTA_LABEL = 'Quiero armar mi menú';
export const TRUST_CTA_LABEL = 'Quiero empezar con más claridad';
export const STICKY_CTA_LABEL = 'Quiero armar mi menú';
export const CTA_LABEL = HERO_CTA_LABEL;
