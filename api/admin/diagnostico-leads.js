import { verifyAdminRequest, getFirebaseAdmin } from '../../server/lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await verifyAdminRequest(req);
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) {
      return res.status(503).json({ error: 'Firebase Admin no configurado' });
    }

    const limit = Math.min(200, Math.max(1, Number(req.query?.limit) || 80));
    const firestore = firebaseAdmin.firestore();
    const snap = await firestore
      .collection('diagnostico_leads')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const leads = snap.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      const createdAt = data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : data.day || null;
      return {
        id: docSnap.id,
        name: data.name || null,
        skipped: Boolean(data.skipped),
        answers: data.answers || {},
        diagnosisId: data.diagnosisId || null,
        line: data.line || 'paletas',
        createdAt,
        day: data.day || null,
      };
    });

    return res.status(200).json({ leads, count: leads.length });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status =
      message === 'Unauthorized' || message === 'Forbidden'
        ? message === 'Unauthorized'
          ? 401
          : 403
        : 500;
    return res.status(status).json({ error: message });
  }
}
