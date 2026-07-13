import { Resend } from 'resend';
import {
  buildTransactionalEmail,
  normalizeEmailProduct,
} from './welcome-email.js';
import { BRAND_NAME } from '../../src/site/brand.js';
import { getFirebaseAdmin, FieldValue } from './firebase-admin.js';

/**
 * Send purchase/welcome email via Resend.
 * Safe to call from admin API or purchase webhooks.
 *
 * @param {{ email: string, name?: string, line?: string, tier?: string, product?: string, source?: string }} opts
 */
export async function sendWelcomeEmailServer({
  email,
  name = '',
  line = 'paletas',
  tier = 'kit',
  product = null,
  source = 'unknown',
} = {}) {
  if (!email) {
    return { ok: false, error: 'email es obligatorio' };
  }
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.SITE_URL || 'https://paletasparawhatsapp.vercel.app';
  const from = process.env.RESEND_FROM_EMAIL || `${BRAND_NAME} <onboarding@resend.dev>`;
  const productId = normalizeEmailProduct({ product, line, tier });
  const built = buildTransactionalEmail(name, siteUrl, { product: productId });
  const to = String(email).trim().toLowerCase();

  const { error, data } = await resend.emails.send({
    from,
    to,
    subject: built.subject,
    html: built.html,
    text: built.plain,
  });

  const result = error
    ? { ok: false, error: error.message || 'Error al enviar email', product: productId }
    : { ok: true, id: data?.id || null, product: productId };

  try {
    const firebaseAdmin = getFirebaseAdmin();
    if (firebaseAdmin) {
      await firebaseAdmin.firestore().collection('email_send_log').add({
        email: to,
        name: String(name || '').trim() || null,
        product: productId,
        line: built.line,
        tier: built.tier,
        source: String(source || 'unknown'),
        ok: Boolean(result.ok),
        error: result.ok ? null : result.error || null,
        resendId: result.id || null,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (logErr) {
    console.warn('[email] send log failed', logErr?.message || logErr);
  }

  return result;
}
