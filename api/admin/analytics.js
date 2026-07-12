import { verifyAdminRequest, getFirebaseAdmin } from '../../server/lib/firebase-admin.js';
import { PAGE_META, todayKey } from '../../server/lib/analytics-schema.js';
import { publicAbEntry, rate } from '../../server/lib/analytics-ab.js';
import {
  buildStepDropoff,
  publicDwell,
  publicQuizSteps,
} from '../../server/lib/analytics-funnel.js';

/** Last N UTC day keys (YYYY-MM-DD), newest first — avoids Firestore orderBy(__name__) index. */
function lastDayKeys(n = 14) {
  const keys = [];
  const anchor = todayKey();
  const base = new Date(`${anchor}T00:00:00.000Z`);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

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

function buildAbPayload(entry) {
  const ab = publicAbEntry(entry);
  const enrich = (arm) => {
    const assignT = arm.assign.today;
    const assignAll = arm.assign.total;
    return {
      ...arm,
      rates: {
        checkoutToday: rate(arm.checkout.today, assignT),
        checkoutTotal: rate(arm.checkout.total, assignAll),
        purchaseToday: rate(arm.purchase.today, assignT),
        purchaseTotal: rate(arm.purchase.total, assignAll),
      },
    };
  };
  return {
    lp: enrich(ab.lp),
    quiz: enrich(ab.quiz),
  };
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

    const dayKeys = lastDayKeys(14);
    const daySnaps = await firestore.getAll(
      ...dayKeys.map((id) => firestore.doc(`analytics_daily/${id}`)),
    );

    const history = daySnaps
      .filter((docSnap) => docSnap.exists)
      .map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          date: docSnap.id,
          total: data.total || 0,
          pages: data.pages || {},
          events: data.events || {},
          lines: data.lines || {},
          ctas: data.ctas || {},
          whatsapp: data.whatsapp || {},
          ab: data.ab || null,
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

    const abEntry = buildAbPayload(summary.ab?.paletas?.entry || {});
    const funnel = {
      quizSteps: buildStepDropoff(publicQuizSteps(summary.quiz_steps || {})),
      dwell: publicDwell(summary.dwell || {}),
      abandon: {
        today: Number(summary.quiz_abandon?.today) || 0,
        total: Number(summary.quiz_abandon?.total) || 0,
      },
    };

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
      ab: {
        paletas: {
          entry: abEntry,
        },
      },
      funnel,
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
