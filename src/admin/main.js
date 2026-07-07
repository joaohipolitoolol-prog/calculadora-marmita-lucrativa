import { logout, watchAuth } from '../lib/auth.js';
import {
  getUserProfile,
  isUserAdmin,
  listUsers,
  updateUserProfile,
} from '../lib/user-profile.js';
import { sendWelcomeEmail } from '../lib/send-welcome.js';
import { isFirebaseConfigured } from '../lib/firebase.js';
import {
  KIWIFY_EMAIL_KIT,
  KIWIFY_EMAIL_PREMIUM,
  KIWIFY_SETUP_STEPS,
  KIWIFY_URLS,
  kiwifyKitEmailHtml,
  kiwifyPremiumEmailHtml,
} from '../kiwify/email-templates.js';
import { BRAND_NAME } from '../site/brand.js';
import { DEV_ADMIN_ACCESS } from '../site/dev.js';
import { ICONS, NAV_ITEMS } from './icons.js';

const root = document.getElementById('admin-root');

let currentAdminUser = null;
let usersCache = [];
let activeTab = 'dashboard';
let kiwifySubTab = 'urls';
let userSearch = '';
let sidebarOpen = false;

const VIEW_META = {
  dashboard: { title: 'Resumen', subtitle: 'Vista general del área de miembros' },
  users: { title: 'Usuarios', subtitle: 'Gestiona accesos al kit y premium' },
  kiwify: { title: 'Kiwify', subtitle: 'Enlaces y plantillas de email' },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getUserInitial(user) {
  const name = user?.displayName || user?.email || '?';
  return name.charAt(0).toUpperCase();
}

function getStats(users) {
  return {
    total: users.length,
    activeKit: users.filter((u) => u.hasKit).length,
    pendingKit: users.filter((u) => !u.hasKit && !u.isAdmin).length,
    premium: users.filter((u) => u.hasPremium).length,
  };
}

function filterUsers(users) {
  const q = userSearch.trim().toLowerCase();
  if (!q) return users;
  return users.filter((u) => {
    const name = String(u.displayName || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });
}

function showToast(message) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

async function copyText(text, label = 'Copiado') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
    return label;
  } catch {
    showToast('No se pudo copiar');
    return 'Error';
  }
}

function renderLoading() {
  root.innerHTML = `
    <div class="admin-loading-screen">
      <div class="admin-spinner" aria-hidden="true"></div>
      <p>Cargando panel...</p>
    </div>
  `;
}

function renderDenied(message) {
  root.innerHTML = `
    <div class="admin-error">
      <div class="admin-error-card">
        <h1>Acceso restringido</h1>
        <p>${escapeHtml(message)}</p>
        <a href="/login" class="admin-btn primary">Ir al login</a>
      </div>
    </div>
  `;
}

function renderBadge(user) {
  if (user.isAdmin) return '<span class="admin-badge admin">Admin</span>';
  if (user.hasKit) return '<span class="admin-badge active">Kit activo</span>';
  return '<span class="admin-badge pending">Pendiente</span>';
}

function renderPremiumBadge(hasPremium) {
  return hasPremium
    ? '<span class="admin-badge premium">Premium</span>'
    : '<span style="color:var(--gray)">—</span>';
}

function renderUserActions(u, compact = false) {
  const kitLabel = u.hasKit ? 'Revocar kit' : 'Liberar kit';
  const premiumLabel = u.hasPremium ? 'Quitar premium' : 'Dar premium';
  const kitClass = u.hasKit ? 'danger' : 'success';
  const size = compact ? 'sm' : '';

  return `
    <div class="admin-actions">
      <button
        type="button"
        class="admin-btn ${kitClass} ${size}"
        data-user-kit="${u.id}"
        data-has-kit="${Boolean(u.hasKit)}"
        data-email="${escapeHtml(u.email || '')}"
        data-name="${escapeHtml(u.displayName || '')}"
      >${kitLabel}</button>
      <button
        type="button"
        class="admin-btn ghost ${size}"
        data-user-premium="${u.id}"
        data-has-premium="${Boolean(u.hasPremium)}"
      >${premiumLabel}</button>
    </div>
  `;
}

function renderStatsGrid(stats) {
  return `
    <div class="admin-stats">
      <div class="admin-stat">
        <span class="admin-stat-label">Usuarios</span>
        <span class="admin-stat-value">${stats.total}</span>
      </div>
      <div class="admin-stat accent-green">
        <span class="admin-stat-label">Kit activo</span>
        <span class="admin-stat-value">${stats.activeKit}</span>
      </div>
      <div class="admin-stat accent-warn">
        <span class="admin-stat-label">Pendientes</span>
        <span class="admin-stat-value">${stats.pendingKit}</span>
      </div>
      <div class="admin-stat accent-gold">
        <span class="admin-stat-label">Premium</span>
        <span class="admin-stat-value">${stats.premium}</span>
      </div>
    </div>
  `;
}

function renderDashboardView(users) {
  const stats = getStats(users);
  const pending = users.filter((u) => !u.hasKit && !u.isAdmin).slice(0, 6);

  return `
    ${renderStatsGrid(stats)}
    <div class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>Pendientes de liberación</h2>
          <p>Usuarios que crearon cuenta pero aún no tienen el kit activo.</p>
        </div>
        ${
          stats.pendingKit > 0
            ? `<button type="button" class="admin-btn ghost" data-tab="users">Ver todos</button>`
            : ''
        }
      </div>
      <div class="admin-card-body flush">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${
                pending.length
                  ? pending
                      .map(
                        (u) => `
                <tr>
                  <td class="user-cell">
                    <strong>${escapeHtml(u.displayName || 'Sin nombre')}</strong>
                    <span>${escapeHtml(u.email || '—')}</span>
                  </td>
                  <td>${renderBadge(u)}</td>
                  <td>${formatDate(u.createdAt)}</td>
                  <td>${renderUserActions(u, true)}</td>
                </tr>
              `
                      )
                      .join('')
                  : `<tr><td colspan="4" class="admin-table-empty">No hay usuarios pendientes 🎉</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderUsersView(users) {
  const filtered = filterUsers(users);

  return `
    ${renderStatsGrid(getStats(users))}
    <div class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>Todos los usuarios</h2>
          <p>Libera el kit tras verificar la compra en Kiwify. Al liberar, se envía email automático.</p>
        </div>
        <div class="admin-search">
          ${ICONS.search}
          <input
            type="search"
            id="user-search"
            placeholder="Buscar por nombre o correo..."
            value="${escapeHtml(userSearch)}"
            autocomplete="off"
          >
        </div>
      </div>
      <div class="admin-card-body flush">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Kit</th>
                <th>Premium</th>
                <th>Rol</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length
                  ? filtered
                      .map(
                        (u) => `
                <tr>
                  <td class="user-cell">
                    <strong>${escapeHtml(u.displayName || 'Sin nombre')}</strong>
                    <span>${escapeHtml(u.email || '—')}</span>
                  </td>
                  <td>${u.hasKit ? '<span class="admin-badge active">Activo</span>' : '<span class="admin-badge pending">Pendiente</span>'}</td>
                  <td>${renderPremiumBadge(u.hasPremium)}</td>
                  <td>${u.isAdmin ? '<span class="admin-badge admin">Admin</span>' : '—'}</td>
                  <td>${formatDate(u.createdAt)}</td>
                  <td>${renderUserActions(u)}</td>
                </tr>
              `
                      )
                      .join('')
                  : `<tr><td colspan="6" class="admin-table-empty">${userSearch ? 'Ningún usuario coincide con la búsqueda.' : 'Aún no hay usuarios registrados.'}</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderKiwifyUrls() {
  const urlSteps = KIWIFY_SETUP_STEPS.filter(
    (s) => typeof s.value === 'string' && s.value.startsWith('http')
  );

  return `
    <p class="admin-hint">
      Pega en Kiwify → Producto → Emails. Enlace corto recomendado:
      <code>${escapeHtml(KIWIFY_URLS.accessShort)}</code>
    </p>
    <div class="kiwify-grid">
      ${urlSteps
        .map(
          (step) => `
        <div class="kiwify-card">
          <strong>${escapeHtml(step.title)}</strong>
          <code class="kiwify-code">${escapeHtml(step.value)}</code>
          <p>${escapeHtml(step.note || '')}</p>
          <button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(step.value)}">
            ${ICONS.copy} Copiar
          </button>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function renderKiwifyKit() {
  return `
    <p class="admin-hint">Sin código de acceso — el cliente crea cuenta y tú liberas en la pestaña Usuarios.</p>
    <div class="email-block">
      <div class="email-block-head">
        <h3>Asunto del email (kit)</h3>
        <button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_KIT.subject)}">${ICONS.copy} Copiar</button>
      </div>
      <pre>${escapeHtml(KIWIFY_EMAIL_KIT.subject)}</pre>
    </div>
    <div class="email-block">
      <div class="email-block-head">
        <h3>Texto plano (kit)</h3>
        <button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_KIT.plain)}">${ICONS.copy} Copiar</button>
      </div>
      <pre>${escapeHtml(KIWIFY_EMAIL_KIT.plain)}</pre>
    </div>
    <div class="email-block">
      <div class="email-block-head">
        <h3>HTML (kit)</h3>
        <button type="button" class="admin-btn sm copy-btn" data-copy-html="kit">${ICONS.copy} Copiar HTML</button>
      </div>
      <pre>Vista previa no disponible — usa Copiar HTML para pegar en Kiwify.</pre>
    </div>
  `;
}

function renderKiwifyPremium() {
  return `
    <div class="email-block">
      <div class="email-block-head">
        <h3>Asunto del email (premium)</h3>
        <button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_PREMIUM.subject)}">${ICONS.copy} Copiar</button>
      </div>
      <pre>${escapeHtml(KIWIFY_EMAIL_PREMIUM.subject)}</pre>
    </div>
    <div class="email-block">
      <div class="email-block-head">
        <h3>Texto plano (premium)</h3>
        <button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_PREMIUM.plain)}">${ICONS.copy} Copiar</button>
      </div>
      <pre>${escapeHtml(KIWIFY_EMAIL_PREMIUM.plain)}</pre>
    </div>
    <div class="email-block">
      <div class="email-block-head">
        <h3>HTML (premium)</h3>
        <button type="button" class="admin-btn sm copy-btn" data-copy-html="premium">${ICONS.copy} Copiar HTML</button>
      </div>
      <pre>Vista previa no disponible — usa Copiar HTML para pegar en Kiwify.</pre>
    </div>
  `;
}

function renderKiwifyView() {
  const subContent =
    kiwifySubTab === 'kit'
      ? renderKiwifyKit()
      : kiwifySubTab === 'premium'
        ? renderKiwifyPremium()
        : renderKiwifyUrls();

  return `
    <div class="admin-card">
      <div class="admin-tabs" role="tablist">
        <button type="button" class="admin-tab ${kiwifySubTab === 'urls' ? 'active' : ''}" data-kiwify-tab="urls" role="tab">Enlaces</button>
        <button type="button" class="admin-tab ${kiwifySubTab === 'kit' ? 'active' : ''}" data-kiwify-tab="kit" role="tab">Email kit</button>
        <button type="button" class="admin-tab ${kiwifySubTab === 'premium' ? 'active' : ''}" data-kiwify-tab="premium" role="tab">Email premium</button>
      </div>
      <div class="admin-card-body">${subContent}</div>
    </div>
  `;
}

function renderMainContent() {
  switch (activeTab) {
    case 'users':
      return renderUsersView(usersCache);
    case 'kiwify':
      return renderKiwifyView();
    default:
      return renderDashboardView(usersCache);
  }
}

function renderSidebar(user) {
  const stats = getStats(usersCache);
  const pendingBadge =
    stats.pendingKit > 0
      ? `<span class="admin-nav-badge">${stats.pendingKit}</span>`
      : '';

  return `
    <aside class="admin-sidebar ${sidebarOpen ? 'open' : ''}" aria-label="Navegación admin">
      <div class="admin-brand">
        <div class="admin-brand-mark" aria-hidden="true">🍓</div>
        <div class="admin-brand-text">
          <strong>${escapeHtml(BRAND_NAME)}</strong>
          <span>Panel admin</span>
        </div>
      </div>
      <nav class="admin-nav">
        ${NAV_ITEMS.map((item) => {
          const badge = item.id === 'users' ? pendingBadge : '';
          return `
            <button
              type="button"
              class="admin-nav-item ${activeTab === item.id ? 'active' : ''}"
              data-tab="${item.id}"
            >
              ${ICONS[item.icon]}
              <span>${item.label}</span>
              ${badge}
            </button>
          `;
        }).join('')}
      </nav>
      <div class="admin-sidebar-foot">
        <div class="admin-user-chip">
          <span class="admin-user-avatar" aria-hidden="true">${escapeHtml(getUserInitial(user))}</span>
          <div class="admin-user-meta">
            <strong>${escapeHtml(user.displayName || user.email?.split('@')[0] || 'Admin')}</strong>
            <span>${escapeHtml(user.email || '')}</span>
          </div>
        </div>
        <a href="/app" class="admin-foot-link">${ICONS.app} Área miembros</a>
        <button type="button" class="admin-foot-logout" id="admin-logout">${ICONS.logout} Salir</button>
      </div>
    </aside>
  `;
}

function renderShell(user) {
  const meta = VIEW_META[activeTab] || VIEW_META.dashboard;

  root.innerHTML = `
    <div class="admin-layout">
      <div class="admin-sidebar-overlay ${sidebarOpen ? 'visible' : ''}" data-close-sidebar aria-hidden="true"></div>
      ${renderSidebar(user)}
      <div class="admin-main">
        <header class="admin-header">
          <button type="button" class="admin-menu-btn" id="admin-menu-toggle" aria-label="Abrir menú">
            ${ICONS.menu}
          </button>
          <div class="admin-header-titles">
            <h1>${meta.title}</h1>
            <p>${meta.subtitle}</p>
          </div>
        </header>
        <main class="admin-content">
          <div class="admin-content-inner">
            ${renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  `;
}

async function togglePremium(uid, current) {
  await updateUserProfile(uid, { hasPremium: !current });
  await refreshDashboard();
}

async function toggleKit(uid, current, userRecord, authUser) {
  const next = !current;
  await updateUserProfile(uid, { hasKit: next });

  if (next) {
    try {
      const token = await authUser.getIdToken();
      await sendWelcomeEmail(token, {
        email: userRecord.email,
        name: userRecord.displayName,
      });
      showToast('Kit liberado y email enviado');
    } catch (error) {
      showToast('Kit liberado — email no enviado');
      console.warn('[admin] welcome email:', error);
    }
  } else {
    showToast('Kit revocado');
  }

  await refreshDashboard();
}

async function refreshDashboard() {
  if (!currentAdminUser) return;
  usersCache = await listUsers();
  renderShell(currentAdminUser);
  bindEvents(currentAdminUser);
}

function bindEvents(user) {
  document.getElementById('admin-logout')?.addEventListener('click', async () => {
    await logout();
    window.location.href = '/login';
  });

  document.getElementById('admin-menu-toggle')?.addEventListener('click', () => {
    sidebarOpen = true;
    root.querySelector('.admin-sidebar')?.classList.add('open');
    root.querySelector('.admin-sidebar-overlay')?.classList.add('visible');
  });

  root.querySelector('[data-close-sidebar]')?.addEventListener('click', () => {
    sidebarOpen = false;
    root.querySelector('.admin-sidebar')?.classList.remove('open');
    root.querySelector('.admin-sidebar-overlay')?.classList.remove('visible');
  });

  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      sidebarOpen = false;
      renderShell(user);
      bindEvents(user);
    });
  });

  root.querySelectorAll('[data-kiwify-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kiwifySubTab = btn.dataset.kiwifyTab;
      renderShell(user);
      bindEvents(user);
    });
  });

  const searchInput = document.getElementById('user-search');
  searchInput?.addEventListener('input', () => {
    userSearch = searchInput.value;
    const tbody = root.querySelector('.admin-table tbody');
    if (!tbody || activeTab !== 'users') return;
    renderShell(user);
    bindEvents(user);
    const next = document.getElementById('user-search');
    if (next) {
      next.focus();
      next.setSelectionRange(next.value.length, next.value.length);
    }
  });

  root.querySelectorAll('[data-user-kit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await toggleKit(
        btn.dataset.userKit,
        btn.dataset.hasKit === 'true',
        { email: btn.dataset.email, displayName: btn.dataset.name },
        user
      );
    });
  });

  root.querySelectorAll('[data-user-premium]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await togglePremium(btn.dataset.userPremium, btn.dataset.hasPremium === 'true');
    });
  });

  root.querySelectorAll('.copy-btn[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = decodeURIComponent(btn.dataset.copy || '');
      if (!text) return;
      await copyText(text);
    });
  });

  root.querySelectorAll('.copy-btn[data-copy-html]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const html =
        btn.dataset.copyHtml === 'premium'
          ? kiwifyPremiumEmailHtml()
          : kiwifyKitEmailHtml();
      await copyText(html, 'HTML copiado');
    });
  });
}

async function renderDashboard(user) {
  usersCache = await listUsers();
  renderShell(user);
  bindEvents(user);
}

renderLoading();

watchAuth(async (user) => {
  try {
    if (!user) {
      window.location.replace('/login?next=/admin');
      return;
    }

    if (!isFirebaseConfigured) {
      renderDenied('Firebase no está configurado. Agrega las variables en Vercel.');
      return;
    }

    let profile = await getUserProfile(user.uid);
    const admin = (await isUserAdmin(user, profile)) || DEV_ADMIN_ACCESS;

    if (!admin) {
      renderDenied(
        'Tu cuenta no tiene permisos de administrador. Agrega tu email en VITE_ADMIN_EMAILS en Vercel.'
      );
      return;
    }

    if (!profile?.isAdmin) {
      await updateUserProfile(user.uid, {
        email: user.email?.trim().toLowerCase() || '',
        displayName: user.displayName || '',
        isAdmin: true,
        hasKit: true,
      });
      profile = await getUserProfile(user.uid);
    }

    currentAdminUser = user;
    await renderDashboard(user);
  } catch (error) {
    console.error('[admin]', error);
    renderDenied(`No se pudo cargar el panel: ${error.message || 'Error desconocido'}`);
  }
});
