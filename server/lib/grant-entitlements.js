/**
 * Server-side entitlement grants, shared by admin ops + future purchase webhooks.
 * Kit auto / upsell can be granted here; funnels stay isolated by `line`.
 */

import { getFirebaseAdmin, FieldValue } from './firebase-admin.js';

const LINE_FIELDS = {
  paletas: { kit: 'hasKit', premium: 'hasPremium' },
  postres: { kit: 'hasPostres', premium: 'hasPostresPremium' },
  minipostres: { kit: 'hasMinipostres', premium: 'hasMinipostresPremium' },
};

/**
 * @param {string} uid
 * @param {{ line: 'paletas'|'postres'|'minipostres', tier: 'kit'|'premium'|'both', source?: string }} opts
 */
export async function grantEntitlements(uid, opts = {}) {
  if (!uid) throw new Error('uid requerido');

  const line = opts.line;
  const tier = opts.tier || 'kit';
  const fields = LINE_FIELDS[line];
  if (!fields) throw new Error(`line inválida: ${line}`);

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) throw new Error('Firebase Admin no configurado');

  const updates = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (tier === 'kit' || tier === 'both') {
    updates[fields.kit] = true;
  }
  if (tier === 'premium' || tier === 'both') {
    updates[fields.premium] = true;
    updates[`premiumPending.${line}`] = false;
  }

  if (opts.source) {
    updates.lastGrantSource = String(opts.source).slice(0, 64);
    updates.lastGrantAt = FieldValue.serverTimestamp();
  }

  const ref = firebaseAdmin.firestore().doc(`users/${uid}`);
  await ref.set(updates, { merge: true });
  return updates;
}

/**
 * Map provider product codes → line/tier.
 * Extend when Hotmart/Kiwify webhooks go live.
 */
export function mapPurchaseProduct(productCode) {
  const code = String(productCode || '').toLowerCase();
  const map = {
    paletas_kit: { line: 'paletas', tier: 'kit' },
    paletas_premium: { line: 'paletas', tier: 'premium' },
    postres_kit: { line: 'postres', tier: 'kit' },
    postres_premium: { line: 'postres', tier: 'premium' },
    // Legacy Mini codes still accepted; grant Postres (unified offer)
    minipostres_kit: { line: 'postres', tier: 'kit' },
    minipostres_premium: { line: 'postres', tier: 'premium' },
  };
  return map[code] || null;
}

export async function findUserUidByEmail(email) {
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin || !email) return null;
  try {
    const user = await firebaseAdmin.auth().getUserByEmail(String(email).trim().toLowerCase());
    return user.uid;
  } catch {
    return null;
  }
}
