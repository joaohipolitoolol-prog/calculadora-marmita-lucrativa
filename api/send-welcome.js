import { Resend } from 'resend';
import { verifyAdminRequest } from '../server/lib/firebase-admin.js';
import { buildWelcomeEmailHtml } from '../server/lib/welcome-email.js';
import { BRAND_KIT, BRAND_NAME } from '../src/site/brand.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'RESEND_API_KEY no configurada en Vercel' });
  }

  try {
    await verifyAdminRequest(req);

    const { email, name } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'email es obligatorio' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.SITE_URL || 'https://paletasparawhatsapp.vercel.app';
    const from = process.env.RESEND_FROM_EMAIL || `${BRAND_NAME} <onboarding@resend.dev>`;

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: `Tu ${BRAND_KIT} está listo 🍓`,
      html: buildWelcomeEmailHtml(name, siteUrl),
    });

    if (error) {
      return res.status(500).json({ error: error.message || 'Error al enviar email' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
