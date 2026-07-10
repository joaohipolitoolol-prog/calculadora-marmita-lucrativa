/** Página de aviso pós-compra Postres — editar aquí */

import { getWhatsAppDisplay, getWhatsAppNumber, getWhatsAppUrl } from '../lib/whatsapp-numbers.js';

export const PRODUCT_NAME = 'Postres en Vaso para WhatsApp';

/** Preferir upsell; aviso fica como fallback / suporte */
export const ACCESS_URL = '/cadastrar?compra=1&postres=1&line=postres';
export const UPSELL_URL = '/postres/upsell';
export const LOGIN_URL = '/login?line=postres';

export const WHATSAPP_NUMBER_ID = 'postres_support';
export const WHATSAPP_NUMBER = getWhatsAppNumber(WHATSAPP_NUMBER_ID).e164;
export const WHATSAPP_DISPLAY = getWhatsAppDisplay(WHATSAPP_NUMBER_ID);

export const WHATSAPP_MESSAGE = `¡Hola! 👋 Acabo de comprar ${PRODUCT_NAME}.

📧 Mi correo de compra: [escribe tu correo]

Tengo una duda sobre el acceso al material.

Gracias 🍨`;

export const WHATSAPP_URL = getWhatsAppUrl(WHATSAPP_NUMBER_ID, WHATSAPP_MESSAGE);
