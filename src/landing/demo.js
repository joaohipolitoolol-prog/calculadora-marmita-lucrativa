import { money, percent, parseNumber } from '../lib/format.js';

const TARGET_MARGIN = 30;
const MIN_SELLING_PRICE = 5;

function calcDemo(values) {
  const sellingPriceRaw = parseNumber(values.sellingPrice);
  const sellingPrice = sellingPriceRaw >= MIN_SELLING_PRICE ? sellingPriceRaw : MIN_SELLING_PRICE;
  const foodCost = Math.max(parseNumber(values.foodCost), 0);
  const packaging = Math.max(parseNumber(values.packaging), 0);
  const gasSpices = Math.max(parseNumber(values.gasSpices), 0);
  const delivery = Math.max(parseNumber(values.delivery), 0);
  const waste = Math.max(parseNumber(values.waste), 0);
  const marmitasPerDay = Math.max(parseNumber(values.marmitasPerDay), 1);

  const realCost = foodCost + packaging + gasSpices + delivery + waste;
  const profit = sellingPrice - realCost;
  const dailyProfit = profit * marmitasPerDay;
  const idealPrice = realCost / (1 - TARGET_MARGIN / 100);

  let marginLabel = '—';
  let marginClass = 'warn';

  if (sellingPriceRaw >= MIN_SELLING_PRICE) {
    const margin = (profit / sellingPrice) * 100;
    if (margin < -100) {
      marginLabel = 'Prejuízo alto';
      marginClass = 'red';
    } else {
      marginLabel = percent(margin);
      marginClass = profit < 0 ? 'red' : margin < TARGET_MARGIN ? 'warn' : 'green';
    }
  }

  let status = 'lucro';
  let alertText = '';
  if (profit < 0) {
    status = 'prejuizo';
    alertText = `Cada marmita sai R$ ${Math.abs(profit).toFixed(2).replace('.', ',')} abaixo do custo`;
  } else if (profit / sellingPrice < TARGET_MARGIN / 100) {
    status = 'alerta';
    alertText = 'Sua margem está abaixo do ideal (30%)';
  }

  let impactText = '';
  if (sellingPriceRaw >= MIN_SELLING_PRICE) {
    if (profit >= 0) {
      impactText = `${marmitasPerDay} marmitas/dia × ${money(profit)} = ${money(dailyProfit)} no bolso por dia`;
    } else {
      impactText = `${marmitasPerDay} marmitas/dia × ${money(Math.abs(profit))} de prejuízo = ${money(Math.abs(dailyProfit))} saindo do bolso por dia`;
    }
  }

  return {
    sellingPrice,
    realCost,
    profit,
    marginLabel,
    marginClass,
    idealPrice,
    dailyProfit,
    status,
    alertText,
    impactText,
    invalidPrice: sellingPriceRaw > 0 && sellingPriceRaw < MIN_SELLING_PRICE,
  };
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
  root.querySelector('[data-out="margin"]').textContent = r.marginLabel;
  root.querySelector('[data-out="ideal"]').textContent = money(r.idealPrice);
  root.querySelector('[data-out="daily"]').textContent = money(Math.abs(r.dailyProfit));

  const dailyLabel = root.querySelector('[data-out="daily-label"]');
  if (dailyLabel) {
    dailyLabel.textContent = r.profit >= 0 ? 'Lucro do dia' : 'Prejuízo do dia';
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
  profitEl.classList.add(r.profit >= 0 ? 'green' : 'red');

  dailyEl.classList.remove('green', 'red');
  dailyEl.classList.add(r.profit >= 0 ? 'green' : 'red');

  marginEl.classList.remove('warn', 'green', 'red');
  marginEl.classList.add(r.marginClass);

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
