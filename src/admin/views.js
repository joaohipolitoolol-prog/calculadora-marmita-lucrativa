import { PRODUCTS, profileStatus } from '../lib/products.js';
import { ICONS } from './icons.js';
import { escapeHtml, formatDate, formatDateTime, getUserInitial } from './helpers.js';
import {
  ADMIN_LANGS,
  getAdminLang,
  getCodeTypes,
  getNavItems,
  getUserFilters,
  getViewMeta,
  productLabel,
  t,
} from './i18n.js';

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
  if (!active.length) return `<span class="admin-pill muted">${t('pill.noAccess')}</span>`;
  return active
    .map(
      (p) =>
        `<span class="admin-pill ${p.tier === 'upsell' ? 'gold' : 'active'}" title="${escapeHtml(productLabel(p.id))}">${p.emoji} ${escapeHtml(p.short)}</span>`
    )
    .join('');
}

function renderStatusBadge(user) {
  const status = profileStatus(user);
  if (status === 'admin') return `<span class="admin-badge admin">${t('status.admin')}</span>`;
  if (status === 'orphan') return `<span class="admin-badge warn">${t('status.orphan')}</span>`;
  if (status === 'active') return `<span class="admin-badge active">${t('status.active')}</span>`;
  return `<span class="admin-badge pending">${t('status.pending')}</span>`;
}

export function renderStatsGrid(stats, analytics) {
  return `
    <div class="admin-stats">
      <div class="admin-stat">
        <span class="admin-stat-label">${t('stat.users')}</span>
        <span class="admin-stat-value">${stats.total}</span>
      </div>
      <div class="admin-stat accent-green">
        <span class="admin-stat-label">${t('stat.active')}</span>
        <span class="admin-stat-value">${stats.active}</span>
      </div>
      <div class="admin-stat accent-warn">
        <span class="admin-stat-label">${t('stat.pending')}</span>
        <span class="admin-stat-value">${stats.pending}</span>
      </div>
      <div class="admin-stat accent-gold">
        <span class="admin-stat-label">${t('stat.upsell')}</span>
        <span class="admin-stat-value">${stats.premium}</span>
      </div>
      ${
        analytics
          ? `
      <div class="admin-stat accent-blue">
        <span class="admin-stat-label">${t('stat.visitsToday')}</span>
        <span class="admin-stat-value">${analytics.todayTotal || 0}</span>
      </div>
      <div class="admin-stat accent-purple">
        <span class="admin-stat-label">${t('stat.visitsTotal')}</span>
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
      ${getUserFilters()
        .map(
          (f) => `
        <button type="button" class="admin-filter-chip ${userFilter === f.id ? 'active' : ''}" data-user-filter="${f.id}">
          ${f.label}
        </button>`
        )
        .join('')}
    </div>
  `;
}

export function renderBulkBar(selectedCount) {
  if (!selectedCount) return '';
  const label =
    selectedCount === 1
      ? `1 ${t('bulk.selected')}`
      : `${selectedCount} ${t('bulk.selectedPlural')}`;
  return `
    <div class="admin-bulk-bar">
      <span><strong>${label}</strong></span>
      <div class="admin-bulk-actions">
        <button type="button" class="admin-btn sm success" data-bulk-product="paletas_kit" data-value="1">${t('bulk.addPaletas')}</button>
        <button type="button" class="admin-btn sm ghost" data-bulk-product="paletas_kit" data-value="0">${t('bulk.removePaletas')}</button>
        <button type="button" class="admin-btn sm success" data-bulk-product="paletas_premium" data-value="1">${t('bulk.addPremium')}</button>
        <button type="button" class="admin-btn sm ghost" data-bulk-product="paletas_premium" data-value="0">${t('bulk.removePremium')}</button>
        <button type="button" class="admin-btn sm success" data-bulk-product="postres_kit" data-value="1">${t('bulk.addPostres')}</button>
        <button type="button" class="admin-btn sm danger" data-bulk-delete>${t('bulk.delete')}</button>
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
              <input type="checkbox" id="select-all-users" ${allSelected ? 'checked' : ''} aria-label="${t('table.selectAll')}">
            </th>
            <th>${t('table.user')}</th>
            <th>${t('table.products')}</th>
            <th>${t('table.status')}</th>
            <th>${t('table.registered')}</th>
            <th class="col-actions">${t('table.actions')}</th>
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
                <input type="checkbox" class="user-select" data-user-select="${u.id}" ${checked} ${isSelf ? 'disabled' : ''} aria-label="${t('table.selectUser')}">
              </td>
              <td class="user-cell">
                <strong>${escapeHtml(u.displayName || t('table.noName'))}</strong>
                <span>${escapeHtml(u.email || '—')}</span>
              </td>
              <td><div class="admin-pill-row">${renderProductPills(u)}</div></td>
              <td>${renderStatusBadge(u)}</td>
              <td>${formatDate(u.createdAt)}</td>
              <td class="col-actions">
                <button type="button" class="admin-icon-btn" data-user-view="${u.id}" title="${t('table.viewDetail')}">${ICONS.eye}</button>
              </td>
            </tr>`;
                  })
                  .join('')
              : `<tr><td colspan="6" class="admin-table-empty">${t('table.noMatch')}</td></tr>`
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
        <strong>${p.emoji} ${escapeHtml(productLabel(p.id))}</strong>
        <span>${p.tier === 'upsell' ? t('drawer.upsell') : t('drawer.mainProduct')}</span>
      </div>
      <input type="checkbox" data-drawer-product="${p.id}" data-user-id="${user.id}" ${user[p.field] ? 'checked' : ''}>
    </label>`
  ).join('');

  return `
    <div class="admin-drawer-overlay visible" data-close-drawer></div>
    <aside class="admin-drawer open" aria-label="${t('drawer.title')}">
      <div class="admin-drawer-head">
        <div class="admin-drawer-user">
          <span class="admin-user-avatar lg">${escapeHtml(getUserInitial(user))}</span>
          <div>
            <h2>${escapeHtml(user.displayName || t('table.noName'))}</h2>
            <p>${escapeHtml(user.email || '—')}</p>
          </div>
        </div>
        <button type="button" class="admin-icon-btn" data-close-drawer aria-label="${t('drawer.close')}">${ICONS.close}</button>
      </div>
      <div class="admin-drawer-body">
        ${user.missingProfile ? `<div class="admin-alert warn">${t('drawer.orphanWarn')}</div>` : ''}
        <div class="admin-detail-grid">
          <div><span>UID</span><code>${escapeHtml(user.id)}</code></div>
          <div><span>${t('drawer.origin')}</span><strong>${escapeHtml(user.registeredFrom || '—')}</strong></div>
          <div><span>${t('drawer.registered')}</span><strong>${formatDateTime(user.createdAt)}</strong></div>
          <div><span>${t('drawer.lastLogin')}</span><strong>${formatDateTime(user.lastLoginAt)}</strong></div>
        </div>
        <h3>${t('drawer.products')}</h3>
        <div class="admin-toggle-list">${productToggles}</div>
        <div class="admin-drawer-actions">
          ${
            user.hasKit && user.email
              ? `<button type="button" class="admin-btn ghost" data-resend-email="${user.id}" data-email="${escapeHtml(user.email)}" data-name="${escapeHtml(user.displayName || '')}">${ICONS.mailSend} ${t('drawer.resendEmail')}</button>`
              : ''
          }
          ${
            !user.isAdmin && user.id !== window.__adminSelfUid
              ? `<button type="button" class="admin-btn ghost" data-user-admin="${user.id}">${t('drawer.makeAdmin')}</button>`
              : ''
          }
          ${
            !user.isAdmin && user.id !== window.__adminSelfUid
              ? `<button type="button" class="admin-btn danger" data-user-delete="${user.id}" data-email="${escapeHtml(user.email || '')}">${ICONS.trash} ${t('drawer.delete')}</button>`
              : ''
          }
        </div>
      </div>
    </aside>
  `;
}

export function renderAnalyticsView(analytics) {
  if (!analytics) {
    return `<div class="admin-card"><div class="admin-card-body"><p class="admin-table-empty">${t('analytics.loading')}</p></div></div>`;
  }

  const pages = analytics.pages || [];
  const history = analytics.history || [];

  return `
    ${renderStatsGrid({ total: 0, pending: 0, active: 0, premium: 0 }, analytics)}
    <div class="admin-card">
      <div class="admin-card-head"><h2>${t('analytics.landingPages')}</h2></div>
      <div class="admin-card-body flush">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>${t('analytics.page')}</th><th>${t('analytics.path')}</th><th>${t('analytics.today')}</th><th>${t('analytics.total')}</th></tr></thead>
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
                  : `<tr><td colspan="4" class="admin-table-empty">${t('analytics.noVisits')}</td></tr>`
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
      <div class="admin-card-head"><h2>${t('analytics.last14')}</h2></div>
      <div class="admin-card-body">
        <div class="admin-history-bars">
          ${history
            .slice()
            .reverse()
            .map((day) => {
              const max = Math.max(...history.map((d) => d.total || 0), 1);
              const height = Math.round(((day.total || 0) / max) * 100);
              return `
              <div class="admin-history-bar" title="${day.date}: ${day.total || 0} ${t('analytics.visits')}">
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
        ? `<div class="admin-alert warn">${t('dashboard.orphanWarn', { n: stats.orphans })}</div>`
        : ''
    }
    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-head">
          <div><h2>${t('dashboard.pendingTitle')}</h2><p>${t('dashboard.pendingSub')}</p></div>
          <button type="button" class="admin-btn ghost" data-tab="users">${t('dashboard.viewAll')}</button>
        </div>
        <div class="admin-card-body flush">${renderUsersTable(pending, new Set(), false)}</div>
      </div>
      <div class="admin-card">
        <div class="admin-card-head"><div><h2>${t('dashboard.trafficTitle')}</h2><p>${t('dashboard.trafficSub')}</p></div></div>
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
              : `<p class="admin-table-empty">${t('dashboard.noTraffic')}</p>`
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
      <button type="button" class="admin-btn primary" data-open-add-user>${ICONS.plus} ${t('users.create')}</button>
      <button type="button" class="admin-btn ghost" data-sync-users>${ICONS.sync} ${t('users.sync')}</button>
    </div>
    ${renderBulkBar(selectedIds.size)}
    <div class="admin-card">
      <div class="admin-card-head">
        <div><h2>${t('users.title')}</h2><p>${t('users.hint')}</p></div>
        <div class="admin-search">${ICONS.search}<input type="search" id="user-search" placeholder="${t('users.search')}" value="${escapeHtml(userSearch)}" autocomplete="off"></div>
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
      <div class="admin-card-head"><div><h2>${t('codes.title')}</h2><p>${t('codes.hint')}</p></div></div>
      <div class="admin-card-body">
        <form class="codes-form" id="codes-form">
          <label>${t('codes.code')}<input type="text" name="code" required placeholder="postres2026" autocomplete="off"></label>
          <label>${t('codes.type')}<select name="type">${getCodeTypes().map((ct) => `<option value="${ct.value}">${ct.label}</option>`).join('')}</select></label>
          <label>${t('codes.maxUses')}<input type="number" name="maxUses" min="1" placeholder="${t('codes.unlimited')}"></label>
          <button type="submit" class="admin-btn primary">${t('codes.create')}</button>
        </form>
        <div class="admin-table-wrap flush">
          <table class="admin-table">
            <thead><tr><th>${t('codes.code')}</th><th>${t('codes.type')}</th><th>${t('codes.uses')}</th><th>${t('table.status')}</th><th>${t('table.actions')}</th></tr></thead>
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
                  <td>${code.active ? `<span class="admin-badge active">${t('status.active')}</span>` : `<span class="admin-badge pending">${t('status.inactive')}</span>`}</td>
                  <td>
                    <div class="admin-actions-row">
                      <button type="button" class="admin-btn sm ghost copy-btn" data-copy="${encodeURIComponent(code.code)}">${ICONS.copy}</button>
                      <button type="button" class="admin-btn sm ghost" data-code-toggle="${code.id}" data-active="${Boolean(code.active)}">${code.active ? t('codes.deactivate') : t('codes.activate')}</button>
                      <button type="button" class="admin-btn sm danger" data-code-delete="${code.id}">${ICONS.trash}</button>
                    </div>
                  </td>
                </tr>`;
                      })
                      .join('')
                  : `<tr><td colspan="5" class="admin-table-empty">${t('codes.empty')}</td></tr>`
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
        <button type="button" class="admin-tab ${kiwifySubTab === 'urls' ? 'active' : ''}" data-kiwify-tab="urls">${t('kiwify.urls')}</button>
        <button type="button" class="admin-tab ${kiwifySubTab === 'kit' ? 'active' : ''}" data-kiwify-tab="kit">${t('kiwify.emailKit')}</button>
        <button type="button" class="admin-tab ${kiwifySubTab === 'premium' ? 'active' : ''}" data-kiwify-tab="premium">${t('kiwify.emailPremium')}</button>
      </div>
      <div class="admin-card-body">${kiwifyContent}</div>
    </div>
  `;
}

function renderLangSwitcher() {
  const current = getAdminLang();
  return `
    <div class="admin-lang-switch" role="group" aria-label="${t('sidebar.lang')}">
      <span class="admin-lang-label">${t('sidebar.lang')}</span>
      ${ADMIN_LANGS.map(
        (lang) => `
        <button type="button" class="admin-lang-btn ${current === lang.id ? 'active' : ''}" data-admin-lang="${lang.id}">${lang.label}</button>`
      ).join('')}
    </div>
  `;
}

export function renderSidebar(activeTab, users, user, sidebarOpen) {
  const stats = getStats(users);
  const pendingBadge = stats.pending > 0 ? `<span class="admin-nav-badge">${stats.pending}</span>` : '';
  const orphanBadge = stats.orphans > 0 ? `<span class="admin-nav-badge warn">${stats.orphans}</span>` : '';
  const navItems = getNavItems();

  return `
    <aside class="admin-sidebar ${sidebarOpen ? 'open' : ''}" aria-label="Admin navigation">
      <div class="admin-sidebar-top">
        <div class="admin-brand">
          <div class="admin-brand-mark">🍓</div>
          <div class="admin-brand-text"><strong>${t('sidebar.brand')}</strong><span>${t('sidebar.sub')}</span></div>
        </div>
        <button type="button" class="admin-sidebar-close" data-close-sidebar aria-label="${t('sidebar.close')}">${ICONS.close}</button>
      </div>
      <nav class="admin-nav">
        ${navItems
          .map((item) => {
            let badge = '';
            if (item.id === 'users') badge = pendingBadge || orphanBadge;
            return `
          <button type="button" class="admin-nav-item ${activeTab === item.id ? 'active' : ''}" data-tab="${item.id}">
            ${ICONS[item.icon]}<span>${item.label}</span>${badge}
          </button>`;
          })
          .join('')}
      </nav>
      <div class="admin-sidebar-foot">
        ${renderLangSwitcher()}
        <div class="admin-user-chip">
          <span class="admin-user-avatar">${escapeHtml(getUserInitial(user))}</span>
          <div class="admin-user-meta"><strong>${escapeHtml(user.displayName || 'Admin')}</strong><span>${escapeHtml(user.email || '')}</span></div>
        </div>
        <a href="/app" class="admin-foot-link">${ICONS.app} ${t('sidebar.members')}</a>
        <button type="button" class="admin-foot-logout" id="admin-logout">${ICONS.logout} ${t('sidebar.logout')}</button>
      </div>
    </aside>
  `;
}

export function renderShell(props) {
  const {
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
  } = props;
  const meta = getViewMeta()[activeTab] || getViewMeta().dashboard;
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

  document.body.classList.toggle('admin-sidebar-open', Boolean(sidebarOpen));

  return `
    <div class="admin-layout">
      <div class="admin-sidebar-overlay ${sidebarOpen ? 'visible' : ''}" data-close-sidebar></div>
      ${renderSidebar(activeTab, users, user, sidebarOpen)}
      <div class="admin-main">
        <header class="admin-header">
          <button type="button" class="admin-menu-btn" id="admin-menu-toggle" aria-label="Menu">${ICONS.menu}</button>
          <div class="admin-header-titles"><h1>${meta.title}</h1><p>${meta.subtitle}</p></div>
        </header>
        <main class="admin-content"><div class="admin-content-inner">${content}</div></main>
      </div>
      ${detailUser ? renderUserDrawer(detailUser) : ''}
    </div>
  `;
}
