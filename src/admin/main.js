import { logout, watchAuth } from '../lib/auth.js';
import {
  getUserProfile,
  isUserAdmin,
  listUsers,
  updateUserProfile,
} from '../lib/user-profile.js';
import {
  createAccessCode,
  deleteAccessCode,
  listAccessCodes,
  toggleAccessCode,
} from '../lib/access-codes-db.js';
import { deleteUserAccount } from '../lib/admin-api.js';
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
let codesCache = [];
let activeTab = 'dashboard';
let kiwifySubTab = 'urls';
let userSearch = '';
let userFilter = 'all';
let sidebarOpen = false;

const VIEW_META = {
  dashboard: { title: 'Resumen', subtitle: 'Vista general del área de miembros' },
  users: { title: 'Usuarios', subtitle: 'Gestiona accesos al kit y premium' },
  codes: { title: 'Códigos de acceso', subtitle: 'Crea y controla códigos de liberación' },
  kiwify: { title: 'Kiwify', subtitle: 'Enlaces y plantillas de email' },
};

const USER_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'kit', label: 'Kit activo' },
  { id: 'premium', label: 'Premium' },
];

const CODE_TYPES = [
  { value: 'kit', label: 'Kit' },
  { value: 'premium', label: 'Premium' },
  { value: 'both', label: 'Kit + Premium' },
];

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
  let list = users;

  switch (userFilter) {
    case 'pending':
      list = list.filter((u) => !u.hasKit && !u.isAdmin);
      break;
    case 'kit':
      list = list.filter((u) => u.hasKit);
      break;
    case 'premium':
      list = list.filter((u) => u.hasPremium);
      break;
    default:
      break;
  }

  const q = userSearch.trim().toLowerCase();
  if (!q) return list;
  return list.filter((u) => {
    const name = String(u.displayName || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });
}

function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay visible';
    overlay.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <h3 id="admin-modal-title">${escapeHtml(title)}</h3>
        <p>${message}</p>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn ghost" data-modal-cancel>Cancelar</button>
          <button type="button" class="admin-btn ${danger ? 'danger' : 'primary'}" data-modal-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector('[data-modal-cancel]')?.addEventListener('click', () => close(false));
    overlay.querySelector('[data-modal-confirm]')?.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close(false);
    });
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
  const isSelf = u.id === currentAdminUser?.uid;
  const resendBtn =
    u.hasKit && u.email
      ? `<button type="button" class="admin-btn ghost ${size}" data-resend-email="${u.id}" data-email="${escapeHtml(u.email || '')}" data-name="${escapeHtml(u.displayName || '')}">${ICONS.mailSend} Email</button>`
      : '';
  const adminBtn =
    !isSelf && !u.isAdmin
      ? `<button type="button" class="admin-btn ghost ${size}" data-user-admin="${u.id}">Hacer admin</button>`
      : '';
  const deleteBtn =
    !isSelf && !u.isAdmin
      ? `<button type="button" class="admin-btn danger ${size}" data-user-delete="${u.id}" data-email="${escapeHtml(u.email || '')}">${ICONS.trash}</button>`
      : '';

  return `
    <div class="admin-actions-row">
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
      ${resendBtn}
      ${adminBtn}
      ${deleteBtn}
    </div>
  `;
}

function renderUserFilters() {
  return `
    <div class="admin-filters" role="group" aria-label="Filtrar usuarios">
      ${USER_FILTERS.map(
        (filter) => `
          <button
            type="button"
            class="admin-filter-chip ${userFilter === filter.id ? 'active' : ''}"
            data-user-filter="${filter.id}"
          >${filter.label}</button>
        `
      ).join('')}
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
          <p>Libera el kit tras verificar la compra. Al liberar, se envía email automático.</p>
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
      <div class="admin-card-body">
        ${renderUserFilters()}
        <div class="admin-table-wrap flush">
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
                  : `<tr><td colspan="6" class="admin-table-empty">${userSearch || userFilter !== 'all' ? 'Ningún usuario coincide con el filtro.' : 'Aún no hay usuarios registrados.'}</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderCodeTypeLabel(type) {
  const match = CODE_TYPES.find((item) => item.value === type);
  return match?.label || type || 'Kit';
}

function renderCodesView(codes) {
  return `
    <div class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>Códigos de acceso</h2>
          <p>Crea códigos para liberar kit o premium al registrarse. Desactiva los que ya no uses.</p>
        </div>
      </div>
      <div class="admin-card-body">
        <form class="codes-form" id="codes-form">
          <label>
            Código
            <input type="text" name="code" placeholder="ej. postres2026" required autocomplete="off">
          </label>
          <label>
            Tipo
            <select name="type">
              ${CODE_TYPES.map((item) => `<option value="${item.value}">${item.label}</option>`).join('')}
            </select>
          </label>
          <label>
            Máx. usos
            <input type="number" name="maxUses" min="1" placeholder="Ilimitado">
          </label>
          <button type="submit" class="admin-btn primary">Crear</button>
        </form>
        <div class="admin-table-wrap flush">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Usos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
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
                  <td>${escapeHtml(renderCodeTypeLabel(code.type))}</td>
                  <td>${uses}</td>
                  <td>${code.active ? '<span class="admin-badge active">Activo</span>' : '<span class="admin-badge pending">Inactivo</span>'}</td>
                  <td>
                    <div class="admin-actions-row">
                      <button type="button" class="admin-btn sm ghost copy-btn" data-copy="${encodeURIComponent(code.code)}">${ICONS.copy}</button>
                      <button type="button" class="admin-btn sm ghost" data-code-toggle="${code.id}" data-active="${Boolean(code.active)}">${code.active ? 'Desactivar' : 'Activar'}</button>
                      <button type="button" class="admin-btn sm danger" data-code-delete="${code.id}" data-code-label="${escapeHtml(code.code)}">${ICONS.trash}</button>
                    </div>
                  </td>
                </tr>
              `;
                      })
                      .join('')
                  : `<tr><td colspan="5" class="admin-table-empty">Aún no hay códigos creados.</td></tr>`
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
    case 'codes':
      return renderCodesView(codesCache);
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
  showToast(current ? 'Premium revocado' : 'Premium activado');
  await refreshDashboard();
}

async function resendWelcome(authUser, { email, name }) {
  if (!email) {
    showToast('Este usuario no tiene email');
    return;
  }
  try {
    const token = await authUser.getIdToken();
    await sendWelcomeEmail(token, { email, name });
    showToast('Email reenviado');
  } catch (error) {
    showToast('No se pudo reenviar el email');
    console.warn('[admin] resend email:', error);
  }
}

async function promoteToAdmin(uid) {
  const ok = await confirmDialog({
    title: 'Hacer administrador',
    message: 'Este usuario tendrá acceso total al panel admin y al kit. ¿Continuar?',
    confirmLabel: 'Hacer admin',
  });
  if (!ok) return;

  await updateUserProfile(uid, { isAdmin: true, hasKit: true });
  showToast('Usuario promovido a admin');
  await refreshDashboard();
}

async function deleteUser(uid, email) {
  if (uid === currentAdminUser?.uid) {
    showToast('No puedes eliminar tu propia cuenta');
    return;
  }

  const ok = await confirmDialog({
    title: 'Eliminar usuario',
    message: `Se eliminará permanentemente la cuenta <strong>${escapeHtml(email || uid)}</strong>, su perfil en Firestore y sus datos guardados. Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar',
    danger: true,
  });
  if (!ok) return;

  try {
    const token = await currentAdminUser.getIdToken();
    await deleteUserAccount(token, uid);
    showToast('Usuario eliminado');
    await refreshDashboard();
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar');
    console.warn('[admin] delete user:', error);
  }
}

async function handleCreateCode(form) {
  const code = form.code.value.trim();
  const type = form.type.value;
  const maxUsesRaw = form.maxUses.value.trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;

  if (!code) {
    showToast('Escribe un código');
    return;
  }

  try {
    await createAccessCode({ code, type, maxUses });
    form.reset();
    showToast('Código creado');
    codesCache = await listAccessCodes();
    renderShell(currentAdminUser);
    bindEvents(currentAdminUser);
  } catch (error) {
    showToast(error.message || 'No se pudo crear el código');
  }
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
  if (activeTab === 'codes') {
    codesCache = await listAccessCodes();
  }
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
    btn.addEventListener('click', async () => {
      activeTab = btn.dataset.tab;
      sidebarOpen = false;
      if (activeTab === 'codes') {
        codesCache = await listAccessCodes();
      }
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

  root.querySelectorAll('[data-user-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      userFilter = btn.dataset.userFilter;
      renderShell(user);
      bindEvents(user);
    });
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

  root.querySelectorAll('[data-resend-email]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await resendWelcome(user, {
        email: btn.dataset.email,
        name: btn.dataset.name,
      });
      btn.disabled = false;
    });
  });

  root.querySelectorAll('[data-user-admin]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await promoteToAdmin(btn.dataset.userAdmin);
    });
  });

  root.querySelectorAll('[data-user-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await deleteUser(btn.dataset.userDelete, btn.dataset.email);
      btn.disabled = false;
    });
  });

  document.getElementById('codes-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    await handleCreateCode(form);
    submitBtn.disabled = false;
  });

  root.querySelectorAll('[data-code-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const next = btn.dataset.active !== 'true';
      await toggleAccessCode(btn.dataset.codeToggle, next);
      showToast(next ? 'Código activado' : 'Código desactivado');
      codesCache = await listAccessCodes();
      renderShell(user);
      bindEvents(user);
    });
  });

  root.querySelectorAll('[data-code-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const label = btn.dataset.codeLabel || 'este código';
      const ok = await confirmDialog({
        title: 'Eliminar código',
        message: `Se eliminará el código <strong>${escapeHtml(label)}</strong>. Los usuarios que ya lo usaron no se verán afectados.`,
        confirmLabel: 'Eliminar',
        danger: true,
      });
      if (!ok) return;

      btn.disabled = true;
      await deleteAccessCode(btn.dataset.codeDelete);
      showToast('Código eliminado');
      codesCache = await listAccessCodes();
      renderShell(user);
      bindEvents(user);
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
