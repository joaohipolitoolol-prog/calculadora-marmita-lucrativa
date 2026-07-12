import admin from 'firebase-admin';

let initialized = false;

export const FieldValue = admin.firestore.FieldValue;

export function getFirebaseAdmin() {
  if (initialized) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(raw)),
  });
  initialized = true;
  return admin;
}

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

async function loadAdminEmails(firestore) {
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
 * Verifies Bearer Firebase ID token and admin access.
 * Accepts users/{uid}.isAdmin OR email allowlist (settings/admins + ADMIN_EMAILS).
 * Auto-stamps isAdmin when allowlisted so client Firestore rules also pass.
 */
export async function verifyAdminRequest(req) {
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    throw new Error('Firebase Admin no configurado');
  }

  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = await firebaseAdmin.auth().verifyIdToken(token);
  const firestore = firebaseAdmin.firestore();
  const userRef = firestore.doc(`users/${decoded.uid}`);
  const profileSnap = await userRef.get();
  const profile = profileSnap.exists ? profileSnap.data() : null;

  if (profile?.isAdmin === true) {
    return decoded;
  }

  const email = normalizeEmail(decoded.email || profile?.email);
  const allowlist = await loadAdminEmails(firestore);
  if (email && allowlist.includes(email)) {
    await userRef.set(
      {
        email,
        isAdmin: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return decoded;
  }

  throw new Error('Forbidden');
}
