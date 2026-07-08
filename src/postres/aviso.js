import { WHATSAPP_URL } from './aviso-config.js';

const btn = document.getElementById('aviso-whatsapp');
if (btn && WHATSAPP_URL && !WHATSAPP_URL.includes('COLOCAR')) {
  btn.href = WHATSAPP_URL;
  btn.setAttribute('rel', 'noopener noreferrer');
  btn.setAttribute('target', '_blank');
}
