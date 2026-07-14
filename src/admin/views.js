import { PRODUCTS, isPendingStatus, profileStatus } from '../lib/products.js';
import { getEnabledLines } from '../lib/product-lines.js';
import { getContentSettings } from '../lib/content-settings.js';
import { getExperiments } from '../lib/experiments.js';
import { getAdminAllowlist } from '../lib/admin-access.js';
import { WHATSAPP_NUMBERS } from '../lib/whatsapp-numbers.js';
import {
  HOTMART_WEBHOOK_URL,
  getAdminEmailTemplate,
  listEmailTemplates,
} from './email-templates.js';
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

function insightWinnerLabel(winner) {
  if (winner === 'quiz') return t('dashboard.insightsWinnerQuiz');
  if (winner === 'lp') return t('dashboard.insightsWinnerLp');
  if (winner === 'tie') return t('dashboard.insightsWinnerTie');
  if (winner === 'early') return t('dashboard.insightsWinnerEarly');
  return t('dashboard.insightsWinnerNone');
}

function insightWinnerClass(winner) {
  if (winner === 'quiz' || winner === 'lp') return 'win';
  if (winner === 'tie') return 'tie';
  if (winner === 'early') return 'early';
  return 'none';
}

function formatInsightBullet(bullet) {
  const params = { ...(bullet.params || {}) };
  if (params.winner) {
    params.winner = t(`insight.winner.${params.winner}`) || params.winner;
  }
  return t(`insight.bullet.${bullet.id}`, params);
}

function renderInsightsBlock(analytics) {
  let insights = analytics?.insights;
  if (!insights && analytics?.kpis) {
    // Client fallback if API omitted insights (older deploy / partial payload)
    const k = analytics.kpis;
    const views = Number(k.pageViewsToday) || 0;
    const sales = Number(k.salesToday) || 0;
    const checkout = Number(k.checkoutToday) || 0;
    insights = {
      headline: sales > 0 ? 'sales_ok' : views > 0 ? 'traffic_no_sales' : 'quiet_day',
      headlineParams: { sales, checkout, views },
      bullets: [
        {
          id: 'traffic_snapshot',
          params: {
            views,
            checkout,
            wa: Number(k.whatsappToday) || 0,
            sales,
          },
        },
        {
          id: 'sales_by_line',
          params: {
            paletas: Number(analytics.salesByLine?.paletas?.period) || 0,
            postres: Number(analytics.salesByLine?.postres?.period) || 0,
            minipostres: Number(analytics.salesByLine?.minipostres?.period) || 0,
          },
        },
      ],
      suggestions: [],
      ab: { winner: 'none', lpAssign: 0, quizAssign: 0 },
    };
  }

  if (!insights) {
    return `
      <section class="admin-insights" aria-label="${escapeHtml(t('dashboard.insightsTitle'))}">
        <div class="admin-insights-head">
          <div>
            <h2>${t('dashboard.insightsTitle')}</h2>
            <p>${t('dashboard.insightsSub')}</p>
          </div>
        </div>
        <p class="admin-insights-empty">${t('dashboard.insightsLoading')}</p>
      </section>
    `;
  }

  const headline = t(`insight.headline.${insights.headline}`, insights.headlineParams || {});
  const bullets = Array.isArray(insights.bullets) ? insights.bullets : [];
  const suggestions = Array.isArray(insights.suggestions) ? insights.suggestions : [];
  const ab = insights.ab || {};
  const winner = ab.winner || 'none';
  const showAb = (Number(ab.lpAssign) || 0) + (Number(ab.quizAssign) || 0) > 0;

  return `
    <section class="admin-insights" aria-label="${escapeHtml(t('dashboard.insightsTitle'))}">
      <div class="admin-insights-head">
        <div>
          <h2>${t('dashboard.insightsTitle')}</h2>
          <p>${t('dashboard.insightsSub')}</p>
        </div>
        <button type="button" class="admin-btn ghost" data-tab="funnel">${t('dashboard.insightsOpenFunnel')}</button>
      </div>
      <p class="admin-insights-headline">${escapeHtml(headline)}</p>
      ${
        bullets.length
          ? `<ul class="admin-insights-bullets">${bullets
              .map((b) => `<li>${escapeHtml(formatInsightBullet(b))}</li>`)
              .join('')}</ul>`
          : ''
      }
      ${
        suggestions.length
          ? `<div class="admin-insights-suggest">
              <h3>${t('dashboard.insightsSuggestions')}</h3>
              <ul>${suggestions
                .map(
                  (s) => `
                <li class="severity-${escapeHtml(s.severity || 'med')}">${escapeHtml(
                  t(`insight.suggest.${s.id}`, s.params || {}),
                )}</li>`
                )
                .join('')}</ul>
            </div>`
          : ''
      }
      ${
        showAb
          ? `<div class="admin-insights-ab">
              <div class="admin-insights-ab-head">
                <strong>${t('dashboard.insightsAbCompare')}</strong>
                <span class="admin-insights-badge ${insightWinnerClass(winner)}">${escapeHtml(
                  insightWinnerLabel(winner),
                )}</span>
              </div>
              <div class="admin-insights-ab-grid">
                <div class="admin-insights-ab-arm ${winner === 'lp' ? 'is-winner' : ''}">
                  <span class="admin-insights-ab-label">${t('dashboard.insightsWinnerLp')}</span>
                  <div class="admin-insights-ab-metrics">
                    <span><em>${t('dashboard.insightsAbAssign')}</em> ${ab.lpAssign || 0}</span>
                    <span><em>${t('dashboard.insightsAbCheckout')}</em> ${ab.lpCheckout || 0}</span>
                    <span><em>${t('dashboard.insightsAbPurchase')}</em> ${ab.lpPurchase || 0}</span>
                    <span><em>${t('dashboard.insightsAbCvr')}</em> ${ab.lpCvr || 0}%</span>
                  </div>
                </div>
                <div class="admin-insights-ab-arm ${winner === 'quiz' ? 'is-winner' : ''}">
                  <span class="admin-insights-ab-label">${t('dashboard.insightsWinnerQuiz')}</span>
                  <div class="admin-insights-ab-metrics">
                    <span><em>${t('dashboard.insightsAbAssign')}</em> ${ab.quizAssign || 0}</span>
                    <span><em>${t('dashboard.insightsAbCheckout')}</em> ${ab.quizCheckout || 0}</span>
                    <span><em>${t('dashboard.insightsAbPurchase')}</em> ${ab.quizPurchase || 0}</span>
                    <span><em>${t('dashboard.insightsAbCvr')}</em> ${ab.quizCvr || 0}%</span>
                  </div>
                </div>
              </div>
            </div>`
          : ''
      }
    </section>
  `;
}

export function renderStatsGrid(stats, analytics) {
  const kpis = analytics?.kpis || {};
  return `
    <div class="admin-stats">
      <div class="admin-stat accent-green">
        <span class="admin-stat-label">${t('stat.salesToday')}</span>
        <span class="admin-stat-value">${kpis.salesToday ?? 0}</span>
        <span class="admin-stat-hint">${t('stat.salesTodayHint')}</span>
      </div>
      <div class="admin-stat">
        <span class="admin-stat-label">${t('stat.salesTotal')}</span>
        <span class="admin-stat-value">${kpis.salesTotal ?? 0}</span>
      </div>
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
        <span class="admin-stat-hint">${t('stat.checkoutTodayHint')}</span>
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
                <span>${escapeHtml(u.email || '-')}</span>
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
            <p>${escapeHtml(user.email || '-')}</p>
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
                <div><span>${t('drawer.grantSource')}:</span> <strong>${escapeHtml(user.lastGrantSource || '-')}</strong></div>
                <div><span>${t('drawer.grantAt')}:</span> <strong>${formatDateTime(user.lastGrantAt)}</strong></div>
              </div>`
            : ''
        }
        <div class="admin-detail-grid">
          <div><span>UID</span><code>${escapeHtml(user.id)}</code></div>
          <div><span>${t('drawer.origin')}</span><strong>${escapeHtml(user.registeredFrom || '-')}</strong></div>
          <div><span>${t('drawer.line')}</span><strong>${escapeHtml(user.registeredLine || user.lastActiveLine || '-')}</strong></div>
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
              ? `<button type="button" class="admin-btn ghost" data-resend-email="${user.id}" data-email="${escapeHtml(user.email)}" data-name="${escapeHtml(user.displayName || '')}" data-product="paletas_kit" data-line="paletas">${ICONS.mailSend} ${t('drawer.resendEmail')}</button>`
              : ''
          }
          ${
            canResendPostres
              ? `<button type="button" class="admin-btn ghost" data-resend-email="${user.id}" data-email="${escapeHtml(user.email)}" data-name="${escapeHtml(user.displayName || '')}" data-product="postres_kit" data-line="postres">${ICONS.mailSend} ${t('drawer.resendEmailPostres')}</button>`
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

  const kpis = analytics.kpis || {};
  const pages = analytics.pages || [];
  const history = analytics.history || [];
  const ctas = analytics.ctas || [];
  const whatsapp = analytics.whatsapp || [];

  return `
    ${renderLineFilter(lineFilter)}
    <div class="admin-card admin-card-accent admin-card-link">
      <div class="admin-card-body admin-card-body-row">
        <div>
          <h2>${t('analytics.abTitle')}</h2>
          <p class="admin-hint">${t('analytics.abMovedHint')}</p>
        </div>
        <button type="button" class="admin-btn sm primary" data-tab="funnel">${t('content.abResultsLink')}</button>
      </div>
    </div>
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
                  <td><code>${escapeHtml(p.path || '-')}</code></td>
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
              <div><strong>${escapeHtml(c.key)}</strong><span>${escapeHtml(c.line || '-')}</span></div>
              <span class="admin-metric today">${c.today || 0}</span>
            </div>`
                  )
                  .join('')
              : `<p class="admin-table-empty">-</p>`
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
              <div><strong>${escapeHtml(w.key)}</strong><span>${escapeHtml(w.purpose || w.line || '-')}</span></div>
              <span class="admin-metric today">${w.today || 0}</span>
            </div>`
                  )
                  .join('')
              : `<p class="admin-table-empty">-</p>`
          }
        </div>
      </div>
    </div>
    ${renderHistoryBars(history)}
  `;
}

function cell(metric) {
  if (!metric) return { today: 0, total: 0 };
  return {
    today: Number(metric.today) || 0,
    total: Number(metric.total) || 0,
  };
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

function pageMetric(pages, key) {
  const row = pages.find((p) => p.key === key);
  return { today: row?.today || 0, total: row?.total || 0 };
}

function renderQuizStepsChart(steps) {
  if (!steps?.length) return `<p class="admin-table-empty">-</p>`;
  return steps
    .map(
      (step, i) => `
    <div class="admin-quiz-step-row">
      <div class="admin-quiz-step-head">
        <span class="admin-quiz-step-idx">${i + 1}</span>
        <strong>${escapeHtml(step.label)}</strong>
        <span class="admin-quiz-step-count">
          <span class="admin-metric today">${step.today || 0}</span> / ${step.total || 0}
        </span>
        ${
          i > 0 && step.dropFromPrev > 0
            ? `<span class="admin-quiz-drop">−${step.dropFromPrev}%</span>`
            : ''
        }
      </div>
      <div class="admin-quiz-step-bar" aria-hidden="true"><span style="width:${step.pctOfMax || 0}%"></span></div>
    </div>`
    )
    .join('');
}

function formatLeadWhen(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return escapeHtml(String(iso));
    return escapeHtml(
      d.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  } catch {
    return escapeHtml(String(iso));
  }
}

function formatLeadAnswers(answers = {}) {
  const parts = ['experience', 'blocker', 'channel', 'start', 'victory']
    .map((k) => answers[k])
    .filter(Boolean);
  return parts.length ? escapeHtml(parts.join(' · ')) : '-';
}

export function renderDiagnosticoLeadsTable(leads) {
  if (!leads?.length) {
    return `<p class="admin-table-empty">${t('funnel.leadsEmpty')}</p>`;
  }
  const rows = leads
    .map((lead) => {
      const name = lead.skipped || !lead.name
        ? `<em class="admin-lead-skipped">${t('funnel.leadsSkipped')}</em>`
        : `<strong>${escapeHtml(lead.name)}</strong>`;
      return `
      <tr>
        <td>${name}</td>
        <td><code>${escapeHtml(lead.diagnosisId || '-')}</code></td>
        <td class="admin-lead-answers">${formatLeadAnswers(lead.answers)}</td>
        <td>${formatLeadWhen(lead.createdAt)}</td>
      </tr>`;
    })
    .join('');
  return `
    <div class="admin-table-wrap">
      <table class="admin-table admin-leads-table">
        <thead>
          <tr>
            <th>${t('funnel.leadsColName')}</th>
            <th>${t('funnel.leadsColDiag')}</th>
            <th>${t('funnel.leadsColAnswers')}</th>
            <th>${t('funnel.leadsColWhen')}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderCollapsibleCard({ id, title, hint = '', body, collapsed = true, accent = false }) {
  const open = collapsed ? '' : 'open';
  return `
    <details class="admin-card ${accent ? 'admin-card-accent' : ''} admin-collapse" data-collapse-id="${escapeHtml(id)}" ${open}>
      <summary class="admin-card-head admin-collapse-summary">
        <div>
          <h2>${title}</h2>
          ${hint ? `<p class="admin-hint">${hint}</p>` : ''}
        </div>
        <span class="admin-collapse-chevron" aria-hidden="true"></span>
      </summary>
      <div class="admin-card-body">${body}</div>
    </details>`;
}

function renderRangeFilter(activeRange = 'today') {
  const ranges = [
    ['today', t('funnel.rangeToday')],
    ['yesterday', t('funnel.rangeYesterday')],
    ['7d', t('funnel.range7d')],
    ['30d', t('funnel.range30d')],
    ['all', t('funnel.rangeAll')],
  ];
  return `
    <div class="admin-funnel-toolbar">
      <div class="admin-line-filter admin-range-filter" role="group" aria-label="Range">
        ${ranges
          .map(
            ([id, label]) => `
          <button type="button" class="admin-line-chip ${activeRange === id ? 'active' : ''}" data-date-range="${id}">
            ${escapeHtml(label)}
          </button>`
          )
          .join('')}
      </div>
      <button type="button" class="admin-btn sm ghost" data-funnel-refresh>
        ${ICONS.sync} ${t('funnel.refresh')}
      </button>
    </div>
    <p class="admin-hint admin-funnel-note">${t('funnel.periodVsTotal')} · ${t('funnel.dataNote')}</p>
  `;
}

function renderAbConfigCard(entry, dirty) {
  const quizPct = Number(entry.quizPercent) || 0;
  const lpPct = 100 - quizPct;
  const liveLabel = entry.enabled
    ? t('content.abLiveOn', { quiz: String(quizPct), lp: String(lpPct) })
    : t('content.abLiveOff');

  const body = `
        <div class="admin-collapse-live">
          <span class="admin-status-pill ${entry.enabled ? 'is-on' : ''}" data-ab-live-pill>${escapeHtml(liveLabel)}</span>
        </div>
        <label class="admin-toggle-row">
          <span>
            ${t('content.abEnabled')}
            <span class="admin-toggle-hint">${t('content.abEnabledHint')}</span>
          </span>
          <input type="checkbox" id="ab-paletas-enabled" data-ab-enabled data-funnel-dirty ${entry.enabled ? 'checked' : ''}>
        </label>
        <label class="admin-field admin-ab-percent">
          <span>${t('content.abQuizPercent')}</span>
          <div class="admin-ab-range-row">
            <input
              type="range"
              id="ab-paletas-quiz-percent"
              data-ab-quiz-percent
              data-funnel-dirty
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
              data-funnel-dirty
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
        <div class="admin-save-bar ${dirty ? 'is-dirty' : ''}" data-funnel-save-bar>
          <div class="admin-save-bar-copy">
            <strong data-funnel-save-status>${dirty ? t('content.dirty') : t('funnel.saveAbHint')}</strong>
          </div>
          <button type="button" class="admin-btn primary admin-save-bar-btn" data-funnel-save-ab ${dirty ? '' : 'disabled'}>
            ${t('funnel.saveAb')}
          </button>
        </div>`;

  return renderCollapsibleCard({
    id: 'ab-config',
    title: t('content.abTitle'),
    hint: t('content.abHint'),
    body,
    collapsed: true,
    accent: true,
  });
}

export function renderFunnelView(
  analytics,
  lineFilter = 'paletas',
  funnelDraft = null,
  dateRange = 'today',
  diagnosticoLeads = null,
) {
  if (!analytics) {
    return `<div class="admin-card"><div class="admin-card-body"><p class="admin-table-empty">${t('analytics.loading')}</p></div></div>`;
  }

  const pages = analytics.pages || [];
  const ctas = analytics.ctas || [];
  const whatsapp = analytics.whatsapp || [];
  const kpis = analytics.kpis || {};
  const abEntry = analytics.ab?.paletas?.entry || null;
  const funnel = analytics.funnel || {};
  const quizSteps = funnel.quizSteps || [];
  const dwell = funnel.dwell || {};
  const abandon = funnel.abandon || { today: 0, total: 0 };
  const showPaletasQuiz = lineFilter === 'paletas' || lineFilter === 'all';
  const isPostresOnly = lineFilter === 'postres';
  const range = analytics.range || dateRange || 'today';

  const home = pageMetric(pages, 'home');
  const quiz = pageMetric(pages, 'diagnostico');
  const postresLp = pageMetric(pages, 'postres');

  const welcomeStep = quizSteps.find((s) => s.id === 'welcome');
  const offerStep = quizSteps.find((s) => s.id === 'offer');
  const completePct =
    (welcomeStep?.today || 0) > 0
      ? Math.round(((offerStep?.today || 0) / welcomeStep.today) * 1000) / 10
      : 0;

  const experiments = getExperiments();
  const savedEntry = experiments.paletas?.entry || { enabled: false, quizPercent: 0 };
  const entry = funnelDraft?.ab
    ? {
        enabled: funnelDraft.ab.enabled === true,
        quizPercent: Number(funnelDraft.ab.quizPercent) || 0,
      }
    : savedEntry;
  const dirty = Boolean(funnelDraft?.dirty);

  const lpKpi = isPostresOnly ? postresLp : home;
  const quizKpi = isPostresOnly ? { today: 0, total: 0 } : quiz;

  const entryPages = pages.filter((p) => {
    if (isPostresOnly) return p.key === 'postres' || String(p.key).startsWith('upsell-postres');
    if (lineFilter === 'paletas') {
      return p.line === 'paletas' || p.key === 'home' || p.key === 'diagnostico';
    }
    return true;
  });

  const abResultsBody = abEntry
    ? `
        <div class="admin-ab-grid">
          ${renderAbArmColumn('LP', abEntry.lp)}
          ${renderAbArmColumn('Quiz', abEntry.quiz)}
        </div>
        <p class="admin-hint admin-ab-note">${t('analytics.abNote')}</p>`
    : `<p class="admin-hint">${t('analytics.abEmpty')}</p>`;

  return `
    ${renderLineFilter(lineFilter)}
    ${renderRangeFilter(range)}
    <div class="admin-funnel-kpis">
      <div class="admin-funnel-kpi" title="${escapeHtml(t('funnel.periodVsTotal'))}">
        <span>${isPostresOnly ? t('funnel.lpPages') : t('funnel.kpiViews')}</span>
        <strong><span class="admin-metric today">${lpKpi.today}</span> / ${lpKpi.total}</strong>
      </div>
      <div class="admin-funnel-kpi">
        <span>${t('funnel.kpiQuiz')}</span>
        <strong><span class="admin-metric today">${quizKpi.today}</span> / ${quizKpi.total}</strong>
      </div>
      <div class="admin-funnel-kpi" title="${escapeHtml(t('funnel.kpiCheckoutHint'))}">
        <span>${t('funnel.kpiCheckout')}</span>
        <strong><span class="admin-metric today">${kpis.checkoutToday || 0}</span> / ${kpis.checkoutTotal || 0}</strong>
        <small>${t('funnel.kpiCheckoutHint')}</small>
      </div>
      <div class="admin-funnel-kpi" title="${escapeHtml(t('stat.salesTodayHint'))}">
        <span>${t('stat.salesToday')}</span>
        <strong><span class="admin-metric today">${kpis.salesToday || 0}</span> / ${kpis.salesTotal || 0}</strong>
        <small>${t('stat.salesTodayHint')}</small>
      </div>
      <div class="admin-funnel-kpi" title="${escapeHtml(t('funnel.kpiWaHint'))}">
        <span>${t('funnel.kpiWa')}</span>
        <strong><span class="admin-metric today">${kpis.whatsappToday || 0}</span> / ${kpis.whatsappTotal || 0}</strong>
        <small>${t('funnel.kpiWaHint')}</small>
      </div>
    </div>

    ${
      isPostresOnly
        ? `
      <div class="admin-card">
        <div class="admin-card-body"><p class="admin-hint">${t('funnel.postresSoon')}</p></div>
      </div>`
        : ''
    }

    ${
      showPaletasQuiz
        ? `
      ${renderAbConfigCard(entry, dirty)}
      ${renderCollapsibleCard({
        id: 'ab-results',
        title: t('analytics.abTitle'),
        hint: t('analytics.abHint'),
        body: abResultsBody,
        collapsed: true,
        accent: true,
      })}
      <div class="admin-grid-2">
        ${renderCollapsibleCard({
          id: 'quiz-steps',
          title: t('funnel.quizSteps'),
          hint: t('funnel.quizStepsHint'),
          body: `<div class="admin-quiz-steps">${renderQuizStepsChart(quizSteps)}</div>`,
          collapsed: false,
        })}
        ${renderCollapsibleCard({
          id: 'dwell',
          title: t('funnel.dwell'),
          body: `
            <div class="admin-dwell-grid">
              <div class="admin-dwell-cell">
                <span>${t('funnel.dwellLp')}</span>
                <strong>${formatDuration(dwell.home?.avgSecondsToday || dwell.home?.avgSeconds || 0)}</strong>
                <small>${dwell.home?.todaySessions || 0} período · ${dwell.home?.sessions || 0} total</small>
              </div>
              <div class="admin-dwell-cell">
                <span>${t('funnel.dwellQuiz')}</span>
                <strong>${formatDuration(dwell.diagnostico?.avgSecondsToday || dwell.diagnostico?.avgSeconds || 0)}</strong>
                <small>${dwell.diagnostico?.todaySessions || 0} período · ${dwell.diagnostico?.sessions || 0} total</small>
              </div>
              <div class="admin-dwell-cell accent-warn">
                <span>${t('funnel.abandon')}</span>
                <strong><span class="admin-metric today">${abandon.today || 0}</span> / ${abandon.total || 0}</strong>
                <small>${t('funnel.abandonHint')}</small>
              </div>
              <div class="admin-dwell-cell accent-green">
                <span>${t('funnel.completeRate')}</span>
                <strong>${completePct}%</strong>
                <small>${offerStep?.today || 0} / ${welcomeStep?.today || 0}</small>
              </div>
            </div>`,
          collapsed: false,
        })}
      </div>
      ${renderCollapsibleCard({
        id: 'quiz-leads',
        title: t('funnel.leads'),
        hint: t('funnel.leadsHint'),
        body: renderDiagnosticoLeadsTable(diagnosticoLeads),
        collapsed: false,
      })}`
        : ''
    }

    ${
      lineFilter === 'all'
        ? `<p class="admin-hint admin-funnel-note">${t('funnel.abOnlyPaletas')}</p>`
        : ''
    }

    <div class="admin-grid-2">
      ${renderCollapsibleCard({
        id: 'cta-clicks',
        title: t('funnel.ctaClicks'),
        body: ctas.length
          ? ctas
              .slice(0, 10)
              .map(
                (c) => `
            <div class="admin-traffic-row">
              <div><strong>${escapeHtml(c.key)}</strong><span>${escapeHtml(c.line || '-')}</span></div>
              <span class="admin-metric today">${c.today || 0}</span> / ${c.total || 0}
            </div>`
              )
              .join('')
          : `<p class="admin-table-empty">-</p>`,
        collapsed: true,
      })}
      ${renderCollapsibleCard({
        id: 'wa-clicks',
        title: t('analytics.whatsapp'),
        hint: t('funnel.kpiWaHint'),
        body: whatsapp.length
          ? whatsapp
              .slice(0, 8)
              .map(
                (w) => `
            <div class="admin-traffic-row">
              <div><strong>${escapeHtml(w.key)}</strong><span>${escapeHtml(w.purpose || w.line || '-')}</span></div>
              <span class="admin-metric today">${w.today || 0}</span> / ${w.total || 0}
            </div>`
              )
              .join('')
          : `<p class="admin-table-empty">-</p>`,
        collapsed: true,
      })}
    </div>

    ${renderCollapsibleCard({
      id: 'entry-pages',
      title: t('funnel.lpPages'),
      body: `
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>${t('analytics.page')}</th><th>${t('analytics.path')}</th><th>${t('analytics.today')}</th><th>${t('analytics.total')}</th></tr></thead>
            <tbody>
              ${
                entryPages.length
                  ? entryPages
                      .map(
                        (p) => `
                <tr>
                  <td><strong>${escapeHtml(p.label)}</strong></td>
                  <td><code>${escapeHtml(p.path || '-')}</code></td>
                  <td><span class="admin-metric today">${p.today || 0}</span></td>
                  <td><span class="admin-metric">${p.total || 0}</span></td>
                </tr>`
                      )
                      .join('')
                  : `<tr><td colspan="4" class="admin-table-empty">${t('analytics.noVisits')}</td></tr>`
              }
            </tbody>
          </table>
        </div>`,
      collapsed: true,
    })}
  `;
}

function renderAbArmColumn(label, arm) {
  const assign = cell(arm?.assign);
  const view = cell(arm?.view);
  const start = cell(arm?.quiz_start);
  const complete = cell(arm?.quiz_complete);
  const checkout = cell(arm?.checkout);
  const purchase = cell(arm?.purchase);
  const rates = arm?.rates || {};
  const rows = [
    [t('analytics.abAssign'), assign],
    [t('analytics.abView'), view],
  ];
  if (label === 'Quiz') {
    rows.push([t('analytics.abQuizStart'), start]);
    rows.push([t('analytics.abQuizComplete'), complete]);
  }
  rows.push([t('analytics.abCheckout'), checkout]);
  rows.push([t('analytics.abPurchase'), purchase]);

  return `
    <div class="admin-ab-col">
      <h3>${escapeHtml(label)}</h3>
      <div class="admin-ab-metrics">
        ${rows
          .map(
            ([name, m]) => `
          <div class="admin-ab-row">
            <span>${escapeHtml(name)}</span>
            <strong><span class="admin-metric today">${m.today}</span> / ${m.total}</strong>
          </div>`
          )
          .join('')}
      </div>
      <div class="admin-ab-rates">
        <div><span>${t('analytics.abCvrCheckout')}</span><strong>${rates.checkoutToday ?? 0}% <small>/ ${rates.checkoutTotal ?? 0}%</small></strong></div>
        <div><span>${t('analytics.abCvrPurchase')}</span><strong>${rates.purchaseToday ?? 0}% <small>/ ${rates.purchaseTotal ?? 0}%</small></strong></div>
      </div>
    </div>
  `;
}

function renderAbEntryCard(abEntry) {
  if (!abEntry) {
    return `
      <div class="admin-card admin-card-accent">
        <div class="admin-card-head"><h2>${t('analytics.abTitle')}</h2></div>
        <div class="admin-card-body"><p class="admin-hint">${t('analytics.abEmpty')}</p></div>
      </div>`;
  }

  return `
    <div class="admin-card admin-card-accent">
      <div class="admin-card-head">
        <div>
          <h2>${t('analytics.abTitle')}</h2>
          <p class="admin-hint">${t('analytics.abHint')}</p>
        </div>
      </div>
      <div class="admin-card-body">
        <div class="admin-ab-grid">
          ${renderAbArmColumn('LP', abEntry.lp)}
          ${renderAbArmColumn('Quiz', abEntry.quiz)}
        </div>
        <p class="admin-hint admin-ab-note">${t('analytics.abNote')}</p>
      </div>
    </div>
  `;
}

function renderInboxRow(user, kind) {
  const name = escapeHtml(user.displayName || t('table.noName'));
  const email = escapeHtml(user.email || '-');
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
    ${renderInsightsBlock(analytics)}

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

export function renderContentView(draft = null) {
  const settings = getContentSettings();
  const lines = getEnabledLines().filter((line) => line.sellable);
  const adminEmails = getAdminAllowlist();
  const dirty = Boolean(draft?.dirty);

  return `
    <div class="admin-content-stack" data-content-settings>
      <div class="admin-card admin-card-accent admin-card-link">
        <div class="admin-card-body admin-card-body-row">
          <div>
            <h2>${t('content.abTitle')}</h2>
            <p class="admin-hint">${t('content.abMovedToFunnel')}</p>
          </div>
          <button type="button" class="admin-btn sm primary" data-tab="funnel">${t('content.abResultsLink')}</button>
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
                const saved = settings.lines[line.id] || {};
                const flags = draft?.lines?.[line.id]
                  ? { ...saved, ...draft.lines[line.id] }
                  : saved;
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
                  <input type="checkbox" data-content-flag="kitOpen" data-content-line="${line.id}" data-content-dirty ${flags.kitOpen !== false ? 'checked' : ''}>
                </label>
                <label class="admin-toggle-row">
                  <span>
                    ${t('content.premiumOpen')}
                    <span class="admin-toggle-hint">${t('content.premiumOpenHint')}</span>
                  </span>
                  <input type="checkbox" data-content-flag="premiumOpen" data-content-line="${line.id}" data-content-dirty ${flags.premiumOpen !== false ? 'checked' : ''}>
                </label>
                <label class="admin-toggle-row">
                  <span>
                    ${t('content.audioGuideOpen')}
                    <span class="admin-toggle-hint">${t('content.audioGuideOpenHint')}</span>
                  </span>
                  <input type="checkbox" data-content-flag="audioGuideOpen" data-content-line="${line.id}" data-content-dirty ${flags.audioGuideOpen !== false ? 'checked' : ''}>
                </label>
                <label class="admin-toggle-row">
                  <span>
                    ${t('content.menuWebOpen')}
                    <span class="admin-toggle-hint">${t('content.menuWebOpenHint')}</span>
                  </span>
                  <input type="checkbox" data-content-flag="menuWebOpen" data-content-line="${line.id}" data-content-dirty ${flags.menuWebOpen === true ? 'checked' : ''}>
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
    </div>

    <div class="admin-save-bar ${dirty ? 'is-dirty' : ''}" data-content-save-bar>
      <div class="admin-save-bar-copy">
        <strong data-content-save-status>${dirty ? t('content.dirty') : t('content.saveAllHint')}</strong>
      </div>
      <button type="button" class="admin-btn primary admin-save-bar-btn" data-content-save-all ${dirty ? '' : 'disabled'}>
        ${t('content.saveAll')}
      </button>
    </div>
  `;
}

export function renderEmailsView(
  users = [],
  emailFilter = 'paletas',
  emailProduct = 'paletas_kit',
  emailDevice = 'mobile',
  emailSubTab = 'auto',
  emailActivity = null,
  emailSelectedIds = new Set(),
  emailUserSearch = '',
  emailBulkProduct = 'auto',
) {
  const sub = ['auto', 'send', 'templates'].includes(emailSubTab) ? emailSubTab : 'auto';
  const templates = listEmailTemplates();
  const activeProduct = templates.some((t) => t.id === emailProduct)
    ? emailProduct
    : 'paletas_kit';
  const device = emailDevice === 'desktop' ? 'desktop' : 'mobile';
  const previewName = 'María';
  const active = getAdminEmailTemplate(activeProduct, previewName);
  const fromLabel = active.meta?.brandLine || 'Paletas para WhatsApp';

  const productForUser = (u) => {
    if (emailFilter === 'postres' || (u.hasPostres && !u.hasKit && !u.hasPremium)) {
      return u.hasPostresPremium && !u.hasPostres ? 'postres_premium' : 'postres_kit';
    }
    if (u.hasPostres && !u.hasKit) {
      return u.hasPostresPremium ? 'postres_premium' : 'postres_kit';
    }
    return u.hasPremium && !u.hasKit ? 'paletas_premium' : 'paletas_kit';
  };

  const q = String(emailUserSearch || '').trim().toLowerCase();
  const filtered = users
    .filter((u) => {
      if (!u.email) return false;
      if (emailFilter === 'postres') return u.hasPostres || u.hasPostresPremium;
      if (emailFilter === 'pending') return profileStatus(u) === 'pending_kit';
      if (emailFilter === 'premium') return u.hasPremium || u.hasPostresPremium;
      if (emailFilter === 'all') return true;
      return u.hasKit || u.hasPremium;
    })
    .filter((u) => {
      if (!q) return true;
      return (
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.displayName || '').toLowerCase().includes(q)
      );
    })
    .slice(0, 80);

  const selectedCount = [...emailSelectedIds].filter((id) =>
    users.some((u) => u.id === id && u.email)
  ).length;

  const tabs = `
    <div class="admin-tabs admin-email-tabs" role="tablist">
      <button type="button" class="admin-tab ${sub === 'auto' ? 'active' : ''}" data-email-sub="auto">${t('emails.tabAuto')}</button>
      <button type="button" class="admin-tab ${sub === 'send' ? 'active' : ''}" data-email-sub="send">${t('emails.tabSend')}</button>
      <button type="button" class="admin-tab ${sub === 'templates' ? 'active' : ''}" data-email-sub="templates">${t('emails.tabTemplates')}</button>
    </div>
  `;

  const cfg = emailActivity?.config;
  const stats = emailActivity?.stats;
  const activity = emailActivity?.activity || [];

  const cfgPill = (ok, warn = false) =>
    ok
      ? `<span class="admin-status-pill is-on">${t('emails.cfgOk')}</span>`
      : `<span class="admin-status-pill ${warn ? 'is-warn' : ''}">${t('emails.cfgMissing')}</span>`;

  const statusCell = (row) => {
    if (row.status === 'duplicate') {
      return `<span class="admin-pill" title="Hotmart envió APPROVED + COMPLETE; solo contamos 1 venta">${t('emails.statusDup')}</span>`;
    }
    if (row.emailSent) {
      return `<span class="admin-pill active">${t('emails.statusSent')}</span>`;
    }
    if (row.emailError) {
      return `<span class="admin-pill danger" title="${escapeHtml(row.emailError)}">${t('emails.statusFail')}</span>`;
    }
    return `<span class="admin-pill">${t('emails.statusPending')}</span>`;
  };

  let body = '';

  if (sub === 'auto') {
    body = `
      <div class="admin-card">
        <div class="admin-card-head">
          <div>
            <h2>${t('emails.autoTitle')}</h2>
            <p>${t('emails.autoHint')}</p>
          </div>
          <button type="button" class="admin-btn sm ghost" data-email-refresh-activity>${t('emails.refreshActivity')}</button>
        </div>
        <div class="admin-card-body">
          <div class="admin-email-auto-banner ${cfg?.autoReady ? 'is-ready' : 'is-warn'}">
            <strong>${cfg?.autoReady ? t('emails.autoReady') : t('emails.autoNotReady')}</strong>
            <span>${escapeHtml(cfg?.webhookUrl || HOTMART_WEBHOOK_URL)}</span>
          </div>
          <div class="admin-email-cfg-grid">
            <div class="admin-email-cfg">
              <span>${t('emails.cfgResend')}</span>
              ${cfgPill(Boolean(cfg?.resendConfigured))}
            </div>
            <div class="admin-email-cfg">
              <span>${t('emails.cfgHottok')}</span>
              ${cfgPill(Boolean(cfg?.hottokConfigured))}
            </div>
            <div class="admin-email-cfg">
              <span>${t('emails.cfgFrom')}</span>
              ${cfgPill(Boolean(cfg?.from?.configured) && !cfg?.from?.isDevFrom, Boolean(cfg?.from?.isDevFrom))}
              ${
                cfg?.from?.isDevFrom
                  ? `<small>${t('emails.cfgFromDev')}</small>`
                  : cfg?.from?.fromLabel
                    ? `<small>${escapeHtml(cfg.from.fromLabel)}</small>`
                    : ''
              }
            </div>
          </div>
          <div class="admin-funnel-kpis" style="margin-top:16px">
            <div class="admin-funnel-kpi"><strong>${stats?.salesUnique24h ?? '-'}</strong><span>${t('emails.statSales')}</span></div>
            <div class="admin-funnel-kpi"><strong>${stats?.duplicates ?? '-'}</strong><span>${t('emails.statDup')}</span></div>
            <div class="admin-funnel-kpi"><strong>${stats?.sentOk ?? '-'}</strong><span>${t('emails.statOk')}</span></div>
            <div class="admin-funnel-kpi"><strong>${stats?.failed ?? '-'}</strong><span>${t('emails.statFail')}</span></div>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-head">
          <div>
            <h2>${t('emails.activityTitle')}</h2>
            <p>${t('emails.activityHint')}</p>
          </div>
        </div>
        <div class="admin-card-body flush">
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>${t('emails.colWhen')}</th>
                  <th>${t('emails.colEmail')}</th>
                  <th>${t('emails.colProduct')}</th>
                  <th>${t('emails.colSource')}</th>
                  <th>${t('emails.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                ${
                  activity.length
                    ? activity
                        .map(
                          (row) => `
                  <tr>
                    <td>${formatDateTime(row.createdAt)}</td>
                    <td>
                      <strong>${escapeHtml(row.email || '-')}</strong>
                      ${row.emailError ? `<div class="admin-muted">${escapeHtml(row.emailError)}</div>` : ''}
                    </td>
                    <td>${escapeHtml(productLabel(row.product))}</td>
                    <td>${row.kind === 'manual' ? t('emails.sourceManual') : t('emails.sourcePurchase')}</td>
                    <td>${statusCell(row)}</td>
                  </tr>`
                        )
                        .join('')
                    : `<tr><td colspan="5" class="admin-table-empty">${t('emails.noActivity')}</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      ${renderCollapsibleCard({
        id: 'emails-hotmart',
        title: t('emails.hotmartTitle'),
        hint: t('emails.hotmartHint'),
        collapsed: true,
        accent: true,
        body: `
          <ol class="admin-emails-steps">
            <li>${t('emails.hotmartStep1')}</li>
            <li>
              ${t('emails.hotmartStep2')}
              <div class="admin-emails-webhook">
                <code>${escapeHtml(HOTMART_WEBHOOK_URL)}</code>
                <button type="button" class="admin-btn sm ghost" data-copy="${encodeURIComponent(HOTMART_WEBHOOK_URL)}">${t('emails.copyWebhook')}</button>
              </div>
            </li>
            <li>${t('emails.hotmartStep3')}</li>
            <li>${t('emails.hotmartStep4')}</li>
            <li>${t('emails.hotmartStep5')}</li>
            <li>${t('emails.hotmartStep6')}</li>
          </ol>
          <p class="admin-hint">${t('emails.hotmartNote')}</p>
        `,
      })}
    `;
  } else if (sub === 'send') {
    body = `
      <div class="admin-card">
        <div class="admin-card-head">
          <div>
            <h2>${t('emails.bulkTitle')}</h2>
            <p>${t('emails.bulkHint')}</p>
          </div>
        </div>
        <div class="admin-card-body">
          <div class="admin-email-send-toolbar">
            <div class="admin-line-filter" role="group">
              <button type="button" class="admin-line-chip ${emailFilter === 'all' ? 'active' : ''}" data-email-filter="all">All</button>
              <button type="button" class="admin-line-chip ${emailFilter === 'paletas' ? 'active' : ''}" data-email-filter="paletas">Paletas</button>
              <button type="button" class="admin-line-chip ${emailFilter === 'postres' ? 'active' : ''}" data-email-filter="postres">Postres</button>
              <button type="button" class="admin-line-chip ${emailFilter === 'premium' ? 'active' : ''}" data-email-filter="premium">Premium</button>
              <button type="button" class="admin-line-chip ${emailFilter === 'pending' ? 'active' : ''}" data-email-filter="pending">${t('filter.pending_kit')}</button>
            </div>
            <div class="admin-search">${ICONS.search}<input type="search" data-email-user-search placeholder="${t('emails.searchUsers')}" value="${escapeHtml(emailUserSearch)}" autocomplete="off"></div>
          </div>

          <div class="admin-email-bulk-bar">
            <label class="admin-field admin-email-bulk-template">
              <span>${t('emails.templateForSend')}</span>
              <select data-email-bulk-product>
                <option value="auto" ${emailBulkProduct === 'auto' ? 'selected' : ''}>${t('emails.templateAuto')}</option>
                ${templates
                  .map(
                    (tpl) =>
                      `<option value="${tpl.id}" ${emailBulkProduct === tpl.id ? 'selected' : ''}>${t(tpl.labelKey)}</option>`
                  )
                  .join('')}
              </select>
            </label>
            <div class="admin-email-bulk-actions">
              <span class="admin-muted">${selectedCount} ${t('emails.selectedCount')}</span>
              <button type="button" class="admin-btn sm ghost" data-email-select-visible>${t('emails.selectAll')}</button>
              <button type="button" class="admin-btn sm ghost" data-email-clear-selection>${t('emails.clearSelection')}</button>
              <button type="button" class="admin-btn sm primary" data-email-send-selected ${selectedCount ? '' : 'disabled'}>${t('emails.sendSelected')}</button>
            </div>
          </div>

          <div class="admin-table-wrap" style="margin-top:12px">
            <table class="admin-table">
              <thead>
                <tr>
                  <th class="col-check"><input type="checkbox" data-email-toggle-visible aria-label="${t('emails.selectAll')}"></th>
                  <th>${t('table.user')}</th>
                  <th>${t('table.products')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered.length
                    ? filtered
                        .map((u) => {
                          const product = productForUser(u);
                          const checked = emailSelectedIds.has(u.id) ? 'checked' : '';
                          return `
                  <tr>
                    <td class="col-check">
                      <input type="checkbox" data-email-select="${u.id}" ${checked}>
                    </td>
                    <td>
                      <strong>${escapeHtml(u.displayName || t('table.noName'))}</strong>
                      <div class="admin-muted">${escapeHtml(u.email || '')}</div>
                    </td>
                    <td>${renderProductPills(u)}</td>
                    <td class="col-actions">
                      <button type="button" class="admin-btn sm primary" data-email-send-user="${u.id}" data-email="${escapeHtml(u.email || '')}" data-name="${escapeHtml(u.displayName || '')}" data-product="${product}">
                        ${t('emails.sendToUser')}
                      </button>
                    </td>
                  </tr>`;
                        })
                        .join('')
                    : `<tr><td colspan="4" class="admin-table-empty">${t('emails.noUsers')}</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-head">
          <div>
            <h2>${t('emails.sendTitle')}</h2>
            <p>${t('emails.sendHint')}</p>
          </div>
        </div>
        <div class="admin-card-body">
          <form class="admin-emails-send-form admin-email-send-inline" data-email-send-form>
            <label class="admin-field">
              <span>${t('emails.email')}</span>
              <input type="email" name="email" required placeholder="cliente@email.com" data-email-to>
            </label>
            <label class="admin-field">
              <span>${t('emails.name')}</span>
              <input type="text" name="name" placeholder="María" data-email-name>
            </label>
            <label class="admin-field">
              <span>${t('emails.templateForSend')}</span>
              <select data-email-product-field>
                ${templates
                  .map(
                    (tpl) =>
                      `<option value="${tpl.id}" ${activeProduct === tpl.id ? 'selected' : ''}>${t(tpl.labelKey)}</option>`
                  )
                  .join('')}
              </select>
            </label>
            <button type="submit" class="admin-btn primary">${t('emails.send')}</button>
          </form>
        </div>
      </div>
    `;
  } else {
    body = `
      <div class="admin-email-studio">
        <aside class="admin-email-rail">
          <div class="admin-email-rail-head">
            <h2>${t('emails.studioTitle')}</h2>
            <p>${t('emails.studioHint')}</p>
          </div>

          <div class="admin-email-tpl-list" role="list">
            ${templates
              .map(
                (tpl) => `
              <button type="button" class="admin-email-tpl-card ${activeProduct === tpl.id ? 'active' : ''}" data-email-product="${tpl.id}" role="listitem">
                <span class="admin-email-tpl-dot" style="background:${escapeHtml(tpl.meta?.accent || '#E8437A')}"></span>
                <span class="admin-email-tpl-copy">
                  <strong>${t(tpl.labelKey)}</strong>
                  <small>${escapeHtml(tpl.subject)}</small>
                </span>
              </button>`
              )
              .join('')}
          </div>

          <div class="admin-email-rail-actions">
            <button type="button" class="admin-btn sm ghost" data-copy="${encodeURIComponent(active.subject)}">${t('emails.copySubject')}</button>
            <button type="button" class="admin-btn sm ghost" data-copy="${encodeURIComponent(active.plain)}">${t('emails.copyPlain')}</button>
            <button type="button" class="admin-btn sm ghost" data-copy-html-live>${t('emails.copyHtml')}</button>
          </div>

          <textarea class="hidden" data-email-html-live hidden readonly>${escapeHtml(active.html)}</textarea>

          <label class="admin-field" style="margin-top:12px">
            <span>${t('emails.previewName')}</span>
            <input type="text" value="${escapeHtml(previewName)}" data-email-preview-name placeholder="María">
          </label>
        </aside>

        <section class="admin-email-client">
          <div class="admin-email-client-bar">
            <div class="admin-email-client-meta">
              <div><span>De</span><strong data-email-live-from>${escapeHtml(fromLabel)}</strong></div>
              <div><span>${t('emails.subject')}</span><strong data-email-live-subject>${escapeHtml(active.subject)}</strong></div>
            </div>
            <div class="admin-email-device" role="group">
              <button type="button" class="admin-line-chip ${device === 'mobile' ? 'active' : ''}" data-email-device="mobile">Mobile</button>
              <button type="button" class="admin-line-chip ${device === 'desktop' ? 'active' : ''}" data-email-device="desktop">Desktop</button>
            </div>
          </div>
          <div class="admin-email-preview-wrap" data-email-device-frame="${device}">
            <div class="admin-email-device-shell" data-email-device-shell>
              <div class="admin-email-device-top" aria-hidden="true">
                <span class="admin-email-device-speaker"></span>
              </div>
              <iframe
                class="admin-email-preview-frame"
                data-email-preview-live
                title="Email preview"
                sandbox="allow-same-origin allow-popups"
              ></iframe>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  return `
    <div class="admin-content-stack">
      ${tabs}
      ${body}
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

export function renderSidebar(activeTab, users, user, sidebarOpen, sidebarCollapsed = false) {
  const stats = getStats(users);
  const pendingBadge = stats.pending > 0 ? `<span class="admin-nav-badge">${stats.pending}</span>` : '';
  const orphanBadge = stats.orphans > 0 ? `<span class="admin-nav-badge warn">${stats.orphans}</span>` : '';
  const navItems = getNavItems();

  return `
    <aside class="admin-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'is-collapsed' : ''}" aria-label="Admin navigation">
      <div class="admin-sidebar-top">
        <div class="admin-brand">
          <img class="admin-brand-mark" src="/favicon.svg?v=5" width="34" height="34" alt="" decoding="async">
          <div class="admin-brand-text"><strong>${t('sidebar.brand')}</strong><span>${t('sidebar.sub')}</span></div>
        </div>
        <button type="button" class="admin-sidebar-collapse" data-toggle-sidebar-collapse aria-label="${sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}" title="${sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}">
          ${sidebarCollapsed ? ICONS.chevronRight : ICONS.chevronLeft}
        </button>
        <button type="button" class="admin-sidebar-close" data-close-sidebar aria-label="${t('sidebar.close')}">${ICONS.close}</button>
      </div>
      <nav class="admin-nav">
        ${navItems
          .map((item) => {
            let badge = '';
            if (item.id === 'users') badge = pendingBadge || orphanBadge;
            return `
          <button type="button" class="admin-nav-item ${activeTab === item.id ? 'active' : ''}" data-tab="${item.id}" title="${escapeHtml(item.label)}">
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

  const seen = new Set();
  const items = [];
  for (const warning of apiWarnings) {
    const key =
      warning.message === 'firebaseAdmin' || warning.id === 'firebaseAdmin'
        ? 'firebaseAdmin'
        : warning.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const text =
      labels[key] ||
      labels[warning.message] ||
      warning.message ||
      warning.id;
    if (text) items.push(text);
  }

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
    sidebarCollapsed = false,
    lineFilter = 'all',
    apiWarnings = [],
    contentDraft = null,
    funnelDraft = null,
    dateRange = 'today',
    diagnosticoLeads = null,
    emailFilter = 'paletas',
    emailProduct = 'paletas_kit',
    emailDevice = 'mobile',
    emailSubTab = 'auto',
    emailActivity = null,
    emailSelectedIds = new Set(),
    emailUserSearch = '',
    emailBulkProduct = 'auto',
  } = props;
  const meta = getViewMeta()[activeTab] || getViewMeta().dashboard;
  let content = '';

  switch (activeTab) {
    case 'users':
      content = renderUsersView(users, selectedIds, userFilter, userSearch);
      break;
    case 'funnel':
      content = renderFunnelView(
        analytics,
        lineFilter,
        funnelDraft,
        dateRange,
        diagnosticoLeads,
      );
      break;
    case 'analytics':
      content = renderAnalyticsView(analytics, lineFilter, users);
      break;
    case 'emails':
      content = renderEmailsView(
        users,
        emailFilter,
        emailProduct,
        emailDevice,
        emailSubTab,
        emailActivity,
        emailSelectedIds,
        emailUserSearch,
        emailBulkProduct,
      );
      break;
    case 'codes':
      content = renderCodesView(codes);
      break;
    case 'content':
      content = renderContentView(contentDraft);
      break;
    case 'channels':
      content = renderChannelsView(kiwifySubTab, kiwifyContent, analytics);
      break;
    default:
      content = renderDashboardView(users, analytics, lineFilter);
  }

  document.body.classList.toggle('admin-sidebar-open', Boolean(sidebarOpen));
  document.body.classList.toggle('admin-sidebar-collapsed', Boolean(sidebarCollapsed));

  return `
    <div class="admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      <div class="admin-sidebar-overlay ${sidebarOpen ? 'visible' : ''}" data-close-sidebar></div>
      ${renderSidebar(activeTab, users, user, sidebarOpen, sidebarCollapsed)}
      <div class="admin-main">
        <header class="admin-header">
          <button type="button" class="admin-menu-btn" id="admin-menu-toggle" aria-label="Menu">${ICONS.menu}</button>
          <button type="button" class="admin-collapse-btn" data-toggle-sidebar-collapse aria-label="${sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}" title="${sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}">
            ${sidebarCollapsed ? ICONS.chevronRight : ICONS.chevronLeft}
          </button>
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
