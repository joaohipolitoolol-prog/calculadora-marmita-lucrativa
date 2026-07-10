import { canCloudSync, loadCloudCalculator, mergeScenarios, listCloudScenarios, saveCloudCalculator, saveCloudScenario, deleteCloudScenario, pushLocalScenariosToCloud } from './cloud-sync.js';

const SCENARIO_PREFIX = 'paletas_scenarios_';
const DRAFT_PREFIX = 'paletas_draft_';
const LEGACY_SCENARIO_PREFIX = 'marmita_scenarios_';
const LEGACY_DRAFT_PREFIX = 'marmita_draft_';

let draftSyncTimer = null;

function scenarioKey(uid) {
  return `${SCENARIO_PREFIX}${uid}`;
}

function draftKey(uid) {
  return `${DRAFT_PREFIX}${uid}`;
}

function migrateLegacy(uid) {
  const legacyScenario = `${LEGACY_SCENARIO_PREFIX}${uid}`;
  const legacyDraft = `${LEGACY_DRAFT_PREFIX}${uid}`;
  const nextScenario = scenarioKey(uid);
  const nextDraft = draftKey(uid);

  if (!localStorage.getItem(nextScenario) && localStorage.getItem(legacyScenario)) {
    localStorage.setItem(nextScenario, localStorage.getItem(legacyScenario));
  }
  if (!localStorage.getItem(nextDraft) && localStorage.getItem(legacyDraft)) {
    localStorage.setItem(nextDraft, localStorage.getItem(legacyDraft));
  }
}

function normalizeDraftEntry(entry) {
  if (!entry) return null;
  if (entry.inputs) {
    return {
      inputMode: entry.inputMode || 'full',
      inputs: entry.inputs,
      savedAt: entry.savedAt || 0,
    };
  }
  return { inputMode: 'full', inputs: entry, savedAt: 0 };
}

function readRawDraftStore(uid) {
  migrateLegacy(uid);
  const raw = localStorage.getItem(draftKey(uid));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Normalize legacy flat draft or v2 byLine store into { byLine, activeLineId }. */
export function normalizeDraftStore(parsed) {
  if (!parsed) return { byLine: {}, activeLineId: 'paletas' };

  if (parsed.byLine && typeof parsed.byLine === 'object') {
    const byLine = {};
    for (const [lineId, entry] of Object.entries(parsed.byLine)) {
      const normalized = normalizeDraftEntry(entry);
      if (normalized) byLine[lineId] = normalized;
    }
    return {
      byLine,
      activeLineId: parsed.activeLineId || parsed.lineId || 'paletas',
    };
  }

  const legacy = normalizeDraftEntry(parsed);
  if (!legacy) return { byLine: {}, activeLineId: 'paletas' };
  const lineId = parsed.lineId || 'paletas';
  return {
    byLine: { [lineId]: legacy },
    activeLineId: lineId,
  };
}

function writeDraftStore(uid, store, syncLineId) {
  migrateLegacy(uid);
  const lineId = syncLineId || store.activeLineId || 'paletas';
  const active = store.byLine[lineId] || Object.values(store.byLine)[0] || null;
  const withMeta = {
    version: 2,
    byLine: store.byLine,
    activeLineId: lineId,
    lineId,
    inputMode: active?.inputMode || 'full',
    inputs: active?.inputs || null,
    savedAt: Date.now(),
  };
  localStorage.setItem(draftKey(uid), JSON.stringify(withMeta));
  scheduleCloudDraftSync(uid, withMeta);
  return withMeta;
}

function checklistStorageKey(uid) {
  return `paletas_checklist_${uid}`;
}

function scheduleCloudDraftSync(uid, payload) {
  if (!canCloudSync()) return;
  clearTimeout(draftSyncTimer);
  draftSyncTimer = setTimeout(() => {
    const checklist = JSON.parse(localStorage.getItem(checklistStorageKey(uid)) || '[]');
    saveCloudCalculator(uid, { draft: payload, checklist });
  }, 800);
}

export async function saveScenario(uid, payload) {
  migrateLegacy(uid);
  const key = scenarioKey(uid);
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const item = {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
  };
  list.unshift(item);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 20)));
  await saveCloudScenario(uid, item);
  return item;
}

export async function listScenarios(uid) {
  migrateLegacy(uid);
  const local = JSON.parse(localStorage.getItem(scenarioKey(uid)) || '[]');
  if (!canCloudSync()) return local;

  const cloud = await listCloudScenarios(uid);
  if (!cloud.length) {
    if (local.length) await pushLocalScenariosToCloud(uid, local);
    return local;
  }
  const merged = await mergeScenarios(local, cloud);
  localStorage.setItem(scenarioKey(uid), JSON.stringify(merged));
  return merged;
}

export async function deleteScenario(uid, id) {
  migrateLegacy(uid);
  const key = scenarioKey(uid);
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  localStorage.setItem(
    key,
    JSON.stringify(list.filter((item) => item.id !== id))
  );
  await deleteCloudScenario(uid, id);
}

export async function loadDraftStore(uid) {
  let localStore = normalizeDraftStore(readRawDraftStore(uid));

  if (!canCloudSync()) return localStore;

  const cloud = await loadCloudCalculator(uid);
  if (cloud?.checklist?.length) {
    localStorage.setItem(checklistStorageKey(uid), JSON.stringify(cloud.checklist));
  }

  if (!cloud?.draft) return localStore;

  const cloudStore = normalizeDraftStore(cloud.draft);
  const cloudTime = cloud.updatedAt || cloud.draft.savedAt || 0;
  const localTimes = Object.values(localStore.byLine).map((d) => d.savedAt || 0);
  const localTime = localTimes.length ? Math.max(...localTimes) : 0;

  if (!Object.keys(localStore.byLine).length || cloudTime > localTime) {
    // Merge: prefer newer per-line entries
    const merged = { byLine: { ...localStore.byLine }, activeLineId: cloudStore.activeLineId || localStore.activeLineId };
    for (const [lineId, entry] of Object.entries(cloudStore.byLine)) {
      const localEntry = merged.byLine[lineId];
      if (!localEntry || (entry.savedAt || cloudTime) >= (localEntry.savedAt || 0)) {
        merged.byLine[lineId] = entry;
      }
    }
    writeDraftStore(uid, merged, merged.activeLineId);
    return merged;
  }

  return localStore;
}

/** @deprecated Prefer loadDraftForLine — returns active/legacy flat draft for bootstrap compat. */
export async function loadDraft(uid, lineId = 'paletas') {
  const store = await loadDraftStore(uid);
  return store.byLine[lineId] || store.byLine.paletas || null;
}

export function loadDraftForLineSync(uid, lineId) {
  const store = normalizeDraftStore(readRawDraftStore(uid));
  return store.byLine[lineId] || null;
}

export function getDraftStoreSync(uid) {
  return normalizeDraftStore(readRawDraftStore(uid));
}

export function saveDraft(uid, payload, lineId = 'paletas') {
  const store = normalizeDraftStore(readRawDraftStore(uid));
  store.byLine[lineId] = {
    inputMode: payload.inputMode || 'full',
    inputs: payload.inputs,
    savedAt: Date.now(),
  };
  store.activeLineId = lineId;
  return writeDraftStore(uid, store, lineId);
}

export function saveChecklistToCloud(uid) {
  if (!canCloudSync()) return;
  const checklist = JSON.parse(localStorage.getItem(checklistStorageKey(uid)) || '[]');
  const raw = readRawDraftStore(uid);
  saveCloudCalculator(uid, { draft: raw, checklist });
}

export function clearDraft(uid) {
  migrateLegacy(uid);
  localStorage.removeItem(draftKey(uid));
  localStorage.removeItem(`${LEGACY_DRAFT_PREFIX}${uid}`);
  if (canCloudSync()) saveCloudCalculator(uid, { draft: null, checklist: [] });
}

export function clearScenarios(uid) {
  migrateLegacy(uid);
  localStorage.removeItem(scenarioKey(uid));
  localStorage.removeItem(`${LEGACY_SCENARIO_PREFIX}${uid}`);
}
