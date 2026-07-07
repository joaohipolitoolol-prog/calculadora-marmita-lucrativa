import {
  ACCESS_URL,
  META_PIXEL_ID,
  UPSELL_CHECKOUT_URL,
  UPSELL_CURRENCY,
  UPSELL_CTA_LABEL,
  UPSELL_DECLINE_LABEL,
  UPSELL_PRICE_BRL,
  UPSELL_PRICE_LABEL,
  UPSELL_PRICE_USD,
} from './config.js';

const isPlaceholder = (url) =>
  !url || url.includes('COLOCAR_LINK') || url === '#';

function trackInitiateCheckout() {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      value: UPSELL_CURRENCY === 'BRL' ? UPSELL_PRICE_BRL : UPSELL_PRICE_USD,
      currency: UPSELL_CURRENCY === 'BRL' ? 'BRL' : 'USD',
      content_name: 'Paletas Premium y Combos Rentables',
    });
  }
}

document.querySelectorAll('[data-scroll-top]').forEach((el) => {
  el.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

document.querySelectorAll('[data-upsell-checkout]').forEach((link) => {
  if (isPlaceholder(UPSELL_CHECKOUT_URL)) {
    link.href = '#';
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Configura UPSELL_CHECKOUT_URL en src/upsell/config.js');
    });
    return;
  }
  link.href = UPSELL_CHECKOUT_URL;
  link.setAttribute('rel', 'noopener');
  link.addEventListener('click', trackInitiateCheckout);
});

document.querySelectorAll('[data-upsell-decline]').forEach((link) => {
  link.href = ACCESS_URL;
  link.setAttribute('rel', 'noopener');
});

document.querySelectorAll('[data-upsell-cta]').forEach((el) => {
  el.textContent = UPSELL_CTA_LABEL;
});

document.querySelectorAll('[data-upsell-decline-label]').forEach((el) => {
  el.textContent = UPSELL_DECLINE_LABEL;
});

document.querySelectorAll('[data-upsell-price]').forEach((el) => {
  el.textContent = UPSELL_PRICE_LABEL;
});

document.querySelectorAll('.faq-item').forEach((item) => {
  const trigger = item.querySelector('.faq-question');
  if (!trigger) return;
  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    document.querySelectorAll('.faq-item.is-open').forEach((open) => {
      open.classList.remove('is-open');
      open.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});

if (typeof window.fbq === 'function' && META_PIXEL_ID) {
  window.fbq('track', 'PageView');
}

const stickyBar = document.getElementById('upsell-sticky');
const heroCta = document.querySelector('.upsell-hero [data-upsell-checkout]');

if (stickyBar && heroCta && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      stickyBar.hidden = entry.isIntersecting;
    },
    { threshold: 0.1 }
  );
  observer.observe(heroCta);
} else if (stickyBar) {
  stickyBar.hidden = false;
}
