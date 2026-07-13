import { verifyAdminRequest, getFirebaseAdmin } from '../../server/lib/firebase-admin.js';
import { SITE_URL } from '../../src/site/config.js';

function serializeTimestamp(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate().toISOString();
  if (value._seconds) return new Date(value._seconds * 1000).toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function fromEmailStatus() {
  const from = process.env.RESEND_FROM_EMAIL || '';
  const configured = Boolean(from.trim());
  const isDev = /resend\.dev/i.test(from) || !configured;
  return {
    configured,
    isDevFrom: isDev,
    fromLabel: configured ? from.replace(/.*</, '').replace(/>.*/, '').trim() || from : null,
  };
}

function mapWebhookDoc(doc) {
  const d = doc.data() || {};
  return {
    id: doc.id,
    kind: 'purchase',
    source: d.provider || 'hotmart',
    email: d.email || null,
    product: d.product || null,
    line: d.line || null,
    tier: d.tier || null,
    status: d.status || null,
    event: d.event || null,
    transaction: d.transaction || null,
    emailSent: Boolean(d.emailSent),
    emailError: d.emailError || null,
    createdAt: serializeTimestamp(d.createdAt),
  };
}

/** Unique paid sales in a list (skip duplicate webhook echoes). */
function uniqueSalesFromActivity(rows) {
  const seen = new Set();
  let count = 0;
  for (const row of rows) {
    if (row.kind !== 'purchase') continue;
    if (row.status === 'duplicate' || row.status === 'missing_email' || row.status === 'unknown_product') {
      continue;
    }
    const key = row.transaction || row.id;
    if (seen.has(key)) continue;
    seen.add(key);
    count += 1;
  }
  return count;
}

function mapManualDoc(doc) {
  const d = doc.data() || {};
  return {
    id: doc.id,
    kind: 'manual',
    source: d.source || 'admin',
    email: d.email || null,
    product: d.product || null,
    line: d.line || null,
    tier: d.tier || null,
    status: d.ok ? 'sent' : 'failed',
    event: null,
    transaction: null,
    emailSent: Boolean(d.ok),
    emailError: d.error || null,
    resendId: d.resendId || null,
    createdAt: serializeTimestamp(d.createdAt),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await verifyAdminRequest(req);
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) {
      return res.status(503).json({ error: 'Firebase Admin no configurado' });
    }

    const firestore = firebaseAdmin.firestore();
    const limit = Math.min(Number(req.query?.limit) || 60, 120);

    let webhookSnap;
    let manualSnap;
    try {
      webhookSnap = await firestore
        .collection('purchase_webhook_log')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    } catch {
      webhookSnap = await firestore.collection('purchase_webhook_log').limit(limit).get();
    }

    try {
      manualSnap = await firestore
        .collection('email_send_log')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    } catch {
      try {
        manualSnap = await firestore.collection('email_send_log').limit(limit).get();
      } catch {
        manualSnap = { docs: [] };
      }
    }

    const activity = [
      ...webhookSnap.docs.map(mapWebhookDoc),
      ...manualSnap.docs.map(mapManualDoc),
    ]
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, limit);

    const last24h = activity.filter((row) => {
      if (!row.createdAt) return false;
      return Date.now() - new Date(row.createdAt).getTime() < 24 * 60 * 60 * 1000;
    });

    const from = fromEmailStatus();
    const resendOk = Boolean(process.env.RESEND_API_KEY);
    const hottokOk = Boolean(process.env.HOTMART_HOTTOK);
    const autoReady = resendOk && hottokOk && from.configured && !from.isDevFrom;

    return res.status(200).json({
      config: {
        autoReady,
        resendConfigured: resendOk,
        hottokConfigured: hottokOk,
        from,
        webhookUrl: `${SITE_URL}/api/webhooks/hotmart`,
        siteUrl: SITE_URL,
      },
      stats: {
        totalShown: activity.length,
        last24h: last24h.length,
        salesUnique: uniqueSalesFromActivity(activity),
        salesUnique24h: uniqueSalesFromActivity(last24h),
        duplicates: activity.filter((r) => r.status === 'duplicate').length,
        sentOk: activity.filter((r) => r.emailSent).length,
        failed: activity.filter((r) => r.emailError || (!r.emailSent && r.kind === 'purchase' && r.status !== 'duplicate')).length,
      },
      activity,
    });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
