/**
 * Admin settings write — experiments + content flags via Admin SDK.
 * Avoids client Firestore Write channel (often blocked by ad blockers).
 */
import { verifyAdminRequest, getFirebaseAdmin, FieldValue } from '../../server/lib/firebase-admin.js';
import { normalizeExperiments } from '../../server/lib/experiments-config.js';

function normalizeContentLines(raw = {}) {
  const linesIn = raw.lines && typeof raw.lines === 'object' ? raw.lines : raw;
  const lines = {};
  for (const [lineId, flags] of Object.entries(linesIn || {})) {
    if (!flags || typeof flags !== 'object') continue;
    lines[lineId] = {
      kitOpen: flags.kitOpen !== false,
      premiumOpen: flags.premiumOpen !== false,
      audioGuideOpen: flags.audioGuideOpen !== false,
      menuWebOpen: flags.menuWebOpen === true,
    };
  }
  return lines;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(503).json({
      error: 'Firebase Admin no configurado',
      hint: 'Define FIREBASE_SERVICE_ACCOUNT en Vercel (JSON de service account en una línea).',
    });
  }

  try {
    await verifyAdminRequest(req);
  } catch (err) {
    const msg = err?.message || 'Unauthorized';
    const status = msg === 'Forbidden' ? 403 : 401;
    return res.status(status).json({ error: msg });
  }

  try {
    const body = req.body || {};
    const firestore = firebaseAdmin.firestore();
    const result = {};

    if (body.experiments) {
      const experiments = normalizeExperiments(body.experiments);
      await firestore.doc('settings/experiments').set(
        {
          paletas: { entry: experiments.paletas.entry },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      result.experiments = {
        paletas: experiments.paletas,
        updatedAt: Date.now(),
      };
    }

    if (body.content) {
      const lines = normalizeContentLines(body.content);
      if (Object.keys(lines).length) {
        await firestore.doc('settings/content').set(
          {
            lines,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        result.content = { lines, updatedAt: Date.now() };
      }
    }

    if (!result.experiments && !result.content) {
      return res.status(400).json({ error: 'Nada que guardar (experiments|content)' });
    }

    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('[admin/settings]', err);
    return res.status(500).json({ error: err?.message || 'Error al guardar' });
  }
}
