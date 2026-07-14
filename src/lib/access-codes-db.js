import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.js';
import { auth } from './firebase.js';

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase();
}

/**
 * Redeem access code via server (Admin SDK). Never trusts client Firestore reads.
 * Requires signed-in user.
 */
export async function redeemAccessCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return { valid: false };

  if (!isFirebaseConfigured) {
    return { valid: false, reason: 'Firebase no configurado.' };
  }

  const user = auth?.currentUser;
  if (!user?.getIdToken) {
    return { valid: false, reason: 'Debes iniciar sesión.', deferred: true };
  }

  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/redeem-access-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code: normalized }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.valid) {
      return { valid: false, reason: data.error || 'Código inválido.' };
    }
    return {
      valid: true,
      type: data.type || 'kit',
      grants: data.grants || null,
      source: 'api',
      redeemed: true,
    };
  } catch {
    return { valid: false, reason: 'No se pudo validar el código.' };
  }
}

/** @deprecated Use redeemAccessCode after signup. Pre-auth cannot verify without leaking codes. */
export async function validateAccessCodeFromDb(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return { valid: false };
  if (auth?.currentUser) return redeemAccessCode(normalized);
  // Non-empty only — real check runs after account creation.
  return { valid: true, type: 'pending', source: 'preauth', deferred: true };
}

/** Server increments usedCount on redeem. */
export async function consumeAccessCode() {
  return;
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
