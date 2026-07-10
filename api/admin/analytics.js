import { verifyAdminRequest, getFirebaseAdmin } from '../../server/lib/firebase-admin.js';
import { PAGE_META } from '../../server/lib/analytics-schema.js';

function mapCounterObject(obj = {}) {
  return Object.entries(obj).map(([key, data]) => {
    if (data && typeof data === 'object') {
      return {
        key,
        label: data.label || key,
        path: data.path || PAGE_META[key]?.path || null,
        line: data.line || PAGE_META[key]?.line || null,
        total: data.total || 0,
        today: data.today || 0,
        purpose: data.purpose || null,
        kind: data.kind || null,
      };
    }
    return { key, total: Number(data) || 0, today: 0 };
  });
}

function filterByLine(items, line) {
  if (!line || line === 'all') return items;
  return items.filter((item) => !item.line || item.line === line);
}

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

    const line = String(req.query?.line || 'all');
    const firestore = firebaseAdmin.firestore();
    const summarySnap = await firestore.doc('analytics/summary').get();
    const summary = summarySnap.exists
      ? summarySnap.data()
      : { pages: {}, events: {}, lines: {}, ctas: {}, whatsapp: {} };

    const daysSnap = await firestore
      .collection('analytics_daily')
      .orderBy(firebaseAdmin.firestore.FieldPath.documentId(), 'desc')
      .limit(14)
      .get();

    const history = daysSnap.docs.map((docSnap) => {
      const data = docSnap.data() || {};
      return {
        date: docSnap.id,
        total: data.total || 0,
        pages: data.pages || {},
        events: data.events || {},
        lines: data.lines || {},
        ctas: data.ctas || {},
        whatsapp: data.whatsapp || {},
      };
    });

    let pages = mapCounterObject(summary.pages || {});
    pages = filterByLine(pages, line);

    const events = mapCounterObject(summary.events || {});
    const lines = mapCounterObject(summary.lines || {});
    let ctas = mapCounterObject(summary.ctas || {});
    ctas = filterByLine(ctas, line).sort((a, b) => (b.today || 0) - (a.today || 0));
    let whatsapp = mapCounterObject(summary.whatsapp || {});
    whatsapp = filterByLine(whatsapp, line).sort((a, b) => (b.today || 0) - (a.today || 0));

    const todayTotal = pages.reduce((sum, page) => sum + (page.today || 0), 0);
    const allTimeTotal = pages.reduce((sum, page) => sum + (page.total || 0), 0);

    const eventToday = (key) => events.find((e) => e.key === key)?.today || 0;
    const eventTotal = (key) => events.find((e) => e.key === key)?.total || 0;

    const filteredHistory = history.map((day) => {
      if (!line || line === 'all') return day;
      const lineTotal = day.lines?.[line] || 0;
      return { ...day, total: lineTotal, lineTotal };
    });

    return res.status(200).json({
      line,
      pages,
      events,
      lines,
      ctas: ctas.slice(0, 20),
      whatsapp,
      todayTotal,
      allTimeTotal,
      history: filteredHistory,
      kpis: {
        pageViewsToday: todayTotal,
        pageViewsTotal: allTimeTotal,
        whatsappToday: eventToday('whatsapp_click'),
        whatsappTotal: eventTotal('whatsapp_click'),
        checkoutToday: eventToday('checkout_click'),
        checkoutTotal: eventTotal('checkout_click'),
        ctaToday: eventToday('cta_click'),
        registerToday: eventToday('register'),
        loginToday: eventToday('login'),
        appOpenToday: eventToday('app_open'),
      },
    });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
