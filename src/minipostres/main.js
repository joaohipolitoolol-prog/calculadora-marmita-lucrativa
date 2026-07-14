import {
  CHECKOUT_URL,
  FINAL_CTA_LABEL,
  HERO_CTA_LABEL,
  MAIN_PRICE,
  MAIN_PRICE_LABEL,
  OFFER_CTA_LABEL,
  PRICE_ACCESS_LABEL,
  PRODUCT_NAME,
  STICKY_CTA_LABEL,
  VSL_URL,
  analyticsPrefix,
  contentIds,
  line,
  pageKey,
} from './config.js';
import { mountVslPlayer } from './vsl.js';
import {
  bindHardCheckoutLinks,
  bindScrollRevealSticky,
  bindScrollToOffer,
} from '../lib/landing-checkout.js';
import { trackMetaCustom } from '../lib/meta-pixel.js';
import { bindTrackClicks, trackCurrentPage, trackEvent } from '../lib/track.js';
import { captureAttribution } from '../lib/utm.js';
import { PRODUCT_LINE_BY_ID } from '../lib/product-lines.js';

captureAttribution();
trackCurrentPage({ line });
bindTrackClicks({ page: pageKey, line });

const SELLABLE = PRODUCT_LINE_BY_ID.minipostres?.sellable === true;

function fireCustom(name, params = {}) {
  trackMetaCustom(`${analyticsPrefix}_${name}`, params);
  trackEvent(`minipostres_${name.toLowerCase()}`, { page: pageKey, line, ...params });
}

fireCustom('PageView');
fireCustom('ViewContent', { content_name: PRODUCT_NAME });
if (typeof window.fbq === 'function') {
  window.fbq('track', 'ViewContent', {
    content_name: PRODUCT_NAME,
    content_ids: contentIds,
    content_type: 'product',
    value: MAIN_PRICE,
    currency: 'USD',
  });
}

document.querySelectorAll('[data-price]').forEach((el) => {
  el.textContent = PRICE_ACCESS_LABEL;
});
document.querySelectorAll('[data-price-short]').forEach((el) => {
  el.textContent = MAIN_PRICE_LABEL;
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
  if (link.dataset.ctaHero !== undefined) link.textContent = HERO_CTA_LABEL;
  if (link.dataset.ctaBound === '1') return;
  link.dataset.ctaBound = '1';
  link.addEventListener('click', () => {
    fireCustom('CTA_Click', { cta: link.dataset.track || 'scroll_offer' });
  });
});

bindHardCheckoutLinks({
  checkoutUrl: CHECKOUT_URL,
  price: MAIN_PRICE,
  contentName: PRODUCT_NAME,
  contentIds,
  page: pageKey,
  line,
  labels: {
    offer: OFFER_CTA_LABEL,
    sticky: STICKY_CTA_LABEL,
    hard: FINAL_CTA_LABEL,
  },
  isSellable: SELLABLE,
  unsellableMessage:
    'Mini Postres aún no está a la venta: falta el checkout de Hotmart y el contenido del kit. Vuelve pronto o elige Paletas / Postres en vaso.',
});

if (/COLOCAR_LINK|SEU-LINK|#/.test(CHECKOUT_URL || '') || !SELLABLE) {
  console.info('[minipostres] Checkout no sellable. Define NEXT_PUBLIC_MINIPOSTRES_CHECKOUT_URL con enlace real + backlog de contenido.');
}

/* Hard CTAs: Meta IC + first-party come from bindHardCheckoutLinks / bindTrackClicks only.
   Do not fire a second InitiateCheckout custom here — that duplicated on every spam-click. */

document.querySelectorAll('.faq-item').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    const q = item.querySelector('.faq-question')?.textContent?.trim() || '';
    fireCustom('FAQOpened', { question: q.slice(0, 120) });
  });
});

/* VSL: only mount when URL is configured; never show empty placeholder to paid traffic */
const vslWrap = document.getElementById('mp-vsl-wrap');
const vslRoot = document.getElementById('mp-vsl');
if (vslWrap && vslRoot && VSL_URL && String(VSL_URL).trim() && !/COLOCAR_LINK|^#$/.test(VSL_URL)) {
  vslWrap.hidden = false;
  mountVslPlayer(vslRoot, {
    url: VSL_URL,
    poster: '/postres/hero-variedad-postres.webp?v=8',
    analyticsPrefix,
    title: 'Método de las 3 bases',
  });
} else {
  vslWrap?.remove();
}

const offer = document.getElementById('oferta');
if (offer && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        fireCustom('OfferViewed');
        io.disconnect();
      }
    },
    { threshold: 0.35 }
  );
  io.observe(offer);
}

const sticky = document.getElementById('purchase-sticky');
if (sticky) {
  bindScrollRevealSticky(sticky, { offerId: 'oferta', scrollRatio: 0.2 });
}

/** Carrossel de sabores: cards compactos, drag suave + auto-scroll */
function initFlavorCarousel() {
  const root = document.querySelector('[data-mp-flavor-carousel]');
  const track = root?.querySelector('[data-mp-flavor-track]');
  if (!root || !track) return;

  const originals = [...track.children];
  originals.forEach((node) => {
    const clone = node.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach((img) => {
      img.alt = '';
      img.loading = 'lazy';
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
    track.appendChild(clone);
  });

  track.querySelectorAll('img').forEach((img) => {
    img.removeAttribute('width');
    img.removeAttribute('height');
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pausedUntil = 0;
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let momentumId = 0;

  const loopWidth = () => track.scrollWidth / 2;

  const normalize = () => {
    const half = loopWidth();
    if (half <= 0) return;
    if (root.scrollLeft >= half) root.scrollLeft -= half;
    else if (root.scrollLeft < 0) root.scrollLeft += half;
  };

  const bumpPause = (ms = 2200) => {
    pausedUntil = Date.now() + ms;
  };

  const stopMomentum = () => {
    if (momentumId) {
      cancelAnimationFrame(momentumId);
      momentumId = 0;
    }
  };

  const glide = () => {
    velocity *= 0.94;
    if (Math.abs(velocity) < 0.08) {
      momentumId = 0;
      bumpPause(1800);
      return;
    }
    root.scrollLeft -= velocity;
    normalize();
    momentumId = requestAnimationFrame(glide);
  };

  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stopMomentum();
    dragging = true;
    root.classList.add('is-dragging');
    startX = lastX = e.clientX;
    startScroll = root.scrollLeft;
    lastT = performance.now();
    velocity = 0;
    bumpPause(60_000);
    root.setPointerCapture?.(e.pointerId);
  });

  root.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - startX;
    root.scrollLeft = startScroll - dx;
    normalize();

    const dt = Math.max(now - lastT, 1);
    velocity = ((e.clientX - lastX) / dt) * 14;
    lastX = e.clientX;
    lastT = now;
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    if (!reduceMotion && Math.abs(velocity) > 0.4) {
      momentumId = requestAnimationFrame(glide);
    } else {
      bumpPause(2000);
    }
  };

  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);
  root.addEventListener('pointerleave', () => {
    if (dragging) endDrag();
  });
  root.addEventListener('wheel', () => bumpPause(2200), { passive: true });

  if (reduceMotion) return;

  const tick = () => {
    if (!dragging && !momentumId && Date.now() >= pausedUntil) {
      root.scrollLeft += 0.45;
      normalize();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

initFlavorCarousel();
