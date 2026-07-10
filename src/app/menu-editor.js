import { ICONS } from './icons.js';
import { escapeHtml } from '../lib/format.js';
import { getCurrencySymbol } from '../lib/currency.js';
import {
  canUseMenusCloud,
  emptyItem,
  emptyMenuDraft,
  isValidSlug,
  loadMenuDraft,
  newCategoryId,
  newItemId,
  normalizeSlug,
  normalizeWhatsapp,
  publicMenuPreviewPath,
  publicMenuUrl,
  publishMenu,
  saveMenuDraft,
  unpublishMenu,
} from '../lib/menus.js';
import { uploadMenuImage } from '../lib/menu-images.js';

let draft = emptyMenuDraft();
let loadedUid = null;
let loadedLineId = 'paletas';
let busy = false;
let claimedSlug = '';
/** @type {'menu' | 'settings' | 'item' | 'categories' | null} */
let screen = 'menu';
/** @type {string | null} */
let editingItemId = null;
/** Draft of the item being edited in the sheet */
let itemForm = null;
/** Category filter on home — 'all' shows everything */
let filterCategoryId = 'all';

const ERROR_MESSAGES = {
  missing_business: 'Escribe el nombre de tu negocio.',
  invalid_slug: 'El link debe tener 3–32 caracteres (a-z, 0-9, guion).',
  invalid_whatsapp: 'WhatsApp inválido. Incluye código de país (ej. 52155…).',
  missing_items: 'Agrega al menos un producto con nombre.',
  slug_taken: 'Ese link ya está en uso. Prueba otro.',
  save_failed: 'No se pudo guardar. Intenta de nuevo.',
  publish_failed: 'No se pudo publicar. Intenta de nuevo.',
  invalid_image: 'Usa una imagen JPG o PNG.',
  image_too_large: 'Imagen muy pesada. Prueba otra más liviana.',
};

export async function ensureMenuDraftLoaded(uid, lineId = 'paletas') {
  if (!uid) {
    draft = emptyMenuDraft(lineId);
    loadedUid = null;
    loadedLineId = lineId;
    screen = 'menu';
    return draft;
  }
  if (loadedUid === uid && loadedLineId === lineId) return draft;
  draft = await loadMenuDraft(uid, lineId);
  loadedUid = uid;
  loadedLineId = lineId;
  claimedSlug = draft.slug || '';
  screen = 'menu';
  editingItemId = null;
  itemForm = null;
  filterCategoryId = 'all';
  return draft;
}

function menuLineId() {
  return loadedLineId || 'paletas';
}

export function getMenuDraft() {
  return draft;
}

function moneyLabel(price) {
  const p = String(price || '').trim();
  if (!p) return '';
  const sym = getCurrencySymbol();
  if (p.startsWith(sym) || p.startsWith('$')) return p;
  return `${sym}${p}`;
}

function categoryName(id) {
  return draft.categories.find((c) => c.id === id)?.name || '';
}

function openItemEditor(itemId) {
  if (itemId) {
    const existing = draft.items.find((i) => i.id === itemId);
    if (!existing) return;
    editingItemId = itemId;
    itemForm = { ...existing };
  } else {
    editingItemId = null;
    const cat = draft.categories[0]?.id || '';
    itemForm = emptyItem(cat);
  }
  screen = 'item';
}

function syncCategoryNamesFromDom(root) {
  root.querySelectorAll('.mw-cat-row').forEach((row) => {
    const id = row.dataset.catId;
    const name = row.querySelector('[data-cat-name]')?.value?.trim();
    const cat = draft.categories.find((c) => c.id === id);
    if (cat && name) cat.name = name.slice(0, 40);
  });
}

function closeItemEditor() {
  screen = 'menu';
  editingItemId = null;
  itemForm = null;
}

function readSettingsFromDom(root) {
  draft = {
    ...draft,
    businessName: String(root.querySelector('#mw-business')?.value || '').trim(),
    tagline: String(root.querySelector('#mw-tagline')?.value || '').trim(),
    whatsapp: normalizeWhatsapp(root.querySelector('#mw-whatsapp')?.value || ''),
    phone: normalizeWhatsapp(root.querySelector('#mw-phone')?.value || ''),
    slug: normalizeSlug(root.querySelector('#mw-slug')?.value || ''),
    note: String(root.querySelector('#mw-note')?.value || '').trim(),
  };
}

function readItemFormFromDom(root) {
  if (!itemForm) return;
  itemForm = {
    ...itemForm,
    name: String(root.querySelector('#mw-item-name')?.value || '').trim(),
    price: String(root.querySelector('#mw-item-price')?.value || '').trim(),
    description: String(root.querySelector('#mw-item-desc')?.value || '').trim(),
    categoryId: String(root.querySelector('#mw-item-cat')?.value || itemForm.categoryId || ''),
    available: Boolean(root.querySelector('#mw-item-available')?.checked),
  };
}

function suggestSlugFromBusiness(name) {
  return normalizeSlug(name).slice(0, 32);
}

/** Auto link from business name, or last digits of WhatsApp as fallback. */
function ensureAutoSlug() {
  if (draft.slug && isValidSlug(draft.slug)) return draft.slug;
  const fromName = suggestSlugFromBusiness(draft.businessName);
  if (fromName.length >= 3) {
    draft.slug = fromName;
    return draft.slug;
  }
  const digits = normalizeWhatsapp(draft.whatsapp);
  if (digits.length >= 8) {
    draft.slug = `menu-${digits.slice(-8)}`;
    return draft.slug;
  }
  return '';
}

function seedDemoProducts() {
  const cats = [
    { id: 'cat_frutales', name: 'Frutales' },
    { id: 'cat_cremosas', name: 'Cremosas' },
    { id: 'cat_especiales', name: 'Especiales' },
  ];
  draft.categories = cats;
  if (!draft.businessName) draft.businessName = 'Paletas de Sofía';
  if (!draft.tagline) draft.tagline = 'Artesanales · Pedidos por WhatsApp';
  if (!draft.note) {
    draft.note = 'Pedidos con 1 día de anticipación. Entrega en zona centro.';
  }
  draft.items = [
    { id: newItemId(), name: 'Fresa natural', price: '25', description: 'Con trozos de fresa fresca', categoryId: 'cat_frutales', image: '', available: true },
    { id: newItemId(), name: 'Mango chile', price: '28', description: 'Mango maduro con toque de chile', categoryId: 'cat_frutales', image: '', available: true },
    { id: newItemId(), name: 'Limón', price: '22', description: 'Ácida y refrescante', categoryId: 'cat_frutales', image: '', available: true },
    { id: newItemId(), name: 'Chocolate belga', price: '32', description: 'Cacao intenso, cremosa', categoryId: 'cat_cremosas', image: '', available: true },
    { id: newItemId(), name: 'Vainilla', price: '28', description: 'Clásica y suave', categoryId: 'cat_cremosas', image: '', available: true },
    { id: newItemId(), name: 'Coco', price: '30', description: 'Leche de coco natural', categoryId: 'cat_cremosas', image: '', available: false },
    { id: newItemId(), name: 'Oreo rellena', price: '38', description: 'Centro de galleta triturada', categoryId: 'cat_especiales', image: '', available: true },
    { id: newItemId(), name: 'Nutella', price: '40', description: 'Rellena de avellana', categoryId: 'cat_especiales', image: '', available: true },
    { id: newItemId(), name: 'Combo 6 mixtas', price: '150', description: 'Elige 6 sabores · ahorro vs unitario', categoryId: 'cat_especiales', image: '', available: true },
  ];
  filterCategoryId = 'all';
  ensureAutoSlug();
}

function renderThumb(src, alt = '') {
  if (src) {
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
  }
  return `<span class="mw-thumb-placeholder" aria-hidden="true">${ICONS.plus}</span>`;
}

function renderLocked() {
  return `
    <div class="mw-page">
      <div class="mw-locked section-card">
        <h2>Menú web</h2>
        <p class="section-text">Activa tu kit para armar un menú con fotos y link para tus clientes.</p>
      </div>
    </div>
  `;
}

function renderProductCard(item) {
  const unavailable = item.available === false;
  return `
    <article class="mw-product ${unavailable ? 'is-off' : ''}" data-edit-item="${escapeHtml(item.id)}" role="button" tabindex="0">
      <div class="mw-product-thumb">${renderThumb(item.image, item.name)}</div>
      <div class="mw-product-body">
        <div class="mw-product-top">
          <h3>${escapeHtml(item.name || 'Sin nombre')}</h3>
          ${unavailable ? '<span class="mw-badge-off">Agotado</span>' : ''}
        </div>
        ${item.description ? `<p class="mw-product-desc">${escapeHtml(item.description)}</p>` : ''}
        <div class="mw-product-foot">
          <strong class="mw-product-price">${escapeHtml(moneyLabel(item.price) || '—')}</strong>
          <span class="mw-product-cat">${escapeHtml(categoryName(item.categoryId))}</span>
        </div>
      </div>
      <span class="mw-product-chevron" aria-hidden="true">${ICONS.chevronRight}</span>
    </article>
  `;
}

function renderGroupedProducts() {
  const cats = draft.categories;
  const byCat = new Map(cats.map((c) => [c.id, []]));
  const orphan = [];
  for (const item of draft.items) {
    if (item.categoryId && byCat.has(item.categoryId)) {
      byCat.get(item.categoryId).push(item);
    } else {
      orphan.push(item);
    }
  }

  const sections = [];
  for (const cat of cats) {
    const items = byCat.get(cat.id) || [];
    if (!items.length) continue;
    sections.push(`
      <section class="mw-group">
        <h3 class="mw-group-title">${escapeHtml(cat.name)}</h3>
        <div class="mw-product-list">${items.map(renderProductCard).join('')}</div>
      </section>
    `);
  }
  if (orphan.length) {
    sections.push(`
      <section class="mw-group">
        <h3 class="mw-group-title">Sin categoría</h3>
        <div class="mw-product-list">${orphan.map(renderProductCard).join('')}</div>
      </section>
    `);
  }
  return sections.join('');
}

function renderMenuScreen({ cloudAvailable }) {
  const d = draft;
  const empty = !d.items.length;
  const name = d.businessName || 'Tu negocio';
  const catCount = d.categories.length;
  ensureAutoSlug();

  const listHtml = empty
    ? `
      <div class="mw-empty">
        <div class="mw-empty-icon">${ICONS.list}</div>
        <h3>Sin productos aún</h3>
        <p>Crea categorías y agrega sabores con foto y precio.</p>
        <button type="button" class="btn btn-primary" data-add-item>${ICONS.plus}<span>Agregar producto</span></button>
        <button type="button" class="btn btn-ghost" data-open-categories>${ICONS.list}<span>Categorías</span></button>
      </div>
    `
    : renderGroupedProducts();

  const openMenuBtn = `<button type="button" class="mw-profile-tool" data-open-menu-link title="Abrir menú" aria-label="Abrir menú">${ICONS.externalLink}</button>`;

  return `
    <div class="mw-page">
      <header class="mw-profile">
        <div class="mw-profile-cover ${d.coverImage ? 'has-img' : ''}">
          ${d.coverImage ? `<img src="${escapeHtml(d.coverImage)}" alt="" decoding="async">` : ''}
          <div class="mw-profile-tools">
            ${openMenuBtn}
            <button type="button" class="mw-profile-tool" data-open-settings title="Negocio y WhatsApp" aria-label="Ajustes">${ICONS.settings}</button>
          </div>
        </div>
        <div class="mw-profile-row">
          <div class="mw-profile-avatar">${renderThumb(d.logoImage, name)}</div>
          <div class="mw-profile-meta">
            <div class="mw-profile-name">
              <strong>${escapeHtml(name)}</strong>
            </div>
            ${d.tagline ? `<span class="mw-profile-bio">${escapeHtml(d.tagline)}</span>` : ''}
          </div>
        </div>
      </header>

      ${
        !cloudAvailable
          ? `<p class="mw-banner-warn">Modo local: el link público necesita Firebase.</p>`
          : ''
      }

      ${
        empty
          ? `<button type="button" class="mw-demo-link" data-seed-demo>Cargar menú demo</button>`
          : ''
      }

      <div class="mw-actions-row">
        <button type="button" class="btn btn-secondary btn-sm" data-open-categories>
          ${ICONS.list}<span>Categorías${catCount ? ` (${catCount})` : ''}</span>
        </button>
        <button type="button" class="btn btn-primary btn-sm" data-add-item>
          ${ICONS.plus}<span>Producto</span>
        </button>
      </div>

      ${listHtml}
    </div>
  `;
}

function renderCategoriesScreen() {
  const rows = draft.categories
    .map(
      (c) => {
        const count = draft.items.filter((i) => i.categoryId === c.id).length;
        return `
      <div class="mw-cat-row" data-cat-id="${escapeHtml(c.id)}">
        <input type="text" data-cat-name value="${escapeHtml(c.name)}" maxlength="40" placeholder="Nombre" aria-label="Categoría">
        <span class="mw-cat-count">${count}</span>
        <button type="button" class="mw-icon-btn danger" data-remove-cat title="Eliminar" aria-label="Eliminar categoría">${ICONS.trash}</button>
      </div>
    `;
      }
    )
    .join('');

  return `
    <div class="mw-page mw-categories">
      <header class="mw-sheet-head">
        <button type="button" class="mw-icon-btn" data-back-menu aria-label="Volver">${ICONS.chevronLeft}</button>
        <h2>Categorías</h2>
        <button type="button" class="mw-text-btn strong" data-save-categories>Listo</button>
      </header>

      <p class="mw-cat-hint">Organiza tu menú como quieras: Frutales, Combos, Postres…</p>

      <section class="mw-panel">
        <div class="mw-cat-list">${rows || '<p class="mw-cat-empty">Aún no hay categorías.</p>'}</div>
        <button type="button" class="btn btn-secondary btn-block" data-add-cat>${ICONS.plus}<span>Nueva categoría</span></button>
      </section>
    </div>
  `;
}

function renderSettingsScreen() {
  const d = draft;
  ensureAutoSlug();
  const link = d.slug && isValidSlug(d.slug) ? publicMenuUrl(d.slug) : '';

  return `
    <div class="mw-page mw-settings">
      <header class="mw-sheet-head">
        <button type="button" class="mw-icon-btn" data-back-menu aria-label="Volver">${ICONS.chevronLeft}</button>
        <h2>Negocio</h2>
        <button type="button" class="mw-text-btn strong" data-save-settings>Listo</button>
      </header>

      <section class="mw-panel">
        <h3>Perfil</h3>
        <div class="mw-media-row">
          <label class="mw-media-pick">
            <span class="mw-media-label">Portada</span>
            <span class="mw-media-box wide">${renderThumb(d.coverImage, 'Portada')}</span>
            <input type="file" accept="image/*" data-pick-cover hidden>
          </label>
          <label class="mw-media-pick">
            <span class="mw-media-label">Foto</span>
            <span class="mw-media-box round">${renderThumb(d.logoImage, 'Perfil')}</span>
            <input type="file" accept="image/*" data-pick-logo hidden>
          </label>
        </div>
        ${d.coverImage || d.logoImage ? `
          <div class="mw-media-clear">
            ${d.coverImage ? `<button type="button" class="mw-text-btn" data-clear-cover>Quitar portada</button>` : ''}
            ${d.logoImage ? `<button type="button" class="mw-text-btn" data-clear-logo>Quitar foto</button>` : ''}
          </div>
        ` : ''}

        <div class="field">
          <label for="mw-business">Nombre del negocio</label>
          <input id="mw-business" type="text" value="${escapeHtml(d.businessName)}" placeholder="Ej: Paletas de María" maxlength="60" autocomplete="organization">
        </div>
        <div class="field">
          <label for="mw-tagline">Frase corta</label>
          <input id="mw-tagline" type="text" value="${escapeHtml(d.tagline)}" placeholder="Paletas artesanales a domicilio" maxlength="100">
        </div>
      </section>

      <section class="mw-panel">
        <h3>WhatsApp y link</h3>
        <div class="field">
          <label for="mw-whatsapp">WhatsApp (con código de país)</label>
          <input id="mw-whatsapp" type="tel" value="${escapeHtml(d.whatsapp)}" placeholder="5215512345678" inputmode="tel" autocomplete="tel">
          <span class="field-hint">Con esto generamos tu link y el botón de pedir.</span>
        </div>
        <div class="field">
          <label for="mw-phone">Teléfono (opcional)</label>
          <input id="mw-phone" type="tel" value="${escapeHtml(d.phone || '')}" placeholder="5512345678" inputmode="tel" autocomplete="tel">
        </div>
        <div class="field">
          <label for="mw-slug">Tu link</label>
          <div class="mw-slug-row">
            <span>/m/</span>
            <input id="mw-slug" type="text" value="${escapeHtml(d.slug)}" placeholder="maria-paletas" maxlength="32" spellcheck="false" autocomplete="off">
          </div>
          <span class="field-hint">Se crea solo con el nombre o WhatsApp. Puedes editarlo.</span>
        </div>
        ${
          link
            ? `<div class="mw-link-box">
                <code class="mw-link-url">${escapeHtml(link)}</code>
                <div class="mw-link-actions">
                  <button type="button" class="btn btn-secondary btn-sm" data-copy-link>${ICONS.copy}<span>Copiar</span></button>
                  <button type="button" class="btn btn-ghost btn-sm" data-open-menu-link>${ICONS.externalLink}<span>Ver menú</span></button>
                </div>
              </div>`
            : ''
        }
        <div class="field">
          <label for="mw-note">Nota al pie</label>
          <textarea id="mw-note" rows="2" maxlength="240" placeholder="Pedidos con anticipación · Entrega en zona centro">${escapeHtml(d.note)}</textarea>
        </div>
        <button type="button" class="btn btn-primary btn-block" data-publish ${busy ? 'disabled' : ''}>
          ${ICONS.check}<span>${d.published ? 'Actualizar menú público' : 'Publicar menú'}</span>
        </button>
        ${
          d.published
            ? `<button type="button" class="btn btn-ghost btn-block btn-danger-text" data-unpublish ${busy ? 'disabled' : ''}>Despublicar</button>`
            : ''
        }
      </section>

      ${
        !d.items.length
          ? `<button type="button" class="btn btn-ghost btn-block" data-seed-demo>Cargar menú demo</button>`
          : ''
      }
    </div>
  `;
}

function renderItemScreen() {
  const item = itemForm || emptyItem();
  const isNew = !editingItemId;
  const catOptions = draft.categories
    .map(
      (c) =>
        `<option value="${escapeHtml(c.id)}" ${c.id === item.categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
    )
    .join('');
  const symbol = escapeHtml(getCurrencySymbol());

  return `
    <div class="mw-page mw-item-edit">
      <header class="mw-sheet-head">
        <button type="button" class="mw-icon-btn" data-back-menu aria-label="Volver">${ICONS.chevronLeft}</button>
        <h2>${isNew ? 'Nuevo producto' : 'Editar producto'}</h2>
        <button type="button" class="mw-text-btn strong" data-save-item>Guardar</button>
      </header>

      <section class="mw-panel">
        <label class="mw-item-photo">
          <span class="mw-item-photo-box">${renderThumb(item.image, item.name || 'Foto')}</span>
          <span class="mw-item-photo-cta">${item.image ? 'Cambiar foto' : 'Agregar foto'}</span>
          <input type="file" accept="image/*" data-pick-item-image hidden>
        </label>
        ${item.image ? `<button type="button" class="mw-text-btn center" data-clear-item-image>Quitar foto</button>` : ''}

        <div class="field">
          <label for="mw-item-name">Nombre</label>
          <input id="mw-item-name" type="text" value="${escapeHtml(item.name)}" placeholder="Fresa con crema" maxlength="80" required>
        </div>
        <div class="field">
          <label for="mw-item-price">Precio</label>
          <div class="mw-price-row">
            <span>${symbol}</span>
            <input id="mw-item-price" type="text" inputmode="decimal" value="${escapeHtml(item.price)}" placeholder="25" maxlength="24">
          </div>
        </div>
        <div class="field">
          <label for="mw-item-desc">Descripción</label>
          <textarea id="mw-item-desc" rows="3" maxlength="180" placeholder="Con trozos de fresa natural">${escapeHtml(item.description)}</textarea>
        </div>
        <div class="field">
          <label for="mw-item-cat">Categoría</label>
          <select id="mw-item-cat">${catOptions}</select>
        </div>
        <label class="mw-switch">
          <input type="checkbox" id="mw-item-available" ${item.available !== false ? 'checked' : ''}>
          <span>Disponible para pedir</span>
        </label>
      </section>

      ${
        !isNew
          ? `<button type="button" class="btn btn-ghost btn-block btn-danger-text" data-delete-item>${ICONS.trash}<span>Eliminar producto</span></button>`
          : ''
      }
    </div>
  `;
}

export function renderMenuWebView({ locked, cloudAvailable }) {
  if (locked) return renderLocked();
  if (screen === 'settings') return renderSettingsScreen();
  if (screen === 'categories') return renderCategoriesScreen();
  if (screen === 'item') return renderItemScreen();
  return renderMenuScreen({ cloudAvailable });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

async function pickImage(input, { kind, itemId, maxSide, uid, onDone, showToast, render }) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    showToast('Subiendo foto…');
    const url = await uploadMenuImage(uid, file, { kind, itemId, maxSide });
    onDone(url);
    if (kind !== 'item') {
      const saved = await saveMenuDraft(uid, draft, menuLineId());
      draft = saved.draft;
    }
    showToast('Foto lista');
    render();
  } catch (err) {
    const key = err?.message;
    showToast(ERROR_MESSAGES[key] || 'No se pudo usar esa imagen');
  }
}

async function doPublish(uid, showToast, render, { unpublish = false } = {}) {
  if (busy) return;
  ensureAutoSlug();
  busy = true;
  render();
  try {
    if (unpublish) {
      const result = await unpublishMenu(uid, { ...draft, published: false }, menuLineId());
      draft = result.draft;
      loadedUid = uid;
      showToast(canUseMenusCloud() ? 'Menú despublicado' : 'Guardado en este dispositivo');
      return;
    }

    const result = await publishMenu(uid, { ...draft, published: true }, { previousSlug: claimedSlug, lineId: menuLineId() });
    draft = result.draft;
    loadedUid = uid;
    if (!result.ok) {
      showToast(ERROR_MESSAGES[result.error] || 'Error al publicar');
      return;
    }
    claimedSlug = draft.slug || claimedSlug;
    if (result.warning === 'demo') {
      showToast('Guardado local. Link público requiere Firebase.');
      return;
    }
    showToast('Menú publicado');
  } finally {
    busy = false;
    render();
  }
}

export function bindMenuWebEvents({ uid, root, showToast, render, locked }) {
  if (locked || !root) return;
  const page = root.querySelector('.mw-page');
  if (!page) return;

  const rerender = () => render();

  root.querySelectorAll('[data-open-settings]').forEach((btn) => {
    btn.addEventListener('click', () => {
      screen = 'settings';
      rerender();
    });
  });

  root.querySelectorAll('[data-open-menu-link]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ensureAutoSlug();
      try {
        sessionStorage.setItem('mw-menu-preview', JSON.stringify(draft));
      } catch {
        /* ignore quota */
      }
      if (draft.published && draft.slug && isValidSlug(draft.slug)) {
        window.open(publicMenuPreviewPath(draft.slug), '_blank', 'noopener,noreferrer');
        return;
      }
      window.open('/m.html?preview=1', '_blank', 'noopener,noreferrer');
    });
  });

  root.querySelectorAll('[data-open-categories]').forEach((btn) => {
    btn.addEventListener('click', () => {
      screen = 'categories';
      rerender();
    });
  });

  root.querySelectorAll('[data-back-menu]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (screen === 'settings') {
        readSettingsFromDom(root);
        ensureAutoSlug();
        await saveMenuDraft(uid, draft, menuLineId());
      }
      if (screen === 'categories') {
        syncCategoryNamesFromDom(root);
        draft.categories = draft.categories.filter((c) => c.name);
        if (!draft.categories.length) {
          draft.categories = [{ id: newCategoryId(), name: 'General' }];
        }
        await saveMenuDraft(uid, draft, menuLineId());
      }
      closeItemEditor();
      screen = 'menu';
      rerender();
    });
  });

  root.querySelector('[data-save-settings]')?.addEventListener('click', async () => {
    readSettingsFromDom(root);
    ensureAutoSlug();
    const saved = await saveMenuDraft(uid, draft, menuLineId());
    draft = saved.draft;
    loadedUid = uid;
    screen = 'menu';
    showToast('Negocio guardado');
    rerender();
  });

  root.querySelector('[data-save-categories]')?.addEventListener('click', async () => {
    syncCategoryNamesFromDom(root);
    draft.categories = draft.categories.filter((c) => c.name);
    if (!draft.categories.length) {
      draft.categories = [{ id: newCategoryId(), name: 'General' }];
    }
    const saved = await saveMenuDraft(uid, draft, menuLineId());
    draft = saved.draft;
    loadedUid = uid;
    screen = 'menu';
    showToast('Categorías guardadas');
    rerender();
  });

  const businessInput = root.querySelector('#mw-business');
  const slugInput = root.querySelector('#mw-slug');
  const whatsappInput = root.querySelector('#mw-whatsapp');
  businessInput?.addEventListener('blur', () => {
    if (!slugInput) return;
    if (slugInput.value.trim()) return;
    const suggested = suggestSlugFromBusiness(businessInput.value);
    if (suggested.length >= 3) slugInput.value = suggested;
  });
  whatsappInput?.addEventListener('blur', () => {
    if (!slugInput || slugInput.value.trim()) return;
    const digits = normalizeWhatsapp(whatsappInput.value);
    if (digits.length >= 8) slugInput.value = `menu-${digits.slice(-8)}`;
  });
  slugInput?.addEventListener('input', () => {
    const next = normalizeSlug(slugInput.value);
    if (slugInput.value !== next) slugInput.value = next;
  });

  root.querySelectorAll('[data-seed-demo]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      seedDemoProducts();
      const saved = await saveMenuDraft(uid, draft, menuLineId());
      draft = saved.draft;
      loadedUid = uid;
      showToast('Menú demo cargado');
      rerender();
    });
  });

  root.querySelector('[data-pick-cover]')?.addEventListener('change', (e) => {
    pickImage(e.target, {
      kind: 'cover',
      maxSide: 1200,
      uid,
      showToast,
      render: rerender,
      onDone: (url) => {
        draft.coverImage = url;
      },
    });
  });
  root.querySelector('[data-pick-logo]')?.addEventListener('change', (e) => {
    pickImage(e.target, {
      kind: 'logo',
      maxSide: 400,
      uid,
      showToast,
      render: rerender,
      onDone: (url) => {
        draft.logoImage = url;
      },
    });
  });
  root.querySelector('[data-clear-cover]')?.addEventListener('click', () => {
    draft.coverImage = '';
    rerender();
  });
  root.querySelector('[data-clear-logo]')?.addEventListener('click', () => {
    draft.logoImage = '';
    rerender();
  });

  root.querySelector('[data-add-cat]')?.addEventListener('click', () => {
    syncCategoryNamesFromDom(root);
    draft.categories.push({ id: newCategoryId(), name: '' });
    rerender();
    window.setTimeout(() => {
      const inputs = root.querySelectorAll('[data-cat-name]');
      const last = inputs[inputs.length - 1];
      last?.focus();
    }, 0);
  });

  root.querySelectorAll('[data-remove-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncCategoryNamesFromDom(root);
      const row = btn.closest('.mw-cat-row');
      const id = row?.dataset.catId;
      if (!id || draft.categories.length <= 1) {
        showToast('Deja al menos una categoría');
        return;
      }
      const fallback = draft.categories.find((c) => c.id !== id)?.id || '';
      draft.categories = draft.categories.filter((c) => c.id !== id);
      draft.items = draft.items.map((item) =>
        item.categoryId === id ? { ...item, categoryId: fallback } : item
      );
      if (filterCategoryId === id) filterCategoryId = 'all';
      rerender();
    });
  });

  root.querySelectorAll('[data-add-item]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openItemEditor(null);
      rerender();
    });
  });

  root.querySelectorAll('[data-edit-item]').forEach((el) => {
    const open = () => {
      openItemEditor(el.dataset.editItem);
      rerender();
    };
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  root.querySelector('[data-pick-item-image]')?.addEventListener('change', (e) => {
    const id = itemForm?.id || newItemId();
    if (itemForm && !itemForm.id) itemForm.id = id;
    pickImage(e.target, {
      kind: 'item',
      itemId: id,
      maxSide: 720,
      uid,
      showToast,
      render: rerender,
      onDone: (url) => {
        if (!itemForm) return;
        itemForm.image = url;
      },
    });
  });
  root.querySelector('[data-clear-item-image]')?.addEventListener('click', () => {
    if (!itemForm) return;
    itemForm.image = '';
    rerender();
  });

  root.querySelector('[data-save-item]')?.addEventListener('click', async () => {
    readItemFormFromDom(root);
    if (!itemForm?.name) {
      showToast('Escribe el nombre del producto');
      return;
    }
    if (!itemForm.categoryId && draft.categories[0]) {
      itemForm.categoryId = draft.categories[0].id;
    }
    if (editingItemId) {
      draft.items = draft.items.map((i) => (i.id === editingItemId ? { ...itemForm } : i));
    } else {
      draft.items = [...draft.items, { ...itemForm, id: itemForm.id || newItemId() }];
    }
    const saved = await saveMenuDraft(uid, draft, menuLineId());
    draft = saved.draft;
    loadedUid = uid;
    closeItemEditor();
    showToast('Producto guardado');
    rerender();
  });

  root.querySelector('[data-delete-item]')?.addEventListener('click', async () => {
    if (!editingItemId) return;
    if (!window.confirm('¿Eliminar este producto?')) return;
    draft.items = draft.items.filter((i) => i.id !== editingItemId);
    const saved = await saveMenuDraft(uid, draft, menuLineId());
    draft = saved.draft;
    loadedUid = uid;
    closeItemEditor();
    showToast('Producto eliminado');
    rerender();
  });

  root.querySelector('[data-copy-link]')?.addEventListener('click', async () => {
    const url = publicMenuUrl(draft.slug);
    if (!url) {
      showToast('Define tu link en Ajustes');
      return;
    }
    const ok = await copyText(url);
    showToast(ok ? 'Link copiado' : 'No se pudo copiar');
  });

  root.querySelector('[data-publish]')?.addEventListener('click', () => {
    doPublish(uid, showToast, render);
  });

  root.querySelector('[data-unpublish]')?.addEventListener('click', () => {
    doPublish(uid, showToast, render, { unpublish: true });
  });
}
