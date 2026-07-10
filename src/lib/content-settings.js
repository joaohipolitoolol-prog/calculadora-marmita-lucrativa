import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getEnabledLines } from './product-lines.js';

const DOC_PATH = ['settings', 'content'];

export const DEFAULT_LINE_FLAGS = {
  kitOpen: true,
  premiumOpen: true,
  audioGuideOpen: true,
};

function defaultSettings() {
  const lines = {};
  for (const line of getEnabledLines()) {
    lines[line.id] = { ...DEFAULT_LINE_FLAGS };
  }
  return { lines, updatedAt: 0 };
}

let cache = defaultSettings();

export function getContentSettings() {
  return cache;
}

export function normalizeContentSettings(raw = {}) {
  const base = defaultSettings();
  const lines = raw.lines && typeof raw.lines === 'object' ? raw.lines : raw;
  for (const line of getEnabledLines()) {
    const entry = lines[line.id] || {};
    base.lines[line.id] = {
      kitOpen: entry.kitOpen !== false,
      premiumOpen: entry.premiumOpen !== false,
      audioGuideOpen: entry.audioGuideOpen !== false,
    };
  }
  base.updatedAt = Number(raw.updatedAt) || 0;
  return base;
}

export function isLineKitOpen(lineId, settings = cache) {
  return settings.lines[lineId]?.kitOpen !== false;
}

export function isLinePremiumOpen(lineId, settings = cache) {
  return settings.lines[lineId]?.premiumOpen !== false;
}

export function isLineAudioGuideOpen(lineId, settings = cache) {
  return settings.lines[lineId]?.audioGuideOpen !== false;
}

export async function loadContentSettings() {
  if (!isFirebaseConfigured || !db) {
    cache = defaultSettings();
    return cache;
  }

  try {
    const snap = await getDoc(doc(db, ...DOC_PATH));
    if (snap.exists()) {
      const data = snap.data();
      cache = normalizeContentSettings({
        lines: data.lines,
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
      });
      return cache;
    }
  } catch {
    /* use defaults */
  }

  cache = defaultSettings();
  return cache;
}

export async function saveContentSettings(patch) {
  const mergedLines = { ...cache.lines };
  for (const [lineId, flags] of Object.entries(patch || {})) {
    mergedLines[lineId] = {
      ...mergedLines[lineId],
      ...flags,
    };
  }

  const next = normalizeContentSettings({
    lines: mergedLines,
    updatedAt: Date.now(),
  });

  if (!isFirebaseConfigured || !db) {
    cache = next;
    return { ok: true, settings: cache, cloud: false };
  }

  try {
    await setDoc(
      doc(db, ...DOC_PATH),
      {
        lines: next.lines,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    cache = next;
    return { ok: true, settings: cache, cloud: true };
  } catch (err) {
    return { ok: false, settings: cache, error: err };
  }
}
