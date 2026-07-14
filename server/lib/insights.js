/**
 * Rule-based admin insights (no LLM).
 * Returns i18n keys + params for the Dashboard copy layer.
 */

const MIN_AB_ASSIGNS = 30;
const AB_CVR_GAP_PP = 0.5; // percentage points
const QUIZ_DROP_ALERT = 35; // % drop between consecutive steps
const LOW_DWELL_SECONDS = 12;
const CHECKOUT_TO_SALE_ALERT = 8; // checkouts per sale (or checkouts with 0 sales)

function fmtPct(n) {
  const v = Number(n) || 0;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

function fmtGap(a, b) {
  const gap = Math.abs((Number(a) || 0) - (Number(b) || 0));
  return `${gap % 1 === 0 ? gap.toFixed(0) : gap.toFixed(1)}pp`;
}

function avgDwellSeconds(dwell, pageKey) {
  const cell = dwell?.[pageKey];
  if (!cell) return null;
  if (Number(cell.todaySessions) > 0 && cell.avgSecondsToday != null) {
    return Number(cell.avgSecondsToday) || 0;
  }
  if (Number(cell.sessions) > 0 && cell.avgSeconds != null) {
    return Number(cell.avgSeconds) || 0;
  }
  const sessions = Number(cell.todaySessions ?? cell.sessions) || 0;
  const seconds = Number(cell.todaySeconds ?? cell.seconds) || 0;
  if (sessions <= 0) return null;
  return Math.round(seconds / sessions);
}

/**
 * @param {{
 *   line?: string,
 *   kpis?: object,
 *   salesByLine?: object,
 *   abEntry?: { lp: object, quiz: object },
 *   funnel?: { quizSteps?: array, dwell?: object, abandon?: object },
 *   pageViewsByLine?: { paletas?: number, postres?: number },
 * }} input
 */
export function buildInsights(input = {}) {
  const line = String(input.line || 'all');
  const range = String(input.range || 'today');
  const kpis = input.kpis || {};
  const salesByLine = input.salesByLine || {};
  const ab = input.abEntry || {};
  const funnel = input.funnel || {};
  const pageViewsByLine = input.pageViewsByLine || {};

  const paletasSales = Number(salesByLine.paletas?.period ?? salesByLine.paletas?.today) || 0;
  const postresSales = Number(salesByLine.postres?.period ?? salesByLine.postres?.today) || 0;
  const minipostresSales =
    Number(salesByLine.minipostres?.period ?? salesByLine.minipostres?.today) || 0;
  const salesPeriod = Number(kpis.salesToday) || 0;
  const checkoutPeriod = Number(kpis.checkoutToday) || 0;
  const pageViews = Number(kpis.pageViewsToday) || 0;
  const waPeriod = Number(kpis.whatsappToday) || 0;

  const lp = ab.lp || {};
  const quiz = ab.quiz || {};
  const lpAssign = Number(lp.assign?.today) || 0;
  const quizAssign = Number(quiz.assign?.today) || 0;
  const lpCvr = Number(lp.rates?.purchaseToday) || 0;
  const quizCvr = Number(quiz.rates?.purchaseToday) || 0;
  const sampleOk = lpAssign >= MIN_AB_ASSIGNS && quizAssign >= MIN_AB_ASSIGNS;

  let winner = 'none';
  if (sampleOk) {
    if (quizCvr > lpCvr + AB_CVR_GAP_PP) winner = 'quiz';
    else if (lpCvr > quizCvr + AB_CVR_GAP_PP) winner = 'lp';
    else winner = 'tie';
  } else if (lpAssign + quizAssign > 0) {
    winner = 'early';
  }

  const bullets = [];
  const suggestions = [];

  bullets.push({
    id: 'sales_by_line',
    params: { paletas: paletasSales, postres: postresSales, minipostres: minipostresSales },
  });

  bullets.push({
    id: 'traffic_snapshot',
    params: { views: pageViews, checkout: checkoutPeriod, wa: waPeriod, sales: salesPeriod },
  });

  if (checkoutPeriod > 0 || salesPeriod > 0) {
    bullets.push({
      id: 'checkout_vs_sales',
      params: { checkout: checkoutPeriod, sales: salesPeriod },
    });
  }

  const dwellHome = avgDwellSeconds(funnel.dwell, 'home');
  const dwellDiag = avgDwellSeconds(funnel.dwell, 'diagnostico');
  if (dwellHome != null) {
    bullets.push({ id: 'dwell_home', params: { seconds: dwellHome } });
  }
  if (dwellDiag != null && (line === 'all' || line === 'paletas')) {
    bullets.push({ id: 'dwell_quiz', params: { seconds: dwellDiag } });
  }

  if (winner === 'quiz' || winner === 'lp' || winner === 'tie') {
    bullets.push({
      id: 'ab_winner',
      params: {
        winner,
        lpCvr: fmtPct(lpCvr),
        quizCvr: fmtPct(quizCvr),
        gap: fmtGap(quizCvr, lpCvr),
      },
    });
  } else if (winner === 'early') {
    bullets.push({
      id: 'ab_early',
      params: { lp: lpAssign, quiz: quizAssign, min: MIN_AB_ASSIGNS },
    });
  }

  // Headline
  let headline = 'quiet_day';
  let headlineParams = { range };

  if (winner === 'quiz') {
    headline = 'quiz_beats_lp';
    headlineParams = { quizCvr: fmtPct(quizCvr), lpCvr: fmtPct(lpCvr), range };
  } else if (winner === 'lp') {
    headline = 'lp_beats_quiz';
    headlineParams = { lpCvr: fmtPct(lpCvr), quizCvr: fmtPct(quizCvr), range };
  } else if (winner === 'tie' && sampleOk) {
    headline = 'ab_tie';
    headlineParams = { cvr: fmtPct(lpCvr), range };
  } else if (salesPeriod > 0) {
    headline = 'sales_ok';
    headlineParams = { sales: salesPeriod, checkout: checkoutPeriod, range };
  } else if (pageViews > 0) {
    headline = 'traffic_no_sales';
    headlineParams = { views: pageViews, range };
  }

  // Suggestions
  if (winner === 'quiz') {
    suggestions.push({ id: 'shift_traffic_quiz', severity: 'high' });
  } else if (winner === 'lp') {
    suggestions.push({ id: 'shift_traffic_lp', severity: 'high' });
  } else if (winner === 'early') {
    suggestions.push({ id: 'wait_ab_sample', severity: 'low' });
  }

  const steps = Array.isArray(funnel.quizSteps) ? funnel.quizSteps : [];
  let worstDrop = null;
  for (const step of steps) {
    const drop = Number(step.dropFromPrev);
    if (!Number.isFinite(drop) || drop < QUIZ_DROP_ALERT) continue;
    if (!worstDrop || drop > worstDrop.dropFromPrev) {
      worstDrop = step;
    }
  }
  if (worstDrop && (line === 'all' || line === 'paletas')) {
    suggestions.push({
      id: 'fix_quiz_step',
      severity: 'med',
      params: {
        step: worstDrop.label || worstDrop.id,
        drop: `${Math.round(worstDrop.dropFromPrev)}%`,
      },
    });
  }

  if (dwellHome != null && dwellHome < LOW_DWELL_SECONDS && pageViews >= 20) {
    suggestions.push({ id: 'improve_lp_clarity', severity: 'med' });
  }

  if (checkoutPeriod >= CHECKOUT_TO_SALE_ALERT && salesPeriod === 0) {
    suggestions.push({ id: 'checkout_friction', severity: 'high' });
  } else if (
    checkoutPeriod >= CHECKOUT_TO_SALE_ALERT &&
    salesPeriod > 0 &&
    checkoutPeriod / salesPeriod >= CHECKOUT_TO_SALE_ALERT
  ) {
    suggestions.push({ id: 'checkout_friction', severity: 'med' });
  }

  const postresViews = Number(pageViewsByLine.postres) || 0;
  if (
    (line === 'all' || line === 'postres') &&
    postresViews >= 15 &&
    postresSales === 0
  ) {
    suggestions.push({ id: 'postres_traffic_no_sales', severity: 'med' });
  }

  return {
    range,
    generatedAt: new Date().toISOString(),
    headline,
    headlineParams,
    bullets: bullets.slice(0, 5),
    suggestions: suggestions.slice(0, 3),
    ab: {
      winner,
      sampleOk,
      minAssigns: MIN_AB_ASSIGNS,
      lpCvr,
      quizCvr,
      lpAssign,
      quizAssign,
      lpCheckout: Number(lp.checkout?.today) || 0,
      quizCheckout: Number(quiz.checkout?.today) || 0,
      lpPurchase: Number(lp.purchase?.today) || 0,
      quizPurchase: Number(quiz.purchase?.today) || 0,
    },
  };
}
