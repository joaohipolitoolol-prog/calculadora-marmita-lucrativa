/**
 * One sale → one processed run.
 * Primary key: Hotmart purchase.transaction (same on APPROVED + COMPLETE).
 * Fallback (no transaction): email|product|UTC-day, prevents double webhook
 * without an id; rare same-day second real purchase of same product would share it.
 */

import { FieldValue } from './firebase-admin.js';

function sanitizeTransactionId(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().slice(0, 120);
  if (!s) return null;
  return s.replace(/\//g, '_');
}

function fallbackLockId({ email, product }) {
  const e = String(email || '')
    .trim()
    .toLowerCase()
    .slice(0, 80);
  const p = String(product || 'unknown')
    .trim()
    .toLowerCase()
    .slice(0, 40);
  if (!e) return null;
  const day = new Date().toISOString().slice(0, 10);
  return `ntx_${e}_${p}_${day}`.replace(/[^a-zA-Z0-9_@.-]/g, '_').slice(0, 700);
}

/**
 * Claim a transaction for processing.
 * @returns {{ claim: true, transactionId: string|null } | { claim: false, existing: object, transactionId: string }}
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
  const id = sanitizeTransactionId(transaction) || fallbackLockId({ email, product });
  if (!id) {
    // Cannot build any lock key, last resort allow (logged upstream).
    return { claim: true, transactionId: null, skippedLock: true };
  }

  const ref = firestore.collection('purchase_transactions').doc(id);
  const usedFallback = !sanitizeTransactionId(transaction);

  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return { claim: false, transactionId: id, existing: snap.data() || {}, usedFallback };
    }
    tx.set(ref, {
      provider: provider || 'hotmart',
      email: email || null,
      product: product || null,
      line: line || null,
      tier: tier || null,
      firstEvent: event || null,
      ab: ab || null,
      usedFallback: Boolean(usedFallback),
      rawTransaction: transaction || null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { claim: true, transactionId: id, skippedLock: false, usedFallback };
  });
}

export function transactionDocId(raw) {
  return sanitizeTransactionId(raw);
}
