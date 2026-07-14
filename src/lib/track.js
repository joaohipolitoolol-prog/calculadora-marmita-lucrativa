/** First-party analytics client — page views, CTAs, WhatsApp, auth, app opens. */

const AB_STORAGE_KEY = 'ab_paletas_entry';

export const TRACKED_PAGES = {
  home: '/',
  diagnostico: '/diagnostico',
  postres: '/postres',
  minipostres: '/minipostres',
  'minipostres-gracias': '/minipostres/gracias',
  'upsell-paletas': '/upsell-paletas-premium',
  'upsell-postres': '/postres/upsell',
  'aviso-postres': '/postresaviso',
  acesso: '/acesso',
  cadastrar: '/cadastrar',
  'cadastrar-postres': '/postres/cadastrar',
  login: '/login',
  'login-postres': '/postres/login',
  app: '/app',
};

const PAGE_LINES = {
  home: 'paletas',
  diagnostico: 'paletas',
  postres: 'postres',
  minipostres: 'minipostres',
  'minipostres-gracias': 'minipostres',
  'upsell-paletas': 'paletas',
  'upsell-postres': 'postres',
  'aviso-postres': 'postres',
  cadastrar: 'paletas',
  'cadastrar-postres': 'postres',
  login: 'paletas',
  'login-postres': 'postres',
};

function readStickyAb() {
  try {
    const v = localStorage.getItem(AB_STORAGE_KEY);
    if (v === 'lp' || v === 'quiz') return v;
  } catch {
    /* ignore */
  }
  return null;
}

function withAbDefaults(payload = {}) {
  const next = { ...payload };
  if (!next.line && next.page && PAGE_LINES[next.page]) {
    next.line = PAGE_LINES[next.page];
  }
  if (!next.ab && next.line === 'paletas') {
    const ab = readStickyAb();
    if (ab) next.ab = ab;
  }
  return next;
}

function send(payload) {
  const body = JSON.stringify(withAbDefaults(payload));
  const url = '/api/analytics/event';

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return Promise.resolve();
    }
  } catch {
    /* fall through */
  }

  if (typeof fetch === 'undefined') return Promise.resolve();
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackEvent(event, data = {}) {
  if (!event) return Promise.resolve();
  return send(withAbDefaults({ event, ...data }));
}

export function trackPageView(pageKey, extra = {}) {
  if (!pageKey || !TRACKED_PAGES[pageKey]) return;
  trackEvent('page_view', { page: pageKey, ...extra });
}

export function trackCurrentPage(extra = {}) {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const entry = Object.entries(TRACKED_PAGES).find(([, value]) => {
    const normalized = value.replace(/\/$/, '') || '/';
    return normalized === path;
  });
  if (entry) trackPageView(entry[0], extra);
}

export function trackCta(ctaId, extra = {}) {
  if (!ctaId) return;
  trackEvent('cta_click', { ctaId, ...extra });
}

export function trackWhatsApp(numberId, extra = {}) {
  if (!numberId) return;
  trackEvent('whatsapp_click', { numberId, ...extra });
}

export function trackCheckout(tier, extra = {}) {
  trackEvent('checkout_click', { tier: tier || 'kit', ...extra });
}

/**
 * Bind click tracking once per document.
 * - [data-track="ctaId"] → cta_click
 * - [data-whatsapp] or [data-wa-id] or a[href*="wa.me"] → whatsapp_click
 * - [data-checkout] → checkout_click
 * Spam-clicks on the same node within 800ms are ignored for first-party events.
 */
export function bindTrackClicks(defaults = {}) {
  if (typeof document === 'undefined' || document.documentElement.dataset.trackBound === '1') {
    return;
  }
  document.documentElement.dataset.trackBound = '1';

  const lastByEl = new WeakMap();

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target?.closest?.(
        '[data-track], [data-whatsapp], [data-wa-id], [data-checkout], a[href*="wa.me"]'
      );
      if (!el) return;

      const now = Date.now();
      const prev = lastByEl.get(el) || 0;
      if (now - prev < 800) return;
      lastByEl.set(el, now);

      const page = defaults.page || el.dataset.trackPage || undefined;
      const line = defaults.line || el.dataset.line || undefined;
      const base = { page, line };

      if (el.dataset.checkout != null || el.hasAttribute('data-checkout')) {
        trackCheckout(el.dataset.checkout || el.dataset.tier || 'kit', {
          ...base,
          ctaId: el.dataset.track || undefined,
        });
      }

      if (el.dataset.track) {
        trackCta(el.dataset.track, base);
      }

      const waId = el.dataset.waId || el.dataset.whatsapp || el.getAttribute('data-whatsapp');
      const isWa =
        waId ||
        (el.tagName === 'A' && String(el.getAttribute('href') || '').includes('wa.me'));
      if (isWa) {
        trackWhatsApp(waId || defaults.numberId || 'default', {
          ...base,
          purpose: el.dataset.waPurpose || defaults.purpose || 'support',
        });
      }
    },
    true
  );
}

/** @deprecated use trackPageView / trackCurrentPage from track.js */
export { trackPageView as trackPageViewLegacy };
