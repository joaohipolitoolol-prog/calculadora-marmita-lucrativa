import { CARDAPIO_30_DIAS } from '../data/cardapio.js';
import {
  calculate,
  cloneInputs,
  readInputsFromForm,
} from '../lib/calculator.js';
import { LOCAL_USER, getUserLabel } from '../lib/local-user.js';
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

const root = document.getElementById('app-root');
const toastEl = document.getElementById('toast');
const WELCOME_KEY = 'marmita_welcome_seen';

const currentUser = LOCAL_USER;
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
  maybeShowWelcome();
}

function maybeShowWelcome() {
  if (localStorage.getItem(WELCOME_KEY) === '1') return;
  localStorage.setItem(WELCOME_KEY, '1');

  const overlay = document.createElement('div');
  overlay.className = 'welcome-overlay';
  overlay.innerHTML = `
    <div class="welcome-card">
      <div class="welcome-logo">${ICONS.logo}</div>
      <h2>Sua calculadora está pronta</h2>
      <p>Comece no <strong>modo rápido</strong>. Coloque seus custos por marmita e veja o lucro na hora.</p>
      <ul class="welcome-tips">
        <li>O lucro aparece no topo enquanto você digita</li>
        <li>Toque em <strong>Ver meu lucro</strong> quando terminar</li>
        <li>Quer detalhar tudo? Ative o <strong>modo completo</strong></li>
      </ul>
      <button type="button" class="btn btn-primary" id="welcome-close">Começar agora</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#welcome-close').addEventListener('click', () => overlay.remove());
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

function renderTopbarProfit() {
  if (activeView !== 'calc') return '';
  const r = currentResults;
  return `
    <div class="topbar-profit ${r.status}" id="topbar-profit" title="Lucro por marmita">
      <span class="topbar-profit-val">${money(r.profitPerUnit)}</span>
    </div>
  `;
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
      <nav class="drawer-nav">${navItems}</nav>
      <div class="drawer-foot">
        <span class="drawer-mode">${inputMode === 'simple' ? 'Modo rápido' : 'Modo completo'}</span>
        <a href="/" class="drawer-home">${ICONS.home}<span>Página inicial</span></a>
      </div>
    </aside>
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

function renderStepBar() {
  const pct = (openStep / STEPS.length) * 100;
  const step = STEPS[openStep - 1];
  return `
    <div class="step-bar">
      <div class="step-bar-top">
        <span class="step-bar-count">Passo ${openStep} de ${STEPS.length}</span>
        <span class="step-bar-name">${step.label}</span>
      </div>
      <div class="step-bar-track"><div class="step-bar-fill" style="width:${pct}%"></div></div>
      <p class="step-bar-desc">${step.desc}</p>
    </div>
  `;
}

function renderCalcFooter() {
  if (activeView !== 'calc') return '';

  if (inputMode === 'simple') {
    return `
      <div class="calc-footer-bar">
        <button type="submit" form="calc-form" class="btn btn-primary btn-block">Ver meu lucro</button>
      </div>
    `;
  }

  const isLast = openStep >= STEPS.length;
  return `
    <div class="calc-footer-bar">
      <div class="calc-footer-inner">
        ${openStep > 1 ? `<button type="button" class="btn btn-ghost" id="prev-step">${ICONS.chevronLeft}<span>Voltar</span></button>` : '<span></span>'}
        ${
          isLast
            ? '<button type="submit" form="calc-form" class="btn btn-primary">Ver meu lucro</button>'
            : `<button type="button" class="btn btn-primary" id="next-step"><span>Próximo</span>${ICONS.chevronRight}</button>`
        }
      </div>
    </div>
  `;
}

function render() {
  const viewTitle = VIEW_META[activeView]?.label || 'App';

  root.innerHTML = `
    <div class="app-shell ${activeView === 'calc' ? 'has-calc-footer' : ''}">
      ${renderDrawer()}
      <header class="app-topbar">
        <button type="button" class="icon-btn menu-btn" id="menu-toggle" aria-label="Abrir menu">${ICONS.menu}</button>
        <div class="topbar-center">
          ${ICONS.logo}
          <h1 class="topbar-title">${viewTitle}</h1>
        </div>
        ${renderTopbarProfit()}
      </header>

      <main class="app-content">
        <section id="view-calc" class="view ${activeView === 'calc' ? 'active' : ''}">
          ${renderCalculatorForm()}
        </section>
        <section id="view-results" class="view ${activeView === 'results' ? 'active' : ''}">
          ${renderResults()}
        </section>
        <section id="view-bonus" class="view ${activeView === 'bonus' ? 'active' : ''}">
          ${renderBonus()}
        </section>
        <section id="view-account" class="view ${activeView === 'account' ? 'active' : ''}">
          ${renderAccount()}
        </section>
      </main>

      ${renderCalcFooter()}
    </div>
  `;

  bindEvents();
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
    <form id="calc-form">
      ${renderModeToggle()}
      <div class="simple-card">
        <p class="simple-intro">Custo <strong>de cada marmita</strong> — rápido e direto.</p>
        <div class="field-stack">
          ${moneyField('simple_sellingPrice', 'simple_sellingPrice', 'Preço de venda', s.sellingPrice)}
          ${moneyField('simple_foodCostPerUnit', 'simple_foodCostPerUnit', 'Ingredientes/marmita', s.foodCostPerUnit, 'Arroz, feijão, carne...')}
          ${moneyField('simple_packaging', 'simple_packaging', 'Embalagem/marmita', s.packaging)}
          ${moneyField('simple_gasPerUnit', 'simple_gasPerUnit', 'Gás, tempero, energia/marmita', s.gasPerUnit)}
          ${moneyField('simple_delivery', 'simple_delivery', 'Entrega ou taxa/marmita', s.delivery)}
          ${moneyField('simple_wastePerUnit', 'simple_wastePerUnit', 'Desperdício/marmita', s.wastePerUnit)}
          <div class="field">
            <label for="simple_marmitasPerDay">Marmitas por dia</label>
            <input id="simple_marmitasPerDay" name="simple_marmitasPerDay" inputmode="numeric" value="${s.marmitasPerDay}">
          </div>
          <div class="field">
            <label for="simple_targetMarginPercent">Margem ideal (%)</label>
            <input id="simple_targetMarginPercent" name="simple_targetMarginPercent" inputmode="decimal" value="${s.targetMarginPercent}">
            <span class="field-hint">Recomendado: 30%</span>
          </div>
        </div>
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
        <div class="step-panel">
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
        <div class="step-panel">
          <div class="ingredient-list">${renderIngredientsStep()}</div>
          <button type="button" class="btn btn-secondary btn-add" id="add-ingredient">${ICONS.plus}<span>Adicionar ingrediente</span></button>
        </div>
      `;
    case 3:
      return `
        <div class="step-panel">
          <ul class="hidden-costs-list">
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
        <div class="step-panel">
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
        <div class="step-panel">
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
    <form id="calc-form">
      ${renderModeToggle()}
      ${renderStepBar()}
      ${renderStepPanel(openStep)}
    </form>
  `;
}

function renderCalculatorForm() {
  return inputMode === 'simple' ? renderSimpleForm() : renderFullForm();
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
      <ul class="breakdown-list">
        <li><span>Comida</span><strong>${money(r.breakdown.foodCost)}</strong></li>
        <li><span>Desperdício</span><strong>${money(r.breakdown.wasteCost)}</strong></li>
        <li><span>Embalagem</span><strong>${money(r.breakdown.packagingPerUnit)}</strong></li>
        <li><span>Gás/un</span><strong>${money(r.breakdown.gasPerUnit)}</strong></li>
        <li><span>Temperos/un</span><strong>${money(r.breakdown.spicesPerUnit)}</strong></li>
        <li><span>Entrega</span><strong>${money(r.breakdown.deliveryPerUnit)}</strong></li>
        <li><span>Seu tempo</span><strong>${money(r.breakdown.timePerUnit)}</strong></li>
        <li><span>Taxa plataforma</span><strong>${money(r.breakdown.platformFee)}</strong></li>
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
    <div class="results-hero ${r.status}">
      <small>${statusText}</small>
      <h2>${money(r.profitPerUnit)}</h2>
      <p>Lucro por marmita · ${statusDetail}</p>
    </div>

    <div class="price-action">
      <div class="price-action-card ideal">
        <span>Preço recomendado</span>
        <strong>${money(r.idealPrice)}</strong>
        <em>Meta ${percent(Math.min(target, 80))} de margem</em>
      </div>
      <div class="price-action-card">
        <span>Preço mínimo</span>
        <strong>${money(r.minPrice)}</strong>
        <em>Abaixo disso = prejuízo</em>
      </div>
    </div>

    <div class="results-actions">
      <button type="button" class="btn btn-secondary" id="save-scenario-results">Salvar cenário</button>
      <button type="button" class="btn btn-primary" data-view="calc">Ajustar números</button>
    </div>

    <details class="results-details">
      <summary>Ver mais detalhes</summary>
      <div class="results-details-body">
        ${renderResultsDetails()}
      </div>
    </details>
  `;
}

function renderScenarioList() {
  if (!scenarios.length) {
    return '<p class="empty-state">Nenhum cenário salvo ainda.</p>';
  }

  return `
    <ul class="scenario-list">
      ${scenarios
        .map((item) => {
          const name = escapeHtml(item.name || 'Meu cenário');
          const price = money(item.results?.sellingPrice ?? item.inputs?.sellingPrice ?? 0);
          const profit = money(item.results?.profitPerUnit ?? 0);
          return `
            <li class="scenario-item">
              <h3>${name}</h3>
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

function renderBonus() {
  return `
    <div class="section-card bonus-header-card">
      <h2>Cardápio Lucrativo de 30 Dias</h2>
      <p>Ideias para variar sem perder margem. Simule o custo na calculadora antes de fixar o prato.</p>
      <input type="search" class="bonus-search" id="bonus-search" placeholder="Buscar prato ou dia...">
    </div>
    <div class="menu-list" id="menu-list">
      ${renderMenuItems(CARDAPIO_30_DIAS)}
    </div>
  `;
}

function renderMenuItems(items) {
  return items
    .map(
      (item) => `
        <article class="menu-item" data-search="${escapeHtml(`${item.dia} ${item.prato} ${item.dica}`.toLowerCase())}">
          <strong>Dia ${item.dia}</strong>
          <span>${escapeHtml(item.prato)}</span>
          <em>${escapeHtml(item.dica)}</em>
        </article>
      `
    )
    .join('');
}

function renderAccount() {
  return `
    <div class="section-card account-card">
      <div class="account-avatar">${ICONS.logo}</div>
      <h2>Como usar</h2>
      <ol class="help-list">
        <li>Use o <strong>modo rápido</strong> para começar em 2 minutos</li>
        <li>O lucro no topo atualiza enquanto você digita</li>
        <li>Em <strong>Resultados</strong>, veja o preço recomendado</li>
        <li>Ative o <strong>modo completo</strong> para detalhar tudo</li>
        <li>Consulte o <strong>Cardápio de 30 dias</strong> para variar</li>
      </ol>
    </div>
    <div class="section-card">
      <h2>Seus dados</h2>
      <p class="account-note">Tudo fica salvo neste celular. Login na nuvem virá em breve.</p>
      <button type="button" class="btn btn-secondary" id="reset-data">Limpar meus dados</button>
    </div>
  `;
}

function updateLivePreview() {
  const pill = document.getElementById('topbar-profit');
  if (!pill) return;

  const r = currentResults;
  pill.className = `topbar-profit ${r.status}`;
  pill.querySelector('.topbar-profit-val').textContent = money(r.profitPerUnit);

  root.querySelectorAll('.drawer-badge').forEach((el) => {
    el.className = `drawer-badge ${r.status}`;
  });
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
    if (activeView !== 'results') {
      activeView = 'results';
    }
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

  const form = document.getElementById('calc-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      updateFromForm(form);
      activeView = 'results';
      closeDrawer();
      render();
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

  document.getElementById('save-scenario-results')?.addEventListener('click', () => {
    saveScenarioFlow();
  });

  const bonusSearch = document.getElementById('bonus-search');
  if (bonusSearch) {
    bonusSearch.addEventListener('input', () => {
      const q = bonusSearch.value.trim().toLowerCase();
      document.querySelectorAll('#menu-list .menu-item').forEach((item) => {
        item.style.display = !q || item.dataset.search.includes(q) ? '' : 'none';
      });
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

  document.getElementById('reset-data')?.addEventListener('click', () => {
    if (!window.confirm('Apagar rascunho e cenários salvos neste aparelho?')) return;
    clearDraft(currentUser.uid);
    localStorage.removeItem(`marmita_scenarios_${currentUser.uid}`);
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

bootstrap();
