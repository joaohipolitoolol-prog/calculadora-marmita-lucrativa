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
  UPSELL_TIMER_MS,
  UPSELL_TIMER_STORAGE_KEY,
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
  link.addEventListener('click', (e) => {
    if (document.body.classList.contains('upsell-expired')) {
      e.preventDefault();
      return;
    }
    trackInitiateCheckout();
  });
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

function formatTimer(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getOfferDeadline() {
  const now = Date.now();
  const stored = sessionStorage.getItem(UPSELL_TIMER_STORAGE_KEY);
  if (stored) {
    const end = Number(stored);
    if (!Number.isNaN(end) && end > now) return end;
  }
  const end = now + UPSELL_TIMER_MS;
  sessionStorage.setItem(UPSELL_TIMER_STORAGE_KEY, String(end));
  return end;
}

function initUpsellTimer() {
  const deadline = getOfferDeadline();
  const timerEls = document.querySelectorAll('[data-upsell-timer]');
  const expiredOverlay = document.getElementById('upsell-expired');
  let expired = false;

  const setExpired = () => {
    if (expired) return;
    expired = true;
    document.body.classList.add('upsell-expired');
    timerEls.forEach((el) => {
      el.textContent = '00:00';
    });
    if (expiredOverlay) expiredOverlay.hidden = false;
    document.querySelectorAll('[data-upsell-checkout]').forEach((link) => {
      link.setAttribute('aria-disabled', 'true');
      link.tabIndex = -1;
    });
  };

  const tick = () => {
    const left = deadline - Date.now();
    const text = left <= 0 ? '00:00' : formatTimer(left);
    timerEls.forEach((el) => {
      el.textContent = text;
    });

    if (left <= 0) {
      setExpired();
      return;
    }

    if (left <= 2 * 60 * 1000) {
      document.body.classList.add('upsell-urgency-high');
    }

    window.setTimeout(tick, 250);
  };

  tick();
}

initUpsellTimer();
