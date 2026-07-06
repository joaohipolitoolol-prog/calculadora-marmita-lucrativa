import {
  CHECKLIST_PRODUCCION,
  LISTA_COMPRAS,
  MENSAJES_WHATSAPP,
  PLAN_7_DIAS,
  RECETAS_PALETAS,
} from '../data/kit-paletas.js';
import {
  calculate,
  cloneInputs,
  readInputsFromForm,
} from '../lib/calculator.js';
import { LOCAL_USER, getUserLabel } from '../lib/local-user.js';
import { WHATSAPP_PURCHASE_LINK, WHATSAPP_DISPLAY } from '../landing/config.js';
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

let currentUser = LOCAL_USER;
let inputMode = 'simple';
let simpleValues = { ...SIMPLE_DEFAULTS };
let currentInputs = simpleToFull(SIMPLE_DEFAULTS);
let currentResults = calculate(currentInputs);
let scenarios = [];
let activeView = 'calc';
let kitSection = 'mensajes';
let openStep = 1;
let drawerOpen = false;

const STEPS = [
  { id: 1, label: 'Producción', desc: '¿Cuántas paletas preparas por día?' },
  { id: 2, label: 'Ingredientes', desc: 'Costo de cada preparo ÷ porciones' },
  { id: 3, label: 'Extras', desc: 'Empaque, hielo, entrega, desperdicio' },
  { id: 4, label: 'Tiempo', desc: 'Cuánto vale tu hora de trabajo' },
  { id: 5, label: 'Precio', desc: 'Cuánto cobras y qué margen quieres' },
];

const SIMULATION_VOLUMES = [10, 20, 30];

const INSIGHTS = {
  prejuizo: {
    title: 'Acción urgente',
    text: 'Tu precio está por debajo del costo real. Sube al menos al precio mínimo o reduce costos ocultos como empaque y entrega.',
  },
  alerta: {
    title: 'Se puede mejorar',
    text: 'Tienes ganancia, pero la margen está baja. Prueba el precio sugerido o revisa ingredientes y desperdicio.',
  },
  lucro: {
    title: 'Buen camino',
    text: 'Tu margen está saludable. Guarda este escenario y compara cuando cambies sabores o proveedor.',
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
    sessionStorage.setItem('paletas_post_purchase', '1');
    showToast('¡Compra confirmada! Empieza por el modo rápido.');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (sessionStorage.getItem('paletas_demo_welcome') === '1') {
    showToast('Demo activa — tus datos quedan en este celular.');
    sessionStorage.removeItem('paletas_demo_welcome');
  }
}

function renderPostPurchaseBanner() {
  if (sessionStorage.getItem('paletas_post_purchase') !== '1') return '';

  return `
    <div class="welcome-banner" id="welcome-banner">
      <div class="welcome-banner-body">
        <strong>¡Bienvenida a tu Kit Paletas de WhatsApp!</strong>
        <p>1. Calcula tus precios en modo rápido · 2. Toca <em>Ver mi ganancia</em> · 3. Abre Recetas y Kit en el menú de abajo.</p>
        <a href="${WHATSAPP_PURCHASE_LINK}" class="welcome-banner-wa" target="_blank" rel="noopener noreferrer">¿Necesitas ayuda? Escríbenos por WhatsApp</a>
      </div>
      <button type="button" class="welcome-banner-close" id="welcome-banner-close" aria-label="Cerrar">×</button>
    </div>
  `;
}

function dismissPostPurchaseBanner() {
  sessionStorage.removeItem('paletas_post_purchase');
  document.getElementById('welcome-banner')?.remove();
}

bootstrap();

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
        <div class="drawer-brand">${ICONS.logo}<div><strong>Paletas de WhatsApp</strong><small>${escapeHtml(getUserLabel(currentUser))}</small></div></div>
        <button type="button" class="icon-btn" data-drawer-close aria-label="Cerrar menú">${ICONS.close}</button>
      </div>
      <div class="drawer-summary ${currentResults.status}">
        <span>Ganancia/un</span>
        <strong>${money(currentResults.profitPerUnit)}</strong>
        <em>${percent(currentResults.margin)} margen</em>
      </div>
      <nav class="drawer-nav">${navItems}</nav>
      <div class="drawer-foot">
        <span class="drawer-mode">${inputMode === 'simple' ? 'Modo rápido' : 'Modo completo'}</span>
        <a href="/" class="drawer-home">${ICONS.home}<span>Página de venta</span></a>
      </div>
    </aside>
  `;
}

function renderTabBar() {
  return `
    <nav class="app-tabbar" aria-label="Navegación rápida">
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
          <span>Costo real</span>
          <strong>${money(r.realCostPerUnit)}</strong>
        </div>
        <div class="live-summary-item highlight">
          <span>Ganancia/un</span>
          <strong>${money(r.profitPerUnit)}</strong>
        </div>
        <div class="live-summary-item">
          <span>Margen</span>
          <strong>${percent(r.margin)}</strong>
        </div>
      </div>
      <div class="live-summary-foot">
        <span>${money(r.dailyProfit)}/día</span>
        <span>${money(r.monthlyProfit)}/mes</span>
      </div>
    </div>
  `;
}

function renderStepBar() {
  const step = STEPS[openStep - 1];
  const pills = STEPS.map(
    (s) => `
      <button type="button" class="step-pill ${openStep === s.id ? 'active' : openStep > s.id ? 'done' : ''}" data-step="${s.id}" aria-label="Paso ${s.id}: ${s.label}">
        ${openStep > s.id ? ICONS.check : s.id}
      </button>
    `
  ).join('');

  return `
    <div class="step-bar">
      <div class="step-pills">${pills}</div>
      <div class="step-bar-head">
        <span class="step-bar-count">Paso ${openStep} de ${STEPS.length}</span>
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
        <button type="submit" form="calc-form" class="btn btn-primary btn-block">${ICONS.chart}<span>Ver mi ganancia</span></button>
      </div>
    `;
  }

  const isLast = openStep >= STEPS.length;
  return `
    <div class="calc-footer-bar">
      <div class="calc-footer-inner">
        ${openStep > 1 ? `<button type="button" class="btn btn-ghost" id="prev-step">${ICONS.chevronLeft}<span>Atrás</span></button>` : ''}
        ${
          isLast
            ? `<button type="submit" form="calc-form" class="btn btn-primary btn-block">${ICONS.chart}<span>Ver mi ganancia</span></button>`
            : `<button type="button" class="btn btn-primary btn-block" id="next-step"><span>Siguiente</span>${ICONS.chevronRight}</button>`
        }
      </div>
    </div>
  `;
}

function renderActiveView() {
  switch (activeView) {
    case 'calc':
      return `${renderPostPurchaseBanner()}${renderCalculatorForm()}`;
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
        <button type="button" class="icon-btn menu-btn" id="menu-toggle" aria-label="Abrir menú">${ICONS.menu}</button>
        <div class="topbar-center">
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
        <span class="input-prefix">US$</span>
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
        ${fieldGroup('Precio de venta', 'Cuánto cobras hoy por paleta.', moneyField('simple_sellingPrice', 'simple_sellingPrice', 'Precio de venta', s.sellingPrice))}
        ${fieldGroup(
          'Costos por paleta',
          'Suma todo lo que entra en cada unidad vendida.',
          `
            ${moneyField('simple_foodCostPerUnit', 'simple_foodCostPerUnit', 'Ingredientes', s.foodCostPerUnit, 'Fruta, crema, chocolate...')}
            ${moneyField('simple_packaging', 'simple_packaging', 'Empaque', s.packaging)}
            ${moneyField('simple_gasPerUnit', 'simple_gasPerUnit', 'Extras (hielo, gas, energía)', s.gasPerUnit)}
            ${moneyField('simple_delivery', 'simple_delivery', 'Entrega o envío', s.delivery)}
            ${moneyField('simple_wastePerUnit', 'simple_wastePerUnit', 'Desperdicio', s.wastePerUnit)}
          `
        )}
        ${fieldGroup(
          'Producción y meta',
          null,
          `
            <div class="field">
              <label for="simple_marmitasPerDay">Paletas por día</label>
              <input id="simple_marmitasPerDay" name="simple_marmitasPerDay" inputmode="numeric" value="${s.marmitasPerDay}">
            </div>
            <div class="field">
              <label for="simple_targetMarginPercent">Margen ideal (%)</label>
              <input id="simple_targetMarginPercent" name="simple_targetMarginPercent" inputmode="decimal" value="${s.targetMarginPercent}">
              <span class="field-hint">Recomendado: 40%</span>
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
            <input data-ingredient-name value="${escapeHtml(item.name)}" placeholder="Nombre del ingrediente" aria-label="Nombre">
            <button type="button" class="icon-btn icon-btn-danger remove-ingredient" data-index="${index}" aria-label="Eliminar">${ICONS.trash}</button>
          </div>
          <div class="ingredient-card-grid">
            <div>
              <label>Costo del preparo</label>
              <div class="input-wrap">
                <span class="input-prefix">US$</span>
                <input data-ingredient-cost="${index}" inputmode="decimal" value="${item.batchCost}">
              </div>
            </div>
            <div>
              <label>Rinde (paletas)</label>
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
              <label for="marmitasPerDay">Paletas por día</label>
              <input id="marmitasPerDay" name="marmitasPerDay" inputmode="numeric" value="${currentInputs.marmitasPerDay}">
            </div>
            <div class="field">
              <label for="workDaysPerMonth">Días trabajados al mes</label>
              <input id="workDaysPerMonth" name="workDaysPerMonth" inputmode="numeric" value="${currentInputs.workDaysPerMonth}">
            </div>
          </div>
        </div>
      `;
    case 2:
      return `
        <div class="form-card step-panel">
          <div class="ingredient-list">${renderIngredientsStep()}</div>
          <button type="button" class="btn btn-secondary btn-add" id="add-ingredient">${ICONS.plus}<span>Agregar ingrediente</span></button>
        </div>
      `;
    case 3:
      return `
        <div class="form-card step-panel">
          <ul class="tip-list">
            <li>Empaque y materiales</li>
            <li>Hielo, gas y energía</li>
            <li>Entrega o envío</li>
            <li>Desperdicio del preparo</li>
          </ul>
          <div class="field-stack">
            ${moneyField('packagingPerUnit', 'packagingPerUnit', 'Empaque por paleta', currentInputs.packagingPerUnit, 'Bolsa, palito, etiqueta')}
            ${moneyField('gasMonthly', 'gasMonthly', 'Gas / energía por mes', currentInputs.gasMonthly)}
            ${moneyField('spicesMonthly', 'spicesMonthly', 'Extras por mes', currentInputs.spicesMonthly)}
            ${moneyField('deliveryPerUnit', 'deliveryPerUnit', 'Entrega por paleta', currentInputs.deliveryPerUnit)}
            <div class="field">
              <label for="platformFeePercent">Comisión de app (%)</label>
              <input id="platformFeePercent" name="platformFeePercent" inputmode="decimal" value="${currentInputs.platformFeePercent}">
            </div>
            <div class="field">
              <label for="wastePercent">Desperdicio (%)</label>
              <input id="wastePercent" name="wastePercent" inputmode="decimal" value="${currentInputs.wastePercent}">
            </div>
          </div>
        </div>
      `;
    case 4:
      return `
        <div class="form-card step-panel">
          <p class="step-panel-note">Deja en cero si no quieres incluirlo ahora.</p>
          <div class="field-stack">
            <div class="field">
              <label for="hoursPerDay">Horas por día</label>
              <input id="hoursPerDay" name="hoursPerDay" inputmode="decimal" value="${currentInputs.hoursPerDay}">
            </div>
            ${moneyField('hourlyRate', 'hourlyRate', 'Valor de tu hora', currentInputs.hourlyRate)}
          </div>
        </div>
      `;
    case 5:
      return `
        <div class="form-card step-panel">
          <div class="field-stack">
            ${moneyField('sellingPrice', 'sellingPrice', 'Precio que cobras hoy', currentInputs.sellingPrice)}
            <div class="field">
              <label for="targetMarginPercent">Margen ideal (%)</label>
              <input id="targetMarginPercent" name="targetMarginPercent" inputmode="decimal" value="${currentInputs.targetMarginPercent}">
              <span class="field-hint">Recomendado: 40%</span>
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
    { label: 'Ingredientes', value: r.breakdown.foodCost },
    { label: 'Desperdicio', value: r.breakdown.wasteCost },
    { label: 'Empaque', value: r.breakdown.packagingPerUnit },
    { label: 'Gas / energía', value: r.breakdown.gasPerUnit },
    { label: 'Extras', value: r.breakdown.spicesPerUnit },
    { label: 'Entrega', value: r.breakdown.deliveryPerUnit },
    { label: 'Tu tiempo', value: r.breakdown.timePerUnit },
    { label: 'Comisión app', value: r.breakdown.platformFee },
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
      <h2>Simulación de ganancia diaria</h2>
      <div class="simulation-grid">
        ${SIMULATION_VOLUMES.map((qty) => {
          const profit = r.profitPerUnit * qty;
          const cls = profit >= 0 ? 'positive' : 'negative';
          return `
            <div class="simulation-item ${cls}">
              <span>${qty}/día</span>
              <strong>${money(profit)}</strong>
            </div>
          `;
        }).join('')}
      </div>
      <p class="simulation-month">En el mes (${r.workDaysPerMonth} días): <strong>${money(r.monthlyProfit)}</strong></p>
    </div>
  `;
}

function renderResultsDetails() {
  const r = currentResults;
  const marginWidth = Math.min(Math.max(r.margin, 0), 100);

  return `
    <div class="margin-meter">
      <div class="margin-meter-header">
        <span>Margen actual</span>
        <strong>${percent(r.margin)}</strong>
      </div>
      <div class="margin-track">
        <div class="margin-fill ${r.status}" style="width: ${marginWidth}%"></div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <span>Costo real</span>
        <strong>${money(r.realCostPerUnit)}</strong>
      </div>
      <div class="metric-card highlight">
        <span>Precio hoy</span>
        <strong>${money(r.sellingPrice)}</strong>
      </div>
      <div class="metric-card ${r.dailyProfit >= 0 ? 'green' : ''}">
        <span>Ganancia/día</span>
        <strong>${money(r.dailyProfit)}</strong>
      </div>
      <div class="metric-card ${r.monthlyProfit >= 0 ? 'green' : ''}">
        <span>Ganancia/mes</span>
        <strong>${money(r.monthlyProfit)}</strong>
      </div>
    </div>

    ${renderSimulation()}

    <div class="section-card">
      <h2>Desglose del costo</h2>
      ${renderBreakdownBars()}
      <ul class="breakdown-list compact">
        <li><span>Costo total</span><strong>${money(r.realCostPerUnit + r.breakdown.platformFee)}</strong></li>
      </ul>
    </div>

    <div class="section-card">
      <h2>Escenarios guardados</h2>
      ${renderScenarioList()}
    </div>
  `;
}

function renderResults() {
  const r = currentResults;
  const target = parseNumber(currentInputs.targetMarginPercent);

  const statusText =
    r.status === 'prejuizo'
      ? 'Estás perdiendo dinero'
      : r.status === 'alerta'
        ? 'Ganancia baja — se puede mejorar'
        : '¡Tus paletas están dando ganancia!';

  const statusDetail =
    r.status === 'prejuizo'
      ? `Pérdida de ${money(Math.abs(r.profitPerUnit))} por paleta`
      : `${money(r.dailyProfit)}/día · ${money(r.monthlyProfit)}/mes`;

  return `
    <div class="results-page">
      <div class="results-hero ${r.status}">
        <small>${statusText}</small>
        <h2>${money(r.profitPerUnit)}</h2>
        <p>Ganancia por paleta · ${statusDetail}</p>
        <span class="results-hero-badge">${percent(r.margin)} de margen</span>
      </div>

      ${renderInsight()}

      <div class="price-action">
        <div class="price-action-card ideal">
          <span>Precio sugerido</span>
          <strong>${money(r.idealPrice)}</strong>
          <em>Meta ${percent(Math.min(target, 80))} de margen</em>
          <button type="button" class="btn btn-sm btn-ideal" id="apply-ideal-price">${ICONS.check}<span>Aplicar este precio</span></button>
        </div>
        <div class="price-action-card">
          <span>Precio mínimo</span>
          <strong>${money(r.minPrice)}</strong>
          <em>Debajo de esto = pérdida</em>
        </div>
      </div>

      <div class="results-actions">
        <button type="button" class="btn btn-secondary" id="save-scenario-results">${ICONS.save}<span>Guardar</span></button>
        <button type="button" class="btn btn-primary" data-view="calc">${ICONS.edit}<span>Ajustar</span></button>
      </div>

      <details class="results-details">
        <summary>Ver análisis completo</summary>
        <div class="results-details-body">${renderResultsDetails()}</div>
      </details>
    </div>
  `;
}

function renderScenarioList() {
  if (!scenarios.length) {
    return '<p class="empty-state">Ningún escenario guardado. Guarda diferentes combinaciones de precio y costo.</p>';
  }

  return `
    <ul class="scenario-list">
      ${scenarios
        .map((item) => {
          const name = escapeHtml(item.name || 'Mi escenario');
          const price = money(item.results?.sellingPrice ?? item.inputs?.sellingPrice ?? 0);
          const profit = money(item.results?.profitPerUnit ?? 0);
          const status = item.results?.status || 'lucro';
          return `
            <li class="scenario-item ${status}">
              <div class="scenario-item-top">
                <h3>${name}</h3>
                <span class="scenario-status ${status}"></span>
              </div>
              <p>Precio ${price} · Ganancia ${profit}/un</p>
              <div class="scenario-actions">
                <button type="button" class="load" data-load="${item.id}">Cargar</button>
                <button type="button" class="delete" data-delete="${item.id}">Eliminar</button>
              </div>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function recipeTipoSlug(tipo) {
  const map = {
    Frutal: 'frutal',
    Cremosa: 'cremosa',
    Rellena: 'rellena',
    'Estilo postre': 'postre',
    Bañada: 'banada',
  };
  return map[tipo] || 'default';
}

function recipeSearchBlob(item) {
  return [
    item.dia,
    item.nombre,
    item.tipo,
    item.dificultad,
    item.consejo,
    ...(item.ingredientes || []),
    ...(item.pasos || []),
  ]
    .join(' ')
    .toLowerCase();
}

function renderMenuByWeek() {
  const weeks = [];
  for (let i = 0; i < RECETAS_PALETAS.length; i += 7) {
    weeks.push(RECETAS_PALETAS.slice(i, i + 7));
  }

  return weeks
    .map(
      (week, wi) => `
        <details class="menu-week" ${wi === 0 ? 'open' : ''}>
          <summary>Semana ${wi + 1} · Días ${week[0].dia}–${week[week.length - 1].dia}</summary>
          <div class="menu-week-body">
            ${week
              .map(
                (item) => `
                  <details class="menu-item" data-search="${escapeHtml(recipeSearchBlob(item))}">
                    <summary class="menu-item-summary">
                      <div class="menu-item-summary-main">
                        <div class="menu-item-head">
                          <span class="menu-item-day">Receta ${item.dia}</span>
                          <span class="menu-item-type menu-item-type--${recipeTipoSlug(item.tipo)}">${escapeHtml(item.tipo)}</span>
                        </div>
                        <span class="menu-item-name">${escapeHtml(item.nombre)}</span>
                        <span class="menu-item-preview">${escapeHtml(item.ingredientes?.[0] || '')}${item.ingredientes?.length > 1 ? ' · +' + (item.ingredientes.length - 1) + ' más' : ''}</span>
                      </div>
                      <span class="menu-item-chevron" aria-hidden="true">${ICONS.chevronRight}</span>
                    </summary>
                    <div class="menu-item-body">
                      <div class="menu-item-meta">
                        <span>${escapeHtml(item.prep)} prep</span>
                        <span>${escapeHtml(item.congelacion)} frío</span>
                        <span>Rinde ${escapeHtml(item.rendimiento)}</span>
                        <span>${escapeHtml(item.dificultad)}</span>
                      </div>
                      <h4 class="menu-item-section-title">Ingredientes</h4>
                      <ul class="menu-item-ingredients">
                        ${(item.ingredientes || []).map((ing) => `<li>${escapeHtml(ing)}</li>`).join('')}
                      </ul>
                      <h4 class="menu-item-section-title">Preparación</h4>
                      <ol class="menu-item-steps">
                        ${(item.pasos || []).map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
                      </ol>
                      <p class="menu-item-tip"><strong>Tip de venta:</strong> ${escapeHtml(item.consejo || '')}</p>
                    </div>
                  </details>
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
        <h2>30 Recetas de Paletas</h2>
        <p>Cremosas, frutales, rellenas y estilo postre — con ingredientes, pasos y tips de venta.</p>
        <p class="bonus-hint">Toca una receta para ver la preparación completa.</p>
        <div class="search-wrap">
          ${ICONS.search}
          <input type="search" class="bonus-search" id="bonus-search" placeholder="Buscar receta o tipo..." autocomplete="off">
        </div>
      </div>
      <div class="menu-list" id="menu-list">${renderMenuByWeek()}</div>
      <p class="menu-empty hidden" id="menu-empty">Ninguna receta encontrada.</p>
    </div>
  `;
}

function renderKitSectionNav() {
  const sections = [
    { id: 'mensajes', label: 'Mensajes', icon: 'message' },
    { id: 'plan', label: 'Plan 7d', icon: 'calendar' },
    { id: 'lista', label: 'Compras', icon: 'list' },
    { id: 'checklist', label: 'Producción', icon: 'check' },
    { id: 'ayuda', label: 'Ayuda', icon: 'help' },
  ];

  return `
    <div class="kit-nav" role="tablist">
      ${sections
        .map(
          (s) => `
            <button type="button" class="kit-nav-btn ${kitSection === s.id ? 'active' : ''}" data-kit-section="${s.id}" role="tab">
              <span class="kit-nav-icon">${ICONS[s.icon]}</span>
              <span>${s.label}</span>
            </button>
          `
        )
        .join('')}
    </div>
  `;
}

function renderMensajesWhatsApp() {
  const grouped = MENSAJES_WHATSAPP.reduce((acc, msg, idx) => {
    if (!acc[msg.categoria]) acc[msg.categoria] = [];
    acc[msg.categoria].push({ ...msg, idx });
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(
      ([cat, items]) => `
        <div class="section-card">
          <h2>${escapeHtml(cat)}</h2>
          <ul class="message-list">
            ${items
              .map(
                (msg) => `
                  <li class="message-item">
                    <p>${escapeHtml(msg.texto)}</p>
                    <button type="button" class="btn btn-sm btn-secondary copy-msg" data-copy-index="${msg.idx}">
                      ${ICONS.copy}<span>Copiar</span>
                    </button>
                  </li>
                `
              )
              .join('')}
          </ul>
        </div>
      `
    )
    .join('');
}

function renderPlan7Dias() {
  return `
    <div class="section-card">
      <h2>Plan de 7 Días</h2>
      <p class="section-text">Sigue este paso a paso para organizar tu primera semana de ventas.</p>
      <ol class="plan-list">
        ${PLAN_7_DIAS.map(
          (day) => `
            <li class="plan-day">
              <div class="plan-day-head">
                <span class="plan-day-num">Día ${day.dia}</span>
                <strong>${escapeHtml(day.titulo)}</strong>
              </div>
              <ul>
                ${day.tareas.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
              </ul>
            </li>
          `
        ).join('')}
      </ol>
    </div>
  `;
}

function renderListaCompras() {
  return `
    <div class="section-card">
      <h2>Lista de Compras Inicial</h2>
      <h3>Ingredientes base</h3>
      <ul class="kit-checklist">
        ${LISTA_COMPRAS.ingredientes.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}
      </ul>
      <h3>Materiales</h3>
      <ul class="kit-checklist">
        ${LISTA_COMPRAS.materiales.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}
      </ul>
      <h3>Utensilios recomendados</h3>
      <ul class="kit-checklist">
        ${LISTA_COMPRAS.utensilios.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderChecklistProduccion() {
  return `
    <div class="section-card">
      <h2>Checklist de Producción</h2>
      <p class="section-text">Usa esta lista antes de cada día de ventas.</p>
      <ul class="kit-checklist interactive">
        ${CHECKLIST_PRODUCCION.map(
          (item, i) => `
            <li>
              <label class="checklist-label">
                <input type="checkbox" data-checklist="${i}">
                <span>${escapeHtml(item)}</span>
              </label>
            </li>
          `
        ).join('')}
      </ul>
    </div>
  `;
}

function renderKitAyuda() {
  return `
    <div class="quick-cards">
      <button type="button" class="quick-card" data-view="calc">${ICONS.calc}<span>Precios</span></button>
      <button type="button" class="quick-card" data-view="results">${ICONS.chart}<span>Resultados</span></button>
      <button type="button" class="quick-card" data-view="bonus">${ICONS.book}<span>Recetas</span></button>
    </div>

    <div class="section-card">
      <h2>Preguntas frecuentes</h2>
      <details class="faq-item" open>
        <summary>¿Cómo empiezo?</summary>
        <p>Usa el <strong>modo rápido</strong>, coloca el costo de cada paleta y toca <strong>Ver mi ganancia</strong>. El valor aparece arriba mientras escribes.</p>
      </details>
      <details class="faq-item">
        <summary>¿Modo rápido vs completo?</summary>
        <p>El rápido es directo por paleta. El completo divide producción, ingredientes, extras y tiempo — ideal cuando quieres precisión total.</p>
      </details>
      <details class="faq-item">
        <summary>¿La calculadora garantiza ganancias?</summary>
        <p>No. Te ayuda a organizar costos y precios, pero los resultados dependen de tus ingredientes, precios, ejecución y ventas.</p>
      </details>
      <details class="faq-item">
        <summary>¿Qué es el precio sugerido?</summary>
        <p>Es el valor para alcanzar tu margen ideal con los costos actuales. Usa "Aplicar este precio" en los resultados.</p>
      </details>
    </div>

    <div class="section-card">
      <h2>Soporte por WhatsApp</h2>
      <p class="section-text">¿Compraste el kit y tienes dudas de acceso? Escríbenos con tu correo de compra.</p>
      <a href="${WHATSAPP_PURCHASE_LINK}" class="btn btn-primary btn-large" target="_blank" rel="noopener noreferrer">Confirmar mi compra por WhatsApp</a>
      <p class="account-note">${WHATSAPP_DISPLAY}</p>
    </div>

    <div class="section-card">
      <h2>Tus datos</h2>
      <p class="account-note">Todo queda guardado en este dispositivo.</p>
      <button type="button" class="btn btn-secondary" id="replay-onboarding">${ICONS.help}<span>Ver tutorial de nuevo</span></button>
      <button type="button" class="btn btn-secondary btn-danger-text" id="reset-data">Limpiar mis datos</button>
    </div>
  `;
}

function renderKitContent() {
  switch (kitSection) {
    case 'mensajes':
      return renderMensajesWhatsApp();
    case 'plan':
      return renderPlan7Dias();
    case 'lista':
      return renderListaCompras();
    case 'checklist':
      return renderChecklistProduccion();
    default:
      return renderKitAyuda();
  }
}

function renderAccount() {
  return `
    <div class="kit-page">
      ${renderKitSectionNav()}
      <div class="kit-content">${renderKitContent()}</div>
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
      foot[0].textContent = `${money(r.dailyProfit)}/día`;
      foot[1].textContent = `${money(r.monthlyProfit)}/mes`;
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
    drawerSummary.querySelector('em').textContent = `${percent(r.margin)} margen`;
  }
}

function applyIdealPrice() {
  const ideal = currentResults.idealPrice;
  currentInputs.sellingPrice = ideal;
  simpleValues.sellingPrice = ideal;
  currentResults = calculate(currentInputs);
  persistState();
  showToast(`Precio actualizado a ${money(ideal)}`);
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
    showToast('¡Escenario guardado!');
    if (activeView !== 'results') activeView = 'results';
    render();
  });
}

function showSaveModal(onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <h3>Guardar escenario</h3>
      <p>Ponle un nombre (ej: "Con entrega", "Sabor premium").</p>
      <input type="text" id="scenario-name" placeholder="Nombre del escenario" value="Escenario ${scenarios.length + 1}">
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="modal-cancel">Cancelar</button>
        <button type="button" class="btn btn-primary" id="modal-save">Guardar</button>
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
  document.getElementById('welcome-banner-close')?.addEventListener('click', dismissPostPurchaseBanner);

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
      showToast(inputMode === 'simple' ? 'Modo rápido activado' : 'Modo completo activado');
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
          ? '¡Pérdida detectada — hora de ajustar!'
          : currentResults.status === 'alerta'
            ? 'Ganancia baja — revisa el precio sugerido'
            : '¡Bien! Tus paletas dan ganancia'
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
          showToast('Deja al menos 1 ingrediente.');
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
      showToast('¡Escenario cargado!');
    });
  });

  root.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!window.confirm('¿Eliminar este escenario?')) return;
      await deleteScenario(currentUser.uid, btn.dataset.delete);
      scenarios = await listScenarios(currentUser.uid);
      render();
      showToast('Escenario eliminado.');
    });
  });

  document.getElementById('replay-onboarding')?.addEventListener('click', () => {
    showOnboarding();
  });

  root.querySelectorAll('[data-kit-section]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kitSection = btn.dataset.kitSection;
      render();
    });
  });

  root.querySelectorAll('.copy-msg').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = parseNumber(btn.dataset.copyIndex);
      const text = MENSAJES_WHATSAPP[idx]?.texto;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('¡Mensaje copiado!');
      } catch {
        showToast('No se pudo copiar. Selecciona el texto manualmente.');
      }
    });
  });

  document.getElementById('reset-data')?.addEventListener('click', () => {
    if (!window.confirm('¿Borrar borrador y escenarios guardados en este dispositivo?')) return;
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
    showToast('Datos limpiados. Empezando de cero.');
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
