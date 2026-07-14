import { ICONS } from './icons.js';
import { escapeHtml } from '../lib/format.js';
import { getCurrencySymbol } from '../lib/currency.js';

const PALETAS_TEMPLATES = [
  { id: 'simple', label: 'Semanal' },
  { id: 'colorido', label: 'Dulce de hoy' },
  { id: 'premium', label: 'Artesanal' },
];

const STORY_TEXTS = [
  '🍓 Paletas caseras disponibles hoy. Escríbeme para ver sabores y precios.',
  'Menú de la semana en mi estado anterior 👆',
  '¿Cuál te provoca? Pregunta por disponibilidad',
];

function rowCount(lineId) {
  return lineId === 'postres' ? 30 : 6;
}

function menuWaKey(uid, lineId) {
  return `kit_menu_wa_${lineId}_${uid}`;
}

function emptyRows(n) {
  return Array.from({ length: n }, () => ({ sabor: '', precio: '' }));
}

export function defaultMenuWaDraft(brand, recipes = [], lineId = 'paletas') {
  const count = rowCount(lineId);
  const emoji = brand?.emoji || '🍓';
  const title =
    lineId === 'postres'
      ? `${emoji} POSTRES EN VASO`
      : '🍓 Paletas Caseras de la Semana';
  return {
    version: 2,
    template: 'simple',
    simple: {
      title,
      nota:
        lineId === 'postres'
          ? 'Combos y encargos disponibles.\nEscríbeme para apartar 💬'
          : '📱 Pedidos por WhatsApp, Disponible hasta agotar stock',
      rows: emptyRows(count).map((row, i) => ({
        ...row,
        sabor: recipes[i]?.nombre || '',
      })),
    },
    colorido: {
      frutales: '',
      cremosas: '',
      rellenas: '',
      comboPrecio: '',
    },
    premium: {
      especiales: '',
      familiar: '',
      anticipacion: '24 horas mínimo',
    },
  };
}

function migrateDraft(parsed, brand, recipes, lineId) {
  if (parsed?.version === 2 && parsed.simple?.rows?.length) {
    const count = rowCount(lineId);
    while (parsed.simple.rows.length < count) parsed.simple.rows.push({ sabor: '', precio: '' });
    parsed.simple.rows = parsed.simple.rows.slice(0, count);
    parsed.template = parsed.template || 'simple';
    parsed.colorido = { frutales: '', cremosas: '', rellenas: '', comboPrecio: '', ...parsed.colorido };
    parsed.premium = { especiales: '', familiar: '', anticipacion: '24 horas mínimo', ...parsed.premium };
    return parsed;
  }
  if (parsed?.rows?.length) {
    return {
      version: 2,
      template: 'simple',
      simple: {
        title: parsed.title || defaultMenuWaDraft(brand, recipes, lineId).simple.title,
        nota: parsed.nota || defaultMenuWaDraft(brand, recipes, lineId).simple.nota,
        rows: parsed.rows,
      },
      colorido: defaultMenuWaDraft(brand, recipes, lineId).colorido,
      premium: defaultMenuWaDraft(brand, recipes, lineId).premium,
    };
  }
  return defaultMenuWaDraft(brand, recipes, lineId);
}

export function loadMenuWaDraft(uid, lineId, brand, recipes) {
  try {
    const raw = localStorage.getItem(menuWaKey(uid, lineId));
    if (!raw) return defaultMenuWaDraft(brand, recipes, lineId);
    return migrateDraft(JSON.parse(raw), brand, recipes, lineId);
  } catch {
    return defaultMenuWaDraft(brand, recipes, lineId);
  }
}

export function saveMenuWaDraft(uid, lineId, draft) {
  localStorage.setItem(menuWaKey(uid, lineId), JSON.stringify(draft));
}

export function buildMenuWaText(draft, lineId = 'paletas') {
  const sym = getCurrencySymbol();
  const tpl = draft.template || 'simple';

  if (tpl === 'colorido') {
    const c = draft.colorido || {};
    return [
      '🌈 *Menú Dulce de Hoy*',
      '',
      `🍓 Frutales: ${c.frutales || '...'}`,
      `🍦 Cremosas: ${c.cremosas || '...'}`,
      `🍫 Rellenas: ${c.rellenas || '...'}`,
      `🎁 Combo: 3 paletas por ${sym}${c.comboPrecio || '...'}`,
      '',
      '📱 Escríbeme para apartar las tuyas',
    ].join('\n');
  }

  if (tpl === 'premium') {
    const p = draft.premium || {};
    return [
      '✨ *Paletas Artesanales*',
      '',
      `⭐ Especiales: ${p.especiales || '...'}`,
      `👨‍👩‍👧 Combo familiar (6 u.): ${sym}${p.familiar || '...'}`,
      `⏰ Anticipación: ${p.anticipacion || '24 horas mínimo'}`,
      '',
      '📱 Escríbeme para reservar',
    ].join('\n');
  }

  const s = draft.simple || {};
  const lines = [s.title?.trim() || 'Mi menú', ''];
  (s.rows || []).forEach(({ sabor, precio }) => {
    const name = String(sabor || '').trim();
    if (!name) return;
    const price = String(precio || '').trim();
    lines.push(price ? `• ${name}, ${sym}${price}` : `• ${name}`);
  });
  const nota = String(s.nota || '').trim();
  if (nota) lines.push('', nota);
  return lines.join('\n');
}

export function menuWaExportHref(lineId) {
  if (lineId === 'postres') return '/postres/produto/Menu_Editable_Postres.html';
  return '/paletas-de-whatsapp/produto/Menu_Editable_Paletas.html';
}

function renderSimpleFields(draft, lineId) {
  const s = draft.simple || {};
  const rowsHtml = (s.rows || [])
    .map(
      (row, i) => `
      <div class="menu-wa-row">
        <input type="text" class="menu-wa-sabor" data-menu-wa-section="simple" data-menu-wa-row="${i}" data-menu-wa-field="sabor" value="${escapeHtml(row.sabor)}" placeholder="Sabor o producto" autocomplete="off">
        <input type="text" class="menu-wa-precio" data-menu-wa-section="simple" data-menu-wa-row="${i}" data-menu-wa-field="precio" value="${escapeHtml(row.precio)}" placeholder="0.00" inputmode="decimal" autocomplete="off">
      </div>
    `
    )
    .join('');

  const fillLabel =
    lineId === 'postres' ? 'Rellenar con las 30 recetas del kit' : 'Rellenar con recetas del kit';

  return `
    <div class="menu-wa-panel ${draft.template === 'simple' ? '' : 'hidden'}" data-menu-wa-panel="simple">
      <div class="field">
        <label for="menu-wa-title">Título del menú</label>
        <input id="menu-wa-title" type="text" data-menu-wa-section="simple" data-menu-wa-field="title" value="${escapeHtml(s.title || '')}" autocomplete="off">
      </div>
      <div class="menu-wa-rows-label">Sabores y precios</div>
      <div class="menu-wa-rows">${rowsHtml}</div>
      <button type="button" class="btn btn-ghost btn-sm" id="menu-wa-fill-recipes">${fillLabel}</button>
      <div class="field">
        <label for="menu-wa-nota">Nota al pie</label>
        <textarea id="menu-wa-nota" rows="2" data-menu-wa-section="simple" data-menu-wa-field="nota">${escapeHtml(s.nota || '')}</textarea>
      </div>
    </div>
  `;
}

function renderColoridoFields(draft) {
  const c = draft.colorido || {};
  return `
    <div class="menu-wa-panel ${draft.template === 'colorido' ? '' : 'hidden'}" data-menu-wa-panel="colorido">
      <div class="field">
        <label for="menu-wa-frutales">Frutales</label>
        <input id="menu-wa-frutales" type="text" data-menu-wa-section="colorido" data-menu-wa-field="frutales" value="${escapeHtml(c.frutales)}" placeholder="ej: mango, sandía" autocomplete="off">
      </div>
      <div class="field">
        <label for="menu-wa-cremosas">Cremosas</label>
        <input id="menu-wa-cremosas" type="text" data-menu-wa-section="colorido" data-menu-wa-field="cremosas" value="${escapeHtml(c.cremosas)}" placeholder="ej: vainilla, chocolate" autocomplete="off">
      </div>
      <div class="field">
        <label for="menu-wa-rellenas">Rellenas</label>
        <input id="menu-wa-rellenas" type="text" data-menu-wa-section="colorido" data-menu-wa-field="rellenas" value="${escapeHtml(c.rellenas)}" placeholder="ej: dulce de leche" autocomplete="off">
      </div>
      <div class="field">
        <label for="menu-wa-combo">Combo promo: 3 paletas por</label>
        <input id="menu-wa-combo" type="text" data-menu-wa-section="colorido" data-menu-wa-field="comboPrecio" value="${escapeHtml(c.comboPrecio)}" placeholder="0.00" inputmode="decimal" autocomplete="off">
      </div>
    </div>
  `;
}

function renderPremiumFields(draft) {
  const p = draft.premium || {};
  return `
    <div class="menu-wa-panel ${draft.template === 'premium' ? '' : 'hidden'}" data-menu-wa-panel="premium">
      <div class="field">
        <label for="menu-wa-especiales">Especiales de la semana</label>
        <textarea id="menu-wa-especiales" rows="3" data-menu-wa-section="premium" data-menu-wa-field="especiales" placeholder="Tus sabores premium...">${escapeHtml(p.especiales)}</textarea>
      </div>
      <div class="field">
        <label for="menu-wa-familiar">Combo familiar (6 u.)</label>
        <input id="menu-wa-familiar" type="text" data-menu-wa-section="premium" data-menu-wa-field="familiar" value="${escapeHtml(p.familiar)}" placeholder="0.00" inputmode="decimal" autocomplete="off">
      </div>
      <div class="field">
        <label for="menu-wa-anticipacion">Anticipación</label>
        <input id="menu-wa-anticipacion" type="text" data-menu-wa-section="premium" data-menu-wa-field="anticipacion" value="${escapeHtml(p.anticipacion)}" autocomplete="off">
      </div>
    </div>
  `;
}

export function renderMenuWhatsAppView({ draft, exportHref, lineId = 'paletas' }) {
  const pdfBtn = exportHref
    ? `<a class="lista-pdf-btn" href="${exportHref}" target="_blank" rel="noopener" title="Ver HTML / PDF" aria-label="Ver HTML / PDF">${ICONS.download}</a>`
    : '';

  const templateNav =
    lineId === 'paletas'
      ? `
      <div class="menu-wa-templates" role="tablist" aria-label="Modelos de menú">
        ${PALETAS_TEMPLATES.map(
          (t) => `
          <button type="button" class="menu-wa-template-btn ${draft.template === t.id ? 'active' : ''}" data-menu-wa-template="${t.id}" role="tab" aria-selected="${draft.template === t.id}">
            ${escapeHtml(t.label)}
          </button>
        `
        ).join('')}
      </div>
    `
      : '';

  const storyBlock =
    lineId === 'paletas'
      ? `
      <div class="menu-wa-story section-card">
        <h3>Textos para estado / story</h3>
        <ul class="menu-wa-story-list">
          ${STORY_TEXTS.map(
            (t, i) => `
            <li>
              <p>${escapeHtml(t)}</p>
              <button type="button" class="btn btn-sm btn-secondary menu-wa-story-copy" data-story-index="${i}">${ICONS.copy}<span>Copiar</span></button>
            </li>
          `
          ).join('')}
        </ul>
      </div>
    `
      : '';

  return `
    <div class="menu-wa-page">
      <div class="section-card">
        <div class="lista-head">
          <h2>Menú para WhatsApp</h2>
          ${pdfBtn}
        </div>
        <p class="section-text">Elige un modelo, completa los campos y copia el texto para tu estado o chat.</p>
        ${templateNav}
        ${renderSimpleFields(draft, lineId)}
        ${lineId === 'paletas' ? renderColoridoFields(draft) : ''}
        ${lineId === 'paletas' ? renderPremiumFields(draft) : ''}
        <button type="button" class="btn btn-primary btn-block" id="menu-wa-copy">${ICONS.copy}<span>Copiar para WhatsApp</span></button>
        <div class="menu-wa-preview hidden" id="menu-wa-preview" aria-live="polite"></div>
      </div>
      ${storyBlock}
    </div>
  `;
}

export function bindMenuWhatsAppEvents({
  root,
  uid,
  lineId,
  recipes,
  showToast,
  onChange,
  render,
}) {
  const readDraftFromDom = () => {
    const draft = {
      version: 2,
      template: root.querySelector('.menu-wa-template-btn.active')?.dataset.menuWaTemplate || 'simple',
      simple: {
        title: root.querySelector('[data-menu-wa-section="simple"][data-menu-wa-field="title"]')?.value ?? '',
        nota: root.querySelector('[data-menu-wa-section="simple"][data-menu-wa-field="nota"]')?.value ?? '',
        rows: Array.from({ length: rowCount(lineId) }, (_, i) => ({
          sabor:
            root.querySelector(
              `[data-menu-wa-section="simple"][data-menu-wa-row="${i}"][data-menu-wa-field="sabor"]`
            )?.value ?? '',
          precio:
            root.querySelector(
              `[data-menu-wa-section="simple"][data-menu-wa-row="${i}"][data-menu-wa-field="precio"]`
            )?.value ?? '',
        })),
      },
      colorido: {
        frutales: root.querySelector('[data-menu-wa-field="frutales"]')?.value ?? '',
        cremosas: root.querySelector('[data-menu-wa-field="cremosas"]')?.value ?? '',
        rellenas: root.querySelector('[data-menu-wa-field="rellenas"]')?.value ?? '',
        comboPrecio: root.querySelector('[data-menu-wa-field="comboPrecio"]')?.value ?? '',
      },
      premium: {
        especiales: root.querySelector('[data-menu-wa-field="especiales"]')?.value ?? '',
        familiar: root.querySelector('[data-menu-wa-field="familiar"]')?.value ?? '',
        anticipacion: root.querySelector('[data-menu-wa-field="anticipacion"]')?.value ?? '24 horas mínimo',
      },
    };
    return draft;
  };

  const persist = () => {
    const draft = readDraftFromDom();
    onChange(draft);
    saveMenuWaDraft(uid, lineId, draft);
  };

  root.querySelectorAll('[data-menu-wa-field]').forEach((el) => {
    el.addEventListener('input', persist);
  });

  root.querySelectorAll('[data-menu-wa-template]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const draft = readDraftFromDom();
      draft.template = btn.dataset.menuWaTemplate;
      saveMenuWaDraft(uid, lineId, draft);
      onChange(draft);
      render();
    });
  });

  root.querySelector('#menu-wa-fill-recipes')?.addEventListener('click', () => {
    const draft = readDraftFromDom();
    const count = rowCount(lineId);
    recipes.slice(0, count).forEach((r, i) => {
      if (r?.nombre) draft.simple.rows[i].sabor = r.nombre;
    });
    saveMenuWaDraft(uid, lineId, draft);
    onChange(draft);
    showToast(lineId === 'postres' ? '30 recetas cargadas en el menú.' : 'Recetas cargadas en el menú.');
    render();
  });

  root.querySelector('#menu-wa-copy')?.addEventListener('click', async () => {
    persist();
    const draft = readDraftFromDom();
    const text = buildMenuWaText(draft, lineId);
    const preview = root.querySelector('#menu-wa-preview');
    try {
      await navigator.clipboard.writeText(text);
      showToast('¡Menú copiado! Pégalo en WhatsApp.');
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

  root.querySelectorAll('.menu-wa-story-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = STORY_TEXTS[Number(btn.dataset.storyIndex)] || '';
      try {
        await navigator.clipboard.writeText(text);
        showToast('Texto copiado.');
      } catch {
        showToast('No se pudo copiar.');
      }
    });
  });
}
