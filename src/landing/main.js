import { BRAND_KIT } from '../site/brand.js';
import {
  CHECKOUT_URL,
  HERO_CTA_LABEL,
  MAIN_PRICE,
  MAIN_PRICE_LABEL,
  OFFER_CTA_LABEL,
  PRICE_ACCESS_LABEL,
  PRICE_CTA_LABEL,
  STICKY_CTA_LABEL,
  WHATSAPP_NUMBER_ID,
} from './config.js';
import { initDemo } from './demo.js';
import {
  bindHardCheckoutLinks,
  bindOfferSticky,
  bindScrollToOffer,
} from '../lib/landing-checkout.js';
import { bindWaReviewsDrag } from '../lib/wa-reviews.js';
import { bindTrackClicks, trackCurrentPage } from '../lib/track.js';
import { resolvePaletasEntryAb } from '../lib/ab-entry.js';

async function boot() {
  // A/B entry: may redirect to /diagnostico before painting LP analytics
  const ab = await resolvePaletasEntryAb();
  if (ab.redirected) return;

  trackCurrentPage({ line: 'paletas' });
  bindTrackClicks({ page: 'home', line: 'paletas', numberId: WHATSAPP_NUMBER_ID });

  document.querySelectorAll('[data-price]').forEach((el) => {
    el.textContent = MAIN_PRICE_LABEL;
  });

  document.querySelectorAll('[data-price-access]').forEach((el) => {
    el.textContent = PRICE_ACCESS_LABEL;
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
    if (link.dataset.ctaHero !== undefined) {
      link.textContent = HERO_CTA_LABEL;
    } else if (link.dataset.ctaPrice !== undefined) {
      link.textContent = PRICE_CTA_LABEL;
    }
  });

  bindHardCheckoutLinks({
    checkoutUrl: CHECKOUT_URL,
    price: MAIN_PRICE,
    contentName: BRAND_KIT,
    contentIds: ['paletas_kit'],
    page: 'home',
    line: 'paletas',
    labels: {
      offer: OFFER_CTA_LABEL,
      sticky: STICKY_CTA_LABEL,
    },
  });

  bindOfferSticky(document.getElementById('purchase-sticky'));
  document.querySelectorAll('.wa-reviews-track-prints').forEach((el) => bindWaReviewsDrag(el));

  try {
    initDemo();
  } catch (err) {
    console.error('[landing] initDemo failed', err);
  }
}

boot();
