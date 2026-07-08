import { PRODUCTS, profileStatus } from '../lib/products.js';
import { ICONS, NAV_ITEMS } from './icons.js';
import { escapeHtml, formatDate, formatDateTime, getUserInitial } from './helpers.js';

export const VIEW_META = {
  dashboard: { title: 'Resumen', subtitle: 'Métricas, usuarios y accesos' },
  users: { title: 'Usuarios', subtitle: 'Control total de accesos por producto' },
  analytics: { title: 'Tráfico', subtitle: 'Visitas en landing pages' },
  codes: { title: 'Códigos', subtitle: 'Códigos de liberación automática' },
  kiwify: { title: 'Kiwify', subtitle: 'Enlaces y plantillas de email' },
};

export const USER_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'active', label: 'Con acceso' },
  { id: 'premium', label: 'Con upsell' },
  { id: 'orphan', label: 'Sin perfil' },
];

export const CODE_TYPES = [
  { value: 'kit', label: 'Kit Paletas' },
  { value: 'premium', label: 'Premium Paletas' },
  { value: 'both', label: 'Paletas completo' },
  { value: 'postres_kit', label: 'Kit Postres' },
  { value: 'postres_premium', label: 'Premium Postres' },
  { value: 'postres_both', label: 'Postres completo' },
];

export function getStats(users) {
  return {
    total: users.length,
    pending: users.filter((u) => profileStatus(u) === 'pending').length,
    active: users.filter((u) => profileStatus(u) === 'active' || u.isAdmin).length,
    premium: users.filter((u) => u.hasPremium || u.hasPostresPremium).length,
    orphans: users.filter((u) => u.missingProfile).length,
  };
}

export function filterUsers(users, userFilter, userSearch) {
  let list = users;
  switch (userFilter) {
    case 'pending':
      list = list.filter((u) => profileStatus(u) === 'pending');
      break;
    case 'active':
      list = list.filter((u) => profileStatus(u) === 'active' || u.isAdmin);
      break;
    case 'premium':
      list = list.filter((u) => u.hasPremium || u.hasPostresPremium);
      break;
    case 'orphan':
      list = list.filter((u) => u.missingProfile);
      break;
    default:
      break;
  }
  const q = userSearch.trim().toLowerCase();
  if (!q) return list;
  return list.filter((u) => {
    const name = String(u.displayName || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q) || String(u.id || '').includes(q);
  });
}

function renderProductPills(user) {
  const active = PRODUCTS.filter((p) => user[p.field]);
  if (!active.length) return '<span class="admin-pill muted">Sin acceso</span>';
  return active
    .map(
      (p) =>
        `<span class="admin-pill ${p.tier === 'upsell' ? 'gold' : 'active'}" title="${escapeHtml(p.label)}">${p.emoji} ${escapeHtml(p.short)}</span>`
    )
    .join('');
}

function renderStatusBadge(user) {
  const status = profileStatus(user);
  if (status === 'admin') return '<span class="admin-badge admin">Admin</span>';
  if (status === 'orphan') return '<span class="admin-badge warn">Sin perfil</span>';
  if (status === 'active') return '<span class="admin-badge active">Activo</span>';
  return '<span class="admin-badge pending">Pendiente</span>';
}

export function renderStatsGrid(stats, analytics) {
  return `
    <div class="admin-stats">
      <div class="admin-stat">
        <span class="admin-stat-label">Usuarios</span>
        <span class="admin-stat-value">${stats.total}</span>
      </div>
      <div class="admin-stat accent-green">
        <span class="admin-stat-label">Con acceso</span>
        <span class="admin-stat-value">${stats.active}</span>
      </div>
      <div class="admin-stat accent-warn">
        <span class="admin-stat-label">Pendientes</span>
        <span class="admin-stat-value">${stats.pending}</span>
      </div>
      <div class="admin-stat accent-gold">
        <span class="admin-stat-label">Upsell activo</span>
        <span class="admin-stat-value">${stats.premium}</span>
      </div>
      ${
        analytics
          ? `
      <div class="admin-stat accent-blue">
        <span class="admin-stat-label">Visitas hoy</span>
        <span class="admin-stat-value">${analytics.todayTotal || 0}</span>
      </div>
      <div class="admin-stat accent-purple">
        <span class="admin-stat-label">Visitas total</span>
        <span class="admin-stat-value">${analytics.allTimeTotal || 0}</span>
      </div>`
          : ''
      }
    </div>
  `;
}

export function renderUserFilters(userFilter) {
  return `
    <div class="admin-filters">
      ${USER_FILTERS.map(
        (f) => `
        <button type="button" class="admin-filter-chip ${userFilter === f.id ? 'active' : ''}" data-user-filter="${f.id}">
          ${f.label}
        </button>`
      ).join('')}
    </div>
  `;
}

export function renderBulkBar(selectedCount) {
  if (!selectedCount) return '';
  return `
    <div class="admin-bulk-bar">
      <span><strong>${selectedCount}</strong> seleccionado${selectedCount > 1 ? 's' : ''}</span>
      <div class="admin-bulk-actions">
        <button type="button" class="admin-btn sm success" data-bulk-product="paletas_kit" data-value="1">+ Paletas Kit</button>
        <button type="button" class="admin-btn sm ghost" data-bulk-product="paletas_kit" data-value="0">− Paletas Kit</button>
        <button type="button" class="admin-btn sm success" data-bulk-product="paletas_premium" data-value="1">+ Premium</button>
        <button type="button" class="admin-btn sm ghost" data-bulk-product="paletas_premium" data-value="0">− Premium</button>
        <button type="button" class="admin-btn sm success" data-bulk-product="postres_kit" data-value="1">+ Postres</button>
        <button type="button" class="admin-btn sm danger" data-bulk-delete>Eliminar</button>
      </div>
    </div>
  `;
}

export function renderUsersTable(users, selectedIds, allSelected) {
  return `
    <div class="admin-table-wrap">
      <table class="admin-table admin-table-users">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" id="select-all-users" ${allSelected ? 'checked' : ''} aria-label="Seleccionar todos">
            </th>
            <th>Usuario</th>
            <th>Productos</th>
            <th>Estado</th>
            <th>Registro</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${
            users.length
              ? users
                  .map((u) => {
                    const checked = selectedIds.has(u.id) ? 'checked' : '';
                    const isSelf = u.id === window.__adminSelfUid;
                    return `
            <tr data-user-row="${u.id}" class="${u.missingProfile ? 'row-warn' : ''}">
              <td class="col-check">
                <input type="checkbox" class="user-select" data-user-select="${u.id}" ${checked} ${isSelf ? 'disabled' : ''} aria-label="Seleccionar usuario">
              </td>
              <td class="user-cell">
                <strong>${escapeHtml(u.displayName || 'Sin nombre')}</strong>
                <span>${escapeHtml(u.email || '—')}</span>
              </td>
              <td><div class="admin-pill-row">${renderProductPills(u)}</div></td>
              <td>${renderStatusBadge(u)}</td>
              <td>${formatDate(u.createdAt)}</td>
              <td class="col-actions">
                <button type="button" class="admin-icon-btn" data-user-view="${u.id}" title="Ver detalle">${ICONS.eye}</button>
              </td>
            </tr>`;
                  })
                  .join('')
              : `<tr><td colspan="6" class="admin-table-empty">Ningún usuario coincide con el filtro.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

export function renderUserDrawer(user) {
  if (!user) return '';

  const productToggles = PRODUCTS.map(
    (p) => `
    <label class="admin-toggle-row">
      <div>
        <strong>${p.emoji} ${escapeHtml(p.label)}</strong>
        <span>${p.tier === 'upsell' ? 'Upsell' : 'Producto principal'}</span>
      </div>
      <input type="checkbox" data-drawer-product="${p.id}" data-user-id="${user.id}" ${user[p.field] ? 'checked' : ''}>
    </label>`
  ).join('');

  return `
    <div class="admin-drawer-overlay visible" data-close-drawer></div>
    <aside class="admin-drawer open" aria-label="Detalle de usuario">
      <div class="admin-drawer-head">
        <div class="admin-drawer-user">
          <span class="admin-user-avatar lg">${escapeHtml(getUserInitial(user))}</span>
          <div>
            <h2>${escapeHtml(user.displayName || 'Sin nombre')}</h2>
            <p>${escapeHtml(user.email || '—')}</p>
          </div>
        </div>
        <button type="button" class="admin-icon-btn" data-close-drawer aria-label="Cerrar">${ICONS.close}</button>
      </div>
      <div class="admin-drawer-body">
        ${
          user.missingProfile
            ? `<div class="admin-alert warn">Este usuario existe en Auth pero no tenía perfil en Firestore. Ya aparece aquí para que puedas gestionarlo.</div>`
            : ''
        }
        <div class="admin-detail-grid">
          <div><span>UID</span><code>${escapeHtml(user.id)}</code></div>
          <div><span>Origen</span><strong>${escapeHtml(user.registeredFrom || '—')}</strong></div>
          <div><span>Registro</span><strong>${formatDateTime(user.createdAt)}</strong></div>
          <div><span>Último acceso</span><strong>${formatDateTime(user.lastLoginAt)}</strong></div>
        </div>
        <h3>Productos y accesos</h3>
        <div class="admin-toggle-list">${productToggles}</div>
        <div class="admin-drawer-actions">
          ${
            user.hasKit && user.email
              ? `<button type="button" class="admin-btn ghost" data-resend-email="${user.id}" data-email="${escapeHtml(user.email)}" data-name="${escapeHtml(user.displayName || '')}">${ICONS.mailSend} Reenviar email</button>`
              : ''
          }
          ${
            !user.isAdmin && user.id !== window.__adminSelfUid
              ? `<button type="button" class="admin-btn ghost" data-user-admin="${user.id}">Hacer admin</button>`
              : ''
          }
          ${
            !user.isAdmin && user.id !== window.__adminSelfUid
              ? `<button type="button" class="admin-btn danger" data-user-delete="${user.id}" data-email="${escapeHtml(user.email || '')}">${ICONS.trash} Eliminar</button>`
              : ''
          }
        </div>
      </div>
    </aside>
  `;
}

export function renderAddUserModal() {
  return `
    <div class="admin-modal-overlay visible" data-close-modal>
      <div class="admin-modal admin-modal-lg" role="dialog" aria-modal="true">
        <h3>Crear usuario</h3>
        <p>El usuario podrá entrar con este correo y contraseña. Puedes activar productos ahora o después.</p>
        <form id="add-user-form" class="admin-form-grid">
          <label>Nombre<input name="displayName" type="text" required placeholder="Nombre"></label>
          <label>Correo<input name="email" type="email" required placeholder="correo@ejemplo.com"></label>
          <label>Contraseña<input name="password" type="password" required minlength="6" placeholder="Mínimo 6 caracteres"></label>
          <div class="admin-form-products">
            ${PRODUCTS.map(
              (p) => `
              <label class="admin-check-card">
                <input type="checkbox" name="product" value="${p.id}">
                <span>${p.emoji} ${escapeHtml(p.label)}</span>
              </label>`
            ).join('')}
          </div>
          <div class="admin-modal-actions">
            <button type="button" class="admin-btn ghost" data-close-modal>Cancelar</button>
            <button type="submit" class="admin-btn primary">Crear usuario</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderAnalyticsView(analytics) {
  if (!analytics) {
    return `<div class="admin-card"><div class="admin-card-body"><p class="admin-table-empty">Cargando métricas...</p></div></div>`;
  }

  const pages = analytics.pages || [];
  const history = analytics.history || [];

  return `
    ${renderStatsGrid({ total: 0, pending: 0, active: 0, premium: 0 }, analytics)}
    <div class="admin-card">
      <div class="admin-card-head"><h2>Landing pages</h2></div>
      <div class="admin-card-body flush">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Página</th><th>Ruta</th><th>Hoy</th><th>Total</th></tr></thead>
            <tbody>
              ${
                pages.length
                  ? pages
                      .map(
                        (p) => `
                <tr>
                  <td><strong>${escapeHtml(p.label)}</strong></td>
                  <td><code>${escapeHtml(p.path)}</code></td>
                  <td><span class="admin-metric today">${p.today || 0}</span></td>
                  <td><span class="admin-metric">${p.total || 0}</span></td>
                </tr>`
                      )
                      .join('')
                  : `<tr><td colspan="4" class="admin-table-empty">Aún no hay visitas registradas.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ${
      history.length
        ? `
    <div class="admin-card">
      <div class="admin-card-head"><h2>Últimos 14 días</h2></div>
      <div class="admin-card-body">
        <div class="admin-history-bars">
          ${history
            .slice()
            .reverse()
            .map((day) => {
              const max = Math.max(...history.map((d) => d.total || 0), 1);
              const height = Math.round(((day.total || 0) / max) * 100);
              return `
              <div class="admin-history-bar" title="${day.date}: ${day.total || 0} visitas">
                <div class="admin-history-fill" style="height:${height}%"></div>
                <span>${String(day.date).slice(5)}</span>
              </div>`;
            })
            .join('')}
        </div>
      </div>
    </div>`
        : ''
    }
  `;
}

export function renderDashboardView(users, analytics) {
  const stats = getStats(users);
  const pending = users.filter((u) => profileStatus(u) === 'pending').slice(0, 8);

  return `
    ${renderStatsGrid(stats, analytics)}
    ${
      stats.orphans
        ? `<div class="admin-alert warn">Hay <strong>${stats.orphans}</strong> usuario(s) en Auth sin perfil completo. Usa <em>Sincronizar</em> en Usuarios para corregirlo.</div>`
        : ''
    }
    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-head">
          <div><h2>Pendientes de liberación</h2><p>Compraron pero aún no tienen acceso.</p></div>
          <button type="button" class="admin-btn ghost" data-tab="users">Ver todos</button>
        </div>
        <div class="admin-card-body flush">${renderUsersTable(pending, new Set(), false)}</div>
      </div>
      <div class="admin-card">
        <div class="admin-card-head"><div><h2>Tráfico rápido</h2><p>Visitas en landing pages hoy.</p></div></div>
        <div class="admin-card-body">
          ${
            analytics?.pages?.length
              ? analytics.pages
                  .map(
                    (p) => `
              <div class="admin-traffic-row">
                <div><strong>${escapeHtml(p.label)}</strong><span>${escapeHtml(p.path)}</span></div>
                <span class="admin-metric today">${p.today || 0}</span>
              </div>`
                  )
                  .join('')
              : '<p class="admin-table-empty">Sin datos de tráfico aún.</p>'
          }
        </div>
      </div>
    </div>
  `;
}

export function renderUsersView(users, selectedIds, userFilter, userSearch) {
  const filtered = filterUsers(users, userFilter, userSearch);
  const allSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u.id));

  return `
    ${renderStatsGrid(getStats(users))}
    <div class="admin-toolbar">
      <button type="button" class="admin-btn primary" data-open-add-user>${ICONS.plus} Crear usuario</button>
      <button type="button" class="admin-btn ghost" data-sync-users>${ICONS.sync} Sincronizar perfiles</button>
    </div>
    ${renderBulkBar(selectedIds.size)}
    <div class="admin-card">
      <div class="admin-card-head">
        <div><h2>Usuarios</h2><p>Selecciona uno o varios para acciones en masa. Usa el ojo para ver detalle.</p></div>
        <div class="admin-search">${ICONS.search}<input type="search" id="user-search" placeholder="Buscar..." value="${escapeHtml(userSearch)}" autocomplete="off"></div>
      </div>
      <div class="admin-card-body">
        ${renderUserFilters(userFilter)}
        ${renderUsersTable(filtered, selectedIds, allSelected)}
      </div>
    </div>
  `;
}

export function renderCodesView(codes) {
  return `
    <div class="admin-card">
      <div class="admin-card-head"><div><h2>Códigos de acceso</h2><p>Link: <code>/cadastrar?code=TUCODIGO</code></p></div></div>
      <div class="admin-card-body">
        <form class="codes-form" id="codes-form">
          <label>Código<input type="text" name="code" required placeholder="ej. postres2026" autocomplete="off"></label>
          <label>Tipo<select name="type">${CODE_TYPES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('')}</select></label>
          <label>Máx. usos<input type="number" name="maxUses" min="1" placeholder="Ilimitado"></label>
          <button type="submit" class="admin-btn primary">Crear</button>
        </form>
        <div class="admin-table-wrap flush">
          <table class="admin-table">
            <thead><tr><th>Código</th><th>Tipo</th><th>Usos</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              ${
                codes.length
                  ? codes
                      .map((code) => {
                        const uses =
                          code.maxUses != null
                            ? `${code.usedCount || 0} / ${code.maxUses}`
                            : `${code.usedCount || 0}`;
                        return `
                <tr>
                  <td><code>${escapeHtml(code.code)}</code></td>
                  <td>${escapeHtml(code.type)}</td>
                  <td>${uses}</td>
                  <td>${code.active ? '<span class="admin-badge active">Activo</span>' : '<span class="admin-badge pending">Inactivo</span>'}</td>
                  <td>
                    <div class="admin-actions-row">
                      <button type="button" class="admin-btn sm ghost copy-btn" data-copy="${encodeURIComponent(code.code)}">${ICONS.copy}</button>
                      <button type="button" class="admin-btn sm ghost" data-code-toggle="${code.id}" data-active="${Boolean(code.active)}">${code.active ? 'Desactivar' : 'Activar'}</button>
                      <button type="button" class="admin-btn sm danger" data-code-delete="${code.id}">${ICONS.trash}</button>
                    </div>
                  </td>
                </tr>`;
                      })
                      .join('')
                  : `<tr><td colspan="5" class="admin-table-empty">Sin códigos creados.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function renderKiwifyView(kiwifySubTab, kiwifyContent) {
  return `
    <div class="admin-card">
      <div class="admin-tabs">
        <button type="button" class="admin-tab ${kiwifySubTab === 'urls' ? 'active' : ''}" data-kiwify-tab="urls">Enlaces</button>
        <button type="button" class="admin-tab ${kiwifySubTab === 'kit' ? 'active' : ''}" data-kiwify-tab="kit">Email kit</button>
        <button type="button" class="admin-tab ${kiwifySubTab === 'premium' ? 'active' : ''}" data-kiwify-tab="premium">Email premium</button>
      </div>
      <div class="admin-card-body">${kiwifyContent}</div>
    </div>
  `;
}

export function renderSidebar(activeTab, users, user) {
  const stats = getStats(users);
  const pendingBadge = stats.pending > 0 ? `<span class="admin-nav-badge">${stats.pending}</span>` : '';
  const orphanBadge = stats.orphans > 0 ? `<span class="admin-nav-badge warn">${stats.orphans}</span>` : '';

  return `
    <aside class="admin-sidebar" aria-label="Navegación admin">
      <div class="admin-brand">
        <div class="admin-brand-mark">🍓</div>
        <div class="admin-brand-text"><strong>Paletas Admin</strong><span>Panel premium</span></div>
      </div>
      <nav class="admin-nav">
        ${NAV_ITEMS.map((item) => {
          let badge = '';
          if (item.id === 'users') badge = pendingBadge || orphanBadge;
          return `
          <button type="button" class="admin-nav-item ${activeTab === item.id ? 'active' : ''}" data-tab="${item.id}">
            ${ICONS[item.icon]}<span>${item.label}</span>${badge}
          </button>`;
        }).join('')}
      </nav>
      <div class="admin-sidebar-foot">
        <div class="admin-user-chip">
          <span class="admin-user-avatar">${escapeHtml(getUserInitial(user))}</span>
          <div class="admin-user-meta"><strong>${escapeHtml(user.displayName || 'Admin')}</strong><span>${escapeHtml(user.email || '')}</span></div>
        </div>
        <a href="/app" class="admin-foot-link">${ICONS.app} Área miembros</a>
        <button type="button" class="admin-foot-logout" id="admin-logout">${ICONS.logout} Salir</button>
      </div>
    </aside>
  `;
}

export function renderShell({
  activeTab,
  users,
  codes,
  analytics,
  selectedIds,
  userFilter,
  userSearch,
  detailUser,
  kiwifySubTab,
  kiwifyContent,
  user,
  sidebarOpen,
}) {
  const meta = VIEW_META[activeTab] || VIEW_META.dashboard;
  let content = '';

  switch (activeTab) {
    case 'users':
      content = renderUsersView(users, selectedIds, userFilter, userSearch);
      break;
    case 'analytics':
      content = renderAnalyticsView(analytics);
      break;
    case 'codes':
      content = renderCodesView(codes);
      break;
    case 'kiwify':
      content = renderKiwifyView(kiwifySubTab, kiwifyContent);
      break;
    default:
      content = renderDashboardView(users, analytics);
  }

  return `
    <div class="admin-layout">
      <div class="admin-sidebar-overlay ${sidebarOpen ? 'visible' : ''}" data-close-sidebar></div>
      ${renderSidebar(activeTab, users, user)}
      <div class="admin-main">
        <header class="admin-header">
          <button type="button" class="admin-menu-btn" id="admin-menu-toggle">${ICONS.menu}</button>
          <div class="admin-header-titles"><h1>${meta.title}</h1><p>${meta.subtitle}</p></div>
        </header>
        <main class="admin-content"><div class="admin-content-inner">${content}</div></main>
      </div>
      ${detailUser ? renderUserDrawer(detailUser) : ''}
    </div>
  `;
}
