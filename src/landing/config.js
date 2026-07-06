/** Link de checkout — atualizar quando tiver o link LATAM */
export const CHECKOUT_URL = 'https://pay.kiwify.com.br/ugy1jyQ';

/** Página pós-compra — área de descarga del kit */
export const POST_PURCHASE_URL = 'https://calculadora-marmita-lucrativa.vercel.app/paletas-de-whatsapp/entrega.html';

/** WhatsApp suporte pós-compra */
export const WHATSAPP_NUMBER = '447402867442';

export const WHATSAPP_PURCHASE_MESSAGE =
  '¡Hola! Acabo de comprar el Kit Paletas de WhatsApp. ¿Me ayudas a empezar?';

export function getWhatsAppLink(message = WHATSAPP_PURCHASE_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_PURCHASE_LINK = getWhatsAppLink();

export const PRODUCT_ICON = '/favicon.svg';

export const META_PIXEL_ID = '1369803401885896';

/** Preço principal em USD — fonte única para LP e pixel */
export const MAIN_PRICE = 5;
export const MAIN_PRICE_LABEL = 'US$ 5';
export const PRICE_ACCESS_LABEL = 'Acceso completo por US$ 5';

/** URL do site — usada no og:image (atualizar com seu domínio) */
export const SITE_URL = 'https://calculadora-marmita-lucrativa.vercel.app';

export const OG_IMAGE = `${SITE_URL}/paletas/og-paletas-whatsapp.webp`;

export const HERO_CTA_LABEL = 'Quiero mi Kit de Paletas';

export const CALC_CTA_LABEL = 'Quiero preparar, calcular y publicar';

export const OFFER_CTA_LABEL = 'Quiero acceder al kit';

export const TRUST_CTA_LABEL = 'Quiero empezar con claridad';

export const CTA_LABEL = HERO_CTA_LABEL;
