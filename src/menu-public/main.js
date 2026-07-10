import { escapeHtml } from '../lib/format.js';
import { canUseMenusCloud, getPublicMenu, isValidSlug, normalizeSlug } from '../lib/menus.js';
import { DEMO_MENU } from './demo-data.js';

const root = document.getElementById('menu-root');

const WA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`;

const PHONE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;

function readSlug() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1' || params.get('slug') === 'demo') return 'demo';

  const fromQuery = params.get('slug');
  if (fromQuery) return normalizeSlug(fromQuery);

  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'm' && parts[1]) return normalizeSlug(parts[1]);
  return '';
}

function isDemoRequest() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1') return true;
  return readSlug() === 'demo';
}

function isPreviewRequest() {
  return new URLSearchParams(window.location.search).get('preview') === '1';
}

function readPreviewMenu() {
  try {
    const raw = sessionStorage.getItem('mw-menu-preview');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

function waOrderUrl(whatsapp, businessName, itemName = '') {
  const phone = String(whatsapp || '').replace(/\D/g, '');
  const base = businessName
    ? `Hola, vi el menú de ${businessName}`
    : 'Hola, vi tu menú';
  const extra = itemName ? ` y quiero pedir: ${itemName}` : ' y quiero hacer un pedido';
  const text = encodeURIComponent(`${base}${extra}`);
  if (!phone) return `https://wa.me/?text=${text}`;
  return `https://wa.me/${phone}?text=${text}`;
}

function formatPhoneDisplay(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length >= 10) {
    const local = d.slice(-10);
    const cc = d.slice(0, -10);
    const pretty = `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
    return cc ? `+${cc} ${pretty}` : pretty;
  }
  return d;
}

function formatPrice(price) {
  const p = String(price || '').trim();
  if (!p) return '';
  if (p.startsWith('$') || /[A-Za-z]/.test(p)) return p;
  return `$${p}`;
}

function renderMissing(message) {
  root.innerHTML = `
    <main class="mp">
      <div class="mp-empty">
        <p class="mp-kicker">Paletas para WhatsApp</p>
        <h1>Menú no disponible</h1>
        <p>${escapeHtml(message)}</p>
      </div>
    </main>
  `;
  document.title = 'Menú no disponible';
}

function groupByCategory(menu) {
  const cats = Array.isArray(menu.categories) ? menu.categories : [];
  const items = (menu.items || []).filter((i) => i.name && i.available !== false);
  const byCat = new Map(cats.map((c) => [c.id, []]));
  const orphan = [];

  for (const item of items) {
    if (item.categoryId && byCat.has(item.categoryId)) {
      byCat.get(item.categoryId).push(item);
    } else {
      orphan.push(item);
    }
  }

  const sections = cats
    .map((c) => ({ id: c.id, name: c.name, items: byCat.get(c.id) || [] }))
    .filter((s) => s.items.length);

  if (orphan.length) {
    sections.push({ id: '_other', name: sections.length ? 'Más' : 'Menú', items: orphan });
  }
  return sections;
}

function renderItem(item, menu) {
  const price = formatPrice(item.price);
  const orderHref = waOrderUrl(menu.whatsapp, menu.businessName, item.name);
  return `
    <article class="mp-item">
      <div class="mp-item-body">
        <h3>${escapeHtml(item.name)}</h3>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
        <div class="mp-item-foot">
          ${price ? `<strong>${escapeHtml(price)}</strong>` : '<span></span>'}
          <a class="mp-item-order" href="${orderHref}" target="_blank" rel="noopener noreferrer">
            ${WA_ICON}<span>Pedir</span>
          </a>
        </div>
      </div>
      ${
        item.image
          ? `<div class="mp-item-img"><img src="${escapeHtml(item.image)}" alt="" loading="lazy" decoding="async"></div>`
          : `<div class="mp-item-img mp-item-img-empty" aria-hidden="true"></div>`
      }
    </article>
  `;
}

function renderMenu(menu, { preview = false } = {}) {
  document.title = preview
    ? `Vista previa · ${menu.businessName || 'Menú'}`
    : `${menu.businessName} | Menú`;
  const sections = groupByCategory(menu);
  const cta = waOrderUrl(menu.whatsapp, menu.businessName);
  const phoneDigits = String(menu.phone || '').replace(/\D/g, '');
  const phoneLabel = formatPhoneDisplay(phoneDigits);

  const chips = sections
    .map(
      (s, i) =>
        `<a class="mp-chip ${i === 0 ? 'active' : ''}" href="#cat-${escapeHtml(s.id)}">${escapeHtml(s.name)}</a>`
    )
    .join('');

  const sectionsHtml = sections
    .map(
      (s) => `
      <section class="mp-section" id="cat-${escapeHtml(s.id)}">
        <h2>${escapeHtml(s.name)}</h2>
        <div class="mp-list">${s.items.map((item) => renderItem(item, menu)).join('')}</div>
      </section>
    `
    )
    .join('');

  root.innerHTML = `
    <main class="mp">
      ${
        preview
          ? `<div class="mp-preview-banner">Vista previa · aún no publicado</div>`
          : ''
      }
      <header class="mp-hero">
        <div class="mp-cover ${menu.coverImage ? 'has-img' : ''}">
          ${menu.coverImage ? `<img src="${escapeHtml(menu.coverImage)}" alt="" decoding="async">` : ''}
          <div class="mp-cover-fade"></div>
        </div>
        <div class="mp-identity">
          <div class="mp-logo">
            ${
              menu.logoImage
                ? `<img src="${escapeHtml(menu.logoImage)}" alt="" decoding="async">`
                : `<span>${escapeHtml((menu.businessName || '?').charAt(0).toUpperCase())}</span>`
            }
          </div>
          <div class="mp-titles">
            <p class="mp-kicker">Menú</p>
            <h1>${escapeHtml(menu.businessName || 'Tu negocio')}</h1>
            ${menu.tagline ? `<p class="mp-tagline">${escapeHtml(menu.tagline)}</p>` : ''}
          </div>
        </div>
        ${
          phoneLabel
            ? `<a class="mp-phone" href="tel:+${escapeHtml(phoneDigits)}">${PHONE_ICON}<span>${escapeHtml(phoneLabel)}</span></a>`
            : ''
        }
      </header>

      ${chips ? `<nav class="mp-chips" aria-label="Categorías">${chips}</nav>` : ''}

      ${
        sectionsHtml ||
        `<div class="mp-empty-inline"><p>Pronto habrá sabores aquí.</p></div>`
      }

      ${menu.note ? `<p class="mp-note">${escapeHtml(menu.note)}</p>` : ''}

      <div class="mp-spacer"></div>

      <footer class="mp-bar">
        <a class="mp-cta" href="${cta}" target="_blank" rel="noopener noreferrer">
          ${WA_ICON}<span>Pedir por WhatsApp</span>
        </a>
      </footer>
    </main>
  `;

  root.querySelectorAll('.mp-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      root.querySelectorAll('.mp-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

async function boot() {
  if (isDemoRequest()) {
    renderMenu(DEMO_MENU);
    return;
  }

  if (isPreviewRequest()) {
    const preview = readPreviewMenu();
    if (!preview) {
      renderMissing('Abre la vista previa desde el editor del menú.');
      return;
    }
    renderMenu(preview, { preview: true });
    return;
  }

  const slug = readSlug();

  if (!slug || !isValidSlug(slug)) {
    renderMissing('Este link no es válido.');
    return;
  }

  if (!canUseMenusCloud()) {
    renderMissing('El menú público no está disponible en este momento.');
    return;
  }

  const menu = await getPublicMenu(slug);
  if (!menu) {
    renderMissing('Este menú no existe o aún no está publicado.');
    return;
  }

  renderMenu(menu);
}

boot();
