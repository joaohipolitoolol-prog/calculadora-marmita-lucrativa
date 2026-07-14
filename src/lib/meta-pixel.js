/** Meta Pixel helpers: PageView/custom/InitiateCheckout. Browser Purchase is disabled. */

function canTrack() {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function productSessionKey(prefix, contentIds = [], contentName = '') {
  const id = (contentIds[0] || contentName || 'kit').replace(/\W+/g, '_');
  return `${prefix}_${id}`;
}

function alreadyFired(key) {
  return Boolean(storageGet(key));
}

function markFired(key, eventId) {
  storageSet(key, eventId || '1');
}

/** Custom events (QuizStart, QuizComplete, ViewOffer, …) */
export function trackMetaCustom(eventName, params = {}) {
  if (!canTrack() || !eventName) return;
  window.fbq('trackCustom', eventName, params);
}

/**
 * Fire InitiateCheckout once per product id per browser (localStorage).
 * Survives Hotmart opening a new tab; stops spam-clicks from inflating Meta IC.
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
 * Fire Purchase once per product id per browser (localStorage).
 *
 * DISABLED: thank-you + pending_checkout fired Purchase when people abandoned Hotmart.
 * That polluted Meta Ads Manager and destroyed campaigns.
 * Real Purchase → Hotmart webhook → Meta CAPI (server/lib/meta-capi.js).
 */
export function trackMetaPurchaseOnce(_opts = {}) {
  return false;
}

export function hasMetaPurchaseFired(contentIds = [], contentName = '') {
  return alreadyFired(productSessionKey('fb_purchase', contentIds, contentName));
}

/** Kept for analytics UX; does NOT unlock Meta Purchase anymore. */
export function markCheckoutPending(line = 'paletas') {
  storageSet(`pending_purchase_${line}`, String(Date.now()));
}

export function hasCheckoutPending(line = 'paletas', maxAgeMs = 2 * 60 * 60 * 1000) {
  const raw = storageGet(`pending_purchase_${line}`);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts <= maxAgeMs;
}

export function clearCheckoutPending(line = 'paletas') {
  storageRemove(`pending_purchase_${line}`);
}
