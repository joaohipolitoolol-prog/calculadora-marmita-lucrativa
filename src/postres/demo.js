import { percent } from '../lib/format.js';

const DEFAULT_TARGET_MARGIN = 40;
const MAX_TARGET_MARGIN = 80;

function moneyDemo(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'US$ 0.00';
  return `US$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseDemoValue(value) {
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
  if (margin >= 90) return { margin: MAX_TARGET_MARGIN, capped: true };
  return { margin, capped: false };
}

function calcDemo(values) {
  const precioVenta = parseDemoValue(values.sellingPrice);
  const ingredientes = parseDemoValue(values.foodCost);
  const vasoTapa = parseDemoValue(values.packaging);
  const toppings = parseDemoValue(values.toppings);
  const extras = parseDemoValue(values.extras);
  const desperdicio = parseDemoValue(values.waste);
  const postresPorDia = parseDemoValue(values.postresPerDay);
  const { margin: margenDeseada } = resolveTargetMargin(values.targetMargin);

  const costoReal = ingredientes + vasoTapa + toppings + extras + desperdicio;
  const gananciaUnidad = precioVenta - costoReal;
  const margenActual = precioVenta > 0 ? (gananciaUnidad / precioVenta) * 100 : 0;
  const precioRecomendado = costoReal / (1 - margenDeseada / 100);

  return {
    costoReal,
    gananciaUnidad,
    margenActual,
    precioRecomendado,
  };
}

function isDemoCollapsed(root) {
  const inputs = root.querySelector('.demo-inputs');
  if (!inputs?.classList.contains('is-collapsed')) return false;
  return window.matchMedia('(max-width: 639px)').matches;
}

function readValues(root) {
  const get = (name) => root.querySelector(`[data-demo="${name}"]`)?.value ?? '';
  const collapsed = isDemoCollapsed(root);

  return {
    sellingPrice: get('sellingPrice'),
    foodCost: get('foodCost'),
    packaging: collapsed ? '0' : get('packaging'),
    toppings: collapsed ? '0' : get('toppings'),
    extras: collapsed ? '0' : get('extras'),
    waste: collapsed ? '0' : get('waste'),
    postresPerDay: collapsed ? '0' : get('postresPerDay'),
    targetMargin: get('targetMargin'),
  };
}

function renderResults(root, r) {
  root.querySelector('[data-out="profit"]').textContent = moneyDemo(r.gananciaUnidad);
  root.querySelector('[data-out="cost"]').textContent = moneyDemo(r.costoReal);
  root.querySelector('[data-out="margin"]').textContent = percent(r.margenActual);
  root.querySelector('[data-out="ideal"]').textContent = moneyDemo(r.precioRecomendado);

  const profitEl = root.querySelector('[data-out="profit"]');
  const marginEl = root.querySelector('[data-out="margin"]');
  profitEl.classList.remove('green', 'red');
  profitEl.classList.add(r.gananciaUnidad >= 0 ? 'green' : 'red');
  marginEl.classList.remove('warn', 'green', 'red');
  marginEl.classList.add(r.gananciaUnidad < 0 ? 'red' : 'green');
}

export function initDemo() {
  const root = document.getElementById('lp-demo');
  if (!root) return;

  const inputs = root.querySelectorAll('[data-demo]');
  const update = () => renderResults(root, calcDemo(readValues(root)));

  inputs.forEach((input) => input.addEventListener('input', update));

  const demoExpandBtn = document.getElementById('demo-expand-btn');
  const demoInputs = root.querySelector('.demo-inputs');
  if (demoExpandBtn && demoInputs) {
    demoExpandBtn.addEventListener('click', () => {
      demoInputs.classList.remove('is-collapsed');
      demoExpandBtn.hidden = true;
      update();
    });
  }

  window.matchMedia('(max-width: 639px)').addEventListener('change', update);
  update();
}
