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
  const profileSnap = await firebaseAdmin.firestore().doc(`users/${decoded.uid}`).get();
  if (!profileSnap.exists() || !profileSnap.data()?.isAdmin) {
    throw new Error('Forbidden');
  }

  return decoded;
}
