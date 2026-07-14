/**
 * Stamp allowlisted admins + ensure profile exists after login/register.
 * Auth: Bearer Firebase ID token.
 */
import { getFirebaseAdmin, FieldValue } from '../../server/lib/firebase-admin.js';
import { syncAllowlistAdmin, verifyUserRequest } from '../../server/lib/user-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firebaseAdmin, decoded } = await verifyUserRequest(req);
    const firestore = firebaseAdmin.firestore();
    const uid = decoded.uid;
    const email = String(decoded.email || '')
      .trim()
      .toLowerCase();

    const ref = firestore.doc(`users/${uid}`);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set(
        {
          email,
          displayName: decoded.name || email.split('@')[0] || 'Usuario',
          hasKit: false,
          hasPremium: false,
          hasPostres: false,
          hasPostresPremium: false,
          isAdmin: false,
          premiumPending: { paletas: false, postres: false },
          registeredFrom: 'bootstrap',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const admin = await syncAllowlistAdmin(uid, email);
    const profileSnap = await ref.get();
    const profile = profileSnap.exists ? profileSnap.data() : null;

    return res.status(200).json({
      ok: true,
      adminStamped: Boolean(admin.stamped),
      profile: profile
        ? {
            hasKit: Boolean(profile.hasKit),
            hasPremium: Boolean(profile.hasPremium),
            hasPostres: Boolean(profile.hasPostres),
            hasPostresPremium: Boolean(profile.hasPostresPremium),
            isAdmin: Boolean(profile.isAdmin),
          }
        : null,
    });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status = error.status || (/auth|Unauthorized/i.test(message) ? 401 : 500);
    return res.status(status).json({ error: message });
  }
}
