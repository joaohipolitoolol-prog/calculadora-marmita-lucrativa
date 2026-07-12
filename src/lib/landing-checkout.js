/** Shared LP checkout binding: soft scroll vs hard Hotmart buy. */

import {
  clearCheckoutPending,
  hasCheckoutPending,
  markCheckoutPending,
  trackMetaInitiateCheckout,
  trackMetaPurchaseOnce,
} from './meta-pixel.js';
import { withAbCheckoutParam } from './ab-entry.js';

export function bindScrollToOffer(selector = '[data-scroll-offer]') {
  document.querySelectorAll(selector).forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = (link.getAttribute('href') || '#oferta').replace(/^#/, '') || 'oferta';
      const el = document.getElementById(targetId);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/**
 * Hard buy CTAs only: [data-checkout-offer], [data-checkout-sticky], [data-checkout-hard]
 * Soft hero CTAs must use data-scroll-offer (no data-checkout).
 */
export function bindHardCheckoutLinks({
  checkoutUrl,
  price,
  contentName,
  contentIds = ['kit'],
  page,
  line = 'paletas',
  labels = {},
  isSellable = true,
  unsellableMessage = 'Aún no está a la venta.',
} = {}) {
  const isPlaceholder = !checkoutUrl || /SEU-LINK|COLOCAR_LINK|#/.test(checkoutUrl);
  const taggedUrl =
    line === 'paletas' ? withAbCheckoutParam(checkoutUrl) : checkoutUrl;

  document.querySelectorAll('[data-checkout-offer], [data-checkout-sticky], [data-checkout-hard]').forEach((link) => {
    if (!isSellable || isPlaceholder) {
      link.href = '#oferta';
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isSellable) window.alert?.(unsellableMessage);
      });
      if (!isSellable) link.textContent = 'Próximamente';
      return;
    }

    link.href = taggedUrl;
    link.setAttribute('rel', 'noopener');
    link.dataset.checkout = link.dataset.checkout || 'kit';
    if (!link.dataset.track) {
      link.dataset.track =
        link.dataset.checkoutSticky !== undefined ? 'checkout_sticky' : 'checkout_offer';
    }

    if (link.dataset.checkoutCustom === undefined) {
      if (link.dataset.checkoutOffer !== undefined && labels.offer) {
        link.textContent = labels.offer;
      } else if (link.dataset.checkoutSticky !== undefined && labels.sticky) {
        link.textContent = labels.sticky;
      } else if (link.dataset.checkoutHard !== undefined && labels.hard) {
        link.textContent = labels.hard;
      }
    }

    link.addEventListener('click', (e) => {
      markCheckoutPending(line);
      trackMetaInitiateCheckout({
        value: price,
        contentName,
        contentIds,
      });
      // Postres historically used preventDefault + location; keep navigation reliable.
      if (line === 'postres') {
        e.preventDefault();
        window.location.href = taggedUrl;
      }
    });
  });
}

/** Sticky appears only after the offer section (reduces premature IC). */
export function bindOfferSticky(stickyEl, offerId = 'oferta') {
  if (!stickyEl) return;
  const offer = document.getElementById(offerId);

  const update = () => {
    if (!offer) {
      const visible = window.scrollY > 900;
      stickyEl.classList.toggle('visible', visible);
      stickyEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
      return;
    }
    const top = offer.getBoundingClientRect().top;
    const visible = top < 120;
    stickyEl.classList.toggle('visible', visible);
    stickyEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

export function fireThankYouPurchase({
  line = 'paletas',
  value,
  contentName,
  contentIds,
} = {}) {
  const fired = trackMetaPurchaseOnce({
    value,
    contentName,
    contentIds,
  });
  if (fired) clearCheckoutPending(line);
  return fired;
}

export { hasCheckoutPending, markCheckoutPending, clearCheckoutPending };
