/** Configuración de la landing Postres en Vaso, editar aquí */

import { getWhatsAppUrl } from '../lib/whatsapp-numbers.js';

export const CHECKOUT_URL = 'https://pay.hotmart.com/I106646611G?checkoutMode=10';

export const WHATSAPP_NUMBER_ID = 'postres_sales';
export const WHATSAPP_URL = getWhatsAppUrl(WHATSAPP_NUMBER_ID);

export const PRODUCT_NAME = 'Método 3x12';
export const META_PIXEL_ID = '1369803401885896';

export const MAIN_PRICE = 7.49;
export const MAIN_PRICE_LABEL = 'US$ 7,49';
export const PRICE_ACCESS_LABEL = '12 sabores por solo US$ 7,49';

export const HERO_CTA_LABEL = 'Quiero empezar a vender con las 3 bases';
export const CALC_CTA_LABEL = 'Quiero calcular antes de vender';
export const OFFER_CTA_LABEL = 'Quiero empezar a vender con las 3 bases';
export const TRUST_CTA_LABEL = 'Quiero mi primer menú';
export const STICKY_CTA_LABEL = 'Quiero empezar';
export const FINAL_CTA_LABEL = 'Quiero empezar a vender con las 3 bases';
export const CTA_LABEL = HERO_CTA_LABEL;
