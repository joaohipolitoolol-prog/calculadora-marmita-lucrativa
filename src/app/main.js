import { CARDAPIO_30_DIAS } from '../data/cardapio.js';
import {
  calculate,
  cloneInputs,
  readInputsFromForm,
} from '../lib/calculator.js';
import { watchAuth, getUserLabel } from '../lib/auth.js';
import { money, percent, parseNumber, escapeHtml } from '../lib/format.js';
import {
  fullToSimple,
  readSimpleFromForm,
  simpleToFull,
  SIMPLE_DEFAULTS,
} from '../lib/simple-mode.js';
import {
  clearDraft,
  deleteScenario,
  listScenarios,
  loadDraft,
  saveDraft,
  saveScenario,
} from '../lib/storage.js';
import { ICONS, VIEW_META } from './icons.js';
import {
  clearOnboardingSeen,
  hasSeenOnboarding,
  showOnboarding,
} from './onboarding.js';

const root = document.getElementById('app-root');
const toastEl = document.getElementById('toast');

let currentUser = null;
let inputMode = 'simple';
let simpleValues = { ...SIMPLE_DEFAULTS };
let currentInputs = simpleToFull(SIMPLE_DEFAULTS);
let currentResults = calculate(currentInputs);
let scenarios = [];
let activeView = 'calc';
let openStep = 1;
let drawerOpen = false;

const STEPS = [
  { id: 1, label: 'Produção', desc: 'Quantas marmitas você faz por dia?' },
  { id: 2, label: 'Comida', desc: 'Custo de cada preparo ÷ porções' },
  { id: 3, label: 'Extras', desc: 'Embalagem, gás, entrega, desperdício' },
  { id: 4, label: 'Tempo', desc: 'Quanto vale sua hora de trabalho' },
  { id: 5, label: 'Preço', desc: 'Quanto cobra e qual margem quer' },
];

const SIMULATION_VOLUMES = [10, 20, 30];

const INSIGHTS = {
  prejuizo: {
    title: 'Ação urgente',
    text: 'Seu preço está abaixo do custo real. Aumente para pelo menos o preço mínimo ou corte custos ocultos como embalagem e entrega.',
  },
  alerta: {
    title: 'Dá para melhorar',
    text: 'Você tem lucro, mas a margem está baixa. Teste o preço recomendado ou revise ingredientes e desperdício.',
  },
  lucro: {
    title: 'Bom caminho',
    text: 'Sua margem está saudável. Salve este cenário e compare quando mudar cardápio ou fornecedor.',
  },
};

async function bootstrap() {
  const draft = await loadDraft(currentUser.uid);
  if (draft?.inputs) {
    inputMode = draft.inputMode || 'simple';
    currentInputs = draft.inputs;
    simpleValues = fullToSimple(currentInputs);
  }

  currentResults = calculate(currentInputs);
  scenarios = await listScenarios(currentUser.uid);
  render();
  maybeWelcome();
  maybeShowOnboarding();
}

function maybeWelcome() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('compra') === '1') {
    showToast('Acesso liberado! Bora calcular seu lucro.');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (sessionStorage.getItem('marmita_demo_welcome') === '1') {
    showToast('Demo ativa — seus dados ficam neste celular.');
    sessionStorage.removeItem('marmita_demo_welcome');
  }
}

watchAuth((user) => {
  if (!user) {
    window.location.replace('/login.html');
    return;
  }
  if (currentUser) return;
  currentUser = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
  };
  bootstrap();
});

function maybeShowOnboarding() {
  if (hasSeenOnboarding()) return;
  showOnboarding();
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function persistState() {
  saveDraft(currentUser.uid, { inputMode, inputs: currentInputs });
}

function closeDrawer() {
  drawerOpen = false;
  document.body.classList.remove('drawer-open');
  root.querySelector('.app-drawer')?.classList.remove('open');
  root.querySelector('.drawer-overlay')?.classList.remove('open');
}

function openDrawer() {
  drawerOpen = true;
  document.body.classList.add('drawer-open');
  root.querySelector('.app-drawer')?.classList.add('open');
  root.querySelector('.drawer-overlay')?.classList.add('open');
}

function renderTopbarBadge() {
  const r = currentResults;
  if (activeView === 'calc') {
    return `
      <button type="button" class="topbar-badge ${r.status}" id="topbar-badge" data-view="results" title="Ver resultados">
        <span class="topbar-badge-val">${money(r.profitPerUnit)}</span>
        <span class="topbar-badge-sub">${percent(r.margin)}</span>
      </button>
    `;
  }
  if (activeView === 'results') {
    return `<span class="topbar-badge ${r.status} static"><span class="topbar-badge-val">${percent(r.margin)}</span></span>`;
  }
  return '';
}

function renderDrawer() {
  const navItems = Object.entries(VIEW_META)
    .map(([id, meta]) => {
      const badge =
        id === 'results' && currentResults.status
          ? `<span class="drawer-badge ${currentResults.status}"></span>`
          : '';
      return `
        <button type="button" class="drawer-link ${activeView === id ? 'active' : ''}" data-view="${id}">
          <span class="drawer-link-icon">${ICONS[meta.icon]}</span>
          <span class="drawer-link-text">${meta.label}</span>
          ${badge}
        </button>
      `;
    })
    .join('');

  return `
    <div class="drawer-overlay ${drawerOpen ? 'open' : ''}" data-drawer-close aria-hidden="true"></div>
    <aside class="app-drawer ${drawerOpen ? 'open' : ''}" aria-label="Menu principal">
      <div class="drawer-head">
        <div class="drawer-brand">${ICONS.logo}<div><strong>Marmita Lucrativa</strong><small>${escapeHtml(getUserLabel(currentUser))}</small></div></div>
        <button type="button" class="icon-btn" data-drawer-close aria-label="Fechar menu">${ICONS.close}</button>
      </div>
      <div class="drawer-summary ${currentResults.status}">
        <span>Lucro/un</span>
        <strong>${money(currentResults.profitPerUnit)}</strong>
        <em>${percent(currentResults.margin)} margem</em>
      </div>
      <nav class="drawer-nav">${navItems}</nav>
      <div class="drawer-foot">
        <span class="drawer-mode">${inputMode === 'simple' ? 'Modo rápido' : 'Modo completo'}</span>
        <a href="/" class="drawer-home">${ICONS.home}<span>Página inicial</span></a>
      </div>
    </aside>
  `;
}

function renderTabBar() {
  return `
    <nav class="app-tabbar" aria-label="Navegação rápida">
      ${Object.entries(VIEW_META)
        .map(([id, meta]) => {
          const badge =
            id === 'results' && currentResults.status !== 'lucro'
              ? `<span class="tab-badge ${currentResults.status}"></span>`
              : '';
          return `
            <button type="button" class="tab-btn ${activeView === id ? 'active' : ''}" data-view="${id}">
              <span class="tab-icon">${ICONS[meta.icon]}</span>
              <span class="tab-label">${meta.label}</span>
              ${badge}
            </button>
          `;
        })
        .join('')}
    </nav>
  `;
}

function renderModeToggle() {
  return `
    <div class="mode-toggle" role="tablist">
      <button type="button" class="mode-btn ${inputMode === 'simple' ? 'active' : ''}" data-mode="simple">
        ${ICONS.zap}<span>Rápido</span>
      </button>
      <button type="button" class="mode-btn ${inputMode === 'full' ? 'active' : ''}" data-mode="full">
        ${ICONS.list}<span>Completo</span>
      </button>
    </div>
  `;
}

function renderLiveSummary() {
  const r = currentResults;
  return `
    <div class="live-summary ${r.status}" id="live-summary">
      <div class="live-summary-main">
        <div class="live-summary-item">
          <span>Custo real</span>
          <strong>${money(r.realCostPerUnit)}</strong>
        </div>
        <div class="live-summary-item highlight">
          <span>Lucro/un</span>
          <strong>${money(r.profitPerUnit)}</strong>
        </div>
        <div class="live-summary-item">
          <span>Margem</span>
          <strong>${percent(r.margin)}</strong>
        </div>
      </div>
      <div class="live-summary-foot">
        <span>${money(r.dailyProfit)}/dia</span>
        <span>${money(r.monthlyProfit)}/mês</span>
      </div>
    </div>
  `;
}

function renderStepBar() {
  const step = STEPS[openStep - 1];
  const pills = STEPS.map(
    (s) => `
      <button type="button" class="step-pill ${openStep === s.id ? 'active' : openStep > s.id ? 'done' : ''}" data-step="${s.id}" aria-label="Passo ${s.id}: ${s.label}">
        ${openStep > s.id ? ICONS.check : s.id}
      </button>
    `
  ).join('');

  return `
    <div class="step-bar">
      <div class="step-pills">${pills}</div>
      <div class="step-bar-head">
        <span class="step-bar-count">Passo ${openStep} de ${STEPS.length}</span>
        <span class="step-bar-name">${step.label}</span>
      </div>
      <p class="step-bar-desc">${step.desc}</p>
    </div>
  `;
}

function renderCalcFooter() {
  if (activeView !== 'calc') return '';

  if (inputMode === 'simple') {
    return `
      <div class="calc-footer-bar">
        <button type="submit" form="calc-form" class="btn btn-primary btn-block">${ICONS.chart}<span>Ver meu lucro</span></button>
      </div>
    `;
  }

  const isLast = openStep >= STEPS.length;
  return `
    <div class="calc-footer-bar">
      <div class="calc-footer-inner">
        ${openStep > 1 ? `<button type="button" class="btn btn-ghost" id="prev-step">${ICONS.chevronLeft}<span>Voltar</span></button>` : ''}
        ${
          isLast
            ? `<button type="submit" form="calc-form" class="btn btn-primary btn-block">${ICONS.chart}<span>Ver meu lucro</span></button>`
            : `<button type="button" class="btn btn-primary btn-block" id="next-step"><span>Próximo</span>${ICONS.chevronRight}</button>`
        }
      </div>
    </div>
  `;
}

function renderActiveView() {
  switch (activeView) {
    case 'calc':
      return renderCalculatorForm();
    case 'results':
      return renderResults();
    case 'bonus':
      return renderBonus();
    case 'account':
      return renderAccount();
    default:
      return '';
  }
}

function render() {
  const viewTitle = VIEW_META[activeView]?.label || 'App';
  const shellClass = ['app-shell', activeView === 'calc' ? 'has-calc-footer' : '', 'has-tabbar'].filter(Boolean).join(' ');

  root.innerHTML = `
    <div class="${shellClass}">
      ${renderDrawer()}
      <header class="app-topbar">
        <button type="button" class="icon-btn menu-btn" id="menu-toggle" aria-label="Abrir menu">${ICONS.menu}</button>
        <div class="topbar-center">
          ${ICONS.logo}
          <div class="topbar-titles">
            <h1 class="topbar-title">${viewTitle}</h1>
            <p class="topbar-sub">${inputMode === 'simple' ? 'Modo rápido' : 'Modo completo'}</p>
          </div>
        </div>
        ${renderTopbarBadge()}
      </header>

      <main class="app-content">
        ${renderActiveView()}
      </main>

      ${renderCalcFooter()}
      ${renderTabBar()}
    </div>
  `;

  bindEvents();
}

function fieldGroup(title, desc, fieldsHtml) {
  return `
    <div class="field-group">
      <div class="field-group-head">
        <h3>${title}</h3>
        ${desc ? `<p>${desc}</p>` : ''}
      </div>
      <div class="field-stack">${fieldsHtml}</div>
    </div>
  `;
}

function moneyField(id, name, label, value, hint = '') {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <div class="input-wrap">
        <span class="input-prefix">R$</span>
        <input id="${id}" name="${name}" inputmode="decimal" value="${value}">
      </div>
      ${hint ? `<span class="field-hint">${hint}</span>` : ''}
    </div>
  `;
}

function renderSimpleForm() {
  const s = simpleValues;
  return `
    <form id="calc-form" class="calc-form">
      ${renderModeToggle()}
      ${renderLiveSummary()}
      <div class="form-card">
        ${fieldGroup('Preço de venda', 'Quanto você cobra hoje por marmita.', moneyField('simple_sellingPrice', 'simple_sellingPrice', 'Preço de venda', s.sellingPrice))}
        ${fieldGroup(
          'Custos por marmita',
          'Some tudo que entra em cada unidade vendida.',
          `
            ${moneyField('simple_foodCostPerUnit', 'simple_foodCostPerUnit', 'Ingredientes', s.foodCostPerUnit, 'Arroz, feijão, carne...')}
            ${moneyField('simple_packaging', 'simple_packaging', 'Embalagem', s.packaging)}
            ${moneyField('simple_gasPerUnit', 'simple_gasPerUnit', 'Gás, tempero, energia', s.gasPerUnit)}
            ${moneyField('simple_delivery', 'simple_delivery', 'Entrega ou taxa', s.delivery)}
            ${moneyField('simple_wastePerUnit', 'simple_wastePerUnit', 'Desperdício', s.wastePerUnit)}
          `
        )}
        ${fieldGroup(
          'Produção e meta',
          null,
          `
            <div class="field">
              <label for="simple_marmitasPerDay">Marmitas por dia</label>
              <input id="simple_marmitasPerDay" name="simple_marmitasPerDay" inputmode="numeric" value="${s.marmitasPerDay}">
            </div>
            <div class="field">
              <label for="simple_targetMarginPercent">Margem ideal (%)</label>
              <input id="simple_targetMarginPercent" name="simple_targetMarginPercent" inputmode="decimal" value="${s.targetMarginPercent}">
              <span class="field-hint">Recomendado: 30%</span>
            </div>
          `
        )}
      </div>
    </form>
  `;
}

function renderIngredientsStep() {
  return currentInputs.ingredients
    .map(
      (item, index) => `
        <div class="ingredient-card" data-index="${index}">
          <div class="ingredient-card-top">
            <input data-ingredient-name value="${escapeHtml(item.name)}" placeholder="Nome do ingrediente" aria-label="Nome">
            <button type="button" class="icon-btn icon-btn-danger remove-ingredient" data-index="${index}" aria-label="Remover">${ICONS.trash}</button>
          </div>
          <div class="ingredient-card-grid">
            <div>
              <label>Custo do preparo</label>
              <div class="input-wrap">
                <span class="input-prefix">R$</span>
                <input data-ingredient-cost="${index}" inputmode="decimal" value="${item.batchCost}">
              </div>
            </div>
            <div>
              <label>Rende (marmitas)</label>
              <input data-ingredient-portions="${index}" inputmode="numeric" value="${item.portions}">
            </div>
          </div>
        </div>
      `
    )
    .join('');
}

function renderStepPanel(stepId) {
  switch (stepId) {
    case 1:
      return `
        <div class="form-card step-panel">
          <div class="field-stack">
            <div class="field">
              <label for="marmitasPerDay">Marmitas por dia</label>
              <input id="marmitasPerDay" name="marmitasPerDay" inputmode="numeric" value="${currentInputs.marmitasPerDay}">
            </div>
            <div class="field">
              <label for="workDaysPerMonth">Dias trabalhados no mês</label>
              <input id="workDaysPerMonth" name="workDaysPerMonth" inputmode="numeric" value="${currentInputs.workDaysPerMonth}">
            </div>
          </div>
        </div>
      `;
    case 2:
      return `
        <div class="form-card step-panel">
          <div class="ingredient-list">${renderIngredientsStep()}</div>
          <button type="button" class="btn btn-secondary btn-add" id="add-ingredient">${ICONS.plus}<span>Adicionar ingrediente</span></button>
        </div>
      `;
    case 3:
      return `
        <div class="form-card step-panel">
          <ul class="tip-list">
            <li>Embalagem e descartáveis</li>
            <li>Gás, tempero e energia</li>
            <li>Entrega ou taxa de app</li>
            <li>Desperdício do preparo</li>
          </ul>
          <div class="field-stack">
            ${moneyField('packagingPerUnit', 'packagingPerUnit', 'Embalagem por marmita', currentInputs.packagingPerUnit, 'Marmita, talher, sacola')}
            ${moneyField('gasMonthly', 'gasMonthly', 'Gás por mês', currentInputs.gasMonthly)}
            ${moneyField('spicesMonthly', 'spicesMonthly', 'Temperos por mês', currentInputs.spicesMonthly)}
            ${moneyField('deliveryPerUnit', 'deliveryPerUnit', 'Entrega por marmita', currentInputs.deliveryPerUnit)}
            <div class="field">
              <label for="platformFeePercent">Taxa do app (%)</label>
              <input id="platformFeePercent" name="platformFeePercent" inputmode="decimal" value="${currentInputs.platformFeePercent}">
            </div>
            <div class="field">
              <label for="wastePercent">Desperdício (%)</label>
              <input id="wastePercent" name="wastePercent" inputmode="decimal" value="${currentInputs.wastePercent}">
            </div>
          </div>
        </div>
      `;
    case 4:
      return `
        <div class="form-card step-panel">
          <p class="step-panel-note">Deixe zero se não quiser incluir agora.</p>
          <div class="field-stack">
            <div class="field">
              <label for="hoursPerDay">Horas por dia</label>
              <input id="hoursPerDay" name="hoursPerDay" inputmode="decimal" value="${currentInputs.hoursPerDay}">
            </div>
            ${moneyField('hourlyRate', 'hourlyRate', 'Valor da sua hora', currentInputs.hourlyRate)}
          </div>
        </div>
      `;
    case 5:
      return `
        <div class="form-card step-panel">
          <div class="field-stack">
            ${moneyField('sellingPrice', 'sellingPrice', 'Preço que cobra hoje', currentInputs.sellingPrice)}
            <div class="field">
              <label for="targetMarginPercent">Margem ideal (%)</label>
              <input id="targetMarginPercent" name="targetMarginPercent" inputmode="decimal" value="${currentInputs.targetMarginPercent}">
              <span class="field-hint">Recomendado: 30%</span>
            </div>
          </div>
        </div>
      `;
    default:
      return '';
  }
}

function renderFullForm() {
  return `
    <form id="calc-form" class="calc-form">
      ${renderModeToggle()}
      ${renderLiveSummary()}
      ${renderStepBar()}
      ${renderStepPanel(openStep)}
    </form>
  `;
}

function renderCalculatorForm() {
  return inputMode === 'simple' ? renderSimpleForm() : renderFullForm();
}

function renderBreakdownBars() {
  const r = currentResults;
  const items = [
    { label: 'Comida', value: r.breakdown.foodCost },
    { label: 'Desperdício', value: r.breakdown.wasteCost },
    { label: 'Embalagem', value: r.breakdown.packagingPerUnit },
    { label: 'Gás', value: r.breakdown.gasPerUnit },
    { label: 'Temperos', value: r.breakdown.spicesPerUnit },
    { label: 'Entrega', value: r.breakdown.deliveryPerUnit },
    { label: 'Seu tempo', value: r.breakdown.timePerUnit },
    { label: 'Taxa app', value: r.breakdown.platformFee },
  ].filter((i) => i.value > 0);

  const total = items.reduce((s, i) => s + i.value, 0) || 1;

  return `
    <div class="breakdown-bars">
      ${items
        .map(
          (item) => `
            <div class="breakdown-bar-row">
              <div class="breakdown-bar-label"><span>${item.label}</span><strong>${money(item.value)}</strong></div>
              <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${(item.value / total) * 100}%"></div></div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function renderInsight() {
  const insight = INSIGHTS[currentResults.status];
  return `
    <div class="insight-card ${currentResults.status}">
      <div class="insight-icon">${currentResults.status === 'lucro' ? ICONS.trendUp : currentResults.status === 'prejuizo' ? ICONS.trendDown : ICONS.info}</div>
      <div>
        <strong>${insight.title}</strong>
        <p>${insight.text}</p>
      </div>
    </div>
  `;
}

function renderSimulation() {
  const r = currentResults;
  return `
    <div class="section-card simulation-card">
      <h2>Simulação de lucro diário</h2>
      <div class="simulation-grid">
        ${SIMULATION_VOLUMES.map((qty) => {
          const profit = r.profitPerUnit * qty;
          const cls = profit >= 0 ? 'positive' : 'negative';
          return `
            <div class="simulation-item ${cls}">
              <span>${qty}/dia</span>
              <strong>${money(profit)}</strong>
            </div>
          `;
        }).join('')}
      </div>
      <p class="simulation-month">No mês (${r.workDaysPerMonth} dias): <strong>${money(r.monthlyProfit)}</strong></p>
    </div>
  `;
}

function renderResultsDetails() {
  const r = currentResults;
  const marginWidth = Math.min(Math.max(r.margin, 0), 100);

  return `
    <div class="margin-meter">
      <div class="margin-meter-header">
        <span>Margem atual</span>
        <strong>${percent(r.margin)}</strong>
      </div>
      <div class="margin-track">
        <div class="margin-fill ${r.status}" style="width: ${marginWidth}%"></div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <span>Custo real</span>
        <strong>${money(r.realCostPerUnit)}</strong>
      </div>
      <div class="metric-card highlight">
        <span>Preço hoje</span>
        <strong>${money(r.sellingPrice)}</strong>
      </div>
      <div class="metric-card ${r.dailyProfit >= 0 ? 'green' : ''}">
        <span>Lucro/dia</span>
        <strong>${money(r.dailyProfit)}</strong>
      </div>
      <div class="metric-card ${r.monthlyProfit >= 0 ? 'green' : ''}">
        <span>Lucro/mês</span>
        <strong>${money(r.monthlyProfit)}</strong>
      </div>
    </div>

    ${renderSimulation()}

    <div class="section-card">
      <h2>Raio-x do custo</h2>
      ${renderBreakdownBars()}
      <ul class="breakdown-list compact">
        <li><span>Custo total</span><strong>${money(r.realCostPerUnit + r.breakdown.platformFee)}</strong></li>
      </ul>
    </div>

    <div class="section-card">
      <h2>Cenários salvos</h2>
      ${renderScenarioList()}
    </div>
  `;
}

function renderResults() {
  const r = currentResults;
  const target = parseNumber(currentInputs.targetMarginPercent);

  const statusText =
    r.status === 'prejuizo'
      ? 'Você está pagando pra trabalhar'
      : r.status === 'alerta'
        ? 'Lucro baixo — dá pra melhorar'
        : 'Sua marmita está lucrando!';

  const statusDetail =
    r.status === 'prejuizo'
      ? `Prejuízo de ${money(Math.abs(r.profitPerUnit))} por marmita`
      : `${money(r.dailyProfit)}/dia · ${money(r.monthlyProfit)}/mês`;

  return `
    <div class="results-page">
      <div class="results-hero ${r.status}">
        <small>${statusText}</small>
        <h2>${money(r.profitPerUnit)}</h2>
        <p>Lucro por marmita · ${statusDetail}</p>
        <span class="results-hero-badge">${percent(r.margin)} de margem</span>
      </div>

      ${renderInsight()}

      <div class="price-action">
        <div class="price-action-card ideal">
          <span>Preço recomendado</span>
          <strong>${money(r.idealPrice)}</strong>
          <em>Meta ${percent(Math.min(target, 80))} de margem</em>
          <button type="button" class="btn btn-sm btn-ideal" id="apply-ideal-price">${ICONS.check}<span>Usar este preço</span></button>
        </div>
        <div class="price-action-card">
          <span>Preço mínimo</span>
          <strong>${money(r.minPrice)}</strong>
          <em>Abaixo disso = prejuízo</em>
        </div>
      </div>

      <div class="results-actions">
        <button type="button" class="btn btn-secondary" id="save-scenario-results">${ICONS.save}<span>Salvar</span></button>
        <button type="button" class="btn btn-primary" data-view="calc">${ICONS.edit}<span>Ajustar</span></button>
      </div>

      <details class="results-details">
        <summary>Ver análise completa</summary>
        <div class="results-details-body">${renderResultsDetails()}</div>
      </details>
    </div>
  `;
}

function renderScenarioList() {
  if (!scenarios.length) {
    return '<p class="empty-state">Nenhum cenário salvo. Salve diferentes combinações de preço e custo.</p>';
  }

  return `
    <ul class="scenario-list">
      ${scenarios
        .map((item) => {
          const name = escapeHtml(item.name || 'Meu cenário');
          const price = money(item.results?.sellingPrice ?? item.inputs?.sellingPrice ?? 0);
          const profit = money(item.results?.profitPerUnit ?? 0);
          const status = item.results?.status || 'lucro';
          return `
            <li class="scenario-item ${status}">
              <div class="scenario-item-top">
                <h3>${name}</h3>
                <span class="scenario-status ${status}"></span>
              </div>
              <p>Preço ${price} · Lucro ${profit}/un</p>
              <div class="scenario-actions">
                <button type="button" class="load" data-load="${item.id}">Carregar</button>
                <button type="button" class="delete" data-delete="${item.id}">Excluir</button>
              </div>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function renderMenuByWeek() {
  const weeks = [];
  for (let i = 0; i < CARDAPIO_30_DIAS.length; i += 7) {
    weeks.push(CARDAPIO_30_DIAS.slice(i, i + 7));
  }

  return weeks
    .map(
      (week, wi) => `
        <details class="menu-week" ${wi === 0 ? 'open' : ''}>
          <summary>Semana ${wi + 1} · Dias ${week[0].dia}–${week[week.length - 1].dia}</summary>
          <div class="menu-week-body">
            ${week
              .map(
                (item) => `
                  <article class="menu-item" data-search="${escapeHtml(`${item.dia} ${item.prato} ${item.dica}`.toLowerCase())}">
                    <div class="menu-item-head">
                      <strong>Dia ${item.dia}</strong>
                      <span>${escapeHtml(item.prato)}</span>
                    </div>
                    <em>${escapeHtml(item.dica)}</em>
                  </article>
                `
              )
              .join('')}
          </div>
        </details>
      `
    )
    .join('');
}

function renderBonus() {
  return `
    <div class="bonus-page">
      <div class="section-card bonus-header-card">
        <h2>Cardápio de 30 Dias</h2>
        <p>Ideias para variar sem perder margem. Simule o custo antes de fixar o prato.</p>
        <div class="search-wrap">
          ${ICONS.search}
          <input type="search" class="bonus-search" id="bonus-search" placeholder="Buscar prato ou dia..." autocomplete="off">
        </div>
      </div>
      <div class="menu-list" id="menu-list">${renderMenuByWeek()}</div>
      <p class="menu-empty hidden" id="menu-empty">Nenhum prato encontrado.</p>
    </div>
  `;
}

function renderAccount() {
  return `
    <div class="help-page">
      <div class="quick-cards">
        <button type="button" class="quick-card" data-view="calc">${ICONS.calc}<span>Calcular</span></button>
        <button type="button" class="quick-card" data-view="results">${ICONS.chart}<span>Resultados</span></button>
        <button type="button" class="quick-card" data-view="bonus">${ICONS.book}<span>Cardápio</span></button>
      </div>

      <div class="section-card">
        <h2>Perguntas frequentes</h2>
        <details class="faq-item" open>
          <summary>Como começo?</summary>
          <p>Use o <strong>modo rápido</strong>, coloque o custo de cada marmita e veja o lucro no topo enquanto digita.</p>
        </details>
        <details class="faq-item">
          <summary>Modo rápido vs completo?</summary>
          <p>O rápido é direto por marmita. O completo divide produção, ingredientes, extras e tempo — ideal quando quer precisão total.</p>
        </details>
        <details class="faq-item">
          <summary>Meus dados ficam salvos?</summary>
          <p>Sim, neste celular. Rascunho e cenários salvos ficam no navegador até você limpar.</p>
        </details>
        <details class="faq-item">
          <summary>O que é preço recomendado?</summary>
          <p>É o valor para atingir sua margem ideal com os custos atuais. Use o botão "Usar este preço" nos resultados.</p>
        </details>
      </div>

      <div class="section-card">
        <h2>Seus dados</h2>
        <p class="account-note">Tudo fica salvo neste aparelho. Login na nuvem virá em breve.</p>
        <button type="button" class="btn btn-secondary" id="replay-onboarding">${ICONS.help}<span>Ver tutorial de novo</span></button>
        <button type="button" class="btn btn-secondary btn-danger-text" id="reset-data">Limpar meus dados</button>
      </div>
    </div>
  `;
}

function updateLivePreview() {
  const r = currentResults;

  const badge = document.getElementById('topbar-badge');
  if (badge) {
    badge.className = `topbar-badge ${r.status}`;
    badge.querySelector('.topbar-badge-val').textContent = money(r.profitPerUnit);
    badge.querySelector('.topbar-badge-sub').textContent = percent(r.margin);
  }

  const summary = document.getElementById('live-summary');
  if (summary) {
    summary.className = `live-summary ${r.status}`;
    const items = summary.querySelectorAll('.live-summary-item strong');
    if (items.length >= 3) {
      items[0].textContent = money(r.realCostPerUnit);
      items[1].textContent = money(r.profitPerUnit);
      items[2].textContent = percent(r.margin);
    }
    const foot = summary.querySelectorAll('.live-summary-foot span');
    if (foot.length >= 2) {
      foot[0].textContent = `${money(r.dailyProfit)}/dia`;
      foot[1].textContent = `${money(r.monthlyProfit)}/mês`;
    }
  }

  root.querySelectorAll('.drawer-badge, .tab-badge').forEach((el) => {
    el.className = el.className.replace(/\b(lucro|alerta|prejuizo)\b/g, '').trim();
    el.classList.add(r.status);
  });

  const drawerSummary = root.querySelector('.drawer-summary');
  if (drawerSummary) {
    drawerSummary.className = `drawer-summary ${r.status}`;
    drawerSummary.querySelector('strong').textContent = money(r.profitPerUnit);
    drawerSummary.querySelector('em').textContent = `${percent(r.margin)} margem`;
  }
}

function applyIdealPrice() {
  const ideal = currentResults.idealPrice;
  currentInputs.sellingPrice = ideal;
  simpleValues.sellingPrice = ideal;
  currentResults = calculate(currentInputs);
  persistState();
  showToast(`Preço atualizado para ${money(ideal)}`);
  render();
}

function saveScenarioFlow() {
  showSaveModal(async (name) => {
    await saveScenario(currentUser.uid, {
      name,
      inputs: cloneInputs(currentInputs),
      results: currentResults,
    });
    scenarios = await listScenarios(currentUser.uid);
    showToast('Cenário salvo!');
    if (activeView !== 'results') activeView = 'results';
    render();
  });
}

function showSaveModal(onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <h3>Salvar cenário</h3>
      <p>Dê um nome (ex: "Com entrega", "Cardápio seg").</p>
      <input type="text" id="scenario-name" placeholder="Nome do cenário" value="Cenário ${scenarios.length + 1}">
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="modal-cancel">Cancelar</button>
        <button type="button" class="btn btn-primary" id="modal-save">Salvar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#scenario-name');
  input.focus();
  input.select();

  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('#modal-save').addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) return;
    overlay.remove();
    await onSave(name);
  });
}

function navigateTo(view) {
  if (view !== activeView) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  activeView = view;
  closeDrawer();
  render();
}

function bindEvents() {
  document.getElementById('menu-toggle')?.addEventListener('click', openDrawer);

  root.querySelectorAll('[data-drawer-close]').forEach((el) => {
    el.addEventListener('click', closeDrawer);
  });

  root.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', () => navigateTo(el.dataset.view));
  });

  root.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('calc-form');
      if (form) updateFromForm(form);

      const nextMode = btn.dataset.mode;
      if (nextMode === inputMode) return;

      inputMode = nextMode;
      openStep = 1;
      persistState();
      render();
      showToast(inputMode === 'simple' ? 'Modo rápido ativado' : 'Modo completo ativado');
    });
  });

  root.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('calc-form');
      if (form) updateFromForm(form);
      openStep = parseNumber(btn.dataset.step);
      render();
    });
  });

  document.getElementById('next-step')?.addEventListener('click', () => {
    const form = document.getElementById('calc-form');
    if (form) updateFromForm(form);
    if (openStep < STEPS.length) {
      openStep += 1;
      render();
    }
  });

  document.getElementById('prev-step')?.addEventListener('click', () => {
    const form = document.getElementById('calc-form');
    if (form) updateFromForm(form);
    if (openStep > 1) {
      openStep -= 1;
      render();
    }
  });

  document.getElementById('apply-ideal-price')?.addEventListener('click', applyIdealPrice);

  const form = document.getElementById('calc-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      updateFromForm(form);
      navigateTo('results');
      showToast(
        currentResults.status === 'prejuizo'
          ? 'Prejuízo detectado — hora de ajustar!'
          : currentResults.status === 'alerta'
            ? 'Lucro baixo — confira o preço ideal'
            : 'Boa! Marmita lucrando!'
      );
    });

    form.addEventListener('input', () => {
      updateFromForm(form);
      updateLivePreview();
    });

    document.getElementById('add-ingredient')?.addEventListener('click', () => {
      currentInputs.ingredients.push({
        name: '',
        batchCost: 0,
        portions: currentInputs.marmitasPerDay || 20,
      });
      render();
    });

    form.querySelectorAll('.remove-ingredient').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (currentInputs.ingredients.length <= 1) {
          showToast('Deixe pelo menos 1 ingrediente.');
          return;
        }
        currentInputs.ingredients.splice(parseNumber(btn.dataset.index), 1);
        render();
      });
    });
  }

  document.getElementById('save-scenario-results')?.addEventListener('click', saveScenarioFlow);

  const bonusSearch = document.getElementById('bonus-search');
  if (bonusSearch) {
    bonusSearch.addEventListener('input', () => {
      const q = bonusSearch.value.trim().toLowerCase();
      let visible = 0;
      document.querySelectorAll('#menu-list .menu-item').forEach((item) => {
        const show = !q || item.dataset.search.includes(q);
        item.style.display = show ? '' : 'none';
        if (show) visible += 1;
      });
      document.querySelectorAll('#menu-list .menu-week').forEach((week) => {
        const hasVisible = [...week.querySelectorAll('.menu-item')].some((i) => i.style.display !== 'none');
        week.style.display = hasVisible ? '' : 'none';
        if (hasVisible) week.open = true;
      });
      document.getElementById('menu-empty')?.classList.toggle('hidden', visible > 0);
    });
  }

  root.querySelectorAll('[data-load]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = scenarios.find((s) => s.id === btn.dataset.load);
      if (!item?.inputs) return;
      currentInputs = cloneInputs(item.inputs);
      simpleValues = fullToSimple(currentInputs);
      currentResults = calculate(currentInputs);
      persistState();
      openStep = 1;
      navigateTo('calc');
      showToast('Cenário carregado!');
    });
  });

  root.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!window.confirm('Excluir este cenário?')) return;
      await deleteScenario(currentUser.uid, btn.dataset.delete);
      scenarios = await listScenarios(currentUser.uid);
      render();
      showToast('Cenário excluído.');
    });
  });

  document.getElementById('replay-onboarding')?.addEventListener('click', () => {
    showOnboarding();
  });

  document.getElementById('reset-data')?.addEventListener('click', () => {
    if (!window.confirm('Apagar rascunho e cenários salvos neste aparelho?')) return;
    clearDraft(currentUser.uid);
    localStorage.removeItem(`marmita_scenarios_${currentUser.uid}`);
    clearOnboardingSeen();
    inputMode = 'simple';
    simpleValues = { ...SIMPLE_DEFAULTS };
    currentInputs = simpleToFull(SIMPLE_DEFAULTS);
    currentResults = calculate(currentInputs);
    scenarios = [];
    openStep = 1;
    navigateTo('calc');
    showToast('Dados limpos. Começando do zero.');
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawerOpen) closeDrawer();
});

function updateFromForm(form) {
  if (inputMode === 'simple') {
    simpleValues = readSimpleFromForm(form);
    currentInputs = simpleToFull(simpleValues);
  } else {
    currentInputs = readInputsFromForm(form);
    simpleValues = fullToSimple(currentInputs);
  }
  currentResults = calculate(currentInputs);
  persistState();
}
