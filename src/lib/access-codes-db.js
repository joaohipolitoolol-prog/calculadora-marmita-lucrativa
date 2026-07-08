import { db, isFirebaseConfigured } from './firebase.js';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

function normalizeCode(code) {
  return String(code).trim().toLowerCase();
}

export async function validateAccessCodeFromDb(code) {
  const normalized = normalizeCode(code);
  const fallback = normalizeCode(import.meta.env.VITE_ACCESS_CODE || 'paletas27');

  if (!isFirebaseConfigured || !db) {
    return normalized === fallback
      ? { valid: true, type: 'kit', source: 'env' }
      : { valid: false };
  }

  const q = query(
    collection(db, 'accessCodes'),
    where('code', '==', normalized),
    where('active', '==', true)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const entry = snap.docs[0];
    const data = entry.data();
    const maxUses = data.maxUses;
    const usedCount = data.usedCount || 0;
    if (maxUses != null && usedCount >= maxUses) {
      return { valid: false, reason: 'Código agotado.' };
    }
    return {
      valid: true,
      type: data.type || 'kit',
      id: entry.id,
      hasPremium: data.type === 'premium' || data.type === 'both',
      source: 'firestore',
    };
  }

  if (normalized === fallback) {
    return { valid: true, type: 'kit', source: 'env' };
  }

  return { valid: false };
}

export async function consumeAccessCode(codeResult) {
  if (!codeResult?.id || !isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, 'accessCodes', codeResult.id), {
    usedCount: increment(1),
    lastUsedAt: serverTimestamp(),
  });
}

export async function listAccessCodes() {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(collection(db, 'accessCodes'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function createAccessCode({ code, type = 'kit', maxUses = null }) {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase no configurado.');
  const normalized = normalizeCode(code);
  const id = normalized.replace(/[^a-z0-9-]/g, '-');
  await setDoc(doc(db, 'accessCodes', id), {
    code: normalized,
    type,
    active: true,
    maxUses,
    usedCount: 0,
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function toggleAccessCode(id, active) {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, 'accessCodes', id), { active });
}

export async function deleteAccessCode(id) {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, 'accessCodes', id));
}
