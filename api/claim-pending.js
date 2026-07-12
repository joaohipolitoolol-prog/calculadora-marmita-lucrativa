/**
 * Claim pending Hotmart/webhook purchases after the buyer registers.
 * Auth: Bearer Firebase ID token (any signed-in user; email must match).
 */
import { getFirebaseAdmin } from '../../server/lib/firebase-admin.js';
import { claimPendingPurchases } from '../../server/lib/pending-purchases.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Firebase Admin no configurado' });
  }

  try {
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    const email = decoded.email;
    if (!email) return res.status(400).json({ error: 'Usuario sin email' });

    const result = await claimPendingPurchases(decoded.uid, email);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status = /auth/i.test(message) || message === 'Unauthorized' ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
