/**
 * Store purchases for buyers who have not registered yet.
 * Doc id = normalized email. Applied on register via /api/claim-pending.
 */
import { getFirebaseAdmin, FieldValue } from './firebase-admin.js';
import { grantEntitlements } from './grant-entitlements.js';

function emailId(email) {
  return String(email || '').trim().toLowerCase();
}

export async function savePendingPurchase({ email, line, tier, product, source, meta = {} }) {
  const id = emailId(email);
  if (!id || !line || !tier) return null;

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) throw new Error('Firebase Admin no configurado');

  const ref = firebaseAdmin.firestore().collection('pending_purchases').doc(id);
  const snap = await ref.get();
  const prev = snap.exists ? snap.data() : {};
  const grants = Array.isArray(prev.grants) ? [...prev.grants] : [];

  const key = `${line}:${tier}`;
  if (!grants.some((g) => `${g.line}:${g.tier}` === key)) {
    grants.push({ line, tier, product: product || null, at: new Date().toISOString() });
  }

  await ref.set(
    {
      email: id,
      grants,
      source: source || prev.source || 'webhook',
      lastProduct: product || prev.lastProduct || null,
      meta: { ...(prev.meta || {}), ...meta },
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: prev.createdAt || FieldValue.serverTimestamp(),
      claimedAt: null,
      claimedUid: null,
    },
    { merge: true },
  );

  return { email: id, grants };
}

/**
 * Apply all pending grants for an email to a uid, then mark claimed.
 */
export async function claimPendingPurchases(uid, email) {
  const id = emailId(email);
  if (!uid || !id) return { claimed: false, grants: [] };

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) throw new Error('Firebase Admin no configurado');

  const ref = firebaseAdmin.firestore().collection('pending_purchases').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { claimed: false, grants: [] };

  const data = snap.data() || {};
  if (data.claimedUid) {
    return { claimed: false, alreadyClaimed: true, grants: data.grants || [] };
  }

  const grants = Array.isArray(data.grants) ? data.grants : [];
  for (const g of grants) {
    await grantEntitlements(uid, {
      line: g.line,
      tier: g.tier,
      source: 'pending_purchase',
    });
  }

  await ref.set(
    {
      claimedUid: uid,
      claimedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { claimed: true, grants };
}
