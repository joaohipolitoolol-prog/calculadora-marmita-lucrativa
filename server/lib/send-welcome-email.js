import { Resend } from 'resend';
import { buildWelcomeEmailHtml, welcomeEmailSubject } from './welcome-email.js';
import { BRAND_NAME } from '../../src/site/brand.js';

/**
 * Send purchase/welcome email via Resend.
 * Safe to call from admin API or purchase webhooks.
 */
export async function sendWelcomeEmailServer({ email, name = '', line = 'paletas' }) {
  if (!email) {
    return { ok: false, error: 'email es obligatorio' };
  }
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY no configurada' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.SITE_URL || 'https://paletasparawhatsapp.vercel.app';
  const from = process.env.RESEND_FROM_EMAIL || `${BRAND_NAME} <onboarding@resend.dev>`;

  const { error, data } = await resend.emails.send({
    from,
    to: String(email).trim().toLowerCase(),
    subject: welcomeEmailSubject(line),
    html: buildWelcomeEmailHtml(name, siteUrl, { line }),
  });

  if (error) {
    return { ok: false, error: error.message || 'Error al enviar email' };
  }

  return { ok: true, id: data?.id || null };
}
