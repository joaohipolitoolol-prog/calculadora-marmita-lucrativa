import {
  CHECKOUT_URL,
  HERO_CTA_LABEL,
  MAIN_PRICE,
  OFFER_CTA_LABEL,
  PRICE_ACCESS_LABEL,
  PRODUCT_NAME,
  STICKY_CTA_LABEL,
  WHATSAPP_NUMBER_ID,
  WHATSAPP_URL,
} from './config.js';
import {
  bindHardCheckoutLinks,
  bindOfferSticky,
  bindScrollToOffer,
} from '../lib/landing-checkout.js';
import { bindTrackClicks, trackCurrentPage } from '../lib/track.js';
import { PRODUCT_LINE_BY_ID } from '../lib/product-lines.js';
import { initKitPreview } from '../lib/kit-preview.js';
import { initWaReviewsPrints } from '../lib/wa-reviews.js';

trackCurrentPage({ line: 'postres' });
bindTrackClicks({ page: 'postres', line: 'postres', numberId: WHATSAPP_NUMBER_ID });
initKitPreview();
initWaReviewsPrints();

const POSTRES_SELLABLE = PRODUCT_LINE_BY_ID.postres?.sellable === true;

function isPlaceholder(url) {
  return !url || url.includes('COLOCAR_LINK') || url === '#';
}

document.querySelectorAll('[data-price]').forEach((el) => {
  el.textContent = POSTRES_SELLABLE ? PRICE_ACCESS_LABEL : 'Próximamente';
});

const logo = document.querySelector('.site-logo');
if (logo) {
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

bindScrollToOffer();
document.querySelectorAll('[data-scroll-offer]').forEach((link) => {
  if (link.dataset.ctaHero !== undefined || link.dataset.checkoutHero !== undefined) {
    link.textContent = HERO_CTA_LABEL;
  }
});

bindHardCheckoutLinks({
  checkoutUrl: CHECKOUT_URL,
  price: MAIN_PRICE,
  contentName: PRODUCT_NAME,
  contentIds: ['postres_kit'],
  page: 'postres',
  line: 'postres',
  labels: {
    offer: OFFER_CTA_LABEL,
    sticky: STICKY_CTA_LABEL,
  },
  isSellable: POSTRES_SELLABLE,
  unsellableMessage: 'Postres aún no está a la venta. El kit se libera pronto.',
});

document.querySelectorAll('[data-whatsapp]').forEach((link) => {
  if (isPlaceholder(WHATSAPP_URL)) {
    link.href = '#';
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (e) => e.preventDefault());
    return;
  }
  link.href = WHATSAPP_URL;
  link.dataset.waId = WHATSAPP_NUMBER_ID;
  link.dataset.waPurpose = 'sales';
  link.setAttribute('rel', 'noopener noreferrer');
  link.setAttribute('target', '_blank');
});

const sticky = document.getElementById('purchase-sticky');
if (sticky) {
  if (!POSTRES_SELLABLE) {
    sticky.hidden = true;
    sticky.setAttribute('aria-hidden', 'true');
  } else {
    bindOfferSticky(sticky);
  }
}
