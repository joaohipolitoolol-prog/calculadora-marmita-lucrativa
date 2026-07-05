import { CARDAPIO_30_DIAS } from '../data/cardapio.js';
import {
  calculate,
  cloneInputs,
  DEFAULT_INPUTS,
  readInputsFromForm,
} from '../lib/calculator.js';
import {
  getUserLabel,
  isDemoMode,
  logout,
  redirectIfGuest,
  watchAuth,
} from '../lib/auth.js';
import { money, percent, parseNumber, escapeHtml } from '../lib/format.js';
import {
  clearDraft,
  deleteScenario,
  listScenarios,
  loadDraft,
  saveDraft,
  saveScenario,
} from '../lib/storage.js';

const root = document.getElementById('app-root');
const toastEl = document.getElementById('toast');

let currentUser = null;
let currentInputs = cloneInputs(DEFAULT_INPUTS);
let currentResults = calculate(currentInputs);
let scenarios = [];
let activeView = 'calc';
let openStep = 1;

const STEPS = [
  { id: 1, label: 'Produção' },
  { id: 2, label: 'Comida' },
  { id: 3, label: 'Extras' },
  { id: 4, label: 'Tempo' },
  { id: 5, label: 'Preço' },
];

watchAuth(async (user) => {
  if (!user) {
    redirectIfGuest(user);
    return;
  }

  currentUser = user;
  const draft = await loadDraft(user.uid);
  if (draft) currentInputs = draft;

  currentResults = calculate(currentInputs);
  scenarios = await listScenarios(user.uid);
  render();
  maybeShowDemoWelcome();
});

function maybeShowDemoWelcome() {
  if (sessionStorage.getItem('marmita_demo_welcome') !== '1') return;
  sessionStorage.removeItem('marmita_demo_welcome');

  const overlay = document.createElement('div');
  overlay.className = 'welcome-overlay';
  overlay.innerHTML = `
    <div class="welcome-card">
      <span class="welcome-emoji">🍱✨</span>
      <h2>Bem-vinda!</h2>
      <p>Números de exemplo já preenchidos. Muda o preço e vê na hora quanto sobra no bolso.</p>
      <ul class="welcome-tips">
        <li>✅ A barra verde em cima atualiza ao vivo</li>
        <li>✅ Abra cada passo e preencha seus custos</li>
        <li>✅ Toque em <strong>Resultados</strong> para o raio-x completo</li>
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

function renderLiveBarHtml() {
  const r = currentResults;
  const sub =
    r.status === 'prejuizo'
      ? 'Você está no vermelho'
      : r.status === 'alerta'
        ? 'Margem abaixo da meta'
        : `${percent(r.margin)} de margem`;

  return `
    <div id="live-profit-bar" class="live-bar ${r.status}">
      <div>
        <div class="live-bar-label">Lucro por marmita</div>
        <div class="live-bar-value">${money(r.profitPerUnit)}</div>
        <div class="live-bar-sub">${sub}</div>
      </div>
      <button type="button" class="live-bar-action" data-view="results">Ver detalhes</button>
    </div>
  `;
}

function render() {
  root.innerHTML = `
    <div class="app-shell">
      <header class="app-topbar">
        <div class="app-brand"><span>🍱</span> Marmita Lucrativa</div>
        <div class="app-user">
          <strong>${escapeHtml(getUserLabel(currentUser))}</strong>
          ${isDemoMode() ? 'Demo' : 'Aluna'}
        </div>
      </header>
      ${isDemoMode() ? '<div class="demo-banner">Demo ativa — explore à vontade, sem pagar nada</div>' : ''}
      ${activeView === 'calc' ? renderLiveBarHtml() : ''}

      <nav class="app-nav">
        ${navButton('calc', '🧮', 'Calcular')}
        ${navButton('results', '📊', 'Resultados', currentResults.status)}
        ${navButton('bonus', '🎁', 'Bônus')}
        ${navButton('account', '👤', 'Conta')}
      </nav>

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
    </div>
  `;

  bindEvents();
}

function navButton(id, icon, label, status) {
  const badge =
    id === 'results' && status
      ? `<span class="nav-badge ${status}"></span>`
      : '';
  return `
    <button type="button" class="nav-btn ${activeView === id ? 'active' : ''}" data-view="${id}">
      <span>${icon}</span>
      ${label}
      ${badge}
    </button>
  `;
}

function renderStepProgress() {
  return `
    <div class="step-progress">
      ${STEPS.map(
        (step) => `
          <button type="button" class="step-dot ${openStep === step.id ? 'active' : openStep > step.id ? 'done' : ''}" data-step="${step.id}">
            ${step.label}
          </button>
        `
      ).join('')}
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

function renderCalculatorForm() {
  const ingredientsHtml = currentInputs.ingredients
    .map(
      (item, index) => `
        <div class="ingredient-card" data-index="${index}">
          <div class="ingredient-card-top">
            <input data-ingredient-name value="${escapeHtml(item.name)}" placeholder="Nome do ingrediente" aria-label="Nome">
            <button type="button" class="btn-icon remove-ingredient" data-index="${index}" aria-label="Remover">×</button>
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

  return `
    <form id="calc-form">
      ${renderStepProgress()}

      <details class="step-card" data-step="1" ${openStep === 1 ? 'open' : ''}>
        <summary><span class="step-num">1</span> Sua produção</summary>
        <div class="step-body">
          <p>Quantas marmitas você faz por dia e quantos dias vende no mês?</p>
          <div class="field-grid">
            <div class="field">
              <label for="marmitasPerDay">Marmitas/dia</label>
              <input id="marmitasPerDay" name="marmitasPerDay" inputmode="numeric" value="${currentInputs.marmitasPerDay}">
            </div>
            <div class="field">
              <label for="workDaysPerMonth">Dias/mês</label>
              <input id="workDaysPerMonth" name="workDaysPerMonth" inputmode="numeric" value="${currentInputs.workDaysPerMonth}">
            </div>
          </div>
        </div>
      </details>

      <details class="step-card" data-step="2" ${openStep === 2 ? 'open' : ''}>
        <summary><span class="step-num">2</span> Custos da comida</summary>
        <div class="step-body">
          <p>Custo total de cada preparo ÷ quantas marmitas rende.</p>
          <div class="ingredient-list">${ingredientsHtml}</div>
          <button type="button" class="btn-secondary" id="add-ingredient">+ Adicionar ingrediente</button>
        </div>
      </details>

      <details class="step-card" data-step="3" ${openStep === 3 ? 'open' : ''}>
        <summary><span class="step-num">3</span> Custos escondidos</summary>
        <div class="step-body">
          <p>O que quase ninguém coloca na conta — e deveria.</p>
          <div class="field-grid">
            ${moneyField('packagingPerUnit', 'packagingPerUnit', 'Embalagem/un', currentInputs.packagingPerUnit, 'Marmita, talher, sacola')}
            ${moneyField('gasMonthly', 'gasMonthly', 'Gás/mês', currentInputs.gasMonthly)}
            ${moneyField('spicesMonthly', 'spicesMonthly', 'Temperos/mês', currentInputs.spicesMonthly)}
            ${moneyField('deliveryPerUnit', 'deliveryPerUnit', 'Entrega/un', currentInputs.deliveryPerUnit, 'Frete ou motoboy')}
            <div class="field">
              <label for="platformFeePercent">Taxa app (%)</label>
              <input id="platformFeePercent" name="platformFeePercent" inputmode="decimal" value="${currentInputs.platformFeePercent}">
            </div>
            <div class="field">
              <label for="wastePercent">Desperdício (%)</label>
              <input id="wastePercent" name="wastePercent" inputmode="decimal" value="${currentInputs.wastePercent}">
              <span class="field-hint">Sobra, queima, teste</span>
            </div>
          </div>
        </div>
      </details>

      <details class="step-card" data-step="4" ${openStep === 4 ? 'open' : ''}>
        <summary><span class="step-num">4</span> Seu tempo</summary>
        <div class="step-body">
          <p>Trabalhar 5h por R$ 3 de lucro total não vale a pena.</p>
          <div class="field-grid">
            <div class="field">
              <label for="hoursPerDay">Horas/dia</label>
              <input id="hoursPerDay" name="hoursPerDay" inputmode="decimal" value="${currentInputs.hoursPerDay}">
            </div>
            ${moneyField('hourlyRate', 'hourlyRate', 'Valor da hora', currentInputs.hourlyRate)}
          </div>
        </div>
      </details>

      <details class="step-card" data-step="5" ${openStep === 5 ? 'open' : ''}>
        <summary><span class="step-num">5</span> Preço e meta</summary>
        <div class="step-body">
          <p>Quanto cobra hoje e qual margem quer atingir?</p>
          <div class="field-grid">
            ${moneyField('sellingPrice', 'sellingPrice', 'Preço hoje', currentInputs.sellingPrice)}
            <div class="field">
              <label for="targetMarginPercent">Margem ideal (%)</label>
              <input id="targetMarginPercent" name="targetMarginPercent" inputmode="decimal" value="${currentInputs.targetMarginPercent}">
            </div>
          </div>
        </div>
      </details>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Ver meu lucro completo →</button>
        <button type="button" class="btn btn-secondary" id="save-scenario">Salvar cenário</button>
      </div>
    </form>
  `;
}

function renderResults() {
  const r = currentResults;
  const target = parseNumber(currentInputs.targetMarginPercent);
  const marginWidth = Math.min(Math.max(r.margin, 0), 100);

  const statusText =
    r.status === 'prejuizo'
      ? 'Você está pagando pra trabalhar'
      : r.status === 'alerta'
        ? 'Lucro baixo — dá pra melhorar'
        : 'Sua marmita está lucrando!';

  const statusDetail =
    r.status === 'prejuizo'
      ? `Prejuízo de ${money(Math.abs(r.profitPerUnit))} por marmita vendida.`
      : r.status === 'alerta'
        ? `Margem ${percent(r.margin)} · meta ${percent(target)}`
        : `${money(r.dailyProfit)}/dia · ${money(r.monthlyProfit)}/mês`;

  const punch =
    r.status === 'prejuizo'
      ? 'Vender muito no prejuízo = trabalhar de graça com extra steps.'
      : r.status === 'alerta'
        ? 'Você se mata na cozinha — merece sobrar mais no bolso.'
        : 'Esse número é o que importa. Não o que "parece" no Pix.';

  return `
    <div class="app-insert app-insert-punch">${punch}</div>

    <div class="results-hero ${r.status}">
      <small>${statusText}</small>
      <h2>${money(r.profitPerUnit)}</h2>
      <p>Lucro por marmita · ${statusDetail}</p>
    </div>

    <div class="price-action">
      <div class="price-action-card">
        <span>Preço mínimo</span>
        <strong>${money(r.minPrice)}</strong>
      </div>
      <div class="price-action-card ideal">
        <span>Preço ideal</span>
        <strong>${money(r.idealPrice)}</strong>
      </div>
    </div>

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
      <div class="metric-card green">
        <span>Lucro/dia</span>
        <strong>${money(r.dailyProfit)}</strong>
      </div>
      <div class="metric-card green">
        <span>Lucro/mês</span>
        <strong>${money(r.monthlyProfit)}</strong>
      </div>
    </div>

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

function renderScenarioList() {
  if (!scenarios.length) {
    return '<p class="empty-state">Nenhum cenário salvo. Calcule e toque em "Salvar cenário".</p>';
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
    <div class="section-card">
      <h2>🎁 Cardápio de 30 Dias</h2>
      <p>Ideias para variar sem perder margem. Use com a calculadora.</p>
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
          <em>💡 ${escapeHtml(item.dica)}</em>
        </article>
      `
    )
    .join('');
}

function renderAccount() {
  return `
    <div class="section-card account-card">
      <div class="account-avatar">🍱</div>
      <h2>${escapeHtml(getUserLabel(currentUser))}</h2>
      <p>${escapeHtml(currentUser.email || '')}</p>
      <button type="button" class="btn btn-primary" id="logout-btn">Sair da conta</button>
    </div>
    <div class="section-card">
      <h2>Como funciona</h2>
      <p>Preencha os 5 passos, veja o lucro ao vivo na barra verde e salve cenários para comparar cardápios.</p>
    </div>
  `;
}

function updateLivePreview() {
  const bar = document.getElementById('live-profit-bar');
  if (!bar) return;

  const r = currentResults;
  bar.className = `live-bar ${r.status}`;
  bar.querySelector('.live-bar-value').textContent = money(r.profitPerUnit);
  bar.querySelector('.live-bar-sub').textContent =
    r.status === 'prejuizo'
      ? 'Você está no vermelho'
      : r.status === 'alerta'
        ? 'Margem abaixo da meta'
        : `${percent(r.margin)} de margem`;

  root.querySelectorAll('.nav-badge').forEach((el) => {
    el.className = `nav-badge ${r.status}`;
  });
}

function showSaveModal(onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <h3>Salvar cenário</h3>
      <p>Dê um nome para comparar depois (ex: "Cardápio seg", "Com entrega").</p>
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

function bindEvents() {
  root.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', () => {
      activeView = el.dataset.view;
      render();
    });
  });

  root.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openStep = parseNumber(btn.dataset.step);
      render();
    });
  });

  root.querySelectorAll('.step-card').forEach((card) => {
    card.addEventListener('toggle', () => {
      if (card.open) {
        openStep = parseNumber(card.dataset.step);
        root.querySelectorAll('.step-dot').forEach((dot) => {
          const step = parseNumber(dot.dataset.step);
          dot.classList.toggle('active', step === openStep);
          dot.classList.toggle('done', step < openStep);
        });
      }
    });
  });

  const form = document.getElementById('calc-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      updateFromForm(form);
      activeView = 'results';
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
      openStep = 2;
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

    document.getElementById('save-scenario')?.addEventListener('click', () => {
      updateFromForm(form);
      showSaveModal(async (name) => {
        await saveScenario(currentUser.uid, {
          name,
          inputs: cloneInputs(currentInputs),
          results: currentResults,
        });
        scenarios = await listScenarios(currentUser.uid);
        showToast('Cenário salvo!');
        activeView = 'results';
        render();
      });
    });
  }

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
      currentResults = calculate(currentInputs);
      saveDraft(currentUser.uid, currentInputs);
      openStep = 1;
      activeView = 'calc';
      render();
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

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await logout();
    clearDraft(currentUser.uid);
    window.location.href = '/login.html';
  });
}

function updateFromForm(form) {
  currentInputs = readInputsFromForm(form);
  currentResults = calculate(currentInputs);
  saveDraft(currentUser.uid, currentInputs);
}
