import { ACCESS_URL, UPSELL_URL, WHATSAPP_NUMBER_ID, WHATSAPP_URL } from './aviso-config.js';
import { bindTrackClicks, trackCurrentPage } from '../lib/track.js';

trackCurrentPage({ line: 'postres' });
bindTrackClicks({ page: 'aviso-postres', line: 'postres', numberId: WHATSAPP_NUMBER_ID });

const accessBtn = document.getElementById('aviso-access');
if (accessBtn && ACCESS_URL) {
  accessBtn.href = ACCESS_URL;
  accessBtn.dataset.track = 'aviso_access';
}

const upsellBtn = document.getElementById('aviso-upsell');
if (upsellBtn && UPSELL_URL) {
  upsellBtn.href = UPSELL_URL;
  upsellBtn.dataset.track = 'aviso_upsell';
}

const btn = document.getElementById('aviso-whatsapp');
if (btn && WHATSAPP_URL && !WHATSAPP_URL.includes('COLOCAR')) {
  btn.href = WHATSAPP_URL;
  btn.dataset.waId = WHATSAPP_NUMBER_ID;
  btn.dataset.waPurpose = 'support';
  btn.setAttribute('rel', 'noopener noreferrer');
  btn.setAttribute('target', '_blank');
}
