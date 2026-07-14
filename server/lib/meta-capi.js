/**
 * Meta Conversions API (server-side Purchase).
 * Browser Purchase is disabled — client thank-you + pending-checkout caused false sales.
 *
 * Env:
 *   META_PIXEL_ID (default in code)
 *   META_CAPI_ACCESS_TOKEN (required to send; without it this is a no-op)
 *   META_CAPI_TEST_EVENT_CODE (optional, Events Manager test)
 */
import { createHash } from 'crypto';

const DEFAULT_PIXEL_ID = '1369803401885896';

const PRODUCT_META = {
  paletas_kit: { value: 7.49, contentName: 'Paletas para WhatsApp', contentIds: ['paletas_kit'] },
  paletas_premium: {
    value: 9.97,
    contentName: 'Pack Premium Paletas',
    contentIds: ['paletas_premium'],
  },
  postres_kit: {
    value: 7.49,
    contentName: 'Mini Postres Fríos Sin Horno',
    contentIds: ['postres_kit'],
  },
  postres_premium: {
    value: 9.97,
    contentName: 'Pack Premium Postres',
    contentIds: ['postres_premium'],
  },
};

function sha256(value) {
  return createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

/**
 * @param {{
 *   product?: string,
 *   email?: string,
 *   phone?: string,
 *   transaction?: string|null,
 *   eventId?: string|null,
 *   value?: number,
 *   currency?: string,
 * }} opts
 */
export async function sendMetaCapiPurchase(opts = {}) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, skipped: true, reason: 'META_CAPI_ACCESS_TOKEN missing' };
  }

  const pixelId = process.env.META_PIXEL_ID || DEFAULT_PIXEL_ID;
  const productKey = String(opts.product || '').trim();
  const meta = PRODUCT_META[productKey] || {
    value: Number(opts.value) || 0,
    contentName: productKey || 'kit',
    contentIds: productKey ? [productKey] : ['kit'],
  };

  const value = opts.value != null ? Number(opts.value) : meta.value;
  const currency = opts.currency || 'USD';
  const eventId =
    opts.eventId ||
    (opts.transaction
      ? `hotmart_${String(opts.transaction).replace(/\W+/g, '_')}`
      : `capi_${Date.now().toString(36)}`);

  const userData = {};
  if (opts.email) userData.em = [sha256(opts.email)];
  if (opts.phone) {
    const digits = String(opts.phone).replace(/\D+/g, '');
    if (digits) userData.ph = [sha256(digits)];
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          value,
          currency,
          content_name: meta.contentName,
          content_ids: meta.contentIds,
          content_type: 'product',
        },
      },
    ],
  };

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;
  if (testCode) payload.test_event_code = testCode;

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.error || data };
    }
    return { ok: true, eventId, eventsReceived: data?.events_received };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }
}
