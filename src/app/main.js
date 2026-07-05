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
});

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2400);
}

function render() {
  root.innerHTML = `
    <div class="app-shell">
      <header class="app-topbar">
        <div class="app-brand"><span>🍱</span> Marmita Lucrativa</div>
        <div class="app-user">
          <strong>${escapeHtml(getUserLabel(currentUser))}</strong>
          ${isDemoMode() ? 'Modo demonstração' : 'Área do aluno'}
        </div>
      </header>
      ${isDemoMode() ? '<div class="demo-banner">Conta local neste navegador. Configure Firebase na Vercel para produção.</div>' : ''}

      <nav class="app-nav">
        ${navButton('calc', '🧮', 'Calcular')}
        ${navButton('results', '📊', 'Resultados')}
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

function navButton(id, icon, label) {
  return `
    <button type="button" class="nav-btn ${activeView === id ? 'active' : ''}" data-view="${id}">
      <span>${icon}</span>
      ${label}
    </button>
  `;
}

function renderCalculatorForm() {
  const ingredientsHtml = currentInputs.ingredients
    .map(
      (item, index) => `
        <div class="ingredient-row" data-index="${index}">
          <div>
            <label>Nome</label>
            <input data-ingredient-name value="${escapeHtml(item.name)}" placeholder="Ingrediente">
          </div>
          <div>
            <label>Custo (R$)</label>
            <input data-ingredient-cost="${index}" inputmode="decimal" value="${item.batchCost}">
          </div>
          <div>
            <label>Rende</label>
            <input data-ingredient-portions="${index}" inputmode="numeric" value="${item.portions}">
          </div>
          <div class="remove-cell">
            <label>&nbsp;</label>
            <button type="button" class="btn-icon remove-ingredient" data-index="${index}" aria-label="Remover">×</button>
          </div>
        </div>
      `
    )
    .join('');

  return `
    <form id="calc-form">
      <div class="section-card">
        <h2>1. Sua produção</h2>
        <p>Quantas marmitas você faz e vende no mês?</p>
        <div class="field-grid">
          <div class="field">
            <label for="marmitasPerDay">Marmitas por dia</label>
            <input id="marmitasPerDay" name="marmitasPerDay" inputmode="numeric" value="${currentInputs.marmitasPerDay}">
          </div>
          <div class="field">
            <label for="workDaysPerMonth">Dias trabalhados/mês</label>
            <input id="workDaysPerMonth" name="workDaysPerMonth" inputmode="numeric" value="${currentInputs.workDaysPerMonth}">
          </div>
        </div>
      </div>

      <div class="section-card">
        <h2>2. Custos da comida</h2>
        <p>Quanto você gasta e quantas marmitas rende cada preparo?</p>
        ${ingredientsHtml}
        <button type="button" class="btn-secondary" id="add-ingredient">+ Adicionar ingrediente</button>
      </div>

      <div class="section-card">
        <h2>3. Custos que quase todo mundo esquece</h2>
        <div class="field-grid">
          <div class="field">
            <label for="packagingPerUnit">Embalagem por marmita (R$)</label>
            <input id="packagingPerUnit" name="packagingPerUnit" inputmode="decimal" value="${currentInputs.packagingPerUnit}">
          </div>
          <div class="field">
            <label for="gasMonthly">Gás no mês (R$)</label>
            <input id="gasMonthly" name="gasMonthly" inputmode="decimal" value="${currentInputs.gasMonthly}">
          </div>
          <div class="field">
            <label for="spicesMonthly">Temperos no mês (R$)</label>
            <input id="spicesMonthly" name="spicesMonthly" inputmode="decimal" value="${currentInputs.spicesMonthly}">
          </div>
          <div class="field">
            <label for="deliveryPerUnit">Entrega por marmita (R$)</label>
            <input id="deliveryPerUnit" name="deliveryPerUnit" inputmode="decimal" value="${currentInputs.deliveryPerUnit}">
          </div>
          <div class="field">
            <label for="platformFeePercent">Taxa app/plataforma (%)</label>
            <input id="platformFeePercent" name="platformFeePercent" inputmode="decimal" value="${currentInputs.platformFeePercent}">
          </div>
          <div class="field">
            <label for="wastePercent">Desperdício (%)</label>
            <input id="wastePercent" name="wastePercent" inputmode="decimal" value="${currentInputs.wastePercent}">
          </div>
        </div>
      </div>

      <div class="section-card">
        <h2>4. Seu tempo vale dinheiro</h2>
        <div class="field-grid">
          <div class="field">
            <label for="hoursPerDay">Horas na cozinha/dia</label>
            <input id="hoursPerDay" name="hoursPerDay" inputmode="decimal" value="${currentInputs.hoursPerDay}">
          </div>
          <div class="field">
            <label for="hourlyRate">Quanto vale sua hora (R$)</label>
            <input id="hourlyRate" name="hourlyRate" inputmode="decimal" value="${currentInputs.hourlyRate}">
          </div>
        </div>
      </div>

      <div class="section-card">
        <h2>5. Preço e meta</h2>
        <div class="field-grid">
          <div class="field">
            <label for="sellingPrice">Preço que você cobra hoje (R$)</label>
            <input id="sellingPrice" name="sellingPrice" inputmode="decimal" value="${currentInputs.sellingPrice}">
          </div>
          <div class="field">
            <label for="targetMarginPercent">Margem ideal (%)</label>
            <input id="targetMarginPercent" name="targetMarginPercent" inputmode="decimal" value="${currentInputs.targetMarginPercent}">
          </div>
        </div>
        <div class="action-row">
          <button type="submit" class="btn btn-primary">Calcular agora</button>
          <button type="button" class="btn btn-secondary" id="save-scenario">Salvar cenário</button>
        </div>
      </div>
    </form>
  `;
}

function renderResults() {
  const r = currentResults;
  const statusText =
    r.status === 'prejuizo'
      ? 'Atenção: você está no prejuízo'
      : r.status === 'alerta'
        ? 'Lucro baixo — repense o preço'
        : 'Boa! Sua marmita está lucrando';

  const statusDetail =
    r.status === 'prejuizo'
      ? `Cada marmita sai ${money(Math.abs(r.profitPerUnit))} no negativo.`
      : r.status === 'alerta'
        ? `Margem de ${percent(r.margin)} — abaixo da meta de ${percent(currentInputs.targetMarginPercent)}.`
        : `Margem de ${percent(r.margin)} por marmita vendida.`;

  return `
    <div class="results-hero ${r.status}">
      <small>${statusText}</small>
      <h2>${money(r.profitPerUnit)}</h2>
      <p>Lucro por marmita · ${statusDetail}</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <span>Custo real</span>
        <strong>${money(r.realCostPerUnit)}</strong>
      </div>
      <div class="metric-card highlight">
        <span>Preço mínimo</span>
        <strong>${money(r.minPrice)}</strong>
      </div>
      <div class="metric-card highlight">
        <span>Preço ideal</span>
        <strong>${money(r.idealPrice)}</strong>
      </div>
      <div class="metric-card">
        <span>Margem atual</span>
        <strong>${percent(r.margin)}</strong>
      </div>
      <div class="metric-card green">
        <span>Lucro do dia</span>
        <strong>${money(r.dailyProfit)}</strong>
      </div>
      <div class="metric-card green">
        <span>Lucro do mês</span>
        <strong>${money(r.monthlyProfit)}</strong>
      </div>
    </div>

    <div class="section-card">
      <h2>Detalhamento do custo</h2>
      <ul class="breakdown-list">
        <li><span>Comida</span><strong>${money(r.breakdown.foodCost)}</strong></li>
        <li><span>Desperdício</span><strong>${money(r.breakdown.wasteCost)}</strong></li>
        <li><span>Embalagem</span><strong>${money(r.breakdown.packagingPerUnit)}</strong></li>
        <li><span>Gás (por unidade)</span><strong>${money(r.breakdown.gasPerUnit)}</strong></li>
        <li><span>Temperos (por unidade)</span><strong>${money(r.breakdown.spicesPerUnit)}</strong></li>
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
    return '<p class="empty-state">Nenhum cenário salvo ainda. Calcule e clique em "Salvar cenário".</p>';
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
      <h2>🎁 Cardápio Lucrativo de 30 Dias</h2>
      <p>Ideias de pratos para variar sem perder margem. Use junto com a calculadora.</p>
    </div>
    <div class="menu-list">
      ${CARDAPIO_30_DIAS.map(
        (item) => `
          <article class="menu-item">
            <strong>Dia ${item.dia}</strong>
            <span>${escapeHtml(item.prato)}</span>
            <em>💡 ${escapeHtml(item.dica)}</em>
          </article>
        `
      ).join('')}
    </div>
  `;
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
      <h2>Como usar</h2>
      <p>Preencha os custos reais, coloque seu preço atual e veja se está lucrando. Salve cenários para comparar cardápios e volumes.</p>
    </div>

    <div class="section-card">
      <h2>Precisa de ajuda?</h2>
      <p>Guarde seu e-mail e senha. Para recuperar acesso, use "Esqueci minha senha" na tela de login.</p>
    </div>
  `;
}

function bindEvents() {
  root.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeView = btn.dataset.view;
      render();
    });
  });

  const form = document.getElementById('calc-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      updateFromForm(form);
      activeView = 'results';
      render();
      showToast('Cálculo atualizado!');
    });

    form.addEventListener('input', () => {
      updateFromForm(form, { silent: true });
    });

    document.getElementById('add-ingredient')?.addEventListener('click', () => {
      currentInputs.ingredients.push({ name: '', batchCost: 0, portions: currentInputs.marmitasPerDay || 20 });
      render();
    });

    form.querySelectorAll('.remove-ingredient').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseNumber(btn.dataset.index);
        if (currentInputs.ingredients.length <= 1) {
          showToast('Deixe pelo menos 1 ingrediente.');
          return;
        }
        currentInputs.ingredients.splice(index, 1);
        render();
      });
    });

    document.getElementById('save-scenario')?.addEventListener('click', async () => {
      updateFromForm(form);
      const name = window.prompt('Nome do cenário:', `Cenário ${scenarios.length + 1}`);
      if (!name) return;

      await saveScenario(currentUser.uid, {
        name: name.trim(),
        inputs: cloneInputs(currentInputs),
        results: currentResults,
      });

      scenarios = await listScenarios(currentUser.uid);
      showToast('Cenário salvo!');
      activeView = 'results';
      render();
    });
  }

  root.querySelectorAll('[data-load]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = scenarios.find((s) => s.id === btn.dataset.load);
      if (!item?.inputs) return;
      currentInputs = cloneInputs(item.inputs);
      currentResults = calculate(currentInputs);
      saveDraft(currentUser.uid, currentInputs);
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

function updateFromForm(form, options = {}) {
  currentInputs = readInputsFromForm(form);
  currentResults = calculate(currentInputs);
  saveDraft(currentUser.uid, currentInputs);
  if (!options.silent) {
    currentResults = calculate(currentInputs);
  }
}
