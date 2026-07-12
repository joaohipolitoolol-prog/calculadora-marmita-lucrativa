/**
 * Hotmart purchase webhook → grant / pending + welcome email.
 *
 * URL: POST https://paletasparawhatsapp.vercel.app/api/webhooks/hotmart
 * Auth: header x-hotmart-hottok === HOTMART_HOTTOK
 * Events: PURCHASE_APPROVED, PURCHASE_COMPLETE
 */
import {
  findUserUidByEmail,
  grantEntitlements,
} from '../../server/lib/grant-entitlements.js';
import { getFirebaseAdmin, FieldValue } from '../../server/lib/firebase-admin.js';
import { resolveHotmartProduct, APPROVED_EVENTS } from '../../server/lib/hotmart-map.js';
import { savePendingPurchase } from '../../server/lib/pending-purchases.js';
import { sendWelcomeEmailServer } from '../../server/lib/send-welcome-email.js';

function getHottok(req) {
  return (
    req.headers['x-hotmart-hottok'] ||
    req.headers['X-HOTMART-HOTTOK'] ||
    req.body?.hottok ||
    req.body?.data?.hottok ||
    ''
  );
}

function parseBuyer(body) {
  const data = body?.data || body || {};
  const buyer = data.buyer || {};
  return {
    email: String(buyer.email || data.email || body.email || '').trim().toLowerCase(),
    name: String(buyer.name || data.name || body.name || '').trim(),
    phone: buyer.checkout_phone || buyer.phone || null,
  };
}

function parseProduct(body) {
  const data = body?.data || body || {};
  const product = data.product || {};
  const purchase = data.purchase || {};
  return {
    productId: product.id || data.prod || body.prod || null,
    ucode: product.ucode || null,
    offer: purchase.offer?.code || data.off || body.off || null,
    name: product.name || null,
    transaction: purchase.transaction || data.transaction || body.transaction || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.HOTMART_HOTTOK;
  if (!expected) {
    return res.status(503).json({
      error: 'HOTMART_HOTTOK no configurado',
      hint: 'Define HOTMART_HOTTOK en Vercel con el token del webhook de Hotmart',
    });
  }

  if (getHottok(req) !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Firebase Admin no configurado' });
  }

  try {
    const body = req.body || {};
    const event = String(body.event || body.status || '').toUpperCase();

    if (event && !APPROVED_EVENTS.has(event) && !['APPROVED', 'COMPLETED', 'COMPLETE'].includes(event)) {
      return res.status(200).json({ ok: true, ignored: true, event });
    }

    const buyer = parseBuyer(body);
    const productInfo = parseProduct(body);
    const resolved = resolveHotmartProduct(productInfo);

    const logRef = firebaseAdmin.firestore().collection('purchase_webhook_log').doc();

    if (!buyer.email) {
      await logRef.set({
        provider: 'hotmart',
        event: event || null,
        status: 'missing_email',
        rawProduct: productInfo,
        createdAt: FieldValue.serverTimestamp(),
      });
      return res.status(400).json({ error: 'email del comprador no encontrado' });
    }

    if (!resolved) {
      await logRef.set({
        provider: 'hotmart',
        email: buyer.email,
        event: event || null,
        status: 'unknown_product',
        rawProduct: productInfo,
        createdAt: FieldValue.serverTimestamp(),
      });
      return res.status(400).json({
        error: 'producto Hotmart no mapeado',
        product: productInfo,
        hint: 'Ajusta HOTMART_PRODUCT_MAP o los IDs en server/lib/hotmart-map.js',
      });
    }

    const uid = await findUserUidByEmail(buyer.email);
    let grantStatus = 'pending';

    if (uid) {
      await grantEntitlements(uid, {
        line: resolved.line,
        tier: resolved.tier,
        source: 'hotmart_webhook',
      });
      grantStatus = 'granted';
    } else {
      await savePendingPurchase({
        email: buyer.email,
        line: resolved.line,
        tier: resolved.tier,
        product: resolved.product,
        source: 'hotmart',
        meta: {
          event: event || null,
          transaction: productInfo.transaction,
          phone: buyer.phone,
          name: buyer.name,
        },
      });
      grantStatus = 'pending_saved';
    }

    // Always email — this is the chargeback prevention.
    const emailResult = await sendWelcomeEmailServer({
      email: buyer.email,
      name: buyer.name,
      line: resolved.line,
    });

    await logRef.set({
      provider: 'hotmart',
      email: buyer.email,
      uid: uid || null,
      product: resolved.product,
      line: resolved.line,
      tier: resolved.tier,
      event: event || null,
      transaction: productInfo.transaction || null,
      status: grantStatus,
      emailSent: Boolean(emailResult.ok),
      emailError: emailResult.ok ? null : emailResult.error || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      ok: true,
      status: grantStatus,
      product: resolved.product,
      line: resolved.line,
      tier: resolved.tier,
      emailSent: Boolean(emailResult.ok),
      emailError: emailResult.ok ? undefined : emailResult.error,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error interno' });
  }
}
