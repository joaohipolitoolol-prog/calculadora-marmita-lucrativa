/**
 * Purchase webhook stub — same grant path as Hotmart (normalized body).
 *
 * Auth: Authorization: Bearer <PURCHASE_WEBHOOK_SECRET>
 * Body: { email, product, name?, event? }
 *   product = paletas_kit | paletas_premium | postres_kit | postres_premium
 */
import {
  findUserUidByEmail,
  grantEntitlements,
  mapPurchaseProduct,
} from '../../server/lib/grant-entitlements.js';
import { getFirebaseAdmin, FieldValue } from '../../server/lib/firebase-admin.js';
import { savePendingPurchase } from '../../server/lib/pending-purchases.js';
import { sendWelcomeEmailServer } from '../../server/lib/send-welcome-email.js';

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
      hint: 'Define el secret cuando conectes Hotmart/Kiwify o usa /api/webhooks/hotmart',
    });
  }

  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token || token !== secret) return unauthorized(res);

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Firebase Admin no configurado' });
  }

  try {
    const { email, product, name = '', event: purchaseEvent } = req.body || {};
    const mapped = mapPurchaseProduct(product);
    if (!mapped) {
      return res.status(400).json({
        error: 'product inválido',
        allowed: ['paletas_kit', 'paletas_premium', 'postres_kit', 'postres_premium'],
      });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'email es obligatorio' });
    }

    const uid = await findUserUidByEmail(normalizedEmail);
    const logRef = firebaseAdmin.firestore().collection('purchase_webhook_log').doc();
    let grantStatus = 'pending';

    if (!uid) {
      await savePendingPurchase({
        email: normalizedEmail,
        line: mapped.line,
        tier: mapped.tier,
        product,
        source: 'purchase_webhook',
        meta: { purchaseEvent: purchaseEvent || null, name },
      });
      grantStatus = 'pending_saved';
    } else {
      await grantEntitlements(uid, {
        line: mapped.line,
        tier: mapped.tier,
        source: 'webhook_purchase',
      });
      grantStatus = 'granted';
    }

    const emailResult = await sendWelcomeEmailServer({
      email: normalizedEmail,
      name,
      line: mapped.line,
      tier: mapped.tier,
      product,
      source: 'purchase_webhook',
    });

    await logRef.set({
      provider: 'purchase',
      email: normalizedEmail,
      uid: uid || null,
      product,
      line: mapped.line,
      tier: mapped.tier,
      purchaseEvent: purchaseEvent || null,
      status: grantStatus,
      emailSent: Boolean(emailResult.ok),
      emailError: emailResult.ok ? null : emailResult.error || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(grantStatus === 'granted' ? 200 : 202).json({
      ok: true,
      status: grantStatus,
      uid: uid || undefined,
      line: mapped.line,
      tier: mapped.tier,
      emailSent: Boolean(emailResult.ok),
      emailError: emailResult.ok ? undefined : emailResult.error,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error interno' });
  }
}
