import { getFirebaseAdmin, FieldValue } from '../../server/lib/firebase-admin.js';
import {
  EVENT_TYPES,
  LINES,
  PAGE_META,
  sanitizeKey,
  todayKey,
} from '../../server/lib/analytics-schema.js';
import {
  bumpAbMetric,
  metricForAbEvent,
  normalizeAbVariant,
  resetAbToday,
} from '../../server/lib/analytics-ab.js';
import {
  bumpPageDwell,
  bumpQuizAbandon,
  bumpQuizStep,
  resetFunnelToday,
} from '../../server/lib/analytics-funnel.js';

function bump(map, key, n = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + n;
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
    const body = req.body || {};
    const event = sanitizeKey(body.event, 32);
    if (!event || !EVENT_TYPES.has(event)) {
      return res.status(400).json({ error: 'event inválido' });
    }

    const page = sanitizeKey(body.page, 40);
    if (page && !PAGE_META[page]) {
      return res.status(400).json({ error: 'page inválida' });
    }

    let line = sanitizeKey(body.line, 24);
    if (line && !LINES.has(line)) line = null;
    if (!line && page && PAGE_META[page]?.line) line = PAGE_META[page].line;

    const ctaId = sanitizeKey(body.ctaId, 48);
    const numberId = sanitizeKey(body.numberId, 48);
    const purpose = sanitizeKey(body.purpose, 24);
    const tier = sanitizeKey(body.tier, 24);
    const uid = sanitizeKey(body.uid, 128);
    const seconds = Math.min(7200, Math.max(0, Number(body.seconds) || 0));
    const ab =
      normalizeAbVariant(body.ab) ||
      normalizeAbVariant(purpose) ||
      null;

    const day = todayKey();
    const firestore = firebaseAdmin.firestore();
    const summaryRef = firestore.doc('analytics/summary');
    const dailyRef = firestore.doc(`analytics_daily/${day}`);
    const eventRef = firestore.collection('analytics_events').doc();

    const eventDoc = {
      event,
      page: page || null,
      line: line || null,
      ctaId: ctaId || null,
      numberId: numberId || null,
      purpose: purpose || null,
      tier: tier || null,
      uid: uid || null,
      ab: ab || null,
      seconds: seconds || null,
      createdAt: FieldValue.serverTimestamp(),
      day,
    };

    await firestore.runTransaction(async (tx) => {
      const summarySnap = await tx.get(summaryRef);
      const dailySnap = await tx.get(dailyRef);

      const summary = summarySnap.exists
        ? summarySnap.data()
        : { pages: {}, events: {}, lines: {}, ctas: {}, whatsapp: {}, todayKey: day };
      const daily = dailySnap.exists
        ? dailySnap.data()
        : { pages: {}, events: {}, lines: {}, ctas: {}, whatsapp: {}, total: 0, date: day };

      if (summary.todayKey !== day) {
        for (const key of Object.keys(summary.pages || {})) {
          if (summary.pages[key]) summary.pages[key].today = 0;
        }
        for (const key of Object.keys(summary.events || {})) {
          if (summary.events[key] && typeof summary.events[key] === 'object') {
            summary.events[key].today = 0;
          }
        }
        for (const key of Object.keys(summary.lines || {})) {
          if (summary.lines[key] && typeof summary.lines[key] === 'object') {
            summary.lines[key].today = 0;
          }
        }
        for (const key of Object.keys(summary.ctas || {})) {
          if (summary.ctas[key] && typeof summary.ctas[key] === 'object') {
            summary.ctas[key].today = 0;
          }
        }
        for (const key of Object.keys(summary.whatsapp || {})) {
          if (summary.whatsapp[key] && typeof summary.whatsapp[key] === 'object') {
            summary.whatsapp[key].today = 0;
          }
        }
        resetAbToday(summary);
        resetFunnelToday(summary);
        if (summary.sales && typeof summary.sales === 'object') {
          summary.sales.today = 0;
        }
        if (summary.salesByLine) {
          for (const cell of Object.values(summary.salesByLine)) {
            if (cell && typeof cell === 'object') cell.today = 0;
          }
        }
        summary.todayKey = day;
      }

      if (!summary.pages) summary.pages = {};
      if (!summary.events) summary.events = {};
      if (!summary.lines) summary.lines = {};
      if (!summary.ctas) summary.ctas = {};
      if (!summary.whatsapp) summary.whatsapp = {};
      if (!daily.pages) daily.pages = {};
      if (!daily.events) daily.events = {};
      if (!daily.lines) daily.lines = {};
      if (!daily.ctas) daily.ctas = {};
      if (!daily.whatsapp) daily.whatsapp = {};

      if (event === 'page_view' && page) {
        if (!summary.pages[page]) {
          summary.pages[page] = {
            label: PAGE_META[page].label,
            path: PAGE_META[page].path,
            line: PAGE_META[page].line,
            total: 0,
            today: 0,
          };
        }
        summary.pages[page].total = (summary.pages[page].total || 0) + 1;
        summary.pages[page].today = (summary.pages[page].today || 0) + 1;
        summary.pages[page].lastViewAt = FieldValue.serverTimestamp();
        bump(daily.pages, page);
        daily.total = (daily.total || 0) + 1;
      }

      if (!summary.events[event]) summary.events[event] = { total: 0, today: 0 };
      summary.events[event].total = (summary.events[event].total || 0) + 1;
      summary.events[event].today = (summary.events[event].today || 0) + 1;
      bump(daily.events, event);

      if (line) {
        if (!summary.lines[line]) summary.lines[line] = { total: 0, today: 0 };
        summary.lines[line].total = (summary.lines[line].total || 0) + 1;
        summary.lines[line].today = (summary.lines[line].today || 0) + 1;
        bump(daily.lines, line);
      }

      if (event === 'cta_click' && ctaId) {
        if (!summary.ctas[ctaId]) summary.ctas[ctaId] = { total: 0, today: 0, line: line || null };
        summary.ctas[ctaId].total = (summary.ctas[ctaId].total || 0) + 1;
        summary.ctas[ctaId].today = (summary.ctas[ctaId].today || 0) + 1;
        bump(daily.ctas, ctaId);
      }

      if (event === 'whatsapp_click' && numberId) {
        if (!summary.whatsapp[numberId]) {
          summary.whatsapp[numberId] = {
            total: 0,
            today: 0,
            line: line || null,
            purpose: purpose || null,
          };
        }
        summary.whatsapp[numberId].total = (summary.whatsapp[numberId].total || 0) + 1;
        summary.whatsapp[numberId].today = (summary.whatsapp[numberId].today || 0) + 1;
        bump(daily.whatsapp, numberId);
      }

      if (event === 'checkout_click' && tier) {
        const checkoutKey = `${line || 'unknown'}_${tier}`;
        if (!summary.ctas[checkoutKey]) {
          summary.ctas[checkoutKey] = {
            total: 0,
            today: 0,
            line: line || null,
            kind: 'checkout',
          };
        }
        summary.ctas[checkoutKey].total = (summary.ctas[checkoutKey].total || 0) + 1;
        summary.ctas[checkoutKey].today = (summary.ctas[checkoutKey].today || 0) + 1;
        bump(daily.ctas, checkoutKey);
      }

      if (ab) {
        const metric = metricForAbEvent(event, { page, ctaId });
        if (metric) bumpAbMetric(summary, daily, ab, metric);
      }

      if (event === 'diagnostico_step' && ctaId) {
        bumpQuizStep(summary, daily, ctaId);
      }
      if (event === 'page_dwell' && page && seconds > 0) {
        bumpPageDwell(summary, daily, page, seconds);
      }
      if (event === 'diagnostico_abandon') {
        bumpQuizAbandon(summary, daily);
      }

      daily.date = day;

      tx.set(summaryRef, summary, { merge: true });
      tx.set(dailyRef, daily, { merge: true });
      tx.set(eventRef, eventDoc);
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error interno' });
  }
}
