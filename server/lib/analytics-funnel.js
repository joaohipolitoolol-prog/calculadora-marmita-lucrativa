/** Quiz funnel, dwell time, abandon, aggregated in analytics/summary. */

export const QUIZ_STEP_IDS = [
  'welcome',
  'q_experience',
  'q_blocker',
  'affirm_1',
  'q_channel',
  'q_start',
  'q_victory',
  'q_name',
  'loading',
  'diagnosis',
  'plan',
  'trust',
  'offer',
];

export const QUIZ_STEP_LABELS = {
  welcome: 'Inicio',
  q_experience: 'Experiencia',
  q_blocker: 'Bloqueo',
  affirm_1: 'Afirmacion',
  q_channel: 'Canal',
  q_start: 'Empezar',
  q_victory: 'Victoria',
  q_name: 'Nombre',
  loading: 'Cargando',
  diagnosis: 'Diagnostico',
  plan: 'Plan',
  trust: 'Confianza',
  offer: 'Oferta',
};

function emptyCounter() {
  return { total: 0, today: 0 };
}

function ensureStep(summary, stepId) {
  if (!summary.quiz_steps) summary.quiz_steps = {};
  if (!summary.quiz_steps[stepId]) {
    summary.quiz_steps[stepId] = { ...emptyCounter() };
  }
  return summary.quiz_steps[stepId];
}

function ensureDwell(summary, page) {
  if (!summary.dwell) summary.dwell = {};
  if (!summary.dwell[page]) {
    summary.dwell[page] = {
      sessions: 0,
      seconds: 0,
      todaySessions: 0,
      todaySeconds: 0,
    };
  }
  return summary.dwell[page];
}

function ensureAbandon(summary) {
  if (!summary.quiz_abandon) summary.quiz_abandon = { ...emptyCounter() };
  return summary.quiz_abandon;
}

export function resetFunnelToday(summary) {
  if (summary.quiz_steps) {
    for (const step of Object.values(summary.quiz_steps)) {
      if (step && typeof step === 'object') step.today = 0;
    }
  }
  if (summary.dwell) {
    for (const d of Object.values(summary.dwell)) {
      if (d && typeof d === 'object') {
        d.todaySessions = 0;
        d.todaySeconds = 0;
      }
    }
  }
  if (summary.quiz_abandon) summary.quiz_abandon.today = 0;
}

export function bumpQuizStep(summary, daily, stepId) {
  if (!stepId || !QUIZ_STEP_IDS.includes(stepId)) return false;
  const cell = ensureStep(summary, stepId);
  cell.total = (cell.total || 0) + 1;
  cell.today = (cell.today || 0) + 1;
  if (daily) {
    if (!daily.quiz_steps) daily.quiz_steps = {};
    daily.quiz_steps[stepId] = (daily.quiz_steps[stepId] || 0) + 1;
  }
  return true;
}

export function bumpPageDwell(summary, daily, page, seconds) {
  if (!page || !Number.isFinite(seconds) || seconds < 1) return false;
  const sec = Math.min(7200, Math.max(1, Math.round(seconds)));
  const cell = ensureDwell(summary, page);
  cell.sessions = (cell.sessions || 0) + 1;
  cell.seconds = (cell.seconds || 0) + sec;
  cell.todaySessions = (cell.todaySessions || 0) + 1;
  cell.todaySeconds = (cell.todaySeconds || 0) + sec;
  if (daily) {
    if (!daily.dwell) daily.dwell = {};
    if (!daily.dwell[page]) daily.dwell[page] = { sessions: 0, seconds: 0 };
    daily.dwell[page].sessions = (daily.dwell[page].sessions || 0) + 1;
    daily.dwell[page].seconds = (daily.dwell[page].seconds || 0) + sec;
  }
  return true;
}

export function bumpQuizAbandon(summary, daily) {
  const cell = ensureAbandon(summary);
  cell.total = (cell.total || 0) + 1;
  cell.today = (cell.today || 0) + 1;
  if (daily) {
    daily.quiz_abandon = (daily.quiz_abandon || 0) + 1;
  }
  return true;
}

export function avgDwellSeconds(cell) {
  if (!cell || !cell.sessions) return 0;
  return Math.round((cell.seconds || 0) / cell.sessions);
}

export function publicQuizSteps(raw = {}) {
  return QUIZ_STEP_IDS.map((id) => ({
    id,
    label: QUIZ_STEP_LABELS[id] || id,
    today: Number(raw[id]?.today) || 0,
    total: Number(raw[id]?.total) || 0,
  }));
}

export function publicDwell(raw = {}) {
  const out = {};
  for (const [page, cell] of Object.entries(raw || {})) {
    out[page] = {
      avgSeconds: avgDwellSeconds(cell),
      avgSecondsToday: cell.todaySessions
        ? Math.round((cell.todaySeconds || 0) / cell.todaySessions)
        : 0,
      sessions: Number(cell.sessions) || 0,
      todaySessions: Number(cell.todaySessions) || 0,
    };
  }
  return out;
}

/**
 * Drop % and bar width use the period count (`.today`), which matches the
 * highlighted number in the admin UI. `.total` stays as historical context.
 */
export function buildStepDropoff(steps) {
  const list = steps || [];
  if (!list.length) return [];
  const maxPeriod = Math.max(...list.map((s) => s.today || 0), 1);
  return list.map((step, i) => {
    const curr = Number(step.today) || 0;
    const prev = i > 0 ? Number(list[i - 1].today) || 0 : curr;
    const drop =
      i > 0 && prev > 0 ? Math.round(((prev - curr) / prev) * 1000) / 10 : 0;
    return {
      ...step,
      pctOfMax: Math.round((curr / maxPeriod) * 100),
      dropFromPrev: Math.max(0, drop),
    };
  });
}
