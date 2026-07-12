/** Shared experiment config normalize (no Firebase deps). */

export const DEFAULT_PALETAS_ENTRY = {
  enabled: false,
  quizPercent: 0,
};

export function normalizePaletasEntry(raw = {}) {
  const enabled = raw.enabled === true;
  let quizPercent = Number(raw.quizPercent);
  if (!Number.isFinite(quizPercent)) quizPercent = 0;
  quizPercent = Math.max(0, Math.min(100, Math.round(quizPercent)));
  return { enabled, quizPercent };
}

export function normalizeExperiments(raw = {}) {
  const paletas = raw.paletas && typeof raw.paletas === 'object' ? raw.paletas : {};
  const entry = paletas.entry && typeof paletas.entry === 'object' ? paletas.entry : paletas;
  return {
    paletas: {
      entry: normalizePaletasEntry(entry),
    },
    updatedAt: Number(raw.updatedAt) || 0,
  };
}

export function publicExperimentsPayload(experiments) {
  const e = normalizeExperiments(experiments || {});
  return {
    paletas: {
      entry: { ...e.paletas.entry },
    },
  };
}
