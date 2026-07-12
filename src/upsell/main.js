import {
  ACCESS_URL,
  DOWNSELL_CHECKOUT_URL,
  DOWNSELL_CTA_LABEL,
  DOWNSELL_DECLINE_LABEL,
  DOWNSELL_PRICE_LABEL,
  DOWNSELL_PRICE_USD,
  UPSELL_CHECKOUT_URL,
  UPSELL_CURRENCY,
  STICKY_CTA_LABEL,
  UPSELL_CTA_LABEL,
  UPSELL_DECLINE_LABEL,
  UPSELL_PRICE_BRL,
  UPSELL_PRICE_COMPARE_LABEL,
  UPSELL_PRICE_LABEL,
  UPSELL_PRICE_USD,
  UPSELL_TIMER_MS,
  UPSELL_TIMER_STORAGE_KEY,
} from './config.js';
import { MAIN_PRICE } from '../landing/config.js';
import { BRAND_KIT } from '../site/brand.js';
import { fireThankYouPurchase } from '../lib/landing-checkout.js';
import { markCheckoutPending } from '../lib/meta-pixel.js';
import { bindTrackClicks, trackCurrentPage } from '../lib/track.js';

trackCurrentPage({ line: 'paletas' });
bindTrackClicks({ page: 'upsell-paletas', line: 'paletas' });

fireThankYouPurchase({
  line: 'paletas',
  value: MAIN_PRICE,
  contentName: BRAND_KIT,
  contentIds: ['paletas_kit'],
});

const isPlaceholder = (url) =>
  !url || url.includes('COLOCAR_LINK') || url === '#';

function trackInitiateCheckout(value, contentName) {
  markCheckoutPending('paletas');
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      value,
      currency: UPSELL_CURRENCY === 'BRL' ? 'BRL' : 'USD',
      content_name: contentName,
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
  link.dataset.checkout = 'upsell';
  link.dataset.track = link.dataset.track || 'upsell_checkout';
  link.addEventListener('click', (e) => {
    if (document.body.classList.contains('upsell-expired')) {
      e.preventDefault();
      return;
    }
    trackInitiateCheckout(
      UPSELL_CURRENCY === 'BRL' ? UPSELL_PRICE_BRL : UPSELL_PRICE_USD,
      'Pack Premium de Combos para WhatsApp'
    );
    try {
      localStorage.setItem('premium_pending_paletas', '1');
    } catch {
      /* ignore */
    }
  });
});

const downsellModal = document.getElementById('downsell-modal');

function openDownsell() {
  if (!downsellModal) return;
  downsellModal.hidden = false;
  document.body.classList.add('downsell-open');
  const focusTarget =
    downsellModal.querySelector('[data-downsell-checkout]') ||
    downsellModal.querySelector('.downsell-close');
  window.requestAnimationFrame(() => {
    focusTarget?.focus?.();
  });
}

function closeDownsell() {
  if (!downsellModal) return;
  downsellModal.hidden = true;
  document.body.classList.remove('downsell-open');
}

document.querySelectorAll('[data-upsell-decline]').forEach((link) => {
  link.href = ACCESS_URL;
  link.setAttribute('rel', 'noopener');
  const insideExpired = link.closest('#upsell-expired');
  if (downsellModal && !insideExpired) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openDownsell();
    });
  }
});

if (downsellModal) {
  document.querySelectorAll('[data-downsell-price]').forEach((el) => {
    el.textContent = DOWNSELL_PRICE_LABEL;
  });

  document.querySelectorAll('[data-downsell-close]').forEach((el) => {
    el.addEventListener('click', closeDownsell);
  });

  downsellModal.addEventListener('click', (e) => {
    if (e.target === downsellModal) closeDownsell();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !downsellModal.hidden) closeDownsell();
  });

  document.querySelectorAll('[data-downsell-final-decline]').forEach((link) => {
    link.href = ACCESS_URL;
    link.setAttribute('rel', 'noopener');
    link.textContent = DOWNSELL_DECLINE_LABEL;
  });

  document.querySelectorAll('[data-downsell-cta]').forEach((el) => {
    el.textContent = DOWNSELL_CTA_LABEL;
  });

  document.querySelectorAll('[data-downsell-checkout]').forEach((link) => {
    if (isPlaceholder(DOWNSELL_CHECKOUT_URL)) {
      link.href = '#';
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Configura DOWNSELL_CHECKOUT_URL en src/upsell/config.js');
      });
      return;
    }
    link.href = DOWNSELL_CHECKOUT_URL;
    link.setAttribute('rel', 'noopener');
    link.dataset.checkout = 'downsell';
    link.dataset.track = link.dataset.track || 'downsell_checkout';
    link.addEventListener('click', () => {
      trackInitiateCheckout(DOWNSELL_PRICE_USD, 'Mini Pack de Combos para WhatsApp');
    });
  });
}

document.querySelectorAll('[data-upsell-cta]').forEach((el) => {
  el.textContent = UPSELL_CTA_LABEL;
});

document.querySelectorAll('[data-upsell-sticky-cta]').forEach((el) => {
  el.textContent = STICKY_CTA_LABEL;
});

document.querySelectorAll('[data-upsell-decline-label]').forEach((el) => {
  el.textContent = UPSELL_DECLINE_LABEL;
});

document.querySelectorAll('[data-upsell-price]').forEach((el) => {
  el.textContent = UPSELL_PRICE_LABEL;
});

document.querySelectorAll('[data-upsell-price-compare]').forEach((el) => {
  el.textContent = UPSELL_PRICE_COMPARE_LABEL;
});

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
