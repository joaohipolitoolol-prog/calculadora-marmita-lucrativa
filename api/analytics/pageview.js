import { getFirebaseAdmin, FieldValue } from '../lib/firebase-admin.js';

const PAGE_LABELS = {
  home: { path: '/', label: 'Paletas LP' },
  postres: { path: '/postres', label: 'Postres LP' },
  'upsell-paletas': { path: '/upsell-paletas-premium', label: 'Upsell Paletas' },
  'upsell-postres': { path: '/postres/upsell', label: 'Upsell Postres' },
  acesso: { path: '/acesso', label: 'Acceso' },
  cadastrar: { path: '/cadastrar', label: 'Registro' },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Analytics no configurado' });
  }

  try {
    const { page } = req.body || {};
    if (!page || !PAGE_LABELS[page]) {
      return res.status(400).json({ error: 'page inválida' });
    }

    const firestore = firebaseAdmin.firestore();
    const day = todayKey();
    const summaryRef = firestore.doc('analytics/summary');
    const dailyRef = firestore.doc(`analytics/daily/${day}`);

    await firestore.runTransaction(async (tx) => {
      const summarySnap = await tx.get(summaryRef);
      const dailySnap = await tx.get(dailyRef);
      const summary = summarySnap.exists ? summarySnap.data() : { pages: {}, todayKey: day };
      const daily = dailySnap.exists ? dailySnap.data() : { pages: {}, total: 0 };

      if (summary.todayKey !== day) {
        for (const key of Object.keys(summary.pages || {})) {
          summary.pages[key].today = 0;
        }
        summary.todayKey = day;
      }

      if (!summary.pages) summary.pages = {};
      if (!summary.pages[page]) {
        summary.pages[page] = {
          label: PAGE_LABELS[page].label,
          path: PAGE_LABELS[page].path,
          total: 0,
          today: 0,
        };
      }

      summary.pages[page].total = (summary.pages[page].total || 0) + 1;
      summary.pages[page].today = (summary.pages[page].today || 0) + 1;
      summary.pages[page].lastViewAt = FieldValue.serverTimestamp();

      if (!daily.pages) daily.pages = {};
      daily.pages[page] = (daily.pages[page] || 0) + 1;
      daily.total = (daily.total || 0) + 1;
      daily.date = day;

      tx.set(summaryRef, summary, { merge: true });
      tx.set(dailyRef, daily, { merge: true });
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error interno' });
  }
}
