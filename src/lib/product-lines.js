/**
 * Product lines, same digital-kit mold, different angle.
 * Entitlements stay in products.js; this drives branding, funnel URLs, and app UX.
 */

import { CHECKOUT_URL as PALETAS_CHECKOUT, MAIN_PRICE_LABEL as PALETAS_PRICE } from '../landing/config.js';
import { CHECKOUT_URL as POSTRES_CHECKOUT, MAIN_PRICE_LABEL as POSTRES_PRICE } from '../postres/config.js';

export const ACTIVE_LINE_STORAGE_KEY = 'active_product_line_v1';

export const PRODUCT_LINES = [
  {
    id: 'paletas',
    name: 'Paletas para WhatsApp',
    kitName: 'Kit Paletas para WhatsApp',
    short: 'Paletas',
    emoji: '🍓',
    unitSingular: 'paleta',
    unitPlural: 'paletas',
    unitLabel: 'Paletas por día',
    landingPath: '/',
    upsellPath: '/upsell-paletas-premium',
    checkoutUrl: PALETAS_CHECKOUT,
    priceLabel: PALETAS_PRICE,
    mainField: 'hasKit',
    premiumField: 'hasPremium',
    queryKey: 'paletas',
    premiumQueryKey: 'premium',
    accent: '#E8437A',
    favicon: '/favicon.svg?v=5',
    enabled: true,
    /** Live checkout / in-app cross-sell */
    sellable: true,
  },
  {
    id: 'postres',
    name: 'Mini Postres Fríos Sin Horno',
    kitName: 'Mini Postres Fríos Sin Horno',
    short: 'Mini Postres',
    emoji: '🧁',
    unitSingular: 'mini postre',
    unitPlural: 'mini postres',
    unitLabel: 'Mini postres por día',
    landingPath: '/postres',
    upsellPath: '/postres/upsell',
    checkoutUrl: POSTRES_CHECKOUT,
    priceLabel: POSTRES_PRICE,
    mainField: 'hasPostres',
    premiumField: 'hasPostresPremium',
    queryKey: 'postres',
    premiumQueryKey: 'postres_premium',
    accent: '#EC3F7A',
    favicon: '/favicon.svg?v=5',
    enabled: true,
    sellable: true,
  },
  {
    id: 'donuts',
    name: 'Donuts para WhatsApp',
    kitName: 'Kit Donuts para WhatsApp',
    short: 'Donuts',
    emoji: '🍩',
    unitSingular: 'donut',
    unitPlural: 'donuts',
    unitLabel: 'Donuts por día',
    landingPath: '/donuts',
    upsellPath: '/donuts/upsell',
    checkoutUrl: '#',
    priceLabel: 'US$7,49',
    mainField: 'hasDonuts',
    premiumField: 'hasDonutsPremium',
    queryKey: 'donuts',
    premiumQueryKey: 'donuts_premium',
    accent: '#D97706',
    favicon: '/favicon.svg?v=5',
    enabled: false,
    sellable: false,
  },
  {
    id: 'minipostres',
    name: 'Mini Postres Fríos Sin Horno',
    kitName: 'Mini Postres Fríos Sin Horno',
    short: 'Mini Postres',
    emoji: '🧁',
    unitSingular: 'mini postre',
    unitPlural: 'mini postres',
    unitLabel: 'Mini postres por día',
    /** Unified into Postres; keep id for legacy grants / analytics only */
    landingPath: '/postres',
    upsellPath: '/postres/upsell',
    checkoutUrl: POSTRES_CHECKOUT,
    priceLabel: POSTRES_PRICE,
    mainField: 'hasMinipostres',
    premiumField: 'hasMinipostresPremium',
    queryKey: 'minipostres',
    premiumQueryKey: 'minipostres_premium',
    accent: '#EC3F7A',
    favicon: '/favicon.svg?v=5',
    enabled: false,
    sellable: false,
  },
];

export const PRODUCT_LINE_BY_ID = Object.fromEntries(PRODUCT_LINES.map((l) => [l.id, l]));

/** Ordem fixa no topbar: ativos + teasers (ex.: Donuts en breve). */
export const TOPBAR_LINE_IDS = ['paletas', 'postres', 'donuts'];

export function getTopbarLines() {
  return TOPBAR_LINE_IDS.map((id) => PRODUCT_LINE_BY_ID[id]).filter(Boolean);
}

export function getEnabledLines() {
  return PRODUCT_LINES.filter((l) => l.enabled);
}

export function getLineById(id) {
  return PRODUCT_LINE_BY_ID[id] || null;
}

function lineFromParams(params) {
  const explicit = params.get('line');
  if (explicit && PRODUCT_LINE_BY_ID[explicit]?.enabled) {
    return PRODUCT_LINE_BY_ID[explicit];
  }

  for (const line of getEnabledLines()) {
    if (params.get(line.queryKey) === '1') return line;
    if (line.premiumQueryKey && params.get(line.premiumQueryKey) === '1' && line.id !== 'paletas') {
      return line;
    }
  }

  // premium=1 alone is Paletas premium
  if (params.get('premium') === '1') return PRODUCT_LINE_BY_ID.paletas;

  return null;
}

/** Infer product line from auth path (/postres/cadastrar, /postres/login). */
export function resolveLineFromPathname(pathname = typeof window !== 'undefined' ? window.location.pathname : '') {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  if (path === '/postres/cadastrar' || path === '/postres/login') {
    return PRODUCT_LINE_BY_ID.postres;
  }
  return null;
}

/** Infer product line from URL search (?line= / purchase flags / nested ?next=). */
export function resolveLineFromSearch(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search.startsWith('?') || !search ? search : `?${search}`);
  const direct = lineFromParams(params);
  if (direct) return direct;

  // Guest redirect embeds original URL in ?next=/app?line=postres
  const next = params.get('next');
  if (next && next.startsWith('/')) {
    try {
      const nested = new URL(next, 'https://example.local');
      const fromNext = lineFromParams(nested.searchParams);
      if (fromNext) return fromNext;
    } catch {
      /* ignore bad next */
    }
  }

  return null;
}

export function rememberActiveLine(lineId) {
  if (!lineId || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(ACTIVE_LINE_STORAGE_KEY, lineId);
  } catch {
    /* ignore */
  }
}

export function readRememberedLineId() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return sessionStorage.getItem(ACTIVE_LINE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function profileOwnsLine(profile, line) {
  if (!profile || !line) return false;
  if (line.id === 'postres') {
    return Boolean(
      profile.hasPostres ||
        profile.hasPostresPremium ||
        profile.hasMinipostres ||
        profile.hasMinipostresPremium
    );
  }
  return Boolean(profile[line.mainField] || profile[line.premiumField]);
}

export function ownedLinesFromProfile(profile) {
  return getEnabledLines().filter((line) => profileOwnsLine(profile, line));
}

/**
 * Pick active line: URL → session → first owned → default paletas.
 */
export function resolveActiveLine({ search, profile, preferredId } = {}) {
  const fromUrl = resolveLineFromSearch(search);
  const owned = ownedLinesFromProfile(profile);
  const ownedIds = new Set(owned.map((l) => l.id));

  if (fromUrl && (ownedIds.has(fromUrl.id) || !profile || owned.length === 0)) {
    rememberActiveLine(fromUrl.id);
    return fromUrl;
  }

  const preferred = preferredId || readRememberedLineId();
  if (preferred && ownedIds.has(preferred)) {
    return PRODUCT_LINE_BY_ID[preferred];
  }

  if (owned.length > 0) {
    rememberActiveLine(owned[0].id);
    return owned[0];
  }

  return PRODUCT_LINE_BY_ID.paletas;
}

export function crossSellLines(profile) {
  return getEnabledLines().filter((line) => line.sellable && !profileOwnsLine(profile, line));
}

export function premiumStorageKey(lineId = 'paletas') {
  return `kit_premium_${lineId}_v1`;
}

/** Legacy key used before multi-product, only maps to Paletas. */
export const LEGACY_PREMIUM_STORAGE_KEY = 'paletas_premium';

export function authHomeHref(line) {
  return line?.landingPath || '/';
}

export function withLineQuery(path, lineId) {
  const url = new URL(path, 'https://example.local');
  if (lineId) url.searchParams.set('line', lineId);
  return `${url.pathname}${url.search}`;
}
