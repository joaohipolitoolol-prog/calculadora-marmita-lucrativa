/** Página de aviso pós-compra Postres — editar aquí */

export const PRODUCT_NAME = 'Postres en Vaso para WhatsApp';

/** Preferir upsell; aviso fica como fallback / suporte */
export const ACCESS_URL = '/cadastrar?compra=1&postres=1&line=postres';
export const UPSELL_URL = '/postres/upsell';
export const LOGIN_URL = '/login?line=postres';

export const WHATSAPP_NUMBER = '447402867442';

export const WHATSAPP_DISPLAY = '+44 7402 867442';

export const WHATSAPP_MESSAGE = `¡Hola! 👋 Acabo de comprar ${PRODUCT_NAME}.

📧 Mi correo de compra: [escribe tu correo]

Tengo una duda sobre el acceso al material.

Gracias 🍮`;

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
