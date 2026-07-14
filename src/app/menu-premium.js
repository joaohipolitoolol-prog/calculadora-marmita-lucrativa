import { ICONS } from './icons.js';
import { escapeHtml } from '../lib/format.js';
import { getCurrencySymbol } from '../lib/currency.js';

const SABOR_ROWS = 5;
const COMBO_ROWS = 2;

function menuPremiumKey(uid, lineId) {
  return `kit_menu_premium_${lineId}_${uid}`;
}

export function defaultMenuPremiumDraft(brand, recipes = [], combos = []) {
  const emoji = brand?.emoji || '✨';
  return {
    negocio: brand?.short ? `${brand.short}` : 'Mi negocio',
    sabores: Array.from({ length: SABOR_ROWS }, (_, i) => ({
      sabor: recipes[i]?.nombre || '',
      precio: '',
    })),
    combos: Array.from({ length: COMBO_ROWS }, (_, i) => ({
      sabor: combos[i]?.nombre || '',
      precio: '',
    })),
    nota: 'Pedidos con 24h. Entrega en tu zona.',
    titleEmoji: emoji,
  };
}

export function loadMenuPremiumDraft(uid, lineId, brand, recipes, combos) {
  try {
    const raw = localStorage.getItem(menuPremiumKey(uid, lineId));
    if (!raw) return defaultMenuPremiumDraft(brand, recipes, combos);
    const parsed = JSON.parse(raw);
    const base = defaultMenuPremiumDraft(brand, recipes, combos);
    return {
      ...base,
      ...parsed,
      sabores: (parsed.sabores || base.sabores).slice(0, SABOR_ROWS),
      combos: (parsed.combos || base.combos).slice(0, COMBO_ROWS),
    };
  } catch {
    return defaultMenuPremiumDraft(brand, recipes, combos);
  }
}

export function saveMenuPremiumDraft(uid, lineId, draft) {
  localStorage.setItem(menuPremiumKey(uid, lineId), JSON.stringify(draft));
}

export function buildMenuPremiumText(draft, lineId = 'paletas') {
  const sym = getCurrencySymbol();
  const negocio = String(draft.negocio || 'Mi negocio').trim();
  const emoji = lineId === 'postres' ? '🍨' : '🍓';
  const lines = [`${emoji} *${negocio}*, Menú Premium`, '', '*Sabores especiales*'];
  (draft.sabores || []).forEach(({ sabor, precio }) => {
    const name = String(sabor || '').trim();
    if (!name) return;
    const price = String(precio || '').trim();
    lines.push(price ? `• ${name}, ${sym}${price}` : `• ${name}`);
  });
  lines.push('', '*Combos*');
  (draft.combos || []).forEach(({ sabor, precio }) => {
    const name = String(sabor || '').trim();
    if (!name) return;
    const price = String(precio || '').trim();
    lines.push(price ? `• ${name}, ${sym}${price}` : `• ${name}`);
  });
  const nota = String(draft.nota || '').trim();
  if (nota) lines.push('', `_${nota}_`);
  return lines.join('\n');
}

export function menuPremiumExportHref(lineId) {
  if (lineId === 'postres') return '/postres-premium/produto/Menu_Premium_Postres.html';
  return '/paletas-premium/produto/Menu_Premium_Editable.html';
}

function renderRows(rows, section, count) {
  return Array.from({ length: count }, (_, i) => {
    const row = rows[i] || { sabor: '', precio: '' };
    return `
      <div class="menu-wa-row">
        <input type="text" class="menu-wa-sabor" data-menu-premium-section="${section}" data-menu-premium-row="${i}" data-menu-premium-field="sabor" value="${escapeHtml(row.sabor)}" placeholder="${section === 'combos' ? 'Nombre del combo' : 'Sabor premium'}" autocomplete="off">
        <input type="text" class="menu-wa-precio" data-menu-premium-section="${section}" data-menu-premium-row="${i}" data-menu-premium-field="precio" value="${escapeHtml(row.precio)}" placeholder="0.00" inputmode="decimal" autocomplete="off">
      </div>
    `;
  }).join('');
}

export function renderMenuPremiumView({ draft, exportHref }) {
  const pdfBtn = exportHref
    ? `<a class="lista-pdf-btn" href="${exportHref}" target="_blank" rel="noopener" title="Ver HTML" aria-label="Ver HTML">${ICONS.download}</a>`
    : '';

  return `
    <div class="menu-wa-page menu-premium-page">
      <div class="section-card">
        <div class="lista-head">
          <h2>Menú premium</h2>
          ${pdfBtn}
        </div>
        <p class="section-text">Sabores especiales y combos para posicionar tu línea premium en WhatsApp.</p>
        <div class="field">
          <label for="menu-premium-negocio">Nombre de tu negocio</label>
          <input id="menu-premium-negocio" type="text" data-menu-premium-field="negocio" value="${escapeHtml(draft.negocio)}" placeholder="Ej: Paletas de María" autocomplete="off">
        </div>
        <div class="menu-wa-rows-label">Sabores premium</div>
        <div class="menu-wa-rows">${renderRows(draft.sabores, 'sabores', SABOR_ROWS)}</div>
        <button type="button" class="btn btn-ghost btn-sm" id="menu-premium-fill-recipes">Rellenar con recetas premium</button>
        <div class="menu-wa-rows-label">Combos</div>
        <div class="menu-wa-rows">${renderRows(draft.combos, 'combos', COMBO_ROWS)}</div>
        <button type="button" class="btn btn-ghost btn-sm" id="menu-premium-fill-combos">Rellenar con combos del kit</button>
        <div class="field">
          <label for="menu-premium-nota">Nota al pie</label>
          <input id="menu-premium-nota" type="text" data-menu-premium-field="nota" value="${escapeHtml(draft.nota)}" placeholder="Pedidos con 24h..." autocomplete="off">
        </div>
        <button type="button" class="btn btn-primary btn-block" id="menu-premium-copy">${ICONS.copy}<span>Copiar menú premium</span></button>
        <div class="menu-wa-preview hidden" id="menu-premium-preview" aria-live="polite"></div>
      </div>
    </div>
  `;
}

export function bindMenuPremiumEvents({
  root,
  uid,
  lineId,
  recipes,
  combos,
  showToast,
  onChange,
  render,
}) {
  const readDraft = () => {
    const negocio = root.querySelector('[data-menu-premium-field="negocio"]')?.value ?? '';
    const nota = root.querySelector('[data-menu-premium-field="nota"]')?.value ?? '';
    const readRows = (section, count) =>
      Array.from({ length: count }, (_, i) => ({
        sabor:
          root.querySelector(
            `[data-menu-premium-section="${section}"][data-menu-premium-row="${i}"][data-menu-premium-field="sabor"]`
          )?.value ?? '',
        precio:
          root.querySelector(
            `[data-menu-premium-section="${section}"][data-menu-premium-row="${i}"][data-menu-premium-field="precio"]`
          )?.value ?? '',
      }));
    return { negocio, nota, sabores: readRows('sabores', SABOR_ROWS), combos: readRows('combos', COMBO_ROWS) };
  };

  const persist = () => {
    const draft = readDraft();
    onChange(draft);
    saveMenuPremiumDraft(uid, lineId, draft);
  };

  root.querySelectorAll('[data-menu-premium-field]').forEach((el) => {
    el.addEventListener('input', persist);
  });

  root.querySelector('#menu-premium-fill-recipes')?.addEventListener('click', () => {
    const draft = readDraft();
    recipes.slice(0, SABOR_ROWS).forEach((r, i) => {
      if (r?.nombre) draft.sabores[i].sabor = r.nombre;
    });
    saveMenuPremiumDraft(uid, lineId, draft);
    onChange(draft);
    showToast('Recetas premium cargadas.');
    render();
  });

  root.querySelector('#menu-premium-fill-combos')?.addEventListener('click', () => {
    const draft = readDraft();
    combos.slice(0, COMBO_ROWS).forEach((c, i) => {
      if (c?.nombre) draft.combos[i].sabor = c.nombre;
    });
    saveMenuPremiumDraft(uid, lineId, draft);
    onChange(draft);
    showToast('Combos cargados.');
    render();
  });

  root.querySelector('#menu-premium-copy')?.addEventListener('click', async () => {
    persist();
    const text = buildMenuPremiumText(readDraft(), lineId);
    const preview = root.querySelector('#menu-premium-preview');
    try {
      await navigator.clipboard.writeText(text);
      showToast('¡Menú premium copiado!');
      if (preview) {
        preview.textContent = text;
        preview.classList.remove('hidden');
      }
    } catch {
      if (preview) {
        preview.textContent = text;
        preview.classList.remove('hidden');
      }
      showToast('Selecciona y copia el texto del recuadro.');
    }
  });
}
