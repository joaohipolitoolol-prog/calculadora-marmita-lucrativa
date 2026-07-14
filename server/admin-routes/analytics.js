import { verifyAdminRequest, getFirebaseAdmin } from '../lib/firebase-admin.js';
import { PAGE_META, todayKey } from '../lib/analytics-schema.js';
import {
  AB_METRICS,
  AB_VARIANTS,
  emptyAbEntry,
  publicAbEntry,
  rate,
} from '../lib/analytics-ab.js';
import {
  QUIZ_STEP_IDS,
  buildStepDropoff,
  publicDwell,
  publicQuizSteps,
} from '../lib/analytics-funnel.js';
import { buildInsights } from '../lib/insights.js';

const KNOWN_LINES = ['paletas', 'postres', 'donuts', 'minipostres'];

function productToLine(product) {
  const p = String(product || '').toLowerCase();
  if (!p) return null;
  for (const line of KNOWN_LINES) {
    if (p === line || p.startsWith(`${line}_`)) return line;
  }
  return null;
}

function emptySalesCell() {
  return { period: 0, total: 0 };
}

/** Aggregate paid sales by line for a period (+ all-time totals from summary). */
function buildSalesByLine(summary, dayDocs, useSummaryPeriod) {
  const out = {};
  for (const line of KNOWN_LINES) {
    const cell = summary.salesByLine?.[line];
    out[line] = {
      period: 0,
      total: Number(cell?.total) || 0,
    };
  }

  if (useSummaryPeriod) {
    for (const line of KNOWN_LINES) {
      out[line].period = out[line].total;
    }
    return out;
  }

  for (const day of dayDocs) {
    if (day.salesByLine && typeof day.salesByLine === 'object') {
      for (const [line, n] of Object.entries(day.salesByLine)) {
        if (!out[line]) out[line] = emptySalesCell();
        out[line].period += Number(n) || 0;
      }
      continue;
    }
    // Backfill older daily docs that only have salesByProduct
    if (day.salesByProduct && typeof day.salesByProduct === 'object') {
      for (const [product, n] of Object.entries(day.salesByProduct)) {
        const line = productToLine(product);
        if (!line) continue;
        if (!out[line]) out[line] = emptySalesCell();
        out[line].period += Number(n) || 0;
      }
    }
  }

  // Prefer live summary "today" when daily docs lack per-line breakdown yet
  if (dayDocs.length === 1) {
    for (const line of KNOWN_LINES) {
      const summaryToday = Number(summary.salesByLine?.[line]?.today) || 0;
      if (summaryToday > out[line].period) out[line].period = summaryToday;
    }
  }

  return out;
}

function buildSalesByProduct(summary, dayDocs, useSummaryPeriod) {
  const out = {};
  const ensure = (product) => {
    if (!out[product]) out[product] = emptySalesCell();
    return out[product];
  };

  for (const [product, cell] of Object.entries(summary.salesByProduct || {})) {
    const row = ensure(product);
    row.total =
      cell && typeof cell === 'object'
        ? Number(cell.total) || 0
        : Number(cell) || 0;
  }

  if (useSummaryPeriod) {
    for (const row of Object.values(out)) {
      row.period = row.total;
    }
    return out;
  }

  for (const day of dayDocs) {
    if (!day.salesByProduct || typeof day.salesByProduct !== 'object') continue;
    for (const [product, n] of Object.entries(day.salesByProduct)) {
      const row = ensure(product);
      row.period += Number(n) || 0;
      if (!row.total) {
        // Keep total from summary when present; otherwise accumulate seen period as floor
        row.total = Math.max(row.total, row.period);
      }
    }
  }
  return out;
}

function sumCheckoutFromCtas(ctas) {
  return (ctas || [])
    .filter(
      (c) =>
        c.kind === 'checkout' ||
        /_(kit|premium)$/i.test(String(c.key || '')),
    )
    .reduce((sum, c) => sum + (Number(c.today) || 0), 0);
}

function pageViewsByLineFromPages(pages) {
  const out = { paletas: 0, postres: 0, donuts: 0, minipostres: 0 };
  for (const p of pages || []) {
    const line = p.line;
    if (line && out[line] != null) {
      out[line] += Number(p.today) || 0;
    }
  }
  return out;
}

const RANGE_DAYS = {
  today: 1,
  yesterday: 1,
  '7d': 7,
  '30d': 30,
  all: 30,
};

/** Last N UTC day keys (YYYY-MM-DD), newest first — avoids Firestore orderBy(__name__) index. */
function lastDayKeys(n = 14, offset = 0) {
  const keys = [];
  const anchor = todayKey();
  const base = new Date(`${anchor}T00:00:00.000Z`);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - (i + offset));
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function resolveRangeKeys(range) {
  const r = String(range || 'today');
  if (r === 'yesterday') return lastDayKeys(1, 1);
  if (r === '7d') return lastDayKeys(7);
  if (r === '30d') return lastDayKeys(30);
  if (r === 'all') return null; // use summary totals
  return lastDayKeys(1); // today
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

/** Sum daily AB counters into summary-shaped entry (period → today, all-time → total). */
function abEntryFromDays(dayDocs, summaryEntry) {
  const out = emptyAbEntry();
  // totals from summary (all-time)
  const summary = publicAbEntry(summaryEntry || {});
  for (const variant of AB_VARIANTS) {
    for (const metric of AB_METRICS) {
      out[variant][metric].total = summary[variant][metric].total;
      out[variant][metric].today = 0;
    }
  }
  for (const day of dayDocs) {
    const entry = day.ab?.paletas?.entry || {};
    for (const variant of AB_VARIANTS) {
      const arm = entry[variant] || {};
      for (const metric of AB_METRICS) {
        out[variant][metric].today += Number(arm[metric]) || 0;
      }
    }
  }
  return out;
}

function quizStepsFromDays(dayDocs, summarySteps) {
  const totals = {};
  for (const id of QUIZ_STEP_IDS) {
    totals[id] = {
      today: 0,
      total: Number(summarySteps?.[id]?.total) || 0,
    };
  }
  for (const day of dayDocs) {
    const steps = day.quiz_steps || {};
    for (const id of QUIZ_STEP_IDS) {
      totals[id].today += Number(steps[id]) || 0;
    }
  }
  return totals;
}

function dwellFromDays(dayDocs, summaryDwell) {
  const out = {};
  const pages = new Set([
    ...Object.keys(summaryDwell || {}),
    ...dayDocs.flatMap((d) => Object.keys(d.dwell || {})),
  ]);
  for (const page of pages) {
    const sum = summaryDwell?.[page] || {};
    let sessions = 0;
    let seconds = 0;
    for (const day of dayDocs) {
      const cell = day.dwell?.[page];
      if (!cell) continue;
      sessions += Number(cell.sessions) || 0;
      seconds += Number(cell.seconds) || 0;
    }
    out[page] = {
      sessions: Number(sum.sessions) || 0,
      seconds: Number(sum.seconds) || 0,
      todaySessions: sessions,
      todaySeconds: seconds,
    };
  }
  return out;
}

function abandonFromDays(dayDocs, summaryAbandon) {
  let today = 0;
  for (const day of dayDocs) {
    today += Number(day.quiz_abandon) || 0;
  }
  return {
    today,
    total: Number(summaryAbandon?.total) || 0,
  };
}

function sumDailyPages(dayDocs, summaryPages, line) {
  const keys = new Set([
    ...Object.keys(summaryPages || {}),
    ...dayDocs.flatMap((d) => Object.keys(d.pages || {})),
  ]);
  const items = [];
  for (const key of keys) {
    const meta = summaryPages?.[key] || PAGE_META[key] || {};
    const pageLine = meta.line || PAGE_META[key]?.line || null;
    if (line && line !== 'all' && pageLine && pageLine !== line) continue;
    let period = 0;
    for (const day of dayDocs) {
      period += Number(day.pages?.[key]) || 0;
    }
    items.push({
      key,
      label: meta.label || PAGE_META[key]?.label || key,
      path: meta.path || PAGE_META[key]?.path || null,
      line: pageLine,
      today: period,
      total: Number(meta.total) || 0,
    });
  }
  return items.sort((a, b) => (b.today || 0) - (a.today || 0));
}

function sumDailyEvent(dayDocs, eventKey) {
  let n = 0;
  for (const day of dayDocs) {
    n += Number(day.events?.[eventKey]) || 0;
  }
  return n;
}

function sumDailyWhatsapp(dayDocs, summaryWa, line) {
  const keys = new Set([
    ...Object.keys(summaryWa || {}),
    ...dayDocs.flatMap((d) => Object.keys(d.whatsapp || {})),
  ]);
  const items = [];
  for (const key of keys) {
    const meta = summaryWa?.[key] || {};
    if (line && line !== 'all' && meta.line && meta.line !== line) continue;
    let period = 0;
    for (const day of dayDocs) {
      period += Number(day.whatsapp?.[key]) || 0;
    }
    items.push({
      key,
      line: meta.line || null,
      purpose: meta.purpose || null,
      today: period,
      total: Number(meta.total) || 0,
    });
  }
  return items.sort((a, b) => (b.today || 0) - (a.today || 0));
}

function sumDailyCtas(dayDocs, summaryCtas, line) {
  const keys = new Set([
    ...Object.keys(summaryCtas || {}),
    ...dayDocs.flatMap((d) => Object.keys(d.ctas || {})),
  ]);
  const items = [];
  for (const key of keys) {
    const meta = summaryCtas?.[key] || {};
    if (line && line !== 'all' && meta.line && meta.line !== line) continue;
    let period = 0;
    for (const day of dayDocs) {
      period += Number(day.ctas?.[key]) || 0;
    }
    items.push({
      key,
      line: meta.line || null,
      kind: meta.kind || null,
      today: period,
      total: Number(meta.total) || 0,
    });
  }
  return items.sort((a, b) => (b.today || 0) - (a.today || 0));
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
    const range = ['today', 'yesterday', '7d', '30d', 'all'].includes(String(req.query?.range || ''))
      ? String(req.query.range)
      : 'today';

    const firestore = firebaseAdmin.firestore();
    const summarySnap = await firestore.doc('analytics/summary').get();
    const summary = summarySnap.exists
      ? summarySnap.data()
      : { pages: {}, events: {}, lines: {}, ctas: {}, whatsapp: {} };

    // Always load 30 days for history + range aggregation
    const fetchKeys = lastDayKeys(Math.max(RANGE_DAYS[range] || 30, 30));
    const daySnaps = await firestore.getAll(
      ...fetchKeys.map((id) => firestore.doc(`analytics_daily/${id}`)),
    );

    const allDays = daySnaps
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
          quiz_steps: data.quiz_steps || {},
          dwell: data.dwell || {},
          quiz_abandon: data.quiz_abandon || 0,
          sales: data.sales || 0,
          salesByLine: data.salesByLine || null,
          salesByProduct: data.salesByProduct || null,
        };
      });

    const rangeKeys = resolveRangeKeys(range);
    const rangeDays = rangeKeys
      ? allDays.filter((d) => rangeKeys.includes(d.date))
      : allDays;

    const useSummaryPeriod = range === 'all';

    const salesByLine = buildSalesByLine(summary, rangeDays, useSummaryPeriod);
    const salesByProduct = buildSalesByProduct(
      summary,
      rangeDays,
      useSummaryPeriod,
    );

    // Paid sales (webhook deduped) — not checkout clicks; filter by line when set
    let salesToday = Number(summary.sales?.today) || 0;
    let salesTotal = Number(summary.sales?.total) || 0;
    if (!useSummaryPeriod && rangeDays.length) {
      salesToday = rangeDays.reduce((sum, d) => sum + (Number(d.sales) || 0), 0);
    }
    if (useSummaryPeriod) {
      salesToday = salesTotal;
    }
    if (line && line !== 'all') {
      const cell = salesByLine[line] || emptySalesCell();
      salesToday = Number(cell.period) || 0;
      salesTotal = Number(cell.total) || 0;
    }
    let pages;
    let ctas;
    let whatsapp;
    let checkoutPeriod;
    let whatsappPeriod;
    let abRaw;
    let quizStepsRaw;
    let dwellRaw;
    let abandonRaw;

    if (useSummaryPeriod) {
      pages = filterByLine(mapCounterObject(summary.pages || {}), line).map((p) => ({
        ...p,
        today: p.total,
      }));
      ctas = filterByLine(mapCounterObject(summary.ctas || {}), line)
        .map((c) => ({ ...c, today: c.total }))
        .sort((a, b) => (b.today || 0) - (a.today || 0));
      whatsapp = filterByLine(mapCounterObject(summary.whatsapp || {}), line)
        .map((w) => ({ ...w, today: w.total }))
        .sort((a, b) => (b.today || 0) - (a.today || 0));
      const events = mapCounterObject(summary.events || {});
      checkoutPeriod = events.find((e) => e.key === 'checkout_click')?.total || 0;
      whatsappPeriod = events.find((e) => e.key === 'whatsapp_click')?.total || 0;
      abRaw = publicAbEntry(summary.ab?.paletas?.entry || {});
      for (const v of AB_VARIANTS) {
        for (const m of AB_METRICS) {
          abRaw[v][m].today = abRaw[v][m].total;
        }
      }
      quizStepsRaw = summary.quiz_steps || {};
      for (const id of QUIZ_STEP_IDS) {
        if (!quizStepsRaw[id]) quizStepsRaw[id] = { today: 0, total: 0 };
        quizStepsRaw[id] = {
          today: Number(quizStepsRaw[id].total) || 0,
          total: Number(quizStepsRaw[id].total) || 0,
        };
      }
      dwellRaw = summary.dwell || {};
      for (const page of Object.keys(dwellRaw)) {
        const cell = dwellRaw[page];
        dwellRaw[page] = {
          ...cell,
          todaySessions: Number(cell.sessions) || 0,
          todaySeconds: Number(cell.seconds) || 0,
        };
      }
      abandonRaw = {
        today: Number(summary.quiz_abandon?.total) || 0,
        total: Number(summary.quiz_abandon?.total) || 0,
      };
    } else {
      pages = sumDailyPages(rangeDays, summary.pages || {}, line);
      ctas = sumDailyCtas(rangeDays, summary.ctas || {}, line);
      whatsapp = sumDailyWhatsapp(rangeDays, summary.whatsapp || {}, line);
      checkoutPeriod =
        line && line !== 'all'
          ? sumCheckoutFromCtas(ctas)
          : sumDailyEvent(rangeDays, 'checkout_click');
      whatsappPeriod = sumDailyEvent(rangeDays, 'whatsapp_click');
      abRaw = abEntryFromDays(rangeDays, summary.ab?.paletas?.entry || {});
      quizStepsRaw = quizStepsFromDays(rangeDays, summary.quiz_steps || {});
      dwellRaw = dwellFromDays(rangeDays, summary.dwell || {});
      abandonRaw = abandonFromDays(rangeDays, summary.quiz_abandon || {});
    }

    // When filtering by line on "all" range, prefer checkout CTAs for that line
    if (useSummaryPeriod && line && line !== 'all') {
      checkoutPeriod = sumCheckoutFromCtas(ctas);
    }

    const events = mapCounterObject(summary.events || {});
    const lines = mapCounterObject(summary.lines || {});
    const eventTotal = (key) => events.find((e) => e.key === key)?.total || 0;
    const eventToday = (key) => events.find((e) => e.key === key)?.today || 0;

    const todayTotal = pages.reduce((sum, page) => sum + (page.today || 0), 0);
    const allTimeTotal = pages.reduce((sum, page) => sum + (page.total || 0), 0);

    const filteredHistory = allDays.slice(0, 14).map((day) => {
      if (!line || line === 'all') return day;
      const lineTotal = day.lines?.[line] || 0;
      return { ...day, total: lineTotal, lineTotal };
    });

    const abEntry = buildAbPayload(abRaw);
    const funnel = {
      quizSteps: buildStepDropoff(publicQuizSteps(quizStepsRaw)),
      dwell: publicDwell(dwellRaw),
      abandon: abandonRaw,
    };

    const kpis = {
      pageViewsToday: todayTotal,
      pageViewsTotal: allTimeTotal,
      whatsappToday: whatsappPeriod,
      whatsappTotal: eventTotal('whatsapp_click'),
      checkoutToday: checkoutPeriod,
      checkoutTotal:
        line && line !== 'all'
          ? sumCheckoutFromCtas(
              filterByLine(mapCounterObject(summary.ctas || {}), line).map((c) => ({
                ...c,
                today: c.total,
              })),
            )
          : eventTotal('checkout_click'),
      salesToday,
      salesTotal,
      ctaToday: eventToday('cta_click'),
      registerToday: eventToday('register'),
      loginToday: eventToday('login'),
      appOpenToday: eventToday('app_open'),
    };

    const insights = buildInsights({
      line,
      kpis,
      salesByLine,
      abEntry,
      funnel,
      pageViewsByLine: pageViewsByLineFromPages(
        // Unfiltered page views for cross-line insight (postres traffic)
        useSummaryPeriod
          ? mapCounterObject(summary.pages || {}).map((p) => ({
              ...p,
              today: p.total,
            }))
          : sumDailyPages(rangeDays, summary.pages || {}, 'all'),
      ),
    });

    return res.status(200).json({
      line,
      range,
      fetchedAt: new Date().toISOString(),
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
      salesByLine,
      salesByProduct,
      insights,
      kpis,
      legend: {
        checkout: 'checkout_click',
        sales: 'paid_hotmart_transaction',
        whatsapp: 'whatsapp_click',
        note: 'Ventas = compras reales Hotmart (1 por transacción). Checkout = solo clics al botón, NO son compras pagadas.',
      },
    });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
