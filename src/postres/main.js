import {
  CHECKOUT_URL,
  MAIN_PRICE,
  PRICE_ACCESS_LABEL,
  PRODUCT_NAME,
  WHATSAPP_URL,
} from './config.js';
import { initDemo } from './demo.js';
import { trackCurrentPage } from '../lib/page-analytics.js';

trackCurrentPage();

function isPlaceholder(url) {
  return !url || url.includes('COLOCAR_LINK') || url === '#';
}

export function handleCheckoutClick() {
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
  el.textContent = PRICE_ACCESS_LABEL;
});

const logo = document.querySelector('.site-logo');
if (logo) {
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.querySelectorAll('[data-checkout]').forEach((link) => {
  if (isPlaceholder(CHECKOUT_URL)) {
    link.href = '#';
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (e) => e.preventDefault());
    return;
  }
  link.href = CHECKOUT_URL;
  link.setAttribute('rel', 'noopener');
  link.addEventListener('click', (e) => {
    e.preventDefault();
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
  link.setAttribute('rel', 'noopener noreferrer');
  link.setAttribute('target', '_blank');
});

initDemo();

const sticky = document.getElementById('purchase-sticky');
if (sticky) {
  const showAfter = 420;
  const onScroll = () => {
    const visible = window.scrollY > showAfter;
    sticky.classList.toggle('visible', visible);
    sticky.setAttribute('aria-hidden', visible ? 'false' : 'true');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
