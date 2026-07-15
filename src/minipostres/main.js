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

  // First-party only uses allowlisted EVENT_TYPES (Meta keeps the custom names).
  const key = String(name || '').toLowerCase();
  if (key === 'pageview' || key === 'viewcontent') {
    // page_view already sent by trackCurrentPage
    return;
  }
  if (key === 'cta_click') {
    trackEvent('cta_click', {
      page: pageKey,
      line,
      ctaId: sanitizeCtaId(params.cta || 'scroll_offer'),
    });
    return;
  }
  if (key === 'faqopened') {
    trackEvent('cta_click', {
      page: pageKey,
      line,
      ctaId: sanitizeCtaId(`faq_${String(params.question || 'open').slice(0, 24)}`),
    });
  }
}

function sanitizeCtaId(raw) {
  return String(raw || 'cta')
    .toLowerCase()
    .replace(/[^a-z0-9_.:/-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'cta';
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
   Do not fire a second InitiateCheckout custom here: that duplicated on every spam-click. */

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

/* Sabores agora usam grade estática (mp-flavor-grid); sem carrossel. */
