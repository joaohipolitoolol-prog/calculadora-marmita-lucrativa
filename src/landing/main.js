import {
  CHECKOUT_URL,
  HERO_CTA_LABEL,
  MAIN_PRICE,
  MAIN_PRICE_LABEL,
  OFFER_CTA_LABEL,
  PRICE_ACCESS_LABEL,
  PRICE_CTA_LABEL,
  PRODUCT_NAME,
  STICKY_CTA_LABEL,
  WHATSAPP_NUMBER_ID,
} from './config.js';
import {
  bindHardCheckoutLinks,
  bindOfferSticky,
  bindScrollToOffer,
} from '../lib/landing-checkout.js';
import { bindTrackClicks, trackCurrentPage } from '../lib/track.js';
import { initPageDwell } from '../lib/page-dwell.js';
import { resolvePaletasEntryAb } from '../lib/ab-entry.js';
import { initKitPreview } from '../lib/kit-preview.js';
import { initWaReviewsPrints } from '../lib/wa-reviews.js';

async function boot() {
  // A/B entry: may redirect to /diagnostico before painting LP analytics
  const ab = await resolvePaletasEntryAb();
  if (ab.redirected) return;

  trackCurrentPage({ line: 'paletas' });
  initPageDwell('home', { line: 'paletas' });
  bindTrackClicks({ page: 'home', line: 'paletas', numberId: WHATSAPP_NUMBER_ID });
  initKitPreview();
  initWaReviewsPrints();

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
    contentName: PRODUCT_NAME,
    contentIds: ['paletas_kit'],
    page: 'home',
    line: 'paletas',
    labels: {
      offer: OFFER_CTA_LABEL,
      sticky: STICKY_CTA_LABEL,
    },
  });

  bindOfferSticky(document.getElementById('purchase-sticky'));
}

boot();
