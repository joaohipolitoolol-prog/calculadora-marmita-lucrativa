/**
 * A/B experiments — admin-controlled entry split (Paletas quiz vs LP).
 * Firestore: settings/experiments
 */

import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  DEFAULT_PALETAS_ENTRY,
  normalizeExperiments,
  normalizePaletasEntry,
  publicExperimentsPayload,
} from './experiments-config.js';

export {
  DEFAULT_PALETAS_ENTRY,
  normalizeExperiments,
  normalizePaletasEntry,
  publicExperimentsPayload,
};

const DOC_PATH = ['settings', 'experiments'];

function defaultExperiments() {
  return normalizeExperiments({});
}

let cache = defaultExperiments();

export function getExperiments() {
  return cache;
}

export async function loadExperiments() {
  if (!isFirebaseConfigured || !db) {
    cache = defaultExperiments();
    return cache;
  }

  try {
    const snap = await getDoc(doc(db, ...DOC_PATH));
    if (snap.exists()) {
      const data = snap.data();
      cache = normalizeExperiments({
        paletas: data.paletas,
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
      });
      return cache;
    }
  } catch {
    /* use defaults */
  }

  cache = defaultExperiments();
  return cache;
}

/**
 * @param {{ paletas?: { entry?: { enabled?: boolean, quizPercent?: number } } }} patch
 */
export function applyExperimentsLocal(patch = {}) {
  cache = normalizeExperiments({
    paletas: {
      entry: {
        ...cache.paletas.entry,
        ...(patch.paletas?.entry || {}),
      },
    },
    updatedAt: Date.now(),
  });
  return cache;
}

/**
 * @param {{ paletas?: { entry?: { enabled?: boolean, quizPercent?: number } } }} patch
 */
export async function saveExperiments(patch = {}) {
  const next = normalizeExperiments({
    paletas: {
      entry: {
        ...cache.paletas.entry,
        ...(patch.paletas?.entry || {}),
      },
    },
    updatedAt: Date.now(),
  });

  if (!isFirebaseConfigured || !db) {
    cache = next;
    return { ok: true, experiments: cache, cloud: false };
  }

  try {
    await setDoc(
      doc(db, ...DOC_PATH),
      {
        paletas: {
          entry: next.paletas.entry,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    cache = next;
    return { ok: true, experiments: cache, cloud: true };
  } catch (err) {
    return { ok: false, experiments: cache, error: err };
  }
}
