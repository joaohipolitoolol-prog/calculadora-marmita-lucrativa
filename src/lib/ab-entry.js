/**
 * Client-side Paletas entry A/B — sticky assign + optional redirect to quiz.
 */

import { trackEvent } from './track.js';

export const AB_STORAGE_KEY = 'ab_paletas_entry';

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
    trackEvent('ab_assign', {
      page: 'home',
      line: 'paletas',
      purpose: override,
      ctaId: 'override',
    });
    if (override === 'quiz') {
      window.location.replace('/diagnostico');
      return { variant: 'quiz', quizPercent: 100, source: 'override', redirected: true };
    }
    revealLanding();
    return { variant: 'lp', quizPercent: 0, source: 'override', redirected: false };
  }

  const sticky = readStickyVariant();
  if (sticky) {
    trackEvent('ab_assign', {
      page: 'home',
      line: 'paletas',
      purpose: sticky,
      ctaId: 'sticky',
    });
    if (sticky === 'quiz') {
      window.location.replace('/diagnostico');
      return { variant: 'quiz', quizPercent: 0, source: 'sticky', redirected: true };
    }
    revealLanding();
    return { variant: 'lp', quizPercent: 0, source: 'sticky', redirected: false };
  }

  const entry = await fetchEntryConfig();
  const variant = assignVariant(entry);
  writeStickyVariant(variant);
  trackEvent('ab_assign', {
    page: 'home',
    line: 'paletas',
    purpose: variant,
    ctaId: 'assign',
  });

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
