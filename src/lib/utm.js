/**
 * Capture & preserve attribution params across checkout redirects.
 * Keys: utm_*, fbclid, ttclid, gclid
 */

export const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'ttclid',
  'gclid',
];

const STORAGE_KEY = 'mp_attribution_v1';

function safeParse(raw) {
  try {
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/** Read attribution from current URL query. */
export function readAttributionFromSearch(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search.startsWith('?') || !search ? search : `?${search}`);
  const out = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

/** Persist attribution in sessionStorage (merge; newer query wins). */
export function captureAttribution(search) {
  if (typeof sessionStorage === 'undefined') return {};
  const fromUrl = readAttributionFromSearch(search);
  let stored = {};
  try {
    stored = safeParse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    stored = {};
  }
  const merged = { ...stored, ...fromUrl };
  try {
    if (Object.keys(merged).length) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
  } catch {
    /* ignore */
  }
  return merged;
}

/** Load stored attribution (or capture from URL first). */
export function getAttribution() {
  const captured = captureAttribution();
  if (Object.keys(captured).length) return captured;
  if (typeof sessionStorage === 'undefined') return {};
  try {
    return safeParse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Append attribution params to a checkout URL without duplicating existing keys.
 */
export function withAttribution(url, attribution = getAttribution()) {
  if (!url || url === '#' || /COLOCAR_LINK|SEU-LINK/.test(url)) return url;
  try {
    const base = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://example.local');
    for (const [key, value] of Object.entries(attribution || {})) {
      if (!value || !ATTRIBUTION_KEYS.includes(key)) continue;
      if (!base.searchParams.has(key)) {
        base.searchParams.set(key, value);
      }
    }
    // Absolute URLs keep origin; relative stay path+search
    if (/^https?:\/\//i.test(url)) return base.toString();
    return `${base.pathname}${base.search}${base.hash}`;
  } catch {
    return url;
  }
}
