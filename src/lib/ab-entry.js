/**
 * Client-side Paletas entry A/B, sticky assign + optional redirect to quiz.
 */

import { trackEvent } from './track.js';

export const AB_STORAGE_KEY = 'ab_paletas_entry';
export const AB_ASSIGNED_KEY = 'ab_paletas_assigned';

const FETCH_MS = 1800;

/**
 * Show LP after gate (first visit) and fire Meta PageView once if deferred.
 */
export function revealLanding() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const wasPending = root.classList.contains('ab-pending');
  root.classList.remove('ab-pending');
  root.classList.add('ab-ready');
  if (!wasPending) return;
  try {
    if (typeof window.fbq === 'function' && !window.__abLpPageView) {
      window.__abLpPageView = true;
      window.fbq('track', 'PageView');
    }
  } catch {
    /* ignore */
  }
}

/**
 * @returns {'lp'|'quiz'|null}
 */
export function readStickyVariant() {
  try {
    const v = localStorage.getItem(AB_STORAGE_KEY);
    if (v === 'lp' || v === 'quiz') return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Sticky variant for analytics payloads. */
export function getPaletasAb() {
  return readStickyVariant();
}

/**
 * @param {'lp'|'quiz'} variant
 */
export function writeStickyVariant(variant) {
  if (variant !== 'lp' && variant !== 'quiz') return;
  try {
    localStorage.setItem(AB_STORAGE_KEY, variant);
  } catch {
    /* ignore */
  }
}

function hasRecordedAssign() {
  try {
    return localStorage.getItem(AB_ASSIGNED_KEY) === '1';
  } catch {
    return false;
  }
}

function markAssignRecorded() {
  try {
    localStorage.setItem(AB_ASSIGNED_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Fire ab_assign once per visitor (first sticky write).
 * @param {'lp'|'quiz'} variant
 * @param {'assign'|'sticky'|'override'|'gate'} source
 */
export function trackAbAssignOnce(variant, source = 'assign') {
  if (variant !== 'lp' && variant !== 'quiz') return;
  if (hasRecordedAssign()) return;
  markAssignRecorded();
  trackEvent('ab_assign', {
    page: variant === 'quiz' ? 'diagnostico' : 'home',
    line: 'paletas',
    purpose: variant,
    ab: variant,
    ctaId: source === 'override' || source === 'sticky' ? 'assign' : source,
  });
}

/**
 * Ensure quiz visitors redirected by head gate still get assign counted once.
 * Call from /diagnostico boot. Organic /diagnostico (no sticky) is not counted as experiment assign.
 */
export function ensureQuizAbTracking() {
  const sticky = readStickyVariant();
  if (sticky === 'quiz') {
    trackAbAssignOnce('quiz', 'gate');
    return 'quiz';
  }
  return sticky;
}

/**
 * @param {string} search
 * @returns {'lp'|'quiz'|null}
 */
export function parseEntryOverride(search) {
  try {
    const params = new URLSearchParams(search || '');
    const v = String(params.get('v') || '').toLowerCase();
    if (v === 'lp' || v === 'quiz') return v;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {{ enabled?: boolean, quizPercent?: number }} entry
 * @returns {'lp'|'quiz'}
 */
export function assignVariant(entry = {}) {
  if (!entry.enabled) return 'lp';
  const pct = Math.max(0, Math.min(100, Number(entry.quizPercent) || 0));
  if (pct <= 0) return 'lp';
  if (pct >= 100) return 'quiz';
  const roll = Math.floor(Math.random() * 100);
  return roll < pct ? 'quiz' : 'lp';
}

/**
 * Append Hotmart sck for purchase attribution.
 * @param {string} url
 * @param {'lp'|'quiz'|null} [ab]
 */
export function withAbCheckoutParam(url, ab = readStickyVariant()) {
  if (!url) return url;
  const sck = ab === 'quiz' ? 'ab_quiz' : ab === 'lp' ? 'ab_lp' : null;
  if (!sck) return url;
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://local');
    u.searchParams.set('sck', sck);
    return u.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}sck=${encodeURIComponent(sck)}`;
  }
}

async function fetchEntryConfig() {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => {
    try {
      ctrl?.abort();
    } catch {
      /* ignore */
    }
  }, FETCH_MS);
  try {
    const res = await fetch('/api/experiments', {
      credentials: 'omit',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: ctrl?.signal,
    });
    if (!res.ok) return { enabled: false, quizPercent: 0 };
    const data = await res.json();
    return data?.paletas?.entry || { enabled: false, quizPercent: 0 };
  } catch {
    return { enabled: false, quizPercent: 0 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Clear sticky quiz when the entry experiment is off so / is reachable again.
 */
function clearStickyIfExperimentOff(entry) {
  if (entry?.enabled) return false;
  try {
    const sticky = localStorage.getItem(AB_STORAGE_KEY);
    if (sticky === 'quiz') {
      localStorage.setItem(AB_STORAGE_KEY, 'lp');
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Resolve entry variant for `/`. May redirect to /diagnostico.
 * @returns {Promise<{ variant: 'lp'|'quiz', quizPercent: number, source: string, redirected: boolean }>}
 */
export async function resolvePaletasEntryAb() {
  if (typeof window === 'undefined') {
    return { variant: 'lp', quizPercent: 0, source: 'ssr', redirected: false };
  }

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path !== '/') {
    return { variant: 'lp', quizPercent: 0, source: 'skip', redirected: false };
  }

  const override = parseEntryOverride(window.location.search);
  if (override) {
    writeStickyVariant(override);
    trackAbAssignOnce(override, 'assign');
    if (override === 'quiz') {
      window.location.replace('/diagnostico');
      return { variant: 'quiz', quizPercent: 100, source: 'override', redirected: true };
    }
    revealLanding();
    return { variant: 'lp', quizPercent: 0, source: 'override', redirected: false };
  }

  const entry = await fetchEntryConfig();
  const experimentOn = Boolean(entry?.enabled);

  // Experiment off → never force quiz (fixes sticky lock when A/B is disabled)
  if (!experimentOn) {
    clearStickyIfExperimentOff(entry);
    revealLanding();
    return {
      variant: 'lp',
      quizPercent: Number(entry.quizPercent) || 0,
      source: 'disabled',
      redirected: false,
    };
  }

  const sticky = readStickyVariant();
  if (sticky) {
    if (sticky === 'quiz') {
      window.location.replace('/diagnostico');
      return { variant: 'quiz', quizPercent: 0, source: 'sticky', redirected: true };
    }
    revealLanding();
    return { variant: 'lp', quizPercent: 0, source: 'sticky', redirected: false };
  }

  const variant = assignVariant(entry);
  writeStickyVariant(variant);
  trackAbAssignOnce(variant, 'assign');

  if (variant === 'quiz') {
    window.location.replace('/diagnostico');
    return {
      variant: 'quiz',
      quizPercent: Number(entry.quizPercent) || 0,
      source: 'assign',
      redirected: true,
    };
  }

  revealLanding();
  return {
    variant: 'lp',
    quizPercent: Number(entry.quizPercent) || 0,
    source: 'assign',
    redirected: false,
  };
}
