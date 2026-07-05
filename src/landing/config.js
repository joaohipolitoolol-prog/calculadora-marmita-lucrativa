/** Link de checkout Kiwify */
export const CHECKOUT_URL = 'https://pay.kiwify.com.br/ugy1jyQ';

/** Página de obrigado na Kiwify — redirecionar comprador para cá */
export const POST_PURCHASE_URL = 'https://calculadora-marmita-lucrativa.vercel.app/app.html?compra=1';

/** WhatsApp suporte / upsell pós-compra (+44 UK) */
export const WHATSAPP_NUMBER = '447402867442';

export const WHATSAPP_PURCHASE_MESSAGE =
  'Olá! Acabei de adquirir a Calculadora Marmita Lucrativa. Pode me ajudar a começar?';

export function getWhatsAppLink(message = WHATSAPP_PURCHASE_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Cole este link no upsell da Kiwify */
export const WHATSAPP_PURCHASE_LINK = getWhatsAppLink();

/** Ícone do produto (calculadora) */
export const PRODUCT_ICON = '/product-icon.png';

/** Meta Pixel — painel de anúncios Meta */
export const META_PIXEL_ID = '1369803401885896';

/** Texto do CTA no hero — produto explícito na primeira dobra */
export const HERO_CTA_LABEL = 'Quero descobrir meu lucro por R$ 27';

/** Texto único de CTA — demais botões da página */
export const CTA_LABEL = 'Quero parar de vender no achismo — R$ 27';
