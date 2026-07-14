/**
 * Redeem an access code and grant entitlements (Admin SDK).
 * Auth: Bearer Firebase ID token.
 *
 * Optional env ACCESS_CODE / ACCESS_CODE_TYPE = single fallback code (server-only, never shipped to client).
 */
import { FieldValue } from '../../server/lib/firebase-admin.js';
import { grantsFromAccessCodeType, verifyUserRequest } from '../../server/lib/user-auth.js';

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase();
}

function envFallbackCode() {
  const code = normalizeCode(process.env.ACCESS_CODE || '');
  if (!code) return null;
  return {
    code,
    type: process.env.ACCESS_CODE_TYPE || 'kit',
    source: 'env',
  };
}

async function findActiveCode(firestore, normalized) {
  const snap = await firestore
    .collection('accessCodes')
    .where('code', '==', normalized)
    .where('active', '==', true)
    .limit(5)
    .get();

  if (snap.empty) return null;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const maxUses = data.maxUses;
    const usedCount = data.usedCount || 0;
    if (maxUses != null && usedCount >= maxUses) continue;
    return { id: doc.id, type: data.type || 'kit', source: 'firestore' };
  }

  return { exhausted: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firebaseAdmin, decoded } = await verifyUserRequest(req);
    const code = normalizeCode(req.body?.code);
    if (!code) {
      return res.status(400).json({ error: 'Código requerido', valid: false });
    }

    const firestore = firebaseAdmin.firestore();
    let match = await findActiveCode(firestore, code);

    if (match?.exhausted) {
      return res.status(400).json({ error: 'Código agotado.', valid: false });
    }

    if (!match) {
      const fallback = envFallbackCode();
      if (fallback && fallback.code === code) {
        match = fallback;
      }
    }

    if (!match) {
      return res.status(400).json({ error: 'Código inválido.', valid: false });
    }

    const grants = grantsFromAccessCodeType(match.type);
    const updates = {
      ...grants,
      lastGrantSource: `access_code:${match.source}`,
      lastGrantAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await firestore.doc(`users/${decoded.uid}`).set(updates, { merge: true });

    if (match.id) {
      await firestore.doc(`accessCodes/${match.id}`).set(
        {
          usedCount: FieldValue.increment(1),
          lastUsedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return res.status(200).json({
      ok: true,
      valid: true,
      type: match.type,
      grants,
    });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status = error.status || (/auth|Unauthorized/i.test(message) ? 401 : 500);
    return res.status(status).json({ error: message, valid: false });
  }
}
