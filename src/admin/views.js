import { PRODUCTS, isPendingStatus, profileStatus } from '../lib/products.js';
import { getEnabledLines } from '../lib/product-lines.js';
import { getContentSettings } from '../lib/content-settings.js';
import { getExperiments } from '../lib/experiments.js';
import { getAdminAllowlist } from '../lib/admin-access.js';
import { WHATSAPP_NUMBERS } from '../lib/whatsapp-numbers.js';
import { ICONS } from './icons.js';
import { escapeHtml, formatDate, formatDateTime, getUserInitial } from './helpers.js';
import {
  ADMIN_LANGS,
  getAdminLang,
  getCodeTypes,
  getLineFilters,
  getNavItems,
  getUserFilters,
  getViewMeta,
  productLabel,
  t,
} from './i18n.js';

export function getStats(users) {
  const pendingKit = users.filter((u) => profileStatus(u) === 'pending_kit').length;
  const pendingUpsell = users.filter((u) => profileStatus(u) === 'pending_upsell').length;
  return {
    total: users.length,
    pending: pendingKit + pendingUpsell,
    pendingKit,
    pendingUpsell,
    active: users.filter((u) => profileStatus(u) === 'active' || u.isAdmin).length,
    premium: users.filter((u) => u.hasPremium || u.hasPostresPremium).length,
    orphans: users.filter((u) => u.missingProfile).length,
  };
}

export function filterUsers(users, userFilter, userSearch) {
  let list = users;
  switch (userFilter) {
    case 'pending':
      list = list.filter((u) => isPendingStatus(profileStatus(u)));
      break;
    case 'pending_kit':
      list = list.filter((u) => profileStatus(u) === 'pending_kit');
      break;
    case 'pending_upsell':
      list = list.filter((u) => profileStatus(u) === 'pending_upsell');
      break;
    case 'active':
      list = list.filter((u) => profileStatus(u) === 'active' || u.isAdmin);
      break;
    case 'premium':
      list = list.filter((u) => u.hasPremium || u.hasPostresPremium);
      break;
    case 'paletas':
      list = list.filter((u) => u.hasKit || u.hasPremium);
      break;
    case 'postres':
      list = list.filter((u) => u.hasPostres || u.hasPostresPremium);
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
  const badges = [];
  if (status === 'admin') badges.push(`<span class="admin-badge admin">${t('status.admin')}</span>`);
  else if (status === 'orphan') badges.push(`<span class="admin-badge warn">${t('status.orphan')}</span>`);
  else if (status === 'active') badges.push(`<span class="admin-badge active">${t('status.active')}</span>`);
  else if (status === 'pending_upsell') {
    badges.push(`<span class="admin-badge pending">${t('status.pending_upsell')}</span>`);
  } else if (status === 'pending_kit') {
    badges.push(`<span class="admin-badge pending">${t('status.pending_kit')}</span>`);
  } else {
    badges.push(`<span class="admin-badge pending">${t('status.pending')}</span>`);
  }
  if (user.needsPasswordSetup) {
    badges.push(`<span class="admin-badge warn">${t('status.noPassword')}</span>`);
  }
  return `<div class="admin-pill-row">${badges.join('')}</div>`;
}

function renderLineFilter(activeLine) {
  return `
    <div class="admin-line-filter" role="group" aria-label="Line">
      ${getLineFilters()
        .map(
          (f) => `
        <button type="button" class="admin-line-chip ${activeLine === f.id ? 'active' : ''}" data-line-filter="${f.id}">
          ${escapeHtml(f.label)}
        </button>`
        )
        .join('')}
    </div>
  `;
}

export function renderStatsGrid(stats, analytics) {
  const kpis = analytics?.kpis || {};
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
        <span class="admin-stat-label">${t('stat.pendingKit')}</span>
        <span class="admin-stat-value">${stats.pendingKit}</span>
      </div>
      <div class="admin-stat accent-gold">
        <span class="admin-stat-label">${t('stat.pendingUpsell')}</span>
        <span class="admin-stat-value">${stats.pendingUpsell}</span>
      </div>
      <div class="admin-stat accent-blue">
        <span class="admin-stat-label">${t('stat.visitsToday')}</span>
        <span class="admin-stat-value">${analytics?.todayTotal ?? kpis.pageViewsToday ?? 0}</span>
      </div>
      <div class="admin-stat accent-pink">
        <span class="admin-stat-label">${t('stat.waToday')}</span>
        <span class="admin-stat-value">${kpis.whatsappToday || 0}</span>
      </div>
      <div class="admin-stat accent-purple">
        <span class="admin-stat-label">${t('stat.checkoutToday')}</span>
        <span class="admin-stat-value">${kpis.checkoutToday || 0}</span>
      </div>
      <div class="admin-stat">
        <span class="admin-stat-label">${t('stat.appOpenToday')}</span>
        <span class="admin-stat-value">${kpis.appOpenToday || 0}</span>
      </div>
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
        <button type="button" class="admin-btn sm ghost" data-bulk-product="postres_kit" data-value="0">${t('bulk.removePostres')}</button>
        <button type="button" class="admin-btn sm success" data-bulk-product="postres_premium" data-value="1">${t('bulk.addPostresPremium')}</button>
        <button type="button" class="admin-btn sm ghost" data-bulk-product="postres_premium" data-value="0">${t('bulk.removePostresPremium')}</button>
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

  const hasPending =
    user.premiumPending?.paletas || user.premiumPending?.postres;

  const audioValue =
    user.audioGuideEnabled === true ? 'on' : user.audioGuideEnabled === false ? 'off' : 'inherit';
  const menuWebValue =
    user.menuWebEnabled === true ? 'on' : user.menuWebEnabled === false ? 'off' : 'inherit';

  const canResendPaletas = user.hasKit && user.email;
  const canResendPostres = user.hasPostres && user.email;
  const isSelf = user.id === window.__adminSelfUid;

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
        ${user.needsPasswordSetup ? `<div class="admin-alert info">${t('drawer.noPassword')}</div>` : ''}
        ${
          user.lastGrantSource || user.lastGrantAt
            ? `<div class="admin-drawer-meta-note">
                <div><span>${t('drawer.grantSource')}:</span> <strong>${escapeHtml(user.lastGrantSource || '—')}</strong></div>
                <div><span>${t('drawer.grantAt')}:</span> <strong>${formatDateTime(user.lastGrantAt)}</strong></div>
              </div>`
            : ''
        }
        <div class="admin-detail-grid">
          <div><span>UID</span><code>${escapeHtml(user.id)}</code></div>
          <div><span>${t('drawer.origin')}</span><strong>${escapeHtml(user.registeredFrom || '—')}</strong></div>
          <div><span>${t('drawer.line')}</span><strong>${escapeHtml(user.registeredLine || user.lastActiveLine || '—')}</strong></div>
          <div><span>${t('drawer.registered')}</span><strong>${formatDateTime(user.createdAt)}</strong></div>
          <div><span>${t('drawer.lastLogin')}</span><strong>${formatDateTime(user.lastLoginAt)}</strong></div>
        </div>
        <h3>${t('drawer.products')}</h3>
        <div class="admin-toggle-list">${productToggles}</div>
        <h3>${t('drawer.audioTitle')}</h3>
        <label class="admin-toggle-row">
          <div>
            <strong>${t('drawer.audioTitle')}</strong>
            <span class="admin-toggle-hint">${t('content.audioGuideOpenHint')}</span>
          </div>
          <select class="admin-select-inline" data-drawer-audio="${user.id}">
            <option value="inherit" ${audioValue === 'inherit' ? 'selected' : ''}>${t('drawer.audioInherit')}</option>
            <option value="on" ${audioValue === 'on' ? 'selected' : ''}>${t('drawer.audioOn')}</option>
            <option value="off" ${audioValue === 'off' ? 'selected' : ''}>${t('drawer.audioOff')}</option>
          </select>
        </label>
        <h3>${t('drawer.menuWebTitle')}</h3>
        <label class="admin-toggle-row">
          <div>
            <strong>${t('drawer.menuWebTitle')}</strong>
            <span class="admin-toggle-hint">${t('content.menuWebOpenHint')}</span>
          </div>
          <select class="admin-select-inline" data-drawer-menu-web="${user.id}">
            <option value="inherit" ${menuWebValue === 'inherit' ? 'selected' : ''}>${t('drawer.menuWebInherit')}</option>
            <option value="on" ${menuWebValue === 'on' ? 'selected' : ''}>${t('drawer.menuWebOn')}</option>
            <option value="off" ${menuWebValue === 'off' ? 'selected' : ''}>${t('drawer.menuWebOff')}</option>
          </select>
        </label>
        <div class="admin-drawer-actions">
          ${
            hasPending
              ? `<button type="button" class="admin-btn ghost" data-clear-pending="${user.id}">${t('drawer.clearPending')}</button>`
              : ''
          }
          ${
            canResendPaletas
              ? `<button type="button" class="admin-btn ghost" data-resend-email="${user.id}" data-email="${escapeHtml(user.email)}" data-name="${escapeHtml(user.displayName || '')}" data-line="paletas">${ICONS.mailSend} ${t('drawer.resendEmail')}</button>`
              : ''
          }
          ${
            canResendPostres
              ? `<button type="button" class="admin-btn ghost" data-resend-email="${user.id}" data-email="${escapeHtml(user.email)}" data-name="${escapeHtml(user.displayName || '')}" data-line="postres">${ICONS.mailSend} ${t('drawer.resendEmailPostres')}</button>`
              : ''
          }
          ${
            !user.isAdmin && !isSelf
              ? `<button type="button" class="admin-btn ghost" data-user-admin="${user.id}">${t('drawer.makeAdmin')}</button>`
              : ''
          }
          ${
            user.isAdmin && !isSelf
              ? `<button type="button" class="admin-btn ghost" data-user-demote="${user.id}">${t('drawer.removeAdmin')}</button>`
              : ''
          }
          ${
            !user.isAdmin && !isSelf
              ? `<button type="button" class="admin-btn danger" data-user-delete="${user.id}" data-email="${escapeHtml(user.email || '')}">${ICONS.trash} ${t('drawer.delete')}</button>`
              : ''
          }
        </div>
      </div>
    </aside>
  `;
}

function renderHistoryBars(history) {
  if (!history?.length) return '';
  const max = Math.max(...history.map((d) => d.total || 0), 1);
  return `
    <div class="admin-card">
      <div class="admin-card-head"><h2>${t('analytics.last14')}</h2></div>
      <div class="admin-card-body">
        <div class="admin-history-bars">
          ${history
            .slice()
            .reverse()
            .map((day) => {
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
    </div>`;
}

export function renderAnalyticsView(analytics, lineFilter = 'all', users = []) {
  if (!analytics) {
    return `<div class="admin-card"><div class="admin-card-body"><p class="admin-table-empty">${t('analytics.loading')}</p></div></div>`;
  }

  const pages = analytics.pages || [];
  const history = analytics.history || [];
  const ctas = analytics.ctas || [];
  const whatsapp = analytics.whatsapp || [];
  const kpis = analytics.kpis || {};

  return `
    ${renderLineFilter(lineFilter)}
    ${renderStatsGrid(getStats(users), analytics)}
    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-head"><h2>${t('analytics.events')}</h2></div>
        <div class="admin-card-body">
          <div class="admin-kpi-list">
            <div><span>Page views</span><strong>${kpis.pageViewsToday || 0}</strong></div>
            <div><span>CTA</span><strong>${kpis.ctaToday || 0}</strong></div>
            <div><span>WhatsApp</span><strong>${kpis.whatsappToday || 0}</strong></div>
            <div><span>Checkout</span><strong>${kpis.checkoutToday || 0}</strong></div>
            <div><span>Register</span><strong>${kpis.registerToday || 0}</strong></div>
            <div><span>Login</span><strong>${kpis.loginToday || 0}</strong></div>
            <div><span>App open</span><strong>${kpis.appOpenToday || 0}</strong></div>
          </div>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-head"><h2>${t('analytics.funnel')}</h2></div>
        <div class="admin-card-body">
          <div class="admin-funnel">
            <div class="admin-funnel-step"><span>LP</span><strong>${pages.filter((p) => p.key === 'home' || p.key === 'postres').reduce((s, p) => s + (p.today || 0), 0)}</strong></div>
            <div class="admin-funnel-step"><span>Upsell</span><strong>${pages.filter((p) => String(p.key).startsWith('upsell')).reduce((s, p) => s + (p.today || 0), 0)}</strong></div>
            <div class="admin-funnel-step"><span>Registro</span><strong>${kpis.registerToday || 0}</strong></div>
            <div class="admin-funnel-step"><span>App</span><strong>${kpis.appOpenToday || 0}</strong></div>
          </div>
        </div>
      </div>
    </div>
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
                  <td><code>${escapeHtml(p.path || '—')}</code></td>
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
    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-head"><h2>${t('analytics.ctas')}</h2></div>
        <div class="admin-card-body">
          ${
            ctas.length
              ? ctas
                  .slice(0, 8)
                  .map(
                    (c) => `
            <div class="admin-traffic-row">
              <div><strong>${escapeHtml(c.key)}</strong><span>${escapeHtml(c.line || '—')}</span></div>
              <span class="admin-metric today">${c.today || 0}</span>
            </div>`
                  )
                  .join('')
              : `<p class="admin-table-empty">—</p>`
          }
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-head"><h2>${t('analytics.whatsapp')}</h2></div>
        <div class="admin-card-body">
          ${
            whatsapp.length
              ? whatsapp
                  .map(
                    (w) => `
            <div class="admin-traffic-row">
              <div><strong>${escapeHtml(w.key)}</strong><span>${escapeHtml(w.purpose || w.line || '—')}</span></div>
              <span class="admin-metric today">${w.today || 0}</span>
            </div>`
                  )
                  .join('')
              : `<p class="admin-table-empty">—</p>`
          }
        </div>
      </div>
    </div>
    ${renderHistoryBars(history)}
  `;
}

function renderInboxRow(user, kind) {
  const name = escapeHtml(user.displayName || t('table.noName'));
  const email = escapeHtml(user.email || '—');
  let actions = `
    <button type="button" class="admin-btn sm ghost" data-user-view="${user.id}">${t('inbox.open')}</button>
  `;

  if (kind === 'kit') {
    const preferPostres = user.registeredLine === 'postres' || user.lastActiveLine === 'postres';
    actions = `
      <button type="button" class="admin-btn sm success" data-inbox-grant="${user.id}" data-product="${preferPostres ? 'postres_kit' : 'paletas_kit'}">${preferPostres ? t('inbox.grantPostres') : t('inbox.grantPaletas')}</button>
      <button type="button" class="admin-btn sm ghost" data-inbox-grant="${user.id}" data-product="${preferPostres ? 'paletas_kit' : 'postres_kit'}">${preferPostres ? t('inbox.grantPaletas') : t('inbox.grantPostres')}</button>
      ${actions}
    `;
  } else if (kind === 'upsell') {
    const products = [];
    if (user.premiumPending?.paletas && user.hasKit && !user.hasPremium) products.push('paletas_premium');
    if (user.premiumPending?.postres && user.hasPostres && !user.hasPostresPremium) products.push('postres_premium');
    if (!products.length) {
      if (user.hasKit && !user.hasPremium) products.push('paletas_premium');
      if (user.hasPostres && !user.hasPostresPremium) products.push('postres_premium');
    }
    actions = `
      ${products
        .map(
          (pid) =>
            `<button type="button" class="admin-btn sm success" data-inbox-grant="${user.id}" data-product="${pid}">${t('inbox.grantPremium')}${products.length > 1 ? ` · ${pid.includes('postres') ? 'Postres' : 'Paletas'}` : ''}</button>`
        )
        .join('')}
      ${actions}
    `;
  }

  return `
    <div class="admin-inbox-row">
      <div class="admin-inbox-user">
        <strong>${name}</strong>
        <span>${email}</span>
      </div>
      <div class="admin-inbox-actions">${actions}</div>
    </div>
  `;
}

export function renderDashboardView(users, analytics, lineFilter = 'all') {
  const stats = getStats(users);
  const pendingKit = users.filter((u) => profileStatus(u) === 'pending_kit').slice(0, 8);
  const pendingUpsell = users.filter((u) => profileStatus(u) === 'pending_upsell').slice(0, 8);

  return `
    <div class="admin-attention" role="group" aria-label="${escapeHtml(t('inbox.attention'))}">
      <button type="button" class="admin-attention-card danger" data-tab="users" data-set-filter="pending_kit">
        <strong>${stats.pendingKit}</strong>
        <span>${t('inbox.pendingKit')}</span>
      </button>
      <button type="button" class="admin-attention-card warn" data-tab="users" data-set-filter="pending_upsell">
        <strong>${stats.pendingUpsell}</strong>
        <span>${t('inbox.pendingUpsell')}</span>
      </button>
      <button type="button" class="admin-attention-card" data-tab="users" data-set-filter="orphan">
        <strong>${stats.orphans}</strong>
        <span>${t('inbox.orphans')}</span>
      </button>
      <button type="button" class="admin-attention-card" data-tab="users" data-set-filter="active">
        <strong>${stats.active}</strong>
        <span>${t('stat.active')}</span>
      </button>
    </div>

    ${
      stats.orphans
        ? `<div class="admin-alert warn">${t('dashboard.orphanWarn', { n: stats.orphans })}</div>`
        : ''
    }

    <div class="admin-grid-2">
      <div class="admin-card">
        <div class="admin-card-head">
          <div><h2>${t('dashboard.pendingKitTitle')}</h2><p>${t('dashboard.pendingKitSub')}</p></div>
          <button type="button" class="admin-btn ghost" data-tab="users" data-set-filter="pending_kit">${t('dashboard.viewAll')}</button>
        </div>
        <div class="admin-card-body flush">
          ${
            pendingKit.length
              ? `<div class="admin-inbox-list">${pendingKit.map((u) => renderInboxRow(u, 'kit')).join('')}</div>`
              : `<p class="admin-table-empty" style="padding:16px">${t('inbox.emptyKit')}</p>`
          }
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-head">
          <div><h2>${t('dashboard.pendingUpsellTitle')}</h2><p>${t('dashboard.pendingUpsellSub')}</p></div>
          <button type="button" class="admin-btn ghost" data-tab="users" data-set-filter="pending_upsell">${t('dashboard.viewAll')}</button>
        </div>
        <div class="admin-card-body flush">
          ${
            pendingUpsell.length
              ? `<div class="admin-inbox-list">${pendingUpsell.map((u) => renderInboxRow(u, 'upsell')).join('')}</div>`
              : `<p class="admin-table-empty" style="padding:16px">${t('inbox.emptyUpsell')}</p>`
          }
        </div>
      </div>
    </div>

    ${renderLineFilter(lineFilter)}
    <div class="admin-card">
      <div class="admin-card-head"><div><h2>${t('inbox.trafficSecondary')}</h2><p>${t('dashboard.trafficSub')}</p></div></div>
      <div class="admin-card-body">
        ${
          analytics?.pages?.length
            ? analytics.pages
                .slice(0, 6)
                .map(
                  (p) => `
            <div class="admin-traffic-row">
              <div><strong>${escapeHtml(p.label)}</strong><span>${escapeHtml(p.path || '')}</span></div>
              <span class="admin-metric today">${p.today || 0}</span>
            </div>`
                )
                .join('')
            : `<p class="admin-table-empty">${t('dashboard.noTraffic')}</p>`
        }
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
                      <button type="button" class="admin-btn sm ghost copy-btn" data-copy="${encodeURIComponent(code.code)}" title="${t('codes.code')}">${ICONS.copy}</button>
                      <button type="button" class="admin-btn sm ghost" data-copy-code-link="${escapeHtml(code.code)}" data-code-type="${escapeHtml(code.type)}" title="${t('codes.copyLink')}">${t('codes.copyLink')}</button>
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

export function renderContentView() {
  const settings = getContentSettings();
  const experiments = getExperiments();
  const entry = experiments.paletas?.entry || { enabled: false, quizPercent: 0 };
  const quizPct = Number(entry.quizPercent) || 0;
  const lpPct = 100 - quizPct;
  const lines = getEnabledLines().filter((line) => line.sellable);
  const adminEmails = getAdminAllowlist();

  return `
    <div class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>${t('content.adminsTitle')}</h2>
          <p class="admin-hint">${t('content.adminsHint')}</p>
        </div>
      </div>
      <div class="admin-card-body">
        <form id="admin-emails-form" class="admin-emails-form">
          <label class="admin-field">
            <span>${t('content.adminEmails')}</span>
            <textarea id="admin-emails-input" rows="4" placeholder="tu@correo.com">${escapeHtml(adminEmails.join('\n'))}</textarea>
          </label>
          <button type="submit" class="admin-btn primary">${t('content.saveAdmins')}</button>
        </form>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>${t('content.abTitle')}</h2>
          <p class="admin-hint">${t('content.abHint')}</p>
        </div>
      </div>
      <div class="admin-card-body">
        <label class="admin-toggle-row">
          <span>
            ${t('content.abEnabled')}
            <span class="admin-toggle-hint">${t('content.abEnabledHint')}</span>
          </span>
          <input type="checkbox" id="ab-paletas-enabled" data-ab-enabled ${entry.enabled ? 'checked' : ''}>
        </label>
        <label class="admin-field admin-ab-percent">
          <span>${t('content.abQuizPercent')}</span>
          <div class="admin-ab-range-row">
            <input
              type="range"
              id="ab-paletas-quiz-percent"
              data-ab-quiz-percent
              min="0"
              max="100"
              step="5"
              value="${quizPct}"
              ${entry.enabled ? '' : 'disabled'}
            >
            <input
              type="number"
              id="ab-paletas-quiz-number"
              data-ab-quiz-number
              min="0"
              max="100"
              step="1"
              value="${quizPct}"
              ${entry.enabled ? '' : 'disabled'}
            >
            <span class="admin-ab-unit">%</span>
          </div>
          <p class="admin-hint" id="ab-paletas-split-label" data-ab-split-label>
            ${t('content.abSplit', { quiz: String(quizPct), lp: String(lpPct) })}
          </p>
        </label>
        <p class="admin-hint">${t('content.abOverrides')}</p>
        <button type="button" class="admin-btn primary" id="ab-paletas-save" data-ab-save>
          ${t('content.abSave')}
        </button>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>${t('meta.content.title')}</h2>
          <p class="admin-hint">${t('content.hint')}</p>
        </div>
      </div>
      <div class="admin-card-body">
        <div class="admin-content-grid">
          ${lines
            .map((line) => {
              const flags = settings.lines[line.id] || {};
              return `
            <div class="admin-content-line-card">
              <div class="admin-content-line-head">
                <span class="admin-content-line-emoji" aria-hidden="true">${line.emoji}</span>
                <div>
                  <strong>${escapeHtml(t(`content.line.${line.id}`))}</strong>
                  <p>${escapeHtml(line.kitName)}</p>
                </div>
              </div>
              <label class="admin-toggle-row">
                <span>
                  ${t('content.kitOpen')}
                  <span class="admin-toggle-hint">${t('content.kitOpenHint')}</span>
                </span>
                <input type="checkbox" data-content-flag="kitOpen" data-content-line="${line.id}" ${flags.kitOpen !== false ? 'checked' : ''}>
              </label>
              <label class="admin-toggle-row">
                <span>
                  ${t('content.premiumOpen')}
                  <span class="admin-toggle-hint">${t('content.premiumOpenHint')}</span>
                </span>
                <input type="checkbox" data-content-flag="premiumOpen" data-content-line="${line.id}" ${flags.premiumOpen !== false ? 'checked' : ''}>
              </label>
              <label class="admin-toggle-row">
                <span>
                  ${t('content.audioGuideOpen')}
                  <span class="admin-toggle-hint">${t('content.audioGuideOpenHint')}</span>
                </span>
                <input type="checkbox" data-content-flag="audioGuideOpen" data-content-line="${line.id}" ${flags.audioGuideOpen !== false ? 'checked' : ''}>
              </label>
              <label class="admin-toggle-row">
                <span>
                  ${t('content.menuWebOpen')}
                  <span class="admin-toggle-hint">${t('content.menuWebOpenHint')}</span>
                </span>
                <input type="checkbox" data-content-flag="menuWebOpen" data-content-line="${line.id}" ${flags.menuWebOpen === true ? 'checked' : ''}>
              </label>
            </div>
          `;
            })
            .join('')}
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>${t('content.audioTitle')}</h2>
          <p class="admin-hint">${t('content.audioHint')}</p>
        </div>
      </div>
      <div class="admin-card-body">
        <div class="admin-audio-test">
          <button type="button" class="admin-btn primary" id="admin-tts-test">${t('content.audioTest')}</button>
          <p class="admin-hint" id="admin-tts-status" role="status" aria-live="polite"></p>
        </div>
      </div>
    </div>
  `;
}

export function renderChannelsView(kiwifySubTab, kiwifyContent, analytics) {
  const waClicks = Object.fromEntries((analytics?.whatsapp || []).map((w) => [w.key, w.today || 0]));

  return `
    <div class="admin-card">
      <div class="admin-card-head">
        <div><h2>${t('channels.whatsapp')}</h2><p>${t('channels.whatsappSub')}</p></div>
      </div>
      <div class="admin-card-body flush">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>${t('channels.id')}</th>
                <th>${t('channels.number')}</th>
                <th>${t('channels.line')}</th>
                <th>${t('channels.purpose')}</th>
                <th>${t('channels.clicksToday')}</th>
              </tr>
            </thead>
            <tbody>
              ${WHATSAPP_NUMBERS.map(
                (n) => `
                <tr>
                  <td><code>${escapeHtml(n.id)}</code></td>
                  <td><strong>${escapeHtml(n.display)}</strong></td>
                  <td>${escapeHtml(n.line)}</td>
                  <td>${escapeHtml(n.purpose)}</td>
                  <td><span class="admin-metric today">${waClicks[n.id] || 0}</span></td>
                </tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="admin-card">
      <div class="admin-card-head"><h2>${t('channels.kiwify')}</h2></div>
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
      ${ADMIN_LANGS.map(
        (lang) => `
        <button
          type="button"
          class="admin-lang-btn ${current === lang.id ? 'active' : ''}"
          data-admin-lang="${lang.id}"
          title="${escapeHtml(lang.title)}"
          aria-label="${escapeHtml(lang.title)}"
        >${escapeHtml(lang.short)}</button>`
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
          <div class="admin-brand-mark">Ops</div>
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
        <div class="admin-foot-user">
          <span class="admin-user-avatar">${escapeHtml(getUserInitial(user))}</span>
          <div class="admin-user-meta">
            <strong>${escapeHtml(user.displayName || 'Admin')}</strong>
            <span>${escapeHtml(user.email || '')}</span>
          </div>
        </div>
        <div class="admin-foot-actions">
          ${renderLangSwitcher()}
          <a href="/app" class="admin-foot-link" title="${t('sidebar.app')}">${ICONS.app}<span>${t('sidebar.app')}</span></a>
          <button type="button" class="admin-foot-logout" id="admin-logout" title="${t('sidebar.logout')}">${ICONS.logout}<span>${t('sidebar.logout')}</span></button>
        </div>
      </div>
    </aside>
  `;
}

function renderApiWarnings(apiWarnings = []) {
  if (!apiWarnings?.length) return '';
  const labels = {
    firebaseAdmin: t('warn.firebaseAdmin'),
    localApi: t('warn.localApi'),
    usersApi: t('warn.usersApi'),
    analyticsApi: t('warn.analyticsApi'),
  };

  const items = apiWarnings
    .map((warning) => labels[warning.id] || warning.message || warning.id)
    .filter(Boolean);

  if (!items.length) return '';

  return `
    <div class="admin-api-warnings">
      ${items.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}
    </div>
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
    lineFilter = 'all',
    apiWarnings = [],
  } = props;
  const meta = getViewMeta()[activeTab] || getViewMeta().dashboard;
  let content = '';

  switch (activeTab) {
    case 'users':
      content = renderUsersView(users, selectedIds, userFilter, userSearch);
      break;
    case 'analytics':
      content = renderAnalyticsView(analytics, lineFilter, users);
      break;
    case 'codes':
      content = renderCodesView(codes);
      break;
    case 'content':
      content = renderContentView();
      break;
    case 'channels':
      content = renderChannelsView(kiwifySubTab, kiwifyContent, analytics);
      break;
    default:
      content = renderDashboardView(users, analytics, lineFilter);
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
        <main class="admin-content">
          <div class="admin-content-inner">
            ${renderApiWarnings(apiWarnings)}
            ${content}
          </div>
        </main>
      </div>
      ${renderUserDrawer(detailUser)}
    </div>
  `;
}
