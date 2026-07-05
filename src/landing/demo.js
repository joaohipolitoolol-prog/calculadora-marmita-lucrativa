import { money, percent } from '../lib/format.js';

const DEFAULT_TARGET_MARGIN = 30;
const MAX_TARGET_MARGIN = 80;

/** Converte "10,20", "10.20" ou "R$ 10,20" em número. Vazio → 0. */
export function parseDemoValue(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let s = String(value).trim();
  if (!s) return 0;

  s = s.replace(/R\$\s?/gi, '').replace(/\s/g, '');
  if (!s) return 0;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Formato brasileiro: 1.234,56
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
  const precoVenda = parseDemoValue(values.sellingPrice);
  const ingredientes = parseDemoValue(values.foodCost);
  const embalagem = parseDemoValue(values.packaging);
  const gasEnergia = parseDemoValue(values.gasSpices);
  const entregaTaxa = parseDemoValue(values.delivery);
  const desperdicio = parseDemoValue(values.waste);
  const marmitasPorDia = parseDemoValue(values.marmitasPerDay);

  const { margin: margemDesejada, capped: margemCapped } = resolveTargetMargin(values.targetMargin);

  const custoReal =
    ingredientes + embalagem + gasEnergia + entregaTaxa + desperdicio;
  const lucroUnidade = precoVenda - custoReal;
  const margemAtual = precoVenda > 0 ? (lucroUnidade / precoVenda) * 100 : 0;
  const lucroDia = lucroUnidade * marmitasPorDia;
  const precoRecomendado = custoReal / (1 - margemDesejada / 100);

  let status = 'lucro';
  const alerts = [];

  if (margemCapped) {
    alerts.push('Margem desejada limitada a 80% para calcular o preço recomendado.');
  }

  if (lucroUnidade < 0) {
    status = 'prejuizo';
    alerts.push(
      `Cada marmita sai ${money(Math.abs(lucroUnidade))} abaixo do custo`
    );
  } else if (margemAtual < margemDesejada) {
    status = 'alerta';
    alerts.push(`Sua margem está abaixo do ideal (${percent(margemDesejada)})`);
  }

  let impactText = '';
  if (marmitasPorDia > 0) {
    if (lucroUnidade >= 0) {
      impactText = `${marmitasPorDia} marmitas/dia × ${money(lucroUnidade)} = ${money(lucroDia)} no bolso por dia`;
    } else {
      impactText = `${marmitasPorDia} marmitas/dia × ${money(Math.abs(lucroUnidade))} de prejuízo = ${money(Math.abs(lucroDia))} saindo do bolso por dia`;
    }
  }

  return {
    custoReal,
    lucroUnidade,
    margemAtual,
    lucroDia,
    precoRecomendado,
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
  root.querySelector('[data-out="profit"]').textContent = money(r.lucroUnidade);
  root.querySelector('[data-out="cost"]').textContent = money(r.custoReal);
  root.querySelector('[data-out="margin"]').textContent = percent(r.margemAtual);
  root.querySelector('[data-out="ideal"]').textContent = money(r.precoRecomendado);
  root.querySelector('[data-out="daily"]').textContent = money(Math.abs(r.lucroDia));

  const dailyLabel = root.querySelector('[data-out="daily-label"]');
  if (dailyLabel) {
    dailyLabel.textContent = r.lucroUnidade >= 0 ? 'Lucro do dia' : 'Prejuízo do dia';
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
  profitEl.classList.add(r.lucroUnidade >= 0 ? 'green' : 'red');

  dailyEl.classList.remove('green', 'red');
  dailyEl.classList.add(r.lucroUnidade >= 0 ? 'green' : 'red');

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
