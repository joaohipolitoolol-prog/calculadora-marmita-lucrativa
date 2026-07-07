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

export async function createUserProfile(uid, { email, displayName, hasPremium = false }) {
  if (!isFirebaseConfigured || !db) return null;

  const admin = isAdminEmail(email);
  const profile = {
    email: email.trim().toLowerCase(),
    displayName: displayName.trim(),
    hasKit: admin,
    hasPremium: Boolean(hasPremium),
    isAdmin: admin,
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
  await updateUserProfile(uid, { isAdmin: true, hasKit: true });
}

export async function resolveUserProfile(user) {
  if (!user) return null;
  const profile = await getUserProfile(user.uid);
  if (profile) return profile;

  if (user.demo) {
    try {
      const users = JSON.parse(localStorage.getItem('marmita_demo_users') || '[]');
      const demo = users.find((u) => u.uid === user.uid);
      if (demo) {
        return {
          hasKit: Boolean(demo.hasKit),
          hasPremium: Boolean(demo.hasPremium),
          isAdmin: Boolean(demo.isAdmin),
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function hasKitAccess(profile, user) {
  if (profile?.isAdmin || profile?.hasKit) return true;
  if (user?.email && isAdminEmail(user.email)) return true;
  return false;
}
