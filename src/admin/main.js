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
  fetchAdminSettings,
  fetchAdminUsers,
  saveAdminSettings,
  syncAdminUsers,
} from '../lib/admin-api.js';
import { sendWelcomeEmail } from '../lib/send-welcome.js';
import { getAdminEmailTemplate } from './email-templates.js';
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
import {
  ADMIN_PROFILE_GRANTS,
  loadAdminAllowlist,
  saveAdminEmails,
} from '../lib/admin-access.js';
import {
  loadContentSettings,
  saveContentSettings,
  applyContentSettingsFromServer,
  applyContentSettingsLocal,
} from '../lib/content-settings.js';
import {
  loadExperiments,
  saveExperiments,
  applyExperimentsFromServer,
  applyExperimentsLocal,
} from '../lib/experiments.js';
import { TTS_VOICE } from '../lib/tts-config.js';
import { confirmDialog, copyText, escapeHtml, showToast } from './helpers.js';
import { productLabel, setAdminLang, t } from './i18n.js';
import {
  filterUsers,
  renderBulkBar,
  renderShell,
  renderUsersTable,
} from './views.js';

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
  lineFilter: 'all',
  selectedUserIds: new Set(),
  detailUserId: null,
  sidebarOpen: false,
  apiWarnings: [],
  contentDraft: null,
  funnelDraft: null,
  dateRange: 'today',
  emailFilter: 'paletas',
  emailProduct: 'paletas_kit',
  settingsLoadError: null,
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
    lineFilter: state.lineFilter,
    apiWarnings: state.apiWarnings,
    contentDraft: state.contentDraft,
    funnelDraft: state.funnelDraft,
    dateRange: state.dateRange,
    emailFilter: state.emailFilter,
    emailProduct: state.emailProduct,
    settingsLoadError: state.settingsLoadError,
  });
  bindEvents();
}

/** Load experiments + content via Admin SDK API (authoritative). */
async function loadAdminPanelSettings({ allowClientFallback = true } = {}) {
  if (!state.currentAdminUser?.getIdToken) {
    if (allowClientFallback) {
      await loadContentSettings();
      await loadExperiments();
    }
    return { ok: false, error: 'no-user' };
  }

  try {
    const token = await state.currentAdminUser.getIdToken();
    const data = await fetchAdminSettings(token);
    if (data?.experiments) applyExperimentsFromServer(data.experiments);
    if (data?.content) applyContentSettingsFromServer(data.content);
    state.settingsLoadError = null;
    setApiWarning('settings', null);
    return { ok: true, data };
  } catch (error) {
    console.warn('[admin] settings GET failed', error);
    state.settingsLoadError = error?.message || 'settingsLoad';
    setApiWarning(
      'settings',
      isFirebaseAdminError(error?.message) ? 'firebaseAdmin' : error?.message || 'settingsLoad',
    );
    if (allowClientFallback) {
      await loadContentSettings();
      await loadExperiments();
    }
    return { ok: false, error };
  }
}

/** Update users table + bulk bar without remounting the whole shell (keeps search focus). */
function paintUsersListPartial() {
  if (state.activeTab !== 'users') {
    paint();
    return;
  }
  const filtered = filterUsers(state.usersCache, state.userFilter, state.userSearch);
  const allSelected = filtered.length > 0 && filtered.every((u) => state.selectedUserIds.has(u.id));
  const tableHost = root.querySelector('.admin-table-users')?.closest('.admin-table-wrap');
  if (tableHost) {
    tableHost.outerHTML = renderUsersTable(filtered, state.selectedUserIds, allSelected);
  }
  const existingBulk = root.querySelector('.admin-bulk-bar');
  const bulkHtml = renderBulkBar(state.selectedUserIds.size);
  if (existingBulk) {
    if (bulkHtml) existingBulk.outerHTML = bulkHtml;
    else existingBulk.remove();
  } else if (bulkHtml) {
    root.querySelector('.admin-toolbar')?.insertAdjacentHTML('afterend', bulkHtml);
  }
  bindUsersListEvents();
}

function bindUsersListEvents() {
  document.getElementById('select-all-users')?.addEventListener('change', (event) => {
    const checked = event.target.checked;
    if (!checked) {
      state.selectedUserIds.clear();
      paintUsersListPartial();
      return;
    }
    root.querySelectorAll('[data-user-select]').forEach((input) => {
      state.selectedUserIds.add(input.dataset.userSelect);
    });
    paintUsersListPartial();
  });

  root.querySelectorAll('[data-user-select]').forEach((input) => {
    input.addEventListener('change', () => {
      const uid = input.dataset.userSelect;
      if (input.checked) state.selectedUserIds.add(uid);
      else state.selectedUserIds.delete(uid);
      paintUsersListPartial();
    });
  });

  root.querySelectorAll('[data-user-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.detailUserId = btn.dataset.userView;
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
      title: t('confirm.deleteUsers.title'),
      message: t('confirm.deleteUsers.msg', { n: ids.length }),
      confirmLabel: t('confirm.deleteUsers.btn'),
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
    showToast(t('toast.usersDeleted'));
    await refreshAll();
  });
}

function isFirebaseAdminError(message) {
  const text = String(message || '').toLowerCase();
  return text.includes('firebase admin') || text.includes('no configurado');
}

function setApiWarning(id, message) {
  // Collapse duplicate firebaseAdmin warnings into one banner
  if (message === 'firebaseAdmin' || id === 'firebaseAdmin') {
    state.apiWarnings = state.apiWarnings.filter(
      (w) => w.id !== 'firebaseAdmin' && w.message !== 'firebaseAdmin',
    );
    state.apiWarnings.push({ id: 'firebaseAdmin', message: 'firebaseAdmin' });
    return;
  }
  state.apiWarnings = state.apiWarnings.filter((w) => w.id !== id);
  if (message) state.apiWarnings.push({ id, message });
}

async function loadUsers() {
  try {
    const token = await state.currentAdminUser.getIdToken();
    const data = await fetchAdminUsers(token);
    state.usersCache = (data.users || []).map((u) => ({
      ...u,
      id: u.id || u.uid,
    }));
    setApiWarning('users', null);
  } catch (error) {
    console.warn('[admin] users API fallback:', error);
    const firestoreUsers = await listUsers();
    state.usersCache = firestoreUsers.map((u) => ({
      ...u,
      id: u.id,
      missingProfile: false,
    }));
    const message = String(error?.message || '');
    const isLocalApi =
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('CONNECTION_REFUSED');
    setApiWarning(
      'users',
      isFirebaseAdminError(message)
        ? 'firebaseAdmin'
        : isLocalApi
          ? 'localApi'
          : message || 'usersApi'
    );
  }
}

async function loadAnalytics() {
  try {
    const token = await state.currentAdminUser.getIdToken();
    state.analyticsCache = await fetchAdminAnalytics(
      token,
      state.lineFilter,
      state.dateRange || 'today',
    );
    setApiWarning('analytics', null);
  } catch (error) {
    console.warn('[admin] analytics API:', error);
    state.analyticsCache = {
      pages: [],
      todayTotal: 0,
      allTimeTotal: 0,
      history: [],
      kpis: {},
      ctas: [],
      whatsapp: [],
      events: [],
      range: state.dateRange,
    };
    setApiWarning(
      'analytics',
      isFirebaseAdminError(error?.message) ? 'firebaseAdmin' : error?.message || 'analyticsApi'
    );
  }
}

async function refreshAll() {
  await loadUsers();
  if (state.activeTab === 'codes') {
    state.codesCache = await listAccessCodes();
  }
  if (state.activeTab === 'content') {
    await loadAdminPanelSettings();
    await loadAdminAllowlist();
  }
  if (
    state.activeTab === 'dashboard' ||
    state.activeTab === 'analytics' ||
    state.activeTab === 'channels' ||
    state.activeTab === 'funnel'
  ) {
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
  showToast(t('toast.usersUpdated', { n: ids.length }));
  state.selectedUserIds.clear();
  await refreshAll();
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

  root.querySelectorAll('[data-admin-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.activeTab === 'content' && state.contentDraft?.dirty) {
        if (!window.confirm(t('content.unsavedLeave'))) return;
        state.contentDraft = null;
      }
      if (state.activeTab === 'funnel' && state.funnelDraft?.dirty) {
        if (!window.confirm(t('content.unsavedLeave'))) return;
        state.funnelDraft = null;
      }
      setAdminLang(btn.dataset.adminLang);
      state.sidebarOpen = false;
      paint();
    });
  });

  root.querySelectorAll('[data-close-sidebar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sidebarOpen = false;
      paint();
    });
  });

  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const nextTab = btn.dataset.tab;
      if (
        state.activeTab === 'content' &&
        nextTab !== 'content' &&
        state.contentDraft?.dirty
      ) {
        if (!window.confirm(t('content.unsavedLeave'))) return;
        state.contentDraft = null;
      }
      if (
        state.activeTab === 'funnel' &&
        nextTab !== 'funnel' &&
        state.funnelDraft?.dirty
      ) {
        if (!window.confirm(t('content.unsavedLeave'))) return;
        state.funnelDraft = null;
      }

      state.activeTab = nextTab;
      state.sidebarOpen = false;
      if (btn.dataset.setFilter) {
        state.userFilter = btn.dataset.setFilter;
      }
      if (state.activeTab === 'funnel' && state.lineFilter === 'all') {
        state.lineFilter = 'paletas';
      }
      if (state.activeTab === 'codes') {
        state.codesCache = await listAccessCodes();
      }
      if (state.activeTab === 'content') {
        if (!state.contentDraft?.dirty) {
          await loadAdminPanelSettings();
          await loadAdminAllowlist();
          state.contentDraft = null;
        }
      }
      if (state.activeTab === 'funnel') {
        if (!state.funnelDraft?.dirty) {
          await loadAdminPanelSettings();
          state.funnelDraft = null;
        }
      }
      if (
        state.activeTab === 'dashboard' ||
        state.activeTab === 'analytics' ||
        state.activeTab === 'channels' ||
        state.activeTab === 'funnel'
      ) {
        await loadAnalytics();
      }
      paint();
    });
  });

  root.querySelectorAll('[data-line-filter]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      state.lineFilter = btn.dataset.lineFilter || 'all';
      await loadAnalytics();
      paint();
    });
  });

  root.querySelectorAll('[data-date-range]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      state.dateRange = btn.dataset.dateRange || 'today';
      await loadAnalytics();
      paint();
    });
  });

  root.querySelector('[data-funnel-refresh]')?.addEventListener('click', async () => {
    const btn = root.querySelector('[data-funnel-refresh]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('funnel.refreshing');
    }
    await loadAnalytics();
    paint();
    showToast(t('funnel.refreshed'));
  });

  // Persist collapse open/closed
  root.querySelectorAll('details[data-collapse-id]').forEach((el) => {
    const id = el.dataset.collapseId;
    const key = `admin_collapse_${id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved === '1') el.open = true;
      if (saved === '0') el.open = false;
    } catch {
      /* ignore */
    }
    el.addEventListener('toggle', () => {
      try {
        localStorage.setItem(key, el.open ? '1' : '0');
      } catch {
        /* ignore */
      }
    });
  });

  root.querySelectorAll('[data-email-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.emailFilter = btn.dataset.emailFilter || 'paletas';
      paint();
    });
  });

  root.querySelectorAll('[data-email-product]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.emailProduct = btn.dataset.emailProduct || 'paletas_kit';
      paint();
    });
  });

  function refreshEmailPreview() {
    const frame = root.querySelector('[data-email-preview-live]');
    const store = root.querySelector('[data-email-html-live]');
    if (!frame || !store) return;
    const name = root.querySelector('[data-email-preview-name]')?.value?.trim() || 'María';
    const built = getAdminEmailTemplate(state.emailProduct || 'paletas_kit', name);
    store.value = built.html;
    const subjectEl = root.querySelector('[data-email-live-subject]');
    if (subjectEl) subjectEl.textContent = built.subject;
    frame.srcdoc = built.html;
  }

  // Initial live preview fill
  if (state.activeTab === 'emails') {
    const frame = root.querySelector('[data-email-preview-live]');
    const store = root.querySelector('[data-email-html-live]');
    if (frame && store) {
      frame.srcdoc = store.value || '';
    }
  }

  root.querySelector('[data-email-preview-name]')?.addEventListener('input', () => {
    refreshEmailPreview();
  });

  root.querySelectorAll('[data-email-device]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const device = btn.dataset.emailDevice || 'mobile';
      root.querySelectorAll('[data-email-device]').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      const wrap = root.querySelector('[data-email-device-frame]');
      if (wrap) wrap.dataset.emailDeviceFrame = device;
    });
  });

  root.querySelector('[data-copy-html-live]')?.addEventListener('click', async () => {
    const store = root.querySelector('[data-email-html-live]');
    const html = store?.value || '';
    if (!html) return;
    await copyText(html);
    showToast(t('emails.copied'));
  });

  root.querySelector('[data-email-send-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = root.querySelector('[data-email-to]')?.value?.trim();
    const name = root.querySelector('[data-email-name]')?.value?.trim() || '';
    const product =
      root.querySelector('[data-email-product-field]')?.value ||
      state.emailProduct ||
      'paletas_kit';
    if (!email) return;
    const btn = event.target.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('emails.sending');
    }
    try {
      const token = await state.currentAdminUser.getIdToken();
      await sendWelcomeEmail(token, { email, name, product });
      showToast(t('emails.sent'));
    } catch (error) {
      showToast(error?.message || t('emails.sendError'));
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('emails.send');
    }
  });

  root.querySelectorAll('[data-email-send-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.email;
      const name = btn.dataset.name || '';
      const product = btn.dataset.product || 'paletas_kit';
      if (!email) return;
      btn.disabled = true;
      try {
        const token = await state.currentAdminUser.getIdToken();
        await sendWelcomeEmail(token, { email, name, product });
        showToast(t('emails.sent'));
      } catch (error) {
        showToast(error?.message || t('emails.sendError'));
      }
      btn.disabled = false;
    });
  });

  root.querySelectorAll('[data-kiwify-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.kiwifySubTab = btn.dataset.kiwifyTab;
      paint();
    });
  });

  function collectContentDraftFromDom() {
    const lines = {};
    root.querySelectorAll('[data-content-flag]').forEach((input) => {
      const lineId = input.dataset.contentLine;
      const flag = input.dataset.contentFlag;
      if (!lineId || !flag) return;
      if (!lines[lineId]) lines[lineId] = {};
      lines[lineId][flag] = input.checked;
    });
    return {
      dirty: true,
      lines,
    };
  }

  function collectFunnelDraftFromDom() {
    const abEnabledEl = root.querySelector('[data-ab-enabled]');
    const abNumber = root.querySelector('[data-ab-quiz-number]');
    const abRange = root.querySelector('[data-ab-quiz-percent]');
    const quizPercent = Math.max(
      0,
      Math.min(100, Math.round(Number(abNumber?.value ?? abRange?.value) || 0)),
    );
    return {
      dirty: true,
      ab: {
        enabled: Boolean(abEnabledEl?.checked),
        quizPercent,
      },
    };
  }

  function markContentDirty() {
    state.contentDraft = collectContentDraftFromDom();
    const bar = root.querySelector('[data-content-save-bar]');
    const status = root.querySelector('[data-content-save-status]');
    const btn = root.querySelector('[data-content-save-all]');
    bar?.classList.add('is-dirty');
    if (status) status.textContent = t('content.dirty');
    if (btn) btn.disabled = false;
  }

  function markFunnelDirty() {
    state.funnelDraft = collectFunnelDraftFromDom();
    const bar = root.querySelector('[data-funnel-save-bar]');
    const status = root.querySelector('[data-funnel-save-status]');
    const btn = root.querySelector('[data-funnel-save-ab]');
    bar?.classList.add('is-dirty');
    if (status) status.textContent = t('content.dirty');
    if (btn) btn.disabled = false;

    const enabled = Boolean(root.querySelector('[data-ab-enabled]')?.checked);
    const quiz = state.funnelDraft.ab.quizPercent;
    const pill = root.querySelector('[data-ab-live-pill]');
    if (pill) {
      pill.textContent = enabled
        ? t('content.abLiveOn', { quiz: String(quiz), lp: String(100 - quiz) })
        : t('content.abLiveOff');
      pill.classList.toggle('is-on', enabled);
    }
  }

  function syncAbSplitLabel(pct) {
    const label = root.querySelector('[data-ab-split-label]');
    if (!label) return;
    const quiz = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    label.textContent = t('content.abSplit', {
      quiz: String(quiz),
      lp: String(100 - quiz),
    });
  }

  function setAbControlsEnabled(on) {
    root.querySelectorAll('[data-ab-quiz-percent], [data-ab-quiz-number]').forEach((el) => {
      el.disabled = !on;
    });
  }

  root.querySelectorAll('[data-content-dirty]').forEach((input) => {
    input.addEventListener('change', () => {
      markContentDirty();
    });
  });

  root.querySelectorAll('[data-funnel-dirty]').forEach((input) => {
    const eventName = input.type === 'range' || input.type === 'number' ? 'input' : 'change';
    input.addEventListener(eventName, () => {
      if (input.matches('[data-ab-enabled]')) {
        setAbControlsEnabled(input.checked);
      }
      if (input.matches('[data-ab-quiz-percent]')) {
        const num = root.querySelector('[data-ab-quiz-number]');
        if (num) num.value = input.value;
        syncAbSplitLabel(input.value);
      }
      if (input.matches('[data-ab-quiz-number]')) {
        let v = Math.max(0, Math.min(100, Math.round(Number(input.value) || 0)));
        input.value = String(v);
        const range = root.querySelector('[data-ab-quiz-percent]');
        if (range) range.value = String(v);
        syncAbSplitLabel(v);
      }
      markFunnelDirty();
    });
  });

  root.querySelector('[data-content-save-all]')?.addEventListener('click', async () => {
    const btn = root.querySelector('[data-content-save-all]');
    const status = root.querySelector('[data-content-save-status]');
    const draft = collectContentDraftFromDom();
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('content.saving');
    }
    if (status) status.textContent = t('content.saving');

    try {
      const token = await state.currentAdminUser.getIdToken();
      const saved = await saveAdminSettings(token, {
        content: { lines: draft.lines },
      });

      if (saved?.content) applyContentSettingsFromServer(saved.content);
      else applyContentSettingsLocal(draft.lines);

      state.contentDraft = null;
      state.settingsLoadError = null;
      showToast(t('content.allSaved'));
      paint();
      return;
    } catch (apiErr) {
      console.warn('[admin] settings API, trying client write', apiErr);

      const contentResult = await saveContentSettings(draft.lines);

      if (contentResult.ok && contentResult.cloud) {
        state.contentDraft = null;
        showToast(t('content.allSaved'));
        paint();
        return;
      }

      state.contentDraft = draft;
      const detail = String(
        apiErr?.message ||
          contentResult.error?.code ||
          contentResult.error?.message ||
          '',
      );
      const needsServer = /firebase admin|no configurado|503/i.test(detail);
      const blocked = /permission|insufficient|forbidden|blocked/i.test(detail);
      const localOnly = contentResult.ok && !contentResult.cloud;
      showToast(
        needsServer || localOnly
          ? t('content.saveNeedServer')
          : blocked
            ? t('content.saveBlocked')
            : t('toast.saveError'),
      );
    }

    if (btn) {
      btn.disabled = false;
      btn.textContent = t('content.saveAll');
    }
    if (status) status.textContent = t('content.dirty');
  });

  root.querySelector('[data-funnel-save-ab]')?.addEventListener('click', async () => {
    const btn = root.querySelector('[data-funnel-save-ab]');
    const status = root.querySelector('[data-funnel-save-status]');
    const draft = collectFunnelDraftFromDom();
    if (btn) {
      btn.disabled = true;
      btn.textContent = t('content.saving');
    }
    if (status) status.textContent = t('content.saving');

    try {
      const token = await state.currentAdminUser.getIdToken();
      const saved = await saveAdminSettings(token, {
        experiments: {
          paletas: {
            entry: {
              enabled: draft.ab.enabled,
              quizPercent: draft.ab.quizPercent,
            },
          },
        },
      });

      if (saved?.experiments) applyExperimentsFromServer(saved.experiments);
      else applyExperimentsLocal({ paletas: { entry: draft.ab } });

      state.funnelDraft = null;
      state.settingsLoadError = null;
      showToast(t('funnel.abSaved'));
      paint();
      return;
    } catch (apiErr) {
      console.warn('[admin] funnel AB save, trying client write', apiErr);

      const expResult = await saveExperiments({
        paletas: {
          entry: {
            enabled: draft.ab.enabled,
            quizPercent: draft.ab.quizPercent,
          },
        },
      });

      if (expResult.ok && expResult.cloud) {
        state.funnelDraft = null;
        showToast(t('funnel.abSaved'));
        paint();
        return;
      }

      state.funnelDraft = draft;
      const detail = String(
        apiErr?.message || expResult.error?.code || expResult.error?.message || '',
      );
      const needsServer = /firebase admin|no configurado|503/i.test(detail);
      const blocked = /permission|insufficient|forbidden|blocked/i.test(detail);
      const localOnly = expResult.ok && !expResult.cloud;
      showToast(
        needsServer || localOnly
          ? t('content.saveNeedServer')
          : blocked
            ? t('content.saveBlocked')
            : t('toast.saveError'),
      );
    }

    if (btn) {
      btn.disabled = false;
      btn.textContent = t('funnel.saveAb');
    }
    if (status) status.textContent = t('content.dirty');
  });

  document.getElementById('admin-tts-test')?.addEventListener('click', async () => {
    const btn = document.getElementById('admin-tts-test');
    const status = document.getElementById('admin-tts-status');
    if (!btn || !status) return;

    btn.disabled = true;
    status.textContent = t('content.audioTesting');

    const sample =
      'Hola, soy tu guía de recetas. Hoy preparamos un postre en vaso de fresa. Paso uno, mezcla la crema con el queso.';

    try {
      const res = await fetch('/api/tts/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sample, voice: TTS_VOICE }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.audioContent) {
        const detail = payload.detail || payload.error || `HTTP ${res.status}`;
        const billing = /billing/i.test(detail);
        status.textContent = t('content.audioFail', {
          detail: billing ? t('content.audioBilling') : detail,
        });
        return;
      }

      const binary = atob(payload.audioContent);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();

      status.textContent = t('content.audioOk', {
        voice: payload.voice || TTS_VOICE.name,
        lang: payload.languageCode || TTS_VOICE.languageCode,
      });
    } catch (err) {
      status.textContent = t('content.audioFail', { detail: err?.message || 'Error de red' });
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('admin-emails-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const raw = document.getElementById('admin-emails-input')?.value || '';
    const emails = raw
      .split(/[\n,;]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    const result = await saveAdminEmails(emails);
    if (result.ok) {
      showToast(t('content.adminsSaved'));
      paint();
      return;
    }
    showToast(t('toast.adminsSaveError'));
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
    paintUsersListPartial();
  });

  bindUsersListEvents();

  root.querySelectorAll('[data-inbox-grant]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.inboxGrant;
      const productId = btn.dataset.product;
      const product = PRODUCT_BY_ID[productId];
      if (!product) return;
      btn.disabled = true;
      const updates = {
        [product.field]: true,
        lastGrantSource: 'admin_inbox',
        lastGrantAt: new Date().toISOString(),
      };
      if (product.tier === 'upsell') {
        updates[`premiumPending.${product.group}`] = false;
      }
      await updateUserProfile(uid, updates);
      if (
        productId === 'paletas_kit' ||
        productId === 'postres_kit' ||
        productId === 'paletas_premium' ||
        productId === 'postres_premium'
      ) {
        const user = state.usersCache.find((u) => u.id === uid);
        if (user?.email) {
          try {
            const token = await state.currentAdminUser.getIdToken();
            await sendWelcomeEmail(token, {
              email: user.email,
              name: user.displayName,
              product: productId,
              line: product.group,
            });
          } catch {
            /* optional */
          }
        }
      }
      showToast(t('toast.accessUpdated'));
      await refreshAll();
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
      const product = PRODUCT_BY_ID[productId];
      if (!product) return;
      const updates = { [product.field]: active };
      if (active && product.tier === 'upsell') {
        updates[`premiumPending.${product.group}`] = false;
      }
      if (active) {
        updates.lastGrantSource = 'admin_drawer';
        updates.lastGrantAt = new Date().toISOString();
      }
      await updateUserProfile(uid, updates);
      if (
        active &&
        (productId === 'paletas_kit' ||
          productId === 'postres_kit' ||
          productId === 'paletas_premium' ||
          productId === 'postres_premium')
      ) {
        const user = state.usersCache.find((u) => u.id === uid);
        if (user?.email) {
          try {
            const token = await state.currentAdminUser.getIdToken();
            await sendWelcomeEmail(token, {
              email: user.email,
              name: user.displayName,
              product: productId,
              line: product.group,
            });
          } catch {
            /* optional */
          }
        }
      }
      showToast(t('toast.accessUpdated'));
      await refreshAll();
      state.detailUserId = uid;
      paint();
    });
  });

  root.querySelectorAll('[data-drawer-audio]').forEach((select) => {
    select.addEventListener('change', async () => {
      const uid = select.dataset.drawerAudio;
      const value = select.value;
      const audioGuideEnabled = value === 'on' ? true : value === 'off' ? false : null;
      await updateUserProfile(uid, { audioGuideEnabled });
      showToast(t('toast.accessUpdated'));
      await refreshAll();
      state.detailUserId = uid;
      paint();
    });
  });

  root.querySelectorAll('[data-drawer-menu-web]').forEach((select) => {
    select.addEventListener('change', async () => {
      const uid = select.dataset.drawerMenuWeb;
      const value = select.value;
      const menuWebEnabled = value === 'on' ? true : value === 'off' ? false : null;
      await updateUserProfile(uid, { menuWebEnabled });
      showToast(t('toast.accessUpdated'));
      await refreshAll();
      state.detailUserId = uid;
      paint();
    });
  });

  root.querySelectorAll('[data-clear-pending]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.clearPending;
      await updateUserProfile(uid, {
        'premiumPending.paletas': false,
        'premiumPending.postres': false,
      });
      showToast(t('toast.pendingCleared'));
      await refreshAll();
      state.detailUserId = uid;
      paint();
    });
  });

  root.querySelector('[data-sync-users]')?.addEventListener('click', async () => {
    const btn = root.querySelector('[data-sync-users]');
    btn.disabled = true;
    try {
      const token = await state.currentAdminUser.getIdToken();
      const data = await syncAdminUsers(token);
      state.usersCache = data.users || [];
      showToast(t('toast.profilesSynced', { n: data.created || 0 }));
      paint();
    } catch (error) {
      showToast(error.message || t('toast.syncError'));
      btn.disabled = false;
    }
  });

  root.querySelector('[data-open-add-user]')?.addEventListener('click', () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div class="admin-modal-overlay visible" id="add-user-modal">
        <div class="admin-modal admin-modal-lg">
          <h3>${escapeHtml(t('modal.createUser.title'))}</h3>
          <p>${escapeHtml(t('modal.createUser.sub'))}</p>
          <form id="add-user-form" class="admin-form-grid">
            <label>${escapeHtml(t('modal.createUser.name'))}<input name="displayName" type="text" required></label>
            <label>${escapeHtml(t('modal.createUser.email'))}<input name="email" type="email" required></label>
            <label>
              ${escapeHtml(t('modal.createUser.password'))}
              <input name="password" type="password" minlength="6" autocomplete="new-password" placeholder="${escapeHtml(t('modal.createUser.passwordOptional'))}">
            </label>
            <p class="admin-hint">${escapeHtml(t('modal.createUser.passwordHint'))}</p>
            <div class="admin-form-products">
              <label class="admin-check-card"><input type="checkbox" name="product" value="paletas_kit"><span>🍓 ${escapeHtml(productLabel('paletas_kit'))}</span></label>
              <label class="admin-check-card"><input type="checkbox" name="product" value="paletas_premium"><span>⭐ ${escapeHtml(productLabel('paletas_premium'))}</span></label>
              <label class="admin-check-card"><input type="checkbox" name="product" value="postres_kit"><span>🍨 ${escapeHtml(productLabel('postres_kit'))}</span></label>
              <label class="admin-check-card"><input type="checkbox" name="product" value="postres_premium"><span>✨ ${escapeHtml(productLabel('postres_premium'))}</span></label>
            </div>
            <div class="admin-modal-actions">
              <button type="button" class="admin-btn ghost" data-close-add-user>${escapeHtml(t('modal.cancel'))}</button>
              <button type="submit" class="admin-btn primary">${escapeHtml(t('modal.createUser.submit'))}</button>
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
        const password = String(form.password.value || '').trim();
        const data = await createAdminUser(token, {
          displayName: form.displayName.value,
          email: form.email.value,
          password: password || undefined,
          products,
        });
        state.usersCache = data.users || state.usersCache;
        document.getElementById('add-user-modal')?.remove();
        if (data.linkedExisting) {
          showToast(t('toast.userLinked'));
        } else if (data.needsPasswordSetup) {
          showToast(t('toast.userCreatedNoPass'));
        } else {
          showToast(t('toast.userCreated'));
        }
        paint();
      } catch (error) {
        showToast(error.message || t('toast.createError'));
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
          product: btn.dataset.product || null,
          line: btn.dataset.line || 'paletas',
        });
        showToast(t('toast.emailResent'));
      } catch {
        showToast(t('toast.emailResendFail'));
      }
    });
  });

  root.querySelectorAll('[data-user-admin]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: t('confirm.makeAdmin.title'),
        message: t('confirm.makeAdmin.msg'),
        confirmLabel: t('modal.confirm'),
      });
      if (!ok) return;
      await updateUserProfile(btn.dataset.userAdmin, { ...ADMIN_PROFILE_GRANTS });
      showToast(t('toast.adminPromoted'));
      await refreshAll();
      state.detailUserId = btn.dataset.userAdmin;
      paint();
    });
  });

  root.querySelectorAll('[data-user-demote]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: t('confirm.removeAdmin.title'),
        message: t('confirm.removeAdmin.msg'),
        confirmLabel: t('modal.confirm'),
        danger: true,
      });
      if (!ok) return;
      await updateUserProfile(btn.dataset.userDemote, { isAdmin: false });
      showToast(t('toast.adminDemoted'));
      await refreshAll();
      state.detailUserId = btn.dataset.userDemote;
      paint();
    });
  });

  root.querySelectorAll('[data-user-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: t('confirm.deleteUser.title'),
        message: t('confirm.deleteUser.msg', { email: escapeHtml(btn.dataset.email) }),
        confirmLabel: t('confirm.deleteUser.btn'),
        danger: true,
      });
      if (!ok) return;
      const token = await state.currentAdminUser.getIdToken();
      await deleteUserAccount(token, btn.dataset.userDelete);
      state.detailUserId = null;
      showToast(t('toast.userDeleted'));
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
      showToast(t('toast.codeCreated'));
      paint();
    } catch (error) {
      showToast(error.message || t('toast.error'));
    }
  });

  root.querySelectorAll('[data-code-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await toggleAccessCode(btn.dataset.codeToggle, btn.dataset.active !== 'true');
      state.codesCache = await listAccessCodes();
      showToast(t('toast.codeUpdated'));
      paint();
    });
  });

  root.querySelectorAll('[data-code-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: t('confirm.deleteCode.title'),
        message: t('confirm.deleteCode.msg'),
        confirmLabel: t('confirm.deleteUser.btn'),
        danger: true,
      });
      if (!ok) return;
      await deleteAccessCode(btn.dataset.codeDelete);
      state.codesCache = await listAccessCodes();
      showToast(t('toast.codeDeleted'));
      paint();
    });
  });

  root.querySelectorAll('[data-copy-code-link]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.dataset.copyCodeLink;
      const type = btn.dataset.codeType || '';
      const isPostres = String(type).startsWith('postres');
      const path = isPostres ? '/postres/cadastrar' : '/cadastrar';
      const url = `${window.location.origin}${path}?code=${encodeURIComponent(code)}`;
      await copyText(url, t('toast.linkCopied'));
    });
  });

  root.querySelectorAll('.copy-btn[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => copyText(decodeURIComponent(btn.dataset.copy || '')));
  });

  root.querySelectorAll('.copy-btn[data-copy-html]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const html =
        btn.dataset.copyHtml === 'premium' ? kiwifyPremiumEmailHtml() : kiwifyKitEmailHtml();
      copyText(html, t('toast.htmlCopied'));
    });
  });
}

function renderLoading() {
  root.innerHTML = `<div class="admin-loading-screen"><div class="admin-spinner"></div><p>${escapeHtml(t('loading'))}</p></div>`;
}

function renderDenied(message, user = null) {
  const email = user?.email ? `<p class="admin-denied-email">Sesión: <strong>${escapeHtml(user.email)}</strong></p>` : '';
  const hint = `<p class="admin-hint">Si eres el dueño del proyecto, agrega tu correo en Vercel → <code>VITE_ADMIN_EMAILS</code> y vuelve a desplegar, o marca <code>isAdmin: true</code> en Firestore (<code>users/tu-uid</code>).</p>`;
  root.innerHTML = `<div class="admin-error"><div class="admin-error-card"><h1>${escapeHtml(t('denied.title'))}</h1><p>${escapeHtml(message)}</p>${email}${hint}<a href="/login?next=/admin" class="admin-btn primary">${escapeHtml(t('denied.login'))}</a></div></div>`;
}

renderLoading();

watchAuth(async (user) => {
  try {
    if (!user) {
      window.location.replace('/login?next=/admin');
      return;
    }
    if (!isFirebaseConfigured) {
      renderDenied(t('denied.noFirebase'));
      return;
    }

    let profile = await getUserProfile(user.uid);
    await loadAdminAllowlist();
    const admin = (await isUserAdmin(user, profile)) || DEV_ADMIN_ACCESS;
    if (!admin) {
      renderDenied(t('denied.noAdmin'), user);
      return;
    }

    if (!profile?.isAdmin) {
      await updateUserProfile(user.uid, {
        email: user.email?.trim().toLowerCase() || '',
        displayName: user.displayName || '',
        ...ADMIN_PROFILE_GRANTS,
      });
    }

    const allowlist = await loadAdminAllowlist();
    if (allowlist.length === 0 && user.email) {
      await saveAdminEmails([user.email]);
      await loadAdminAllowlist();
    }

    state.currentAdminUser = user;
    await loadAdminAllowlist();
    await loadUsers();
    await loadAdminPanelSettings();
    await loadAnalytics();
    paint();
  } catch (error) {
    console.error('[admin]', error);
    renderDenied(error.message || t('denied.loadError'), user);
  }
});
