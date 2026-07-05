export async function saveScenario(uid, payload) {
  const key = `marmita_scenarios_${uid}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const item = {
    id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
  };
  list.unshift(item);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 20)));
  return item;
}

export async function listScenarios(uid) {
  const key = `marmita_scenarios_${uid}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

export async function deleteScenario(uid, id) {
  const key = `marmita_scenarios_${uid}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  localStorage.setItem(
    key,
    JSON.stringify(list.filter((item) => item.id !== id))
  );
}

export async function loadDraft(uid) {
  const raw = localStorage.getItem(`marmita_draft_${uid}`);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (parsed?.inputs) return parsed;
  return { inputMode: 'full', inputs: parsed };
}

export function saveDraft(uid, payload) {
  localStorage.setItem(`marmita_draft_${uid}`, JSON.stringify(payload));
}

export function clearDraft(uid) {
  localStorage.removeItem(`marmita_draft_${uid}`);
}
