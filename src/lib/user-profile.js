import { db, isFirebaseConfigured } from './firebase.js';
import { normalizeProfile } from './products.js';
import {
  isAdminEmail,
  loadAdminAllowlist,
} from './admin-access.js';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';


export { isAdminEmail } from './admin-access.js';

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
    registeredFrom = null,
    registeredLine = null,
    premiumPending = null,
  }
) {
  if (!isFirebaseConfigured || !db) return null;

  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);

  // Never write entitlement fields on merge — Admin SDK owns grants.
  const base = {
    email: email.trim().toLowerCase(),
    displayName: displayName.trim(),
    registeredFrom,
    registeredLine,
    premiumPending: premiumPending || { paletas: false, postres: false },
    updatedAt: serverTimestamp(),
  };

  if (!existing.exists()) {
    Object.assign(base, {
      hasKit: false,
      hasPremium: false,
      hasPostres: false,
      hasPostresPremium: false,
      hasMinipostres: false,
      hasMinipostresPremium: false,
      isAdmin: false,
      createdAt: serverTimestamp(),
    });
  }

  // Write only `base` — never run normalizeProfile before setDoc (it forces hasKit:false).
  await setDoc(ref, base, { merge: true });
  const snap = await getDoc(ref);
  return snap.exists() ? normalizeProfile({ id: snap.id, ...snap.data() }) : normalizeProfile(base);
}

export async function touchUserActivity(uid, extra = {}) {
  if (!uid || !isFirebaseConfigured || !db) return;
  const payload = {
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...extra,
  };
  await setDoc(doc(db, 'users', uid), payload, { merge: true });
}

export async function markPremiumPending(uid, lineId) {
  if (!uid || !lineId || !isFirebaseConfigured || !db) return;
  await updateUserProfile(uid, { [`premiumPending.${lineId}`]: true });
}

export async function updateUserProfile(uid, data) {
  if (!isFirebaseConfigured || !db) return;
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (Object.prototype.hasOwnProperty.call(data, 'audioGuideEnabled') && data.audioGuideEnabled === null) {
    payload.audioGuideEnabled = deleteField();
  }
  if (Object.prototype.hasOwnProperty.call(data, 'menuWebEnabled') && data.menuWebEnabled === null) {
    payload.menuWebEnabled = deleteField();
  }
  await setDoc(doc(db, 'users', uid), payload, { merge: true });
}

export async function isUserAdmin(user, profile) {
  if (!user) return false;
  await loadAdminAllowlist();
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
  // Client cannot write isAdmin anymore — server bootstrap stamps allowlisted admins.
  void uid;
  void email;
  return;
}

export async function ensureUserProfile(user, extra = {}) {
  if (!user || user.demo || !isFirebaseConfigured || !db) return null;

  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  return createUserProfile(user.uid, {
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
    hasKit: false,
    registeredFrom: extra.registeredFrom || 'backfill',
    ...extra,
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
  return Boolean(
    profile.hasKit ||
      profile.hasPostres ||
      profile.hasMinipostres ||
      profile.hasPremium ||
      profile.hasPostresPremium ||
      profile.hasMinipostresPremium ||
      profile.isAdmin
  );
}

export function hasPaletasAccess(profile) {
  if (!profile) return false;
  return Boolean(profile.hasKit || profile.hasPremium || profile.isAdmin);
}

export function hasPostresAccess(profile) {
  if (!profile) return false;
  return Boolean(
    profile.hasPostres ||
      profile.hasPostresPremium ||
      profile.hasMinipostres ||
      profile.hasMinipostresPremium ||
      profile.isAdmin
  );
}

export function hasPremiumAccess(profile) {
  if (!profile) return false;
  return Boolean(profile.hasPremium || profile.hasPostresPremium);
}
