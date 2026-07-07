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

function readLocalDraft(uid) {
  migrateLegacy(uid);
  const raw = localStorage.getItem(draftKey(uid));
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (parsed?.inputs) return parsed;
  return { inputMode: 'full', inputs: parsed };
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

export async function loadDraft(uid) {
  const local = readLocalDraft(uid);
  if (!canCloudSync()) return local;

  const cloud = await loadCloudCalculator(uid);
  if (!cloud?.draft?.inputs) return local;

  const cloudDraft = cloud.draft;
  const localTime = local?.savedAt || 0;
  const cloudTime = cloud.updatedAt || 0;

  if (cloud.checklist?.length) {
    localStorage.setItem(checklistStorageKey(uid), JSON.stringify(cloud.checklist));
  }

  if (!local?.inputs || cloudTime > localTime) {
    const merged = { ...cloudDraft, savedAt: cloudTime };
    localStorage.setItem(draftKey(uid), JSON.stringify(merged));
    return merged;
  }

  return local;
}

export function saveDraft(uid, payload) {
  migrateLegacy(uid);
  const withMeta = { ...payload, savedAt: Date.now() };
  localStorage.setItem(draftKey(uid), JSON.stringify(withMeta));
  scheduleCloudDraftSync(uid, withMeta);
}

export function saveChecklistToCloud(uid) {
  if (!canCloudSync()) return;
  const checklist = JSON.parse(localStorage.getItem(checklistStorageKey(uid)) || '[]');
  const draft = readLocalDraft(uid);
  saveCloudCalculator(uid, { draft, checklist });
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
