/**
 * Auth helpers for user-facing API routes (Bearer Firebase ID token).
 */
import { getFirebaseAdmin, FieldValue } from './firebase-admin.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function envAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '';
  return raw
    .split(/[,;\n]+/)
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

export async function verifyUserRequest(req) {
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    throw Object.assign(new Error('Firebase Admin no configurado'), { status: 503 });
  }

  const headerToken = req.headers.authorization?.replace(/^Bearer /i, '');
  const queryToken =
    typeof req.query?.access_token === 'string' ? req.query.access_token : '';
  const token = headerToken || queryToken;
  if (!token) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const decoded = await firebaseAdmin.auth().verifyIdToken(token);
  return { firebaseAdmin, decoded, token };
}

export async function loadAdminEmails(firestore) {
  const fromEnv = envAdminEmails();
  try {
    const snap = await firestore.doc('settings/admins').get();
    const fromDb = snap.exists
      ? (snap.data().emails || []).map((e) => normalizeEmail(e)).filter(Boolean)
      : [];
    return [...new Set([...fromEnv, ...fromDb])];
  } catch {
    return fromEnv;
  }
}

/**
 * Stamp isAdmin + full product grants when email is allowlisted.
 * Safe to call on every login/register.
 */
export async function syncAllowlistAdmin(uid, email) {
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin || !uid) return { stamped: false };

  const firestore = firebaseAdmin.firestore();
  const normalized = normalizeEmail(email);
  if (!normalized) return { stamped: false };

  const allowlist = await loadAdminEmails(firestore);
  if (!allowlist.includes(normalized)) return { stamped: false };

  await firestore.doc(`users/${uid}`).set(
    {
      email: normalized,
      isAdmin: true,
      hasKit: true,
      hasPremium: true,
      hasPostres: true,
      hasPostresPremium: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { stamped: true };
}

export function grantsFromAccessCodeType(type) {
  const grants = {
    hasKit: false,
    hasPremium: false,
    hasPostres: false,
    hasPostresPremium: false,
  };

  switch (String(type || 'kit')) {
    case 'kit':
      grants.hasKit = true;
      break;
    case 'premium':
      grants.hasPremium = true;
      break;
    case 'both':
      grants.hasKit = true;
      grants.hasPremium = true;
      break;
    case 'postres_kit':
      grants.hasPostres = true;
      break;
    case 'postres_premium':
      grants.hasPostresPremium = true;
      break;
    case 'postres_both':
      grants.hasPostres = true;
      grants.hasPostresPremium = true;
      break;
    default:
      grants.hasKit = true;
  }

  return grants;
}
