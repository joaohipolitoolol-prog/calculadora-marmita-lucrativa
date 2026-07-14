/** Meta Pixel helpers, InitiateCheckout / Purchase with session dedupe. */

function canTrack() {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

function productSessionKey(prefix, contentIds = [], contentName = '') {
  const id = (contentIds[0] || contentName || 'kit').replace(/\W+/g, '_');
  return `${prefix}_${id}`;
}

function alreadyFired(key) {
  try {
    return Boolean(sessionStorage.getItem(key));
  } catch {
    return false;
  }
}

function markFired(key, eventId) {
  try {
    sessionStorage.setItem(key, eventId || '1');
  } catch {
    /* ignore */
  }
}

/** Custom events (QuizStart, QuizComplete, ViewOffer, …) */
export function trackMetaCustom(eventName, params = {}) {
  if (!canTrack() || !eventName) return;
  window.fbq('trackCustom', eventName, params);
}

/**
 * Fire InitiateCheckout once per product id per browser session.
 * Stops spam-clicks / back-button from inflating Meta IC.
 */
export function trackMetaInitiateCheckout({
  value,
  currency = 'USD',
  contentName,
  contentIds = [],
  eventId,
} = {}) {
  if (!canTrack() || value == null) return false;
  const key = productSessionKey('fb_ic', contentIds, contentName);
  if (alreadyFired(key)) return false;

  const id =
    eventId ||
    `${key}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  markFired(key, id);

  window.fbq(
    'track',
    'InitiateCheckout',
    {
      value: Number(value),
      currency,
      content_name: contentName,
      content_ids: contentIds.length ? contentIds : undefined,
      content_type: 'product',
    },
    { eventID: id }
  );
  return true;
}

/**
 * Fire Purchase once per product id per browser session.
 * Use on thank-you / upsell / aviso / register?compra=1&src=hotmart.
 */
export function trackMetaPurchaseOnce({
  value,
  currency = 'USD',
  contentName,
  contentIds = [],
  eventId,
} = {}) {
  if (!canTrack() || value == null) return false;
  const key = productSessionKey('fb_purchase', contentIds, contentName);
  if (alreadyFired(key)) return false;

  const id =
    eventId ||
    `${key}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  markFired(key, id);

  window.fbq(
    'track',
    'Purchase',
    {
      value: Number(value),
      currency,
      content_name: contentName,
      content_ids: contentIds.length ? contentIds : undefined,
      content_type: 'product',
    },
    { eventID: id }
  );
  return true;
}

/** Mark that the user left for Hotmart, unlocks URL grants on return. */
export function markCheckoutPending(line = 'paletas') {
  try {
    sessionStorage.setItem(`pending_purchase_${line}`, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function hasCheckoutPending(line = 'paletas', maxAgeMs = 2 * 60 * 60 * 1000) {
  try {
    const raw = sessionStorage.getItem(`pending_purchase_${line}`);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts <= maxAgeMs;
  } catch {
    return false;
  }
}

export function clearCheckoutPending(line = 'paletas') {
  try {
    sessionStorage.removeItem(`pending_purchase_${line}`);
  } catch {
    /* ignore */
  }
}
