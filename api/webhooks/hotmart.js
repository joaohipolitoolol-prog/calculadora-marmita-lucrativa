/**
 * Hotmart purchase webhook → grant / pending + welcome email.
 *
 * URL: POST https://paletasparawhatsapp.vercel.app/api/webhooks/hotmart
 * Auth: header x-hotmart-hottok === HOTMART_HOTTOK
 * Events: PURCHASE_APPROVED, PURCHASE_COMPLETE (deduped by transaction id)
 */
import {
  findUserUidByEmail,
  grantEntitlements,
} from '../../server/lib/grant-entitlements.js';
import { getFirebaseAdmin, FieldValue } from '../../server/lib/firebase-admin.js';
import { resolveHotmartProduct, APPROVED_EVENTS } from '../../server/lib/hotmart-map.js';
import { savePendingPurchase } from '../../server/lib/pending-purchases.js';
import { sendWelcomeEmailServer } from '../../server/lib/send-welcome-email.js';
import { bumpAbMetric, normalizeAbVariant } from '../../server/lib/analytics-ab.js';
import { todayKey } from '../../server/lib/analytics-schema.js';
import { claimPurchaseTransaction } from '../../server/lib/purchase-idempotency.js';

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

/** Hotmart sck/src → lp|quiz for A/B purchase attribution. */
function parseAbFromHotmart(body) {
  const data = body?.data || body || {};
  const purchase = data.purchase || {};
  const tracking = data.tracking || purchase.tracking || {};
  const candidates = [
    purchase.sck,
    purchase.src,
    tracking.sck,
    tracking.src,
    data.sck,
    data.src,
    body.sck,
    body.src,
    purchase.checkout_sck,
    purchase.origin?.sck,
    purchase.origin?.src,
  ];
  for (const c of candidates) {
    const ab = normalizeAbVariant(c);
    if (ab) return ab;
  }
  return null;
}

async function bumpAbPurchase(firestore, variant) {
  if (!variant) return;
  const day = todayKey();
  const summaryRef = firestore.doc('analytics/summary');
  const dailyRef = firestore.doc(`analytics_daily/${day}`);

  await firestore.runTransaction(async (tx) => {
    const summarySnap = await tx.get(summaryRef);
    const dailySnap = await tx.get(dailyRef);
    const summary = summarySnap.exists ? summarySnap.data() : { todayKey: day };
    const daily = dailySnap.exists
      ? dailySnap.data()
      : { pages: {}, events: {}, total: 0, date: day };

    bumpAbMetric(summary, daily, variant, 'purchase');
    daily.date = day;
    tx.set(summaryRef, summary, { merge: true });
    tx.set(dailyRef, daily, { merge: true });
  });
}

/** Paid sales counter (deduped transactions), not checkout clicks. */
async function bumpPaidSale(firestore, { line, product } = {}) {
  const day = todayKey();
  const summaryRef = firestore.doc('analytics/summary');
  const dailyRef = firestore.doc(`analytics_daily/${day}`);

  await firestore.runTransaction(async (tx) => {
    const summarySnap = await tx.get(summaryRef);
    const dailySnap = await tx.get(dailyRef);
    const summary = summarySnap.exists ? summarySnap.data() : { todayKey: day };
    const daily = dailySnap.exists
      ? dailySnap.data()
      : { pages: {}, events: {}, total: 0, date: day };

    if (summary.todayKey && summary.todayKey !== day) {
      if (summary.sales) summary.sales.today = 0;
      if (summary.salesByLine) {
        for (const cell of Object.values(summary.salesByLine)) {
          if (cell && typeof cell === 'object') cell.today = 0;
        }
      }
      if (summary.salesByProduct) {
        for (const cell of Object.values(summary.salesByProduct)) {
          if (cell && typeof cell === 'object') cell.today = 0;
        }
      }
      summary.todayKey = day;
    }
    if (!summary.sales) summary.sales = { total: 0, today: 0 };
    summary.sales.total = (summary.sales.total || 0) + 1;
    summary.sales.today = (summary.sales.today || 0) + 1;
    summary.sales.lastAt = FieldValue.serverTimestamp();
    if (line) {
      if (!summary.salesByLine) summary.salesByLine = {};
      if (!summary.salesByLine[line]) summary.salesByLine[line] = { total: 0, today: 0 };
      summary.salesByLine[line].total = (summary.salesByLine[line].total || 0) + 1;
      summary.salesByLine[line].today = (summary.salesByLine[line].today || 0) + 1;
    }
    if (product) {
      if (!summary.salesByProduct) summary.salesByProduct = {};
      if (!summary.salesByProduct[product]) {
        summary.salesByProduct[product] = { total: 0, today: 0 };
      }
      summary.salesByProduct[product].total =
        (summary.salesByProduct[product].total || 0) + 1;
      summary.salesByProduct[product].today =
        (summary.salesByProduct[product].today || 0) + 1;
    }

    daily.sales = (daily.sales || 0) + 1;
    if (line) {
      if (!daily.salesByLine) daily.salesByLine = {};
      daily.salesByLine[line] = (daily.salesByLine[line] || 0) + 1;
    }
    if (product) {
      if (!daily.salesByProduct) daily.salesByProduct = {};
      daily.salesByProduct[product] = (daily.salesByProduct[product] || 0) + 1;
    }
    daily.date = day;

    tx.set(summaryRef, summary, { merge: true });
    tx.set(dailyRef, daily, { merge: true });
  });
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
    const abVariant = parseAbFromHotmart(body);
    const firestore = firebaseAdmin.firestore();
    const logRef = firestore.collection('purchase_webhook_log').doc();

    if (!buyer.email) {
      await logRef.set({
        provider: 'hotmart',
        event: event || null,
        status: 'missing_email',
        rawProduct: productInfo,
        ab: abVariant,
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
        ab: abVariant,
        createdAt: FieldValue.serverTimestamp(),
      });
      return res.status(400).json({
        error: 'producto Hotmart no mapeado',
        product: productInfo,
        hint: 'Ajusta HOTMART_PRODUCT_MAP o los IDs en server/lib/hotmart-map.js',
      });
    }

    // Same Hotmart sale often sends PURCHASE_APPROVED + PURCHASE_COMPLETE.
    // Process grant/email/AB once per transaction id.
    const claim = await claimPurchaseTransaction(firestore, {
      transaction: productInfo.transaction,
      provider: 'hotmart',
      email: buyer.email,
      product: resolved.product,
      line: resolved.line,
      tier: resolved.tier,
      event: event || null,
      ab: abVariant,
    });

    if (!claim.claim) {
      await logRef.set({
        provider: 'hotmart',
        email: buyer.email,
        product: resolved.product,
        line: resolved.line,
        tier: resolved.tier,
        event: event || null,
        transaction: productInfo.transaction || null,
        status: 'duplicate',
        ab: abVariant,
        emailSent: false,
        lockId: claim.transactionId || null,
        createdAt: FieldValue.serverTimestamp(),
      });
      return res.status(200).json({
        ok: true,
        duplicate: true,
        status: 'already_processed',
        transaction: productInfo.transaction || null,
        product: resolved.product,
        firstEvent: claim.existing?.firstEvent || null,
      });
    }

    if (claim.skippedLock) {
      console.warn('[hotmart] processed WITHOUT lock, missing transaction and fallback', {
        email: buyer.email,
        product: resolved.product,
        event,
      });
    }
    if (claim.usedFallback) {
      console.warn('[hotmart] lock used email|product|day fallback (no transaction id)', {
        email: buyer.email,
        product: resolved.product,
        lockId: claim.transactionId,
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
          ab: abVariant,
        },
      });
      grantStatus = 'pending_saved';
    }

    const emailResult = await sendWelcomeEmailServer({
      email: buyer.email,
      name: buyer.name,
      line: resolved.line,
      tier: resolved.tier,
      product: resolved.product,
      source: 'hotmart_webhook',
    });

    if (resolved.line === 'paletas' && abVariant) {
      try {
        await bumpAbPurchase(firestore, abVariant);
      } catch (abErr) {
        console.warn('[hotmart] ab purchase bump failed', abErr);
      }
    }

    try {
      await bumpPaidSale(firestore, { line: resolved.line, product: resolved.product });
    } catch (saleErr) {
      console.warn('[hotmart] paid sale bump failed', saleErr);
    }

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
      ab: abVariant,
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
      ab: abVariant || undefined,
      emailSent: Boolean(emailResult.ok),
      emailError: emailResult.ok ? undefined : emailResult.error,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error interno' });
  }
}
