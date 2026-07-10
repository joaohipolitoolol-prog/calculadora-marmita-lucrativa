import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export const ADMIN_PROFILE_GRANTS = {
  isAdmin: true,
  hasKit: true,
  hasPremium: true,
  hasPostres: true,
  hasPostresPremium: true,
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function envAdminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

let allowlist = envAdminEmails();

export function getAdminAllowlist() {
  return allowlist;
}

export function isAdminEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return allowlist.includes(normalized);
}

export async function loadAdminAllowlist() {
  const env = envAdminEmails();

  if (!isFirebaseConfigured || !db) {
    allowlist = env;
    return allowlist;
  }

  try {
    const snap = await getDoc(doc(db, 'settings', 'admins'));
    const fromDb = snap.exists()
      ? (snap.data().emails || []).map((entry) => normalizeEmail(entry)).filter(Boolean)
      : [];
    allowlist = [...new Set([...env, ...fromDb])];
  } catch {
    allowlist = env;
  }

  return allowlist;
}

export async function saveAdminEmails(emails) {
  const normalized = [...new Set(emails.map((entry) => normalizeEmail(entry)).filter(Boolean))];

  if (!isFirebaseConfigured || !db) {
    allowlist = [...new Set([...envAdminEmails(), ...normalized])];
    return { ok: true, emails: allowlist, cloud: false };
  }

  try {
    await setDoc(
      doc(db, 'settings', 'admins'),
      {
        emails: normalized,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    allowlist = [...new Set([...envAdminEmails(), ...normalized])];
    return { ok: true, emails: allowlist, cloud: true };
  } catch (error) {
    return { ok: false, emails: allowlist, error };
  }
}

export function getManagedAdminEmails() {
  const env = new Set(envAdminEmails());
  return allowlist.filter((email) => !env.has(email));
}
