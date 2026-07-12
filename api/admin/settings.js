/**
 * Admin settings — GET (load) + POST (save) via Admin SDK.
 * Avoids client Firestore (ad blockers / silent defaults on refresh).
 */
import { verifyAdminRequest, getFirebaseAdmin, FieldValue } from '../../server/lib/firebase-admin.js';
import { normalizeExperiments } from '../../server/lib/experiments-config.js';

const ENABLED_LINES = ['paletas', 'postres'];

const DEFAULT_LINE_FLAGS = {
  kitOpen: true,
  premiumOpen: true,
  audioGuideOpen: true,
  menuWebOpen: false,
};

function normalizeContentLines(raw = {}) {
  const linesIn = raw.lines && typeof raw.lines === 'object' ? raw.lines : raw;
  const lines = {};
  for (const lineId of ENABLED_LINES) {
    const flags = linesIn?.[lineId] || {};
    lines[lineId] = {
      kitOpen: flags.kitOpen !== false,
      premiumOpen: flags.premiumOpen !== false,
      audioGuideOpen: flags.audioGuideOpen !== false,
      menuWebOpen: flags.menuWebOpen === true,
    };
  }
  for (const [lineId, flags] of Object.entries(linesIn || {})) {
    if (lines[lineId] || !flags || typeof flags !== 'object') continue;
    lines[lineId] = {
      kitOpen: flags.kitOpen !== false,
      premiumOpen: flags.premiumOpen !== false,
      audioGuideOpen: flags.audioGuideOpen !== false,
      menuWebOpen: flags.menuWebOpen === true,
    };
  }
  return lines;
}

function defaultContentLines() {
  const lines = {};
  for (const lineId of ENABLED_LINES) {
    lines[lineId] = { ...DEFAULT_LINE_FLAGS };
  }
  return lines;
}

async function readSettings(firestore) {
  const [expSnap, contentSnap] = await Promise.all([
    firestore.doc('settings/experiments').get(),
    firestore.doc('settings/content').get(),
  ]);

  const experiments = normalizeExperiments(
    expSnap.exists
      ? {
          paletas: expSnap.data()?.paletas,
          updatedAt: expSnap.data()?.updatedAt?.toMillis?.() || Date.now(),
        }
      : {},
  );

  const contentData = contentSnap.exists ? contentSnap.data() : null;
  const content = {
    lines: contentData?.lines
      ? normalizeContentLines({ lines: contentData.lines })
      : defaultContentLines(),
    updatedAt: contentData?.updatedAt?.toMillis?.() || 0,
  };

  return { experiments, content };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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

  const firestore = firebaseAdmin.firestore();

  if (req.method === 'GET') {
    try {
      const settings = await readSettings(firestore);
      return res.status(200).json({ ok: true, ...settings });
    } catch (err) {
      console.error('[admin/settings GET]', err);
      return res.status(500).json({ error: err?.message || 'Error al cargar' });
    }
  }

  try {
    const body = req.body || {};
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

    const confirmed = await readSettings(firestore);
    return res.status(200).json({ ok: true, ...confirmed, wrote: result });
  } catch (err) {
    console.error('[admin/settings POST]', err);
    return res.status(500).json({ error: err?.message || 'Error al guardar' });
  }
}
