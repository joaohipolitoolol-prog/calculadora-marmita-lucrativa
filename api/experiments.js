/**
 * Public GET — Paletas A/B entry config (anonymous LP traffic).
 * No auth. Returns only non-sensitive experiment flags.
 */
import { getFirebaseAdmin } from '../server/lib/firebase-admin.js';
import {
  normalizeExperiments,
  publicExperimentsPayload,
} from '../server/lib/experiments-config.js';

const FALLBACK = publicExperimentsPayload();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Vary', 'Accept-Encoding');

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(200).json(FALLBACK);
  }

  try {
    const snap = await firebaseAdmin.firestore().doc('settings/experiments').get();
    if (!snap.exists) {
      return res.status(200).json(FALLBACK);
    }
    const data = snap.data() || {};
    const experiments = normalizeExperiments({
      paletas: data.paletas,
      updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || 0,
    });
    return res.status(200).json(publicExperimentsPayload(experiments));
  } catch {
    return res.status(200).json(FALLBACK);
  }
}
