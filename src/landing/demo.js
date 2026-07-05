import { money, percent, parseNumber } from '../lib/format.js';

const TARGET_MARGIN = 30;

const DEFAULTS = {
  sellingPrice: 18,
  foodCost: 10.2,
  packaging: 1.2,
  gasSpices: 0.9,
  delivery: 2,
  waste: 0.8,
  marmitasPerDay: 20,
};

function calcDemo(values) {
  const sellingPrice = Math.max(parseNumber(values.sellingPrice), 0);
  const foodCost = Math.max(parseNumber(values.foodCost), 0);
  const packaging = Math.max(parseNumber(values.packaging), 0);
  const gasSpices = Math.max(parseNumber(values.gasSpices), 0);
  const delivery = Math.max(parseNumber(values.delivery), 0);
  const waste = Math.max(parseNumber(values.waste), 0);
  const marmitasPerDay = Math.max(parseNumber(values.marmitasPerDay), 1);

  const realCost = foodCost + packaging + gasSpices + delivery + waste;
  const profit = sellingPrice - realCost;
  const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  const idealPrice = realCost / (1 - TARGET_MARGIN / 100);
  const dailyProfit = profit * marmitasPerDay;

  let status = 'lucro';
  let alertText = '';
  if (profit < 0) {
    status = 'prejuizo';
    alertText = 'Você está vendendo no prejuízo';
  } else if (margin < TARGET_MARGIN) {
    status = 'alerta';
    alertText = 'Sua margem está baixa';
  }

  return { sellingPrice, realCost, profit, margin, idealPrice, dailyProfit, status, alertText };
}

function readValues(root) {
  const get = (name) => root.querySelector(`[data-demo="${name}"]`)?.value;
  return {
    sellingPrice: get('sellingPrice'),
    foodCost: get('foodCost'),
    packaging: get('packaging'),
    gasSpices: get('gasSpices'),
    delivery: get('delivery'),
    waste: get('waste'),
    marmitasPerDay: get('marmitasPerDay'),
  };
}

function renderResults(root, r) {
  root.querySelector('[data-out="profit"]').textContent = money(r.profit);
  root.querySelector('[data-out="cost"]').textContent = money(r.realCost);
  root.querySelector('[data-out="margin"]').textContent = percent(r.margin);
  root.querySelector('[data-out="ideal"]').textContent = money(r.idealPrice);
  root.querySelector('[data-out="daily"]').textContent = money(r.dailyProfit);

  const profitCard = root.querySelector('[data-out-card="profit"]');
  const profitEl = root.querySelector('[data-out="profit"]');
  const marginEl = root.querySelector('[data-out="margin"]');
  const dailyEl = root.querySelector('[data-out="daily"]');
  const alertBox = root.querySelector('[data-out="alert-box"]');
  const alertText = root.querySelector('[data-out="alert-text"]');

  profitCard.classList.remove('status-lucro', 'status-alerta', 'status-prejuizo');
  profitCard.classList.add(`status-${r.status}`);

  profitEl.classList.remove('green', 'red');
  profitEl.classList.add(r.profit >= 0 ? 'green' : 'red');

  dailyEl.classList.remove('green', 'red');
  dailyEl.classList.add(r.profit >= 0 ? 'green' : 'red');

  marginEl.classList.remove('warn', 'green', 'red');
  marginEl.classList.add(r.status === 'prejuizo' ? 'red' : r.status === 'alerta' ? 'warn' : 'green');

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
