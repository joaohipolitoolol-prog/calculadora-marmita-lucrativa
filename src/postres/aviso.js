import { ACCESS_URL, UPSELL_URL, WHATSAPP_URL } from './aviso-config.js';

const accessBtn = document.getElementById('aviso-access');
if (accessBtn && ACCESS_URL) {
  accessBtn.href = ACCESS_URL;
}

const upsellBtn = document.getElementById('aviso-upsell');
if (upsellBtn && UPSELL_URL) {
  upsellBtn.href = UPSELL_URL;
}

const btn = document.getElementById('aviso-whatsapp');
if (btn && WHATSAPP_URL && !WHATSAPP_URL.includes('COLOCAR')) {
  btn.href = WHATSAPP_URL;
  btn.setAttribute('rel', 'noopener noreferrer');
  btn.setAttribute('target', '_blank');
}
