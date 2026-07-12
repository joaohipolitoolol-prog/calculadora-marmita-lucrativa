/** Paletas entry A/B aggregation helpers (summary + daily). */

export const AB_VARIANTS = new Set(['lp', 'quiz']);

export const AB_METRICS = new Set([
  'assign',
  'view',
  'quiz_start',
  'quiz_complete',
  'checkout',
  'purchase',
]);

export function normalizeAbVariant(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  if (v === 'lp' || v === 'quiz') return v;
  if (v === 'ab_lp') return 'lp';
  if (v === 'ab_quiz') return 'quiz';
  return null;
}

export function emptyAbArm() {
  return {
    assign: { total: 0, today: 0 },
    view: { total: 0, today: 0 },
    quiz_start: { total: 0, today: 0 },
    quiz_complete: { total: 0, today: 0 },
    checkout: { total: 0, today: 0 },
    purchase: { total: 0, today: 0 },
  };
}

export function emptyAbEntry() {
  return {
    lp: emptyAbArm(),
    quiz: emptyAbArm(),
  };
}

function ensureSummaryAb(summary) {
  if (!summary.ab) summary.ab = {};
  if (!summary.ab.paletas) summary.ab.paletas = {};
  if (!summary.ab.paletas.entry) summary.ab.paletas.entry = {};
  for (const variant of AB_VARIANTS) {
    if (!summary.ab.paletas.entry[variant]) {
      summary.ab.paletas.entry[variant] = emptyAbArm();
    } else {
      const arm = summary.ab.paletas.entry[variant];
      for (const metric of AB_METRICS) {
        if (!arm[metric] || typeof arm[metric] !== 'object') {
          arm[metric] = { total: Number(arm[metric]) || 0, today: 0 };
        } else {
          arm[metric].total = Number(arm[metric].total) || 0;
          arm[metric].today = Number(arm[metric].today) || 0;
        }
      }
    }
  }
  return summary.ab.paletas.entry;
}

function ensureDailyAb(daily) {
  if (!daily.ab) daily.ab = {};
  if (!daily.ab.paletas) daily.ab.paletas = {};
  if (!daily.ab.paletas.entry) daily.ab.paletas.entry = {};
  for (const variant of AB_VARIANTS) {
    if (!daily.ab.paletas.entry[variant]) {
      daily.ab.paletas.entry[variant] = {};
    }
  }
  return daily.ab.paletas.entry;
}

/** Reset today counters for AB arms (day rollover). */
export function resetAbToday(summary) {
  if (!summary?.ab?.paletas?.entry) return;
  for (const variant of AB_VARIANTS) {
    const arm = summary.ab.paletas.entry[variant];
    if (!arm) continue;
    for (const metric of AB_METRICS) {
      if (arm[metric] && typeof arm[metric] === 'object') {
        arm[metric].today = 0;
      }
    }
  }
}

/**
 * Bump a funnel metric for an arm on summary + daily.
 * @returns {boolean}
 */
export function bumpAbMetric(summary, daily, variant, metric) {
  const ab = normalizeAbVariant(variant);
  if (!ab || !AB_METRICS.has(metric)) return false;

  const entry = ensureSummaryAb(summary);
  const arm = entry[ab];
  if (!arm[metric]) arm[metric] = { total: 0, today: 0 };
  arm[metric].total = (arm[metric].total || 0) + 1;
  arm[metric].today = (arm[metric].today || 0) + 1;

  if (daily) {
    const dayEntry = ensureDailyAb(daily);
    dayEntry[ab][metric] = (dayEntry[ab][metric] || 0) + 1;
  }
  return true;
}

/** Map ingested event → AB metric name (or null). */
export function metricForAbEvent(event, { page, ctaId } = {}) {
  if (event === 'ab_assign') {
    // Only first sticky assign; sticky/override re-fires are ignored for funnel
    return ctaId === 'assign' || ctaId === 'gate' ? 'assign' : null;
  }
  if (event === 'page_view') return 'view';
  if (event === 'diagnostico_quiz_start') return 'quiz_start';
  if (event === 'diagnostico_view_offer') return 'quiz_complete';
  if (event === 'checkout_click') return 'checkout';
  if (event === 'purchase') return 'purchase';
  return null;
}

/** Public shape for admin analytics API. */
export function publicAbEntry(rawEntry = {}) {
  const out = emptyAbEntry();
  for (const variant of AB_VARIANTS) {
    const src = rawEntry[variant] || {};
    for (const metric of AB_METRICS) {
      const cell = src[metric];
      if (cell && typeof cell === 'object') {
        out[variant][metric] = {
          total: Number(cell.total) || 0,
          today: Number(cell.today) || 0,
        };
      } else if (typeof cell === 'number') {
        out[variant][metric] = { total: cell, today: 0 };
      }
    }
  }
  return out;
}

export function rate(num, den) {
  const n = Number(num) || 0;
  const d = Number(den) || 0;
  if (d <= 0) return 0;
  return Math.round((n / d) * 1000) / 10;
}
