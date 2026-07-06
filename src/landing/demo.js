import { percent } from '../lib/format.js';

const DEFAULT_TARGET_MARGIN = 40;
const MAX_TARGET_MARGIN = 80;

function moneyDemo(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'US$ 0.00';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Converte "1,20", "1.20" ou "US$ 1.20" em número. Vazio → 0. */
export function parseDemoValue(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let s = String(value).trim();
  if (!s) return 0;

  s = s.replace(/US\$\s?/gi, '').replace(/\$\s?/g, '').replace(/\s/g, '');
  if (!s) return 0;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    s = s.replace(',', '.');
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function resolveTargetMargin(raw) {
  const parsed = parseDemoValue(raw);
  const margin = parsed > 0 ? parsed : DEFAULT_TARGET_MARGIN;

  if (margin >= 90) {
    return { margin: MAX_TARGET_MARGIN, capped: true };
  }

  return { margin, capped: false };
}

function calcDemo(values) {
  const precioVenta = parseDemoValue(values.sellingPrice);
  const ingredientes = parseDemoValue(values.foodCost);
  const empaque = parseDemoValue(values.packaging);
  const extras = parseDemoValue(values.gasSpices);
  const entrega = parseDemoValue(values.delivery);
  const desperdicio = parseDemoValue(values.waste);
  const paletasPorDia = parseDemoValue(values.marmitasPerDay);

  const { margin: margenDeseada, capped: margenCapped } = resolveTargetMargin(values.targetMargin);

  const costoReal = ingredientes + empaque + extras + entrega + desperdicio;
  const gananciaUnidad = precioVenta - costoReal;
  const margenActual = precioVenta > 0 ? (gananciaUnidad / precioVenta) * 100 : 0;
  const gananciaDia = gananciaUnidad * paletasPorDia;
  const precioRecomendado = costoReal / (1 - margenDeseada / 100);

  let status = 'lucro';
  const alerts = [];

  if (margenCapped) {
    alerts.push('Margen deseado limitado al 80% para calcular el precio sugerido.');
  }

  if (gananciaUnidad < 0) {
    status = 'prejuizo';
    alerts.push(
      `Cada paleta sale ${moneyDemo(Math.abs(gananciaUnidad))} por debajo del costo`
    );
  } else if (margenActual < margenDeseada) {
    status = 'alerta';
    alerts.push(`Tu margen está por debajo del ideal (${percent(margenDeseada)})`);
  }

  let impactText = '';
  if (paletasPorDia > 0) {
    if (gananciaUnidad >= 0) {
      impactText = `${paletasPorDia} paletas/día × ${moneyDemo(gananciaUnidad)} = ${moneyDemo(gananciaDia)} de ganancia aproximada por día`;
    } else {
      impactText = `${paletasPorDia} paletas/día × ${moneyDemo(Math.abs(gananciaUnidad))} de pérdida = ${moneyDemo(Math.abs(gananciaDia))} saliendo de tu bolsillo por día`;
    }
  }

  return {
    costoReal,
    gananciaUnidad,
    margenActual,
    gananciaDia,
    precioRecomendado,
    status,
    alertText: alerts.join(' '),
    impactText,
  };
}

function readValues(root) {
  const get = (name) => root.querySelector(`[data-demo="${name}"]`)?.value ?? '';
  return {
    sellingPrice: get('sellingPrice'),
    foodCost: get('foodCost'),
    packaging: get('packaging'),
    gasSpices: get('gasSpices'),
    delivery: get('delivery'),
    waste: get('waste'),
    marmitasPerDay: get('marmitasPerDay'),
    targetMargin: get('targetMargin'),
  };
}

function renderResults(root, r) {
  root.querySelector('[data-out="profit"]').textContent = moneyDemo(r.gananciaUnidad);
  root.querySelector('[data-out="cost"]').textContent = moneyDemo(r.costoReal);
  root.querySelector('[data-out="margin"]').textContent = percent(r.margenActual);
  root.querySelector('[data-out="ideal"]').textContent = moneyDemo(r.precioRecomendado);
  root.querySelector('[data-out="daily"]').textContent = moneyDemo(Math.abs(r.gananciaDia));

  const dailyLabel = root.querySelector('[data-out="daily-label"]');
  if (dailyLabel) {
    dailyLabel.textContent = r.gananciaUnidad >= 0 ? 'Ganancia del día' : 'Pérdida del día';
  }

  const impactEl = root.querySelector('[data-out="impact"]');
  if (impactEl) {
    impactEl.textContent = r.impactText;
    impactEl.hidden = !r.impactText;
  }

  const profitCard = root.querySelector('[data-out-card="profit"]');
  const profitEl = root.querySelector('[data-out="profit"]');
  const marginEl = root.querySelector('[data-out="margin"]');
  const dailyEl = root.querySelector('[data-out="daily"]');
  const alertBox = root.querySelector('[data-out="alert-box"]');
  const alertText = root.querySelector('[data-out="alert-text"]');

  profitCard.classList.remove('status-lucro', 'status-alerta', 'status-prejuizo');
  profitCard.classList.add(`status-${r.status}`);

  profitEl.classList.remove('green', 'red');
  profitEl.classList.add(r.gananciaUnidad >= 0 ? 'green' : 'red');

  dailyEl.classList.remove('green', 'red');
  dailyEl.classList.add(r.gananciaUnidad >= 0 ? 'green' : 'red');

  marginEl.classList.remove('warn', 'green', 'red');
  marginEl.classList.add(
    r.status === 'prejuizo' ? 'red' : r.status === 'alerta' ? 'warn' : 'green'
  );

  if (r.alertText) {
    alertBox.hidden = false;
    alertText.textContent = r.alertText;
  } else {
    alertBox.hidden = true;
  }
}

export function initDemo() {
  const root = document.getElementById('lp-demo');
  if (!root) return;

  const inputs = root.querySelectorAll('[data-demo]');

  const update = () => {
    renderResults(root, calcDemo(readValues(root)));
  };

  inputs.forEach((input) => {
    input.addEventListener('input', update);
  });

  update();
}
