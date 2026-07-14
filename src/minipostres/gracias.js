/**
 * Thank-you page for Mini Postres.
 * Does NOT fire Purchase on open; only if checkout pending flag exists
 * (user actually clicked buy in this browser). Prefer real webhook/purchase confirmation.
 */
import { ACCESS_URL, MAIN_PRICE, PRODUCT_NAME, contentIds, line, pageKey } from './config.js';
import { fireThankYouPurchase } from '../lib/landing-checkout.js';
import { captureAttribution } from '../lib/utm.js';
import { trackCurrentPage } from '../lib/track.js';

captureAttribution();
trackCurrentPage({ line });

const btn = document.getElementById('mp-access-btn');
if (btn && ACCESS_URL) {
  btn.href = ACCESS_URL;
}

// Optional: fire Purchase only when pending checkout was marked (not on mere page open without click).
const params = new URLSearchParams(window.location.search);
const confirmed = params.get('compra') === '1' || params.get('src') === 'hotmart';
if (confirmed) {
  fireThankYouPurchase({
    line,
    value: MAIN_PRICE,
    contentName: PRODUCT_NAME,
    contentIds,
  });
}

void pageKey;
