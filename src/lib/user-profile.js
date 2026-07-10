import { db, isFirebaseConfigured } from './firebase.js';
import { normalizeProfile } from './products.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
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
  return snap.exists() ? normalizeProfile({ id: snap.id, ...snap.data() }) : null;
}

export async function createUserProfile(
  uid,
  {
    email,
    displayName,
    hasKit = true,
    hasPremium = false,
    hasPostres = false,
    hasPostresPremium = false,
    registeredFrom = null,
  }
) {
  if (!isFirebaseConfigured || !db) return null;

  const admin = isAdminEmail(email);
  const profile = normalizeProfile({
    email: email.trim().toLowerCase(),
    displayName: displayName.trim(),
    hasKit: Boolean(hasKit) || admin,
    hasPremium: Boolean(hasPremium),
    hasPostres: Boolean(hasPostres),
    hasPostresPremium: Boolean(hasPostresPremium),
    isAdmin: admin,
    registeredFrom,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, 'users', uid), profile, { merge: true });
  return profile;
}

export async function updateUserProfile(uid, data) {
  if (!isFirebaseConfigured || !db) return;
  await setDoc(
    doc(db, 'users', uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
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
    .map((d) => normalizeProfile({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function syncAdminFlag(uid, email) {
  if (!isAdminEmail(email)) return;
  await updateUserProfile(uid, { isAdmin: true, hasKit: true });
}

export async function ensureUserProfile(user, extra = {}) {
  if (!user || user.demo || !isFirebaseConfigured || !db) return null;

  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  return createUserProfile(user.uid, {
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
    registeredFrom: extra.registeredFrom || 'backfill',
  });
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
        return normalizeProfile({
          hasKit: Boolean(demo.hasKit),
          hasPremium: Boolean(demo.hasPremium),
          hasPostres: Boolean(demo.hasPostres),
          hasPostresPremium: Boolean(demo.hasPostresPremium),
          isAdmin: Boolean(demo.isAdmin),
        });
      }
    } catch {
      return null;
    }
  }

  return ensureUserProfile(user);
}

export function hasKitAccess(profile, user) {
  if (!user) return false;
  // Any owned product (or legacy profiles) can enter the app shell.
  if (!profile) return true;
  return Boolean(profile.hasKit || profile.hasPostres || profile.hasPremium || profile.hasPostresPremium || profile.isAdmin);
}

export function hasPaletasAccess(profile) {
  if (!profile) return false;
  return Boolean(profile.hasKit || profile.hasPremium || profile.isAdmin);
}

export function hasPostresAccess(profile) {
  if (!profile) return false;
  return Boolean(profile.hasPostres || profile.hasPostresPremium || profile.isAdmin);
}

export function hasPremiumAccess(profile) {
  if (!profile) return false;
  return Boolean(profile.hasPremium || profile.hasPostresPremium);
}
