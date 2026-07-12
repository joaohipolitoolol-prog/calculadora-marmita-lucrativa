import { verifyAdminRequest } from '../server/lib/firebase-admin.js';
import { sendWelcomeEmailServer } from '../server/lib/send-welcome-email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await verifyAdminRequest(req);

    const { email, name, line = 'paletas' } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'email es obligatorio' });
    }

    const result = await sendWelcomeEmailServer({ email, name, line });
    if (!result.ok) {
      const status = result.error?.includes('RESEND_API_KEY') ? 503 : 500;
      return res.status(status).json({ error: result.error });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
