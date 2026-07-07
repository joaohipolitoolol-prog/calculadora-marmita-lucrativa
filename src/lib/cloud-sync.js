import { db, isFirebaseConfigured } from './firebase.js';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

function calculatorRef(uid) {
  return doc(db, 'users', uid, 'private', 'calculator');
}

function scenarioRef(uid, id) {
  return doc(db, 'users', uid, 'scenarios', id);
}

export function canCloudSync() {
  return isFirebaseConfigured && Boolean(db);
}

export async function loadCloudCalculator(uid) {
  if (!canCloudSync() || !uid) return null;
  try {
    const snap = await getDoc(calculatorRef(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      draft: data.draft || null,
      checklist: Array.isArray(data.checklist) ? data.checklist : [],
      updatedAt: data.updatedAt?.toMillis?.() || 0,
    };
  } catch {
    return null;
  }
}

export async function saveCloudCalculator(uid, { draft, checklist }) {
  if (!canCloudSync() || !uid) return;
  try {
    await setDoc(
      calculatorRef(uid),
      {
        draft: draft || null,
        checklist: checklist || [],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    /* offline or rules — localStorage remains source of truth */
  }
}

export async function listCloudScenarios(uid) {
  if (!canCloudSync() || !uid) return [];
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'scenarios'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  } catch {
    return [];
  }
}

export async function saveCloudScenario(uid, scenario) {
  if (!canCloudSync() || !uid || !scenario?.id) return;
  try {
    await setDoc(
      scenarioRef(uid, scenario.id),
      {
        name: scenario.name || 'Escenario',
        inputs: scenario.inputs,
        results: scenario.results,
        createdAt: scenario.createdAt || new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    /* ignore */
  }
}

export async function deleteCloudScenario(uid, id) {
  if (!canCloudSync() || !uid || !id) return;
  try {
    await deleteDoc(scenarioRef(uid, id));
  } catch {
    /* ignore */
  }
}

export async function mergeScenarios(localList, cloudList) {
  const map = new Map();
  [...cloudList, ...localList].forEach((item) => {
    if (!item?.id) return;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }
    const existingTime = Date.parse(existing.createdAt || 0);
    const itemTime = Date.parse(item.createdAt || 0);
    map.set(item.id, itemTime >= existingTime ? item : existing);
  });
  return [...map.values()]
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
    .slice(0, 20);
}

export async function pushLocalScenariosToCloud(uid, localList) {
  if (!canCloudSync() || !uid || !localList.length) return;
  try {
    const batch = writeBatch(db);
    localList.slice(0, 20).forEach((item) => {
      batch.set(
        scenarioRef(uid, item.id),
        {
          name: item.name || 'Escenario',
          inputs: item.inputs,
          results: item.results,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
    await batch.commit();
  } catch {
    /* ignore */
  }
}
