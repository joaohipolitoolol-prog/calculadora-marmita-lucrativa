/**
 * Purchase webhook stub — same grant path the live Hotmart/Kiwify hook will use.
 *
 * Auth: Authorization: Bearer <PURCHASE_WEBHOOK_SECRET>
 * Body: { email, product, event? }  product = paletas_kit | paletas_premium | postres_kit | postres_premium
 */
import {
  findUserUidByEmail,
  grantEntitlements,
  mapPurchaseProduct,
} from '../lib/grant-entitlements.js';
import { getFirebaseAdmin, FieldValue } from '../lib/firebase-admin.js';

function unauthorized(res) {
  return res.status(401).json({ error: 'Unauthorized' });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.PURCHASE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({
      error: 'PURCHASE_WEBHOOK_SECRET no configurado',
      hint: 'Stub listo — define el secret cuando conectes Hotmart/Kiwify',
    });
  }

  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token || token !== secret) return unauthorized(res);

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Firebase Admin no configurado' });
  }

  try {
    const { email, product, event: purchaseEvent } = req.body || {};
    const mapped = mapPurchaseProduct(product);
    if (!mapped) {
      return res.status(400).json({
        error: 'product inválido',
        allowed: ['paletas_kit', 'paletas_premium', 'postres_kit', 'postres_premium'],
      });
    }

    const uid = await findUserUidByEmail(email);
    const logRef = firebaseAdmin.firestore().collection('purchase_webhook_log').doc();

    if (!uid) {
      await logRef.set({
        email: String(email || '').toLowerCase(),
        product,
        line: mapped.line,
        tier: mapped.tier,
        purchaseEvent: purchaseEvent || null,
        status: 'user_not_found',
        createdAt: FieldValue.serverTimestamp(),
      });
      return res.status(202).json({
        ok: true,
        status: 'user_not_found',
        message: 'Compra registrada; usuario aún no tiene cuenta',
        line: mapped.line,
        tier: mapped.tier,
      });
    }

    await grantEntitlements(uid, {
      line: mapped.line,
      tier: mapped.tier,
      source: 'webhook_purchase',
    });

    await logRef.set({
      email: String(email || '').toLowerCase(),
      uid,
      product,
      line: mapped.line,
      tier: mapped.tier,
      purchaseEvent: purchaseEvent || null,
      status: 'granted',
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      ok: true,
      status: 'granted',
      uid,
      line: mapped.line,
      tier: mapped.tier,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error interno' });
  }
}
