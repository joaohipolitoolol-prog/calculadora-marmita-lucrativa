import { verifyAdminRequest, getFirebaseAdmin } from '../lib/firebase-admin.js';

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

    const firestore = firebaseAdmin.firestore();
    const summarySnap = await firestore.doc('analytics/summary').get();
    const summary = summarySnap.exists ? summarySnap.data() : { pages: {} };

    const daysSnap = await firestore
      .collection('analytics/daily')
      .orderBy(firebaseAdmin.firestore.FieldPath.documentId(), 'desc')
      .limit(14)
      .get();

    const history = daysSnap.docs.map((doc) => ({
      date: doc.id,
      total: doc.data().total || 0,
      pages: doc.data().pages || {},
    }));

    const pages = Object.entries(summary.pages || {}).map(([key, data]) => ({
      key,
      label: data.label || key,
      path: data.path || '/',
      total: data.total || 0,
      today: data.today || 0,
    }));

    const todayTotal = pages.reduce((sum, page) => sum + (page.today || 0), 0);
    const allTimeTotal = pages.reduce((sum, page) => sum + (page.total || 0), 0);

    return res.status(200).json({
      pages,
      todayTotal,
      allTimeTotal,
      history,
    });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
