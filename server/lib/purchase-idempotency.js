/**
 * One Hotmart (or purchase) transaction → one processed sale.
 * Doc id = sanitized transaction key in purchase_transactions/.
 */

import { FieldValue } from './firebase-admin.js';

function sanitizeTransactionId(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().slice(0, 120);
  if (!s) return null;
  // Firestore doc ids: avoid /
  return s.replace(/\//g, '_');
}

/**
 * Claim a transaction for processing.
 * @returns {{ claim: true } | { claim: false, existing: object }}
 */
export async function claimPurchaseTransaction(firestore, {
  transaction,
  provider,
  email,
  product,
  line,
  tier,
  event,
  ab,
}) {
  const id = sanitizeTransactionId(transaction);
  if (!id) {
    // No transaction id — cannot dedupe safely; allow process once without lock.
    return { claim: true, transactionId: null, skippedLock: true };
  }

  const ref = firestore.collection('purchase_transactions').doc(id);

  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return { claim: false, transactionId: id, existing: snap.data() || {} };
    }
    tx.set(ref, {
      provider: provider || 'hotmart',
      email: email || null,
      product: product || null,
      line: line || null,
      tier: tier || null,
      firstEvent: event || null,
      ab: ab || null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { claim: true, transactionId: id, skippedLock: false };
  });
}

export function transactionDocId(raw) {
  return sanitizeTransactionId(raw);
}
