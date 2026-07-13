import { getFirebaseAdmin, FieldValue } from '../../server/lib/firebase-admin.js';

const ANSWER_KEYS = ['experience', 'blocker', 'channel', 'start', 'victory'];
const MAX_NAME = 40;
const MAX_DIAGNOSIS = 48;
const MAX_ANSWER = 48;

function sanitizeText(value, max) {
  if (value == null) return '';
  return String(value).trim().slice(0, max);
}

function sanitizeAnswerMap(raw = {}) {
  const out = {};
  for (const key of ANSWER_KEYS) {
    const v = sanitizeText(raw[key], MAX_ANSWER);
    if (v && /^[a-zA-Z0-9_-]+$/.test(v)) out[key] = v;
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Lead capture no configurado' });
  }

  try {
    const body = req.body || {};
    const skipped = body.skipped === true;
    const name = sanitizeText(body.name, MAX_NAME);
    const diagnosisId = sanitizeText(body.diagnosisId, MAX_DIAGNOSIS);
    const answers = sanitizeAnswerMap(body.answers);

    if (!skipped && !name) {
      return res.status(400).json({ error: 'name requerido' });
    }

    const firestore = firebaseAdmin.firestore();
    const ref = firestore.collection('diagnostico_leads').doc();
    const doc = {
      name: name || null,
      skipped,
      answers,
      diagnosisId: diagnosisId || null,
      line: 'paletas',
      page: 'diagnostico',
      createdAt: FieldValue.serverTimestamp(),
      day: new Date().toISOString().slice(0, 10),
    };

    await ref.set(doc);
    return res.status(200).json({ ok: true, id: ref.id });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error interno' });
  }
}
