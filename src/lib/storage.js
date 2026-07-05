import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.js';

function scenariosRef(uid) {
  if (!db) throw new Error('Firestore indisponível.');
  return collection(db, 'users', uid, 'scenarios');
}

export async function saveScenario(uid, payload) {
  if (!isFirebaseConfigured) {
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

  const ref = await addDoc(scenariosRef(uid), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...payload };
}

export async function listScenarios(uid) {
  if (!isFirebaseConfigured) {
    const key = `marmita_scenarios_${uid}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  const q = query(scenariosRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteScenario(uid, id) {
  if (!isFirebaseConfigured) {
    const key = `marmita_scenarios_${uid}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(
      key,
      JSON.stringify(list.filter((item) => item.id !== id))
    );
    return;
  }

  await deleteDoc(doc(db, 'users', uid, 'scenarios', id));
}

export async function saveUserProfile(uid, data) {
  if (!isFirebaseConfigured) {
    localStorage.setItem(`marmita_profile_${uid}`, JSON.stringify(data));
    return;
  }

  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export async function loadDraft(uid) {
  const raw = localStorage.getItem(`marmita_draft_${uid}`);
  return raw ? JSON.parse(raw) : null;
}

export function saveDraft(uid, inputs) {
  localStorage.setItem(`marmita_draft_${uid}`, JSON.stringify(inputs));
}

export function clearDraft(uid) {
  localStorage.removeItem(`marmita_draft_${uid}`);
}
