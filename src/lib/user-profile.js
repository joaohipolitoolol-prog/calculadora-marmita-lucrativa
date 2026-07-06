import { db, isFirebaseConfigured } from './firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || '').trim().toLowerCase());
}

export async function getUserProfile(uid) {
  if (!isFirebaseConfigured || !db || !uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createUserProfile(uid, { email, displayName, hasPremium = false, accessCodeUsed = '' }) {
  if (!isFirebaseConfigured || !db) return null;

  const profile = {
    email: email.trim().toLowerCase(),
    displayName: displayName.trim(),
    hasKit: true,
    hasPremium: Boolean(hasPremium),
    isAdmin: isAdminEmail(email),
    accessCodeUsed: accessCodeUsed || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid), profile, { merge: true });
  return profile;
}

export async function updateUserProfile(uid, data) {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
}

export async function isUserAdmin(user, profile) {
  if (!user) return false;
  if (profile?.isAdmin) return true;
  if (isAdminEmail(user.email)) return true;
  return false;
}

export async function listUsers() {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function syncAdminFlag(uid, email) {
  if (!isAdminEmail(email)) return;
  await updateUserProfile(uid, { isAdmin: true });
}
