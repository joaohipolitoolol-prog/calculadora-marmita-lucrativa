/** Configuración LP Postres — Método 3x12 */

import { getWhatsAppUrl } from '../lib/whatsapp-numbers.js';

export const CHECKOUT_URL = 'https://pay.hotmart.com/I106646611G?checkoutMode=10';

export const WHATSAPP_NUMBER_ID = 'postres_sales';
export const WHATSAPP_URL = getWhatsAppUrl(WHATSAPP_NUMBER_ID);

export const PRODUCT_NAME = 'Método 3x12';
export const META_PIXEL_ID = '1369803401885896';

export const MAIN_PRICE = 7.49;
export const MAIN_PRICE_LABEL = 'US$ 7,49';
export const PRICE_ACCESS_LABEL = 'Todo el método por US$ 7,49';
export const GUARANTEE_DAYS = 30;

export const HERO_CTA_LABEL = 'Quiero empezar a vender postres';
export const CALC_CTA_LABEL = 'Quiero calcular antes de vender';
export const OFFER_CTA_LABEL = 'Quiero empezar a vender postres';
export const TRUST_CTA_LABEL = 'Quiero empezar a vender postres';
export const STICKY_CTA_LABEL = 'Quiero empezar a vender postres';
export const FINAL_CTA_LABEL = 'Quiero empezar a vender postres';
export const GUARANTEE_CTA_LABEL = 'Quiero acceder al Método 3x12';
export const SECONDARY_CTA_LABEL = 'Quiero acceder al Método 3x12';
export const CTA_LABEL = HERO_CTA_LABEL;

/** Demo defaults already used in the in-page calculator */
export const DEMO_UNIT_PRICE = 1.6;
export const DEMO_UNIT_COST = 0.7;
export const DEMO_UNIT_INGREDIENTS = 0.45;
export const DEMO_UNIT_PACK = 0.25;
