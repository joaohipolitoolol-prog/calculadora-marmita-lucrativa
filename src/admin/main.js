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
import {
  createAdminUser,
  deleteUserAccount,
  fetchAdminAnalytics,
  fetchAdminUsers,
  syncAdminUsers,
} from '../lib/admin-api.js';
import { sendWelcomeEmail } from '../lib/send-welcome.js';
import { isFirebaseConfigured } from '../lib/firebase.js';
import { PRODUCT_BY_ID } from '../lib/products.js';
import {
  KIWIFY_EMAIL_KIT,
  KIWIFY_EMAIL_PREMIUM,
  KIWIFY_SETUP_STEPS,
  KIWIFY_URLS,
  kiwifyKitEmailHtml,
  kiwifyPremiumEmailHtml,
} from '../kiwify/email-templates.js';
import { DEV_ADMIN_ACCESS } from '../site/dev.js';
import { confirmDialog, copyText, escapeHtml, showToast } from './helpers.js';
import { renderShell } from './views.js';

const root = document.getElementById('admin-root');

const state = {
  currentAdminUser: null,
  usersCache: [],
  codesCache: [],
  analyticsCache: null,
  activeTab: 'dashboard',
  kiwifySubTab: 'urls',
  userSearch: '',
  userFilter: 'all',
  selectedUserIds: new Set(),
  detailUserId: null,
  sidebarOpen: false,
};

function getDetailUser() {
  return state.usersCache.find((u) => u.id === state.detailUserId) || null;
}

function renderKiwifyContent() {
  if (state.kiwifySubTab === 'kit') {
    return `
      <p class="admin-hint">Sin código de acceso — el cliente crea cuenta y tú liberas en Usuarios.</p>
      <div class="email-block"><div class="email-block-head"><h3>Asunto (kit)</h3><button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_KIT.subject)}">Copiar</button></div><pre>${escapeHtml(KIWIFY_EMAIL_KIT.subject)}</pre></div>
      <div class="email-block"><div class="email-block-head"><h3>Texto plano (kit)</h3><button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_KIT.plain)}">Copiar</button></div><pre>${escapeHtml(KIWIFY_EMAIL_KIT.plain)}</pre></div>
      <div class="email-block"><div class="email-block-head"><h3>HTML (kit)</h3><button type="button" class="admin-btn sm copy-btn" data-copy-html="kit">Copiar HTML</button></div><pre>Usa Copiar HTML para pegar en Kiwify.</pre></div>`;
  }
  if (state.kiwifySubTab === 'premium') {
    return `
      <div class="email-block"><div class="email-block-head"><h3>Asunto (premium)</h3><button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_PREMIUM.subject)}">Copiar</button></div><pre>${escapeHtml(KIWIFY_EMAIL_PREMIUM.subject)}</pre></div>
      <div class="email-block"><div class="email-block-head"><h3>Texto plano (premium)</h3><button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_PREMIUM.plain)}">Copiar</button></div><pre>${escapeHtml(KIWIFY_EMAIL_PREMIUM.plain)}</pre></div>
      <div class="email-block"><div class="email-block-head"><h3>HTML (premium)</h3><button type="button" class="admin-btn sm copy-btn" data-copy-html="premium">Copiar HTML</button></div><pre>Usa Copiar HTML para pegar en Kiwify.</pre></div>`;
  }
  const urlSteps = KIWIFY_SETUP_STEPS.filter((s) => typeof s.value === 'string' && s.value.startsWith('http'));
  return `
    <p class="admin-hint">Enlace corto: <code>${escapeHtml(KIWIFY_URLS.accessShort)}</code></p>
    <div class="kiwify-grid">${urlSteps
      .map(
        (step) => `
      <div class="kiwify-card"><strong>${escapeHtml(step.title)}</strong><code class="kiwify-code">${escapeHtml(step.value)}</code><p>${escapeHtml(step.note || '')}</p><button type="button" class="admin-btn sm copy-btn" data-copy="${encodeURIComponent(step.value)}">Copiar</button></div>`
      )
      .join('')}</div>`;
}

function paint() {
  window.__adminSelfUid = state.currentAdminUser?.uid;
  root.innerHTML = renderShell({
    activeTab: state.activeTab,
    users: state.usersCache,
    codes: state.codesCache,
    analytics: state.analyticsCache,
    selectedIds: state.selectedUserIds,
    userFilter: state.userFilter,
    userSearch: state.userSearch,
    detailUser: getDetailUser(),
    kiwifySubTab: state.kiwifySubTab,
    kiwifyContent: renderKiwifyContent(),
    user: state.currentAdminUser,
    sidebarOpen: state.sidebarOpen,
  });
  bindEvents();
}

async function loadUsers() {
  try {
    const token = await state.currentAdminUser.getIdToken();
    const data = await fetchAdminUsers(token);
    state.usersCache = (data.users || []).map((u) => ({
      ...u,
      id: u.id || u.uid,
    }));
  } catch (error) {
    console.warn('[admin] users API fallback:', error);
    state.usersCache = (await listUsers()).map((u) => ({ ...u, missingProfile: false }));
  }
}

async function loadAnalytics() {
  try {
    const token = await state.currentAdminUser.getIdToken();
    state.analyticsCache = await fetchAdminAnalytics(token);
  } catch {
    state.analyticsCache = { pages: [], todayTotal: 0, allTimeTotal: 0, history: [] };
  }
}

async function refreshAll() {
  await loadUsers();
  if (state.activeTab === 'codes') {
    state.codesCache = await listAccessCodes();
  }
  if (state.activeTab === 'dashboard' || state.activeTab === 'analytics') {
    await loadAnalytics();
  }
  paint();
}

async function updateProduct(uid, productId, active) {
  const product = PRODUCT_BY_ID[productId];
  if (!product) return;
  await updateUserProfile(uid, { [product.field]: active });
}

async function bulkUpdateProduct(productId, active) {
  const ids = Array.from(state.selectedUserIds);
  if (!ids.length) return;
  const product = PRODUCT_BY_ID[productId];
  if (!product) return;

  for (const uid of ids) {
    await updateUserProfile(uid, { [product.field]: active });
  }
  showToast(`${ids.length} usuario(s) actualizado(s)`);
  state.selectedUserIds.clear();
  await refreshAll();
}

async function toggleKitWithEmail(uid, active, userRecord) {
  await updateUserProfile(uid, { hasKit: active });
  if (active && userRecord?.email) {
    try {
      const token = await state.currentAdminUser.getIdToken();
      await sendWelcomeEmail(token, {
        email: userRecord.email,
        name: userRecord.displayName,
      });
      showToast('Kit liberado y email enviado');
    } catch {
      showToast('Kit liberado — email no enviado');
    }
  } else {
    showToast(active ? 'Acceso activado' : 'Acceso revocado');
  }
}

function bindEvents() {
  document.getElementById('admin-logout')?.addEventListener('click', async () => {
    await logout();
    window.location.href = '/login';
  });

  document.getElementById('admin-menu-toggle')?.addEventListener('click', () => {
    state.sidebarOpen = true;
    paint();
  });

  root.querySelector('[data-close-sidebar]')?.addEventListener('click', () => {
    state.sidebarOpen = false;
    paint();
  });

  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      state.activeTab = btn.dataset.tab;
      state.sidebarOpen = false;
      if (state.activeTab === 'codes') {
        state.codesCache = await listAccessCodes();
      }
      if (state.activeTab === 'dashboard' || state.activeTab === 'analytics') {
        await loadAnalytics();
      }
      paint();
    });
  });

  root.querySelectorAll('[data-kiwify-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.kiwifySubTab = btn.dataset.kiwifyTab;
      paint();
    });
  });

  root.querySelectorAll('[data-user-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.userFilter = btn.dataset.userFilter;
      paint();
    });
  });

  const searchInput = document.getElementById('user-search');
  searchInput?.addEventListener('input', () => {
    state.userSearch = searchInput.value;
    paint();
    const next = document.getElementById('user-search');
    next?.focus();
    next?.setSelectionRange(next.value.length, next.value.length);
  });

  document.getElementById('select-all-users')?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    if (!checked) {
      state.selectedUserIds.clear();
      paint();
      return;
    }
    root.querySelectorAll('[data-user-select]').forEach((input) => {
      state.selectedUserIds.add(input.dataset.userSelect);
    });
    paint();
  });

  root.querySelectorAll('[data-user-select]').forEach((input) => {
    input.addEventListener('change', () => {
      const uid = input.dataset.userSelect;
      if (input.checked) state.selectedUserIds.add(uid);
      else state.selectedUserIds.delete(uid);
      paint();
    });
  });

  root.querySelectorAll('[data-user-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.detailUserId = btn.dataset.userView;
      paint();
    });
  });

  root.querySelectorAll('[data-close-drawer]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.detailUserId = null;
      paint();
    });
  });

  root.querySelectorAll('[data-drawer-product]').forEach((input) => {
    input.addEventListener('change', async () => {
      const uid = input.dataset.userId;
      const productId = input.dataset.drawerProduct;
      const active = input.checked;
      await updateProduct(uid, productId, active);
      if (productId === 'paletas_kit' && active) {
        const user = state.usersCache.find((u) => u.id === uid);
        if (user?.email) {
          try {
            const token = await state.currentAdminUser.getIdToken();
            await sendWelcomeEmail(token, { email: user.email, name: user.displayName });
          } catch {
            /* optional */
          }
        }
      }
      showToast('Acceso actualizado');
      await refreshAll();
      state.detailUserId = uid;
      paint();
    });
  });

  root.querySelectorAll('[data-bulk-product]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await bulkUpdateProduct(btn.dataset.bulkProduct, btn.dataset.value === '1');
    });
  });

  root.querySelector('[data-bulk-delete]')?.addEventListener('click', async () => {
    const ids = Array.from(state.selectedUserIds);
    if (!ids.length) return;
    const ok = await confirmDialog({
      title: 'Eliminar usuarios',
      message: `Se eliminarán <strong>${ids.length}</strong> cuenta(s) permanentemente.`,
      confirmLabel: 'Eliminar todos',
      danger: true,
    });
    if (!ok) return;
    const token = await state.currentAdminUser.getIdToken();
    for (const uid of ids) {
      if (uid === state.currentAdminUser.uid) continue;
      try {
        await deleteUserAccount(token, uid);
      } catch (error) {
        console.warn('[admin] delete', uid, error);
      }
    }
    state.selectedUserIds.clear();
    showToast('Usuarios eliminados');
    await refreshAll();
  });

  root.querySelector('[data-sync-users]')?.addEventListener('click', async () => {
    const btn = root.querySelector('[data-sync-users]');
    btn.disabled = true;
    try {
      const token = await state.currentAdminUser.getIdToken();
      const data = await syncAdminUsers(token);
      state.usersCache = data.users || [];
      showToast(`${data.created || 0} perfil(es) sincronizado(s)`);
      paint();
    } catch (error) {
      showToast(error.message || 'Error al sincronizar');
      btn.disabled = false;
    }
  });

  root.querySelector('[data-open-add-user]')?.addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.innerHTML = document.querySelector('[data-add-user-template]')?.innerHTML || '';
    // render modal inline
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div class="admin-modal-overlay visible" id="add-user-modal">
        <div class="admin-modal admin-modal-lg">
          <h3>Crear usuario</h3>
          <p>El usuario podrá entrar con este correo y contraseña.</p>
          <form id="add-user-form" class="admin-form-grid">
            <label>Nombre<input name="displayName" type="text" required></label>
            <label>Correo<input name="email" type="email" required></label>
            <label>Contraseña<input name="password" type="password" required minlength="6"></label>
            <div class="admin-form-products">
              <label class="admin-check-card"><input type="checkbox" name="product" value="paletas_kit"><span>🍓 Paletas Kit</span></label>
              <label class="admin-check-card"><input type="checkbox" name="product" value="paletas_premium"><span>⭐ Paletas Premium</span></label>
              <label class="admin-check-card"><input type="checkbox" name="product" value="postres_kit"><span>🍮 Postres Kit</span></label>
              <label class="admin-check-card"><input type="checkbox" name="product" value="postres_premium"><span>✨ Postres Premium</span></label>
            </div>
            <div class="admin-modal-actions">
              <button type="button" class="admin-btn ghost" data-close-add-user>Cancelar</button>
              <button type="submit" class="admin-btn primary">Crear</button>
            </div>
          </form>
        </div>
      </div>`
    );

    document.querySelector('[data-close-add-user]')?.addEventListener('click', () => {
      document.getElementById('add-user-modal')?.remove();
    });
    document.getElementById('add-user-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'add-user-modal') e.currentTarget.remove();
    });
    document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const products = {};
      form.querySelectorAll('[name="product"]:checked').forEach((el) => {
        products[el.value] = true;
      });
      try {
        const token = await state.currentAdminUser.getIdToken();
        const data = await createAdminUser(token, {
          displayName: form.displayName.value,
          email: form.email.value,
          password: form.password.value,
          products,
        });
        state.usersCache = data.users || state.usersCache;
        document.getElementById('add-user-modal')?.remove();
        showToast('Usuario creado');
        paint();
      } catch (error) {
        showToast(error.message || 'No se pudo crear');
      }
    });
  });

  root.querySelectorAll('[data-resend-email]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const token = await state.currentAdminUser.getIdToken();
        await sendWelcomeEmail(token, {
          email: btn.dataset.email,
          name: btn.dataset.name,
        });
        showToast('Email reenviado');
      } catch {
        showToast('No se pudo reenviar');
      }
    });
  });

  root.querySelectorAll('[data-user-admin]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Hacer administrador',
        message: 'Este usuario tendrá acceso total al panel.',
        confirmLabel: 'Confirmar',
      });
      if (!ok) return;
      await updateUserProfile(btn.dataset.userAdmin, { isAdmin: true, hasKit: true });
      showToast('Admin promovido');
      await refreshAll();
      state.detailUserId = btn.dataset.userAdmin;
      paint();
    });
  });

  root.querySelectorAll('[data-user-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Eliminar usuario',
        message: `Eliminar <strong>${escapeHtml(btn.dataset.email)}</strong> permanentemente.`,
        confirmLabel: 'Eliminar',
        danger: true,
      });
      if (!ok) return;
      const token = await state.currentAdminUser.getIdToken();
      await deleteUserAccount(token, btn.dataset.userDelete);
      state.detailUserId = null;
      showToast('Usuario eliminado');
      await refreshAll();
    });
  });

  document.getElementById('codes-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const maxUsesRaw = form.maxUses.value.trim();
    try {
      await createAccessCode({
        code: form.code.value,
        type: form.type.value,
        maxUses: maxUsesRaw ? Number(maxUsesRaw) : null,
      });
      form.reset();
      state.codesCache = await listAccessCodes();
      showToast('Código creado');
      paint();
    } catch (error) {
      showToast(error.message || 'Error');
    }
  });

  root.querySelectorAll('[data-code-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await toggleAccessCode(btn.dataset.codeToggle, btn.dataset.active !== 'true');
      state.codesCache = await listAccessCodes();
      showToast('Código actualizado');
      paint();
    });
  });

  root.querySelectorAll('[data-code-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Eliminar código',
        message: 'Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        danger: true,
      });
      if (!ok) return;
      await deleteAccessCode(btn.dataset.codeDelete);
      state.codesCache = await listAccessCodes();
      showToast('Código eliminado');
      paint();
    });
  });

  root.querySelectorAll('.copy-btn[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => copyText(decodeURIComponent(btn.dataset.copy || '')));
  });

  root.querySelectorAll('.copy-btn[data-copy-html]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const html =
        btn.dataset.copyHtml === 'premium' ? kiwifyPremiumEmailHtml() : kiwifyKitEmailHtml();
      copyText(html, 'HTML copiado');
    });
  });
}

function renderLoading() {
  root.innerHTML = `<div class="admin-loading-screen"><div class="admin-spinner"></div><p>Cargando panel...</p></div>`;
}

function renderDenied(message) {
  root.innerHTML = `<div class="admin-error"><div class="admin-error-card"><h1>Acceso restringido</h1><p>${escapeHtml(message)}</p><a href="/login" class="admin-btn primary">Ir al login</a></div></div>`;
}

renderLoading();

watchAuth(async (user) => {
  try {
    if (!user) {
      window.location.replace('/login?next=/admin');
      return;
    }
    if (!isFirebaseConfigured) {
      renderDenied('Firebase no está configurado.');
      return;
    }

    let profile = await getUserProfile(user.uid);
    const admin = (await isUserAdmin(user, profile)) || DEV_ADMIN_ACCESS;
    if (!admin) {
      renderDenied('Tu cuenta no tiene permisos de administrador.');
      return;
    }

    if (!profile?.isAdmin) {
      await updateUserProfile(user.uid, {
        email: user.email?.trim().toLowerCase() || '',
        displayName: user.displayName || '',
        isAdmin: true,
        hasKit: true,
      });
    }

    state.currentAdminUser = user;
    await loadUsers();
    await loadAnalytics();
    paint();
  } catch (error) {
    console.error('[admin]', error);
    renderDenied(error.message || 'Error al cargar el panel');
  }
});
