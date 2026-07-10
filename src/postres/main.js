import {
  CHECKOUT_URL,
  MAIN_PRICE,
  PRICE_ACCESS_LABEL,
  PRODUCT_NAME,
  WHATSAPP_NUMBER_ID,
  WHATSAPP_URL,
} from './config.js';
import { initDemo } from './demo.js';
import { bindTrackClicks, trackCheckout, trackCurrentPage } from '../lib/track.js';
import { PRODUCT_LINE_BY_ID } from '../lib/product-lines.js';

trackCurrentPage({ line: 'postres' });
bindTrackClicks({ page: 'postres', line: 'postres', numberId: WHATSAPP_NUMBER_ID });

const POSTRES_SELLABLE = PRODUCT_LINE_BY_ID.postres?.sellable === true;

function isPlaceholder(url) {
  return !url || url.includes('COLOCAR_LINK') || url === '#';
}

export function handleCheckoutClick() {
  if (!POSTRES_SELLABLE) return;
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      value: MAIN_PRICE,
      currency: 'USD',
      content_name: PRODUCT_NAME,
    });
  }
  if (!isPlaceholder(CHECKOUT_URL)) {
    window.location.href = CHECKOUT_URL;
  }
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

document.querySelectorAll('[data-checkout]').forEach((link) => {
  if (!POSTRES_SELLABLE || isPlaceholder(CHECKOUT_URL)) {
    link.href = '#';
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (!POSTRES_SELLABLE) {
        alert('Postres aún no está a la venta. El kit se libera pronto.');
      }
    });
    if (!POSTRES_SELLABLE) {
      link.textContent = 'Próximamente';
    }
    return;
  }
  link.href = CHECKOUT_URL;
  link.setAttribute('rel', 'noopener');
  link.dataset.checkout = 'kit';
  if (!link.dataset.track) link.dataset.track = 'checkout_kit';
  link.addEventListener('click', (e) => {
    e.preventDefault();
    trackCheckout('kit', { page: 'postres', line: 'postres', ctaId: link.dataset.track });
    handleCheckoutClick();
  });
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

initDemo();

const sticky = document.getElementById('purchase-sticky');
if (sticky) {
  if (!POSTRES_SELLABLE) {
    sticky.hidden = true;
    sticky.setAttribute('aria-hidden', 'true');
  } else {
    const showAfter = 420;
    const onScroll = () => {
      const visible = window.scrollY > showAfter;
      sticky.classList.toggle('visible', visible);
      sticky.setAttribute('aria-hidden', visible ? 'false' : 'true');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}
