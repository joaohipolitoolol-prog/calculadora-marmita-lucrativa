import {
  CHECKLIST_PRODUCCION,
  CHECKLIST_VENTA,
  LISTA_COMPRAS,
  MENSAJES_WHATSAPP,
  MENSAJES_PREMIUM,
  FECHAS_PREMIUM,
  GUIA_PREMIUM,
  KIT_EXTRAS,
  PLAN_7_DIAS,
  RECETAS_PALETAS,
  RECETAS_PREMIUM,
  COMBOS_PREMIUM,
} from '../data/kit-paletas.js';
import {
  CHECKLIST_POSTRES,
  LISTA_COMPRAS_POSTRES,
  MENSAJES_POSTRES,
  MENSAJES_POSTRES_PREMIUM,
  FECHAS_POSTRES_PREMIUM,
  GUIA_POSTRES_PREMIUM,
  PLAN_7_DIAS_POSTRES,
  RECETAS_POSTRES,
  RECETAS_POSTRES_PREMIUM,
  COMBOS_POSTRES_PREMIUM,
} from '../data/kit-postres.js';
import {
  calculate,
  cloneInputs,
  readInputsFromForm,
} from '../lib/calculator.js';
import { LOCAL_USER, getUserLabel } from '../lib/local-user.js';
import { logout, redirectIfGuest, watchAuth } from '../lib/auth.js';
import { CURRENCIES, getCurrency, getCurrencyCode, getCurrencySymbol, setCurrencyCode } from '../lib/currency.js';
import {
  hasKitAccess,
  isUserAdmin,
  markPremiumPending,
  resolveUserProfile,
  touchUserActivity,
} from '../lib/user-profile.js';
import { saveDisplayName, getLocalDisplayName } from '../lib/user-settings.js';
import { bindTrackClicks, trackEvent } from '../lib/track.js';
import { defaultNumberIdForLine, getWhatsAppDisplay, getWhatsAppUrl } from '../lib/whatsapp-numbers.js';
import { WHATSAPP_PURCHASE_MESSAGE, WHATSAPP_SUPPORT_MESSAGE } from '../landing/config.js';

function lineWhatsApp(purpose = 'support') {
  const lineId = activeLine?.id || 'paletas';
  const id = defaultNumberIdForLine(lineId, purpose);
  const message =
    purpose === 'support'
      ? lineId === 'postres'
        ? '¡Hola! Necesito ayuda con Postres en Vaso.'
        : WHATSAPP_SUPPORT_MESSAGE
      : WHATSAPP_PURCHASE_MESSAGE;
  return {
    id,
    href: getWhatsAppUrl(id, message),
    display: getWhatsAppDisplay(id),
  };
}
import { UPSELL_CHECKOUT_URL, UPSELL_PRICE_LABEL, UPSELL_NAME } from '../upsell/config.js';
import {
  UPSELL_CHECKOUT_URL as POSTRES_UPSELL_CHECKOUT,
  UPSELL_PRICE_LABEL as POSTRES_UPSELL_PRICE,
  UPSELL_NAME as POSTRES_UPSELL_NAME,
} from '../postres-upsell/config.js';
import { money, percent, parseNumber, escapeHtml } from '../lib/format.js';
import {
  fullToSimple,
  readSimpleFromForm,
  simpleToFull,
  SIMPLE_DEFAULTS,
} from '../lib/simple-mode.js';
import {
  clearDraft,
  clearScenarios,
  deleteScenario,
  getDraftStoreSync,
  listScenarios,
  loadDraftStore,
  saveDraft,
  saveScenario,
  saveChecklistToCloud,
} from '../lib/storage.js';
import {
  crossSellLines,
  getEnabledLines,
  getTopbarLines,
  ownedLinesFromProfile,
  PRODUCT_LINE_BY_ID,
  rememberActiveLine,
  resolveActiveLine,
  premiumStorageKey,
  LEGACY_PREMIUM_STORAGE_KEY,
} from '../lib/product-lines.js';
import { ICONS, VIEW_META, TAB_VIEWS } from './icons.js';
import { BRAND_EMOJI } from '../brand/logo-mark.js';
import {
  clearOnboardingSeen,
  hasSeenOnboarding,
  showOnboarding,
} from './onboarding.js';
import { DEV_ADMIN_ACCESS, DEV_UNLOCK_ALL_CONTENT } from '../site/dev.js';
import {
  isPwaInstalled,
  openPwaGuide,
} from './pwa-install.js';
import {
  KIT_DOWNLOADS,
  PREMIUM_DOWNLOADS,
  POSTRES_DOWNLOADS,
  POSTRES_PREMIUM_DOWNLOADS,
  getDocById,
  isViewableDoc,
  isNativeDoc,
  hasPdfDownload,
} from './documents.js';
import {
  bindMenuWebEvents,
  ensureMenuDraftLoaded,
  renderMenuWebView,
} from './menu-editor.js';
import {
  bindMenuWhatsAppEvents,
  loadMenuWaDraft,
  menuWaExportHref,
  renderMenuWhatsAppView,
} from './menu-whatsapp.js';
import {
  bindMenuPremiumEvents,
  loadMenuPremiumDraft,
  menuPremiumExportHref,
  renderMenuPremiumView,
} from './menu-premium.js';
import {
  renderFechasEspeciales,
  renderGuiaPresentacion,
  renderKitExtras,
  renderMensajesList,
  renderPremiumLocked,
} from './kit-sections.js';
import { canUseMenusCloud } from '../lib/menus.js';

const root = document.getElementById('app-root');
const toastEl = document.getElementById('toast');

let currentUser = LOCAL_USER;
let inputMode = 'simple';
let simpleValues = { ...SIMPLE_DEFAULTS };
let currentInputs = simpleToFull(SIMPLE_DEFAULTS);
let currentResults = calculate(currentInputs);
let scenarios = [];
let activeView = 'home';
let kitHubTab = 'recetas';
let kitSection = 'mensajes';
let menuWaDraft = null;
let menuPremiumDraft = null;
let activeDocId = null;
let openStep = 1;
let drawerOpen = false;
let drawerMinimized = false;
try {
  drawerMinimized = localStorage.getItem('app_drawer_minimized_v1') === '1';
} catch {
  drawerMinimized = false;
}
let recipeCatalog = 'base';
let recipeFilter = 'all';
let kitUnlocked = true;
let userProfile = null;
let ownedLines = [PRODUCT_LINE_BY_ID.paletas];
let activeLine = PRODUCT_LINE_BY_ID.paletas;
let userIsAdmin = false;
let deferredInstallPrompt = null;

function lineBrand() {
  return activeLine || PRODUCT_LINE_BY_ID.paletas;
}

function ownsLine(lineId) {
  return ownedLines.some((l) => l.id === lineId);
}

function kitContentForLine() {
  const id = lineBrand().id;
  if (id === 'postres') {
    return {
      recipes: RECETAS_POSTRES,
      recipesPremium: RECETAS_POSTRES_PREMIUM,
      combos: COMBOS_POSTRES_PREMIUM,
      mensajes: MENSAJES_POSTRES,
      plan: PLAN_7_DIAS_POSTRES,
      lista: LISTA_COMPRAS_POSTRES,
      checklist: CHECKLIST_POSTRES,
      mensajesPremium: MENSAJES_POSTRES_PREMIUM,
      fechasPremium: FECHAS_POSTRES_PREMIUM,
      guiaPremium: GUIA_POSTRES_PREMIUM,
      kitExtras: null,
      downloads: POSTRES_DOWNLOADS,
      premiumDownloads: POSTRES_PREMIUM_DOWNLOADS,
      upsellCheckout: POSTRES_UPSELL_CHECKOUT,
      upsellPrice: POSTRES_UPSELL_PRICE,
      upsellName: POSTRES_UPSELL_NAME,
      upsellPath: '/postres/upsell',
      recipeTitle: 'Recetas de postres en vaso',
      premiumRecipeTitle: 'Recetas premium · Postres',
    };
  }
  return {
    recipes: RECETAS_PALETAS,
    recipesPremium: RECETAS_PREMIUM,
    combos: COMBOS_PREMIUM,
    mensajes: MENSAJES_WHATSAPP,
    plan: PLAN_7_DIAS,
    lista: LISTA_COMPRAS,
    checklist: CHECKLIST_PRODUCCION,
    checklistVenta: CHECKLIST_VENTA,
    mensajesPremium: MENSAJES_PREMIUM,
    fechasPremium: FECHAS_PREMIUM,
    guiaPremium: GUIA_PREMIUM,
    kitExtras: KIT_EXTRAS,
    downloads: KIT_DOWNLOADS,
    premiumDownloads: PREMIUM_DOWNLOADS,
    upsellCheckout: UPSELL_CHECKOUT_URL,
    upsellPrice: UPSELL_PRICE_LABEL,
    upsellName: UPSELL_NAME,
    upsellPath: '/upsell-paletas-premium',
    recipeTitle: '30 Recetas de Paletas',
    premiumRecipeTitle: '20 Recetas Premium',
  };
}

const THEME_STORAGE_KEY = 'app_theme_v1';

function getTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', next === 'dark' ? '#141014' : '#FFF6F9');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
}

function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  render();
}

applyTheme(getTheme());

function shouldShowInstallButton() {
  return !isPwaInstalled();
}

function triggerPwaInstall() {
  if (isPwaInstalled()) {
    showToast('Ya está en tu pantalla de inicio');
    return;
  }
  openPwaGuide({
    deferredInstallPrompt,
    showToast,
    onAccepted: () => {
      deferredInstallPrompt = null;
      render();
    },
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });
}

function registerPwa() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('Nueva versión lista — recarga la app');
          }
        });
      });
    })
    .catch(() => {});
}

function getCalcSteps() {
  const unit = lineBrand().unitPlural;
  return [
    { id: 1, label: 'Producción', desc: `¿Cuántos ${unit} preparas por día?` },
    { id: 2, label: 'Ingredientes', desc: 'Costo de cada preparo ÷ porciones' },
    { id: 3, label: 'Extras', desc: 'Empaque, hielo, entrega, desperdicio' },
    { id: 4, label: 'Tiempo', desc: 'Cuánto vale tu hora de trabajo' },
    { id: 5, label: 'Precio', desc: 'Cuánto cobras y qué margen quieres' },
  ];
}

function checklistKey(uid) {
  return `kit_checklist_${lineBrand().id}_${uid}`;
}

function checklistVentaKey(uid) {
  return `kit_checklist_venta_${lineBrand().id}_${uid}`;
}

function listaComprasKey(uid) {
  return `kit_lista_${lineBrand().id}_${uid}`;
}

function readPremiumFlag(lineId) {
  if (localStorage.getItem(premiumStorageKey(lineId)) === '1') return true;
  // Migrate legacy Paletas-only key once.
  if (lineId === 'paletas' && localStorage.getItem(LEGACY_PREMIUM_STORAGE_KEY) === '1') {
    localStorage.setItem(premiumStorageKey('paletas'), '1');
    return true;
  }
  return false;
}

function writePremiumFlag(lineId, on) {
  const key = premiumStorageKey(lineId);
  if (on) localStorage.setItem(key, '1');
  else localStorage.removeItem(key);
  if (lineId === 'paletas') {
    if (on) localStorage.setItem(LEGACY_PREMIUM_STORAGE_KEY, '1');
    else localStorage.removeItem(LEGACY_PREMIUM_STORAGE_KEY);
  }
}

function hasPremiumAccess() {
  if (DEV_UNLOCK_ALL_CONTENT) return true;
  if (userProfile) {
    return Boolean(userProfile[lineBrand().premiumField] || userProfile.isAdmin);
  }
  return readPremiumFlag(lineBrand().id);
}

function hasKitContentAccess() {
  if (DEV_UNLOCK_ALL_CONTENT) return true;
  // Active chip = owned line → content unlocked (admin can revoke the flag anytime).
  return ownsLine(lineBrand().id);
}

const SIMULATION_VOLUMES = [10, 20, 30];

const RECIPE_FILTERS_PALETAS = [
  { id: 'all', label: 'Todas' },
  { id: 'frutal', label: 'Frutales' },
  { id: 'cremosa', label: 'Cremosas' },
  { id: 'rellena', label: 'Rellenas' },
  { id: 'postre', label: 'Postre' },
  { id: 'banada', label: 'Bañadas' },
];

const RECIPE_FILTERS_POSTRES = [
  { id: 'all', label: 'Todas' },
  { id: 'cremoso', label: 'Cremosos' },
  { id: 'frutal', label: 'Frutales' },
];

function recipeFiltersForLine(catalog = recipeCatalog) {
  const all = lineBrand().id === 'postres' ? RECIPE_FILTERS_POSTRES : RECIPE_FILTERS_PALETAS;
  const kit = kitContentForLine();
  const recipes =
    catalog === 'premium' ? kit.recipesPremium || [] : kit.recipes || [];
  if (!recipes.length) return all;
  const present = new Set(recipes.map((r) => recipeTipoSlug(r.tipo)));
  return all.filter((f) => f.id === 'all' || present.has(f.id));
}

function ensureValidRecipeFilter() {
  const ids = recipeFiltersForLine().map((f) => f.id);
  if (!ids.includes(recipeFilter)) recipeFilter = 'all';
}

function catalogTypeSummary(recipes) {
  const counts = {};
  for (const r of recipes || []) {
    const label = r.tipo || 'Otros';
    counts[label] = (counts[label] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]) => `${n} ${label}`)
    .join(' · ');
}

function enableHorizontalDragScroll(el) {
  if (!el || el.dataset.dragScrollBound === '1') return;
  el.dataset.dragScrollBound = '1';

  let pointerId = null;
  let startX = 0;
  let startScroll = 0;
  let dragged = false;
  let activeBtn = null;

  el.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') return;
    if (event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScroll = el.scrollLeft;
    dragged = false;
    activeBtn = event.target.closest('[data-recipe-filter], [data-kit-section]');
  });

  el.addEventListener('pointermove', (event) => {
    if (pointerId == null || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    if (!dragged && Math.abs(dx) > 6) {
      dragged = true;
      el.classList.add('is-dragging');
      el.setPointerCapture?.(pointerId);
    }
    if (!dragged) return;
    el.scrollLeft = startScroll - dx;
    event.preventDefault();
  });

  const endDrag = (event) => {
    if (pointerId == null || (event && event.pointerId !== pointerId)) return;
    if (dragged && activeBtn) {
      activeBtn.dataset.dragMoved = '1';
      window.setTimeout(() => {
        delete activeBtn.dataset.dragMoved;
      }, 0);
    }
    el.classList.remove('is-dragging');
    pointerId = null;
    dragged = false;
    activeBtn = null;
  };

  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('lostpointercapture', endDrag);
}

function applyRecipeListFilters() {
  const searchEl = document.getElementById('bonus-search');
  const q = (searchEl?.value || '').trim().toLowerCase();
  const isFiltering = Boolean(q) || recipeFilter !== 'all';
  let visible = 0;

  document.querySelectorAll('#menu-list .menu-item').forEach((item) => {
    const tipoOk = recipeFilter === 'all' || item.dataset.tipo === recipeFilter;
    const searchOk = !q || (item.dataset.search || '').includes(q);
    const show = tipoOk && searchOk;
    item.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });

  document.querySelectorAll('#menu-list .menu-week').forEach((week) => {
    const visibleItems = [...week.querySelectorAll('.menu-item')].filter(
      (i) => i.style.display !== 'none'
    );
    const hasVisible = visibleItems.length > 0;
    week.style.display = hasVisible ? '' : 'none';
    if (isFiltering && hasVisible) week.open = true;
    else if (!isFiltering) week.open = false;
  });

  const countEl = document.getElementById('menu-list-count');
  if (countEl) {
    countEl.textContent = isFiltering
      ? `${visible} receta${visible === 1 ? '' : 's'} encontrada${visible === 1 ? '' : 's'}`
      : `${document.querySelectorAll('#menu-list .menu-item').length} recetas · toca una semana para ver`;
  }
  document.getElementById('menu-empty')?.classList.toggle('hidden', visible > 0);

  document.querySelectorAll('[data-recipe-filter]').forEach((btn) => {
    const active = btn.dataset.recipeFilter === recipeFilter;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function loadChecklistState() {
  try {
    return JSON.parse(localStorage.getItem(checklistKey(currentUser.uid)) || '[]');
  } catch {
    return [];
  }
}

function loadChecklistVentaState() {
  try {
    return JSON.parse(localStorage.getItem(checklistVentaKey(currentUser.uid)) || '[]');
  } catch {
    return [];
  }
}

function saveChecklistState(checkedIndexes) {
  localStorage.setItem(checklistKey(currentUser.uid), JSON.stringify(checkedIndexes));
  saveChecklistToCloud(currentUser.uid);
}

function saveChecklistVentaState(checkedIndexes) {
  localStorage.setItem(checklistVentaKey(currentUser.uid), JSON.stringify(checkedIndexes));
}

function loadListaComprasState() {
  try {
    return JSON.parse(localStorage.getItem(listaComprasKey(currentUser.uid)) || '[]');
  } catch {
    return [];
  }
}

function saveListaComprasState(checkedKeys) {
  localStorage.setItem(listaComprasKey(currentUser.uid), JSON.stringify(checkedKeys));
}

function listaExportHref() {
  const lineId = lineBrand().id;
  if (lineId === 'postres') return '/postres/produto/Lista_Compras_Postres.html';
  return '/paletas-de-whatsapp/produto/Lista_Compras_Paletas.html';
}

function planExportHref() {
  const lineId = lineBrand().id;
  if (lineId === 'postres') return '/postres/produto/Plan_7_Dias_Postres.html';
  return '/paletas-de-whatsapp/produto/Plan_7_Dias_Paletas.pdf';
}

function checklistExportHref() {
  const lineId = lineBrand().id;
  if (lineId === 'postres') return '/postres/produto/Checklist_Postres.html';
  return '/paletas-de-whatsapp/produto/Checklist_Paletas.pdf';
}

function premiumExportHref(nativeKey) {
  const lineId = lineBrand().id;
  const kit = kitContentForLine();
  const doc = kit.premiumDownloads.find((d) => d.native === nativeKey);
  return doc?.downloadHref || doc?.href || '#';
}

function kitExtrasExportHref() {
  return '/paletas-de-whatsapp/produto/Kit_Paletas_de_WhatsApp.pdf';
}

function renderSectionPdfBtn({ href, id }) {
  if (href) {
    const download = href.endsWith('.pdf') ? ' download' : '';
    return `<a class="lista-pdf-btn" href="${href}"${download} target="_blank" rel="noopener" title="PDF" aria-label="PDF">${ICONS.download}</a>`;
  }
  return `<button type="button" class="lista-pdf-btn" id="${id}" title="PDF" aria-label="PDF">${ICONS.download}</button>`;
}

function whatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

const INSIGHTS = {
  prejuizo: {
    title: 'Acción urgente',
    text: 'Tu precio está por debajo del costo real. Sube al menos al precio mínimo o reduce costos ocultos como empaque y entrega.',
  },
  alerta: {
    title: 'Se puede mejorar',
    text: 'Tienes ganancia, pero la margen está baja. Prueba el precio sugerido o revisa ingredientes y desperdicio.',
  },
  lucro: {
    title: 'Buen camino',
    text: 'Tu margen está saludable. Guarda este escenario y compara cuando cambies sabores o proveedor.',
  },
};

function applyDraftPayload(draft) {
  if (draft?.inputs) {
    inputMode = draft.inputMode || 'simple';
    currentInputs = cloneInputs(draft.inputs);
    simpleValues = fullToSimple(currentInputs);
  } else {
    inputMode = 'simple';
    simpleValues = { ...SIMPLE_DEFAULTS };
    currentInputs = simpleToFull(SIMPLE_DEFAULTS);
  }
  currentResults = calculate(currentInputs);
}

function loadCalculatorForLine(lineId) {
  const store = getDraftStoreSync(currentUser.uid);
  applyDraftPayload(store.byLine[lineId] || null);
}

async function bootstrap() {
  registerPwa();
  maybeWelcome();
  unlockPremiumFromQuery();
  readViewFromUrl();

  const store = await loadDraftStore(currentUser.uid);
  const lineId = activeLine?.id || 'paletas';
  applyDraftPayload(store.byLine[lineId] || store.byLine.paletas || null);

  scenarios = await listScenarios(currentUser.uid);
  if (activeView === 'menuWeb') {
    await ensureMenuDraftLoaded(currentUser.uid);
  }
  render();
  maybeWelcome();
  maybeShowOnboarding();
}

function unlockPremiumFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('premium') === '1') writePremiumFlag('paletas', true);
  if (params.get('postres_premium') === '1') writePremiumFlag('postres', true);
  if (
    params.get('compra') === '1' ||
    params.get('premium') === '1' ||
    params.get('postres') === '1' ||
    params.get('postres_premium') === '1' ||
    params.get('line')
  ) {
    // Keep line in session; strip one-shot purchase params from URL.
    const line = params.get('line');
    params.delete('compra');
    params.delete('premium');
    params.delete('postres');
    params.delete('postres_premium');
    params.delete('paletas');
    params.delete('donuts');
    if (line) params.set('line', line);
    else params.delete('line');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }
}

function maybeWelcome() {
  const params = new URLSearchParams(window.location.search);
  if (sessionStorage.getItem('paletas_post_purchase') === '1') return;
  if (params.get('compra') === '1') {
    sessionStorage.setItem('paletas_post_purchase', '1');
    showToast('¡Compra confirmada! Empieza por el modo rápido.');
  } else if (sessionStorage.getItem('paletas_demo_welcome') === '1') {
    showToast('Demo activa — tus datos quedan en este celular.');
    sessionStorage.removeItem('paletas_demo_welcome');
  }
}

function renderKitPendingBanner() {
  if (hasKitContentAccess()) return '';
  return `
    <div class="kit-pending-banner" role="status">
      Verificando tu compra — recetas y archivos se desbloquean en minutos.
    </div>
  `;
}

function renderKitLockedCard(title = 'Contenido del kit') {
  return `
    <div class="section-card kit-locked-card">
      <span class="kit-locked-badge" aria-hidden="true">🔒</span>
      <h2>${escapeHtml(title)}</h2>
      <p class="section-text">Estamos confirmando tu compra. Puedes usar la calculadora mientras tanto; te avisamos por correo cuando el kit esté listo.</p>
      <a href="${lineWhatsApp('support').href}" class="btn btn-primary" target="_blank" rel="noopener noreferrer" data-wa-id="${lineWhatsApp('support').id}" data-wa-purpose="support">Ayuda por WhatsApp</a>
    </div>
  `;
}

function renderPostPurchaseBanner() {
  if (sessionStorage.getItem('paletas_post_purchase') !== '1') return '';
  const brand = lineBrand();

  return `
    <div class="welcome-banner" id="welcome-banner">
      <div class="welcome-banner-body">
        <strong>¡Bienvenida a tu ${escapeHtml(brand.kitName)}!</strong>
        <ol class="welcome-banner-steps">
          <li>Calcula tus precios en modo rápido</li>
          <li>Toca <em>Ver mi ganancia</em></li>
          <li>Abre <em>Kit</em> en el menú de abajo</li>
        </ol>
        <a href="${lineWhatsApp('support').href}" class="welcome-banner-wa" target="_blank" rel="noopener noreferrer" data-wa-id="${lineWhatsApp('support').id}" data-wa-purpose="support">¿Necesitas ayuda? Escríbenos por WhatsApp</a>
      </div>
      <button type="button" class="welcome-banner-close" id="welcome-banner-close" aria-label="Cerrar">×</button>
    </div>
  `;
}

function dismissPostPurchaseBanner() {
  sessionStorage.removeItem('paletas_post_purchase');
  document.getElementById('welcome-banner')?.remove();
}

watchAuth(async (user) => {
  if (!user) {
    redirectIfGuest(null);
    return;
  }

  const profile = await resolveUserProfile(user);
  userProfile = profile;
  kitUnlocked = hasKitAccess(profile, user);
  ownedLines = ownedLinesFromProfile(profile);
  if (DEV_UNLOCK_ALL_CONTENT && ownedLines.length === 0) {
    ownedLines = [PRODUCT_LINE_BY_ID.paletas, PRODUCT_LINE_BY_ID.postres];
  }
  // Do not invent Paletas ownership — admin revoke must stick.
  activeLine = resolveActiveLine({
    search: window.location.search,
    profile,
  });
  if (ownedLines.length > 0 && !ownsLine(activeLine.id)) {
    activeLine = ownedLines[0];
    rememberActiveLine(activeLine.id);
  }
  userIsAdmin = (await isUserAdmin(user, profile)) || DEV_ADMIN_ACCESS;
  writePremiumFlag('paletas', Boolean(profile?.hasPremium));
  writePremiumFlag('postres', Boolean(profile?.hasPostresPremium));

  // Flush local upsell intent → Firestore pending (admin queue)
  try {
    if (localStorage.getItem('premium_pending_paletas') === '1' && profile?.hasKit && !profile?.hasPremium) {
      await markPremiumPending(user.uid, 'paletas');
      localStorage.removeItem('premium_pending_paletas');
    }
    if (
      localStorage.getItem('premium_pending_postres') === '1' &&
      profile?.hasPostres &&
      !profile?.hasPostresPremium
    ) {
      await markPremiumPending(user.uid, 'postres');
      localStorage.removeItem('premium_pending_postres');
    }
  } catch {
    /* optional */
  }

  await touchUserActivity(user.uid, { lastActiveLine: activeLine?.id || null });
  trackEvent('app_open', {
    page: 'app',
    line: activeLine?.id || undefined,
    uid: user.uid,
  });
  bindTrackClicks({
    page: 'app',
    line: activeLine?.id,
    numberId: defaultNumberIdForLine(activeLine?.id || 'paletas', 'support'),
  });

  currentUser = {
    uid: user.uid,
    displayName: user.displayName || getUserLabel(user),
    email: user.email || '',
  };
  await bootstrap();
});

function maybeShowOnboarding() {
  if (hasSeenOnboarding()) return;
  showOnboarding({ brand: lineBrand() });
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function persistState() {
  saveDraft(currentUser.uid, { inputMode, inputs: currentInputs }, activeLine?.id || 'paletas');
}

function closeDrawer() {
  drawerOpen = false;
  document.body.classList.remove('drawer-open');
  root.querySelector('.app-drawer')?.classList.remove('open');
  root.querySelector('.drawer-overlay')?.classList.remove('open');
}

function openDrawer() {
  drawerOpen = true;
  document.body.classList.add('drawer-open');
  root.querySelector('.app-drawer')?.classList.add('open');
  root.querySelector('.drawer-overlay')?.classList.add('open');
}

function setDrawerMinimized(minimized) {
  drawerMinimized = Boolean(minimized);
  try {
    localStorage.setItem('app_drawer_minimized_v1', drawerMinimized ? '1' : '0');
  } catch {
    /* ignore */
  }
  render();
}

function renderTopbarBadge() {
  const r = currentResults;
  if (activeView === 'calc' || activeView === 'home') {
    return `
      <button type="button" class="topbar-badge ${r.status}" id="topbar-badge" data-view="results" title="Ver resultados">
        <span class="topbar-badge-val">${money(r.profitPerUnit)}</span>
        <span class="topbar-badge-sub">${percent(r.margin)}</span>
      </button>
    `;
  }
  if (activeView === 'results') {
    return `<span class="topbar-badge ${r.status} static"><span class="topbar-badge-val">${percent(r.margin)}</span></span>`;
  }
  return '';
}

function renderTopbarLineSwitcher() {
  const owned = ownedLines.filter(Boolean);
  const canSwitch = owned.length > 1;
  const brand = lineBrand();
  const lines = getTopbarLines();

  const menuItems = lines
    .map((line) => {
      const ownedLine = ownsLine(line.id);
      const active = brand.id === line.id;
      const comingSoon = !line.enabled;

      if (comingSoon) {
        return `
          <div class="topbar-line-item locked" aria-disabled="true">
            <span class="topbar-line-emoji" aria-hidden="true">${line.emoji}</span>
            <span class="topbar-line-item-text">
              <strong>${escapeHtml(line.short)}</strong>
              <em>En breve</em>
            </span>
          </div>
        `;
      }

      if (!ownedLine) {
        return `
          <div class="topbar-line-item locked" aria-disabled="true">
            <span class="topbar-line-emoji" aria-hidden="true">${line.emoji}</span>
            <span class="topbar-line-item-text">
              <strong>${escapeHtml(line.short)}</strong>
              <em>Sin acceso</em>
            </span>
          </div>
        `;
      }

      if (!canSwitch) {
        return `
          <div class="topbar-line-item ${active ? 'active' : ''}" aria-current="${active ? 'true' : 'false'}">
            <span class="topbar-line-emoji" aria-hidden="true">${line.emoji}</span>
            <span class="topbar-line-item-text">
              <strong>${escapeHtml(line.short)}</strong>
              <em>${active ? 'Activo' : 'Tu kit'}</em>
            </span>
          </div>
        `;
      }

      return `
        <button type="button" class="topbar-line-item ${active ? 'active' : ''}" data-set-line="${line.id}" aria-pressed="${active}">
          <span class="topbar-line-emoji" aria-hidden="true">${line.emoji}</span>
          <span class="topbar-line-item-text">
            <strong>${escapeHtml(line.short)}</strong>
            <em>${active ? 'Activo' : 'Cambiar'}</em>
          </span>
        </button>
      `;
    })
    .join('');

  return `
    <div class="topbar-line-switch ${canSwitch ? 'can-switch' : 'solo'}">
      <button type="button" class="topbar-line-trigger" data-topbar-line-toggle aria-expanded="false" aria-haspopup="menu" title="${escapeHtml(brand.short)}" aria-label="Producto: ${escapeHtml(brand.short)}">
        <span class="topbar-line-emoji" aria-hidden="true">${brand.emoji}</span>
      </button>
      <div class="topbar-line-menu" role="menu" hidden>
        ${menuItems}
      </div>
    </div>
  `;
}

function renderTopbarActions() {
  const badge = renderTopbarBadge();
  return `
    <div class="topbar-actions">
      ${renderTopbarLineSwitcher()}
      ${badge}
    </div>
  `;
}

function renderTopbarSub() {
  if (activeView === 'document') {
    const doc = getDocById(activeDocId);
    return doc ? doc.title : 'Documento';
  }
  if (activeView === 'calc') return inputMode === 'simple' ? 'Modo rápido' : 'Modo completo';
  if (activeView === 'home') return 'Tu panel';
  if (activeView === 'profile') return 'Ajustes';
  if (activeView === 'menuWeb') return 'Link para clientes';
  if (activeView === 'kit') {
    const labels = { recetas: 'Recetas', archivos: 'Archivos', vender: 'Vender' };
    return labels[kitHubTab] || '';
  }
  return '';
}

function readViewFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const docId = params.get('doc');

  if (view === 'bonus') {
    activeView = 'kit';
    kitHubTab = 'recetas';
  } else if (view === 'files') {
    activeView = 'kit';
    kitHubTab = 'archivos';
  } else if (view === 'account') {
    activeView = 'kit';
    kitHubTab = 'vender';
  } else if (view === 'document' && getDocById(docId)) {
    activeView = 'document';
    activeDocId = docId;
    kitHubTab = 'archivos';
  } else if (view && VIEW_META[view]) {
    activeView = view;
  }

  if (docId && getDocById(docId) && activeView !== 'document') {
    activeView = 'document';
    activeDocId = docId;
    kitHubTab = 'archivos';
  }

  if (params.has('view') || params.has('doc')) {
    params.delete('view');
    params.delete('doc');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }
}

function getDrawerUserName() {
  return currentUser.displayName || getLocalDisplayName(currentUser.uid) || getUserLabel(currentUser);
}

function getDrawerUserInitial() {
  return (getDrawerUserName() || currentUser.email || '?').charAt(0).toUpperCase();
}

async function signOutToLanding() {
  await logout();
  window.location.href = '/';
}

function renderDrawer() {
  // menuWeb is demo-only — hidden from drawer; open via secret control on Perfil
  const drawerOrder = ['home', 'calc', 'kit', 'results'];
  const navItems = drawerOrder
    .map((id) => {
      const meta = VIEW_META[id];
      if (!meta) return '';
      const badge =
        id === 'results' && currentResults.status
          ? `<span class="drawer-badge ${currentResults.status}"></span>`
          : '';
      return `
        <button type="button" class="drawer-link ${activeView === id || (id === 'kit' && activeView === 'document') ? 'active' : ''}" data-view="${id}" title="${meta.label}" aria-label="${meta.label}">
          <span class="drawer-link-icon">${ICONS[meta.icon]}</span>
          <span class="drawer-link-text">${meta.label}</span>
          ${badge}
        </button>
      `;
    })
    .join('');

  const minimizeLabel = drawerMinimized ? 'Expandir menú' : 'Minimizar menú';
  const minimizeIcon = drawerMinimized ? ICONS.panelRight : ICONS.panelLeft;

  return `
    <div class="drawer-overlay ${drawerOpen ? 'open' : ''}" data-drawer-close aria-hidden="true"></div>
    <aside class="app-drawer ${drawerOpen ? 'open' : ''} ${drawerMinimized ? 'is-minimized' : ''}" aria-label="Menu principal">
      <div class="drawer-head">
        <button type="button" class="drawer-brand drawer-brand-toggle" data-drawer-minimize aria-pressed="${drawerMinimized}" aria-label="${minimizeLabel}" title="${minimizeLabel}">
          <span class="drawer-brand-mark" aria-hidden="true">
            <span class="drawer-brand-emoji">${lineBrand().emoji}</span>
            <span class="drawer-brand-action">${minimizeIcon}</span>
          </span>
          <span class="drawer-brand-copy">
            <strong class="drawer-brand-name">${escapeHtml(lineBrand().short)}</strong>
            <span class="drawer-brand-tagline">${escapeHtml(lineBrand().name)}</span>
          </span>
        </button>
        <div class="drawer-head-actions">
          <button type="button" class="icon-btn drawer-close-btn" data-drawer-close aria-label="Cerrar menú">${ICONS.close}</button>
        </div>
      </div>
      <div class="drawer-summary ${currentResults.status}">
        <span>Ganancia/un</span>
        <strong>${money(currentResults.profitPerUnit)}</strong>
        <em>${percent(currentResults.margin)} margen</em>
      </div>
      <nav class="drawer-nav">${navItems}</nav>
      <div class="drawer-foot">
        <div class="drawer-tools">
          <button type="button" class="drawer-tool-btn" id="drawer-theme" title="${getTheme() === 'dark' ? 'Modo claro' : 'Modo oscuro'}" aria-label="${getTheme() === 'dark' ? 'Modo claro' : 'Modo oscuro'}">
            ${getTheme() === 'dark' ? ICONS.sun : ICONS.moon}
          </button>
        </div>
        <div class="drawer-user">
          <button type="button" class="drawer-user-profile" data-view="profile" title="${escapeHtml(getDrawerUserName())}" aria-label="Perfil">
            <span class="drawer-user-avatar" aria-hidden="true">${escapeHtml(getDrawerUserInitial())}</span>
            <span class="drawer-user-name">${escapeHtml(getDrawerUserName())}</span>
          </button>
          <button type="button" class="drawer-user-exit" id="drawer-logout" title="Salir" aria-label="Salir">
            ${ICONS.logOut}
          </button>
        </div>
      </div>
    </aside>
  `;
}

function renderTabBar() {
  return `
    <nav class="app-tabbar" aria-label="Navegación principal">
      ${TAB_VIEWS.map((id) => {
        const meta = VIEW_META[id];
        const isKitActive = id === 'kit' && (activeView === 'kit' || activeView === 'document');
        const isActive = activeView === id || isKitActive;
        return `
          <button type="button" class="tab-btn ${isActive ? 'active' : ''}" data-view="${id}">
            <span class="tab-icon">${ICONS[meta.icon]}</span>
            <span class="tab-label">${meta.label}</span>
          </button>
        `;
      }).join('')}
    </nav>
  `;
}

const KIT_HUB_TABS = [
  { id: 'recetas', label: 'Recetas', icon: 'book' },
  { id: 'archivos', label: 'Archivos', icon: 'folder' },
  { id: 'vender', label: 'Vender', icon: 'message' },
];

function renderKitHubNav() {
  if (!KIT_HUB_TABS.some((t) => t.id === kitHubTab) || kitHubTab === 'postres') {
    kitHubTab = 'recetas';
  }
  return `
    <div class="kit-hub-nav" role="tablist" aria-label="Secciones del kit">
      ${KIT_HUB_TABS.map(
        (tab) => `
        <button type="button" role="tab" class="kit-hub-btn ${kitHubTab === tab.id ? 'active' : ''}" data-kit-hub="${tab.id}" aria-selected="${kitHubTab === tab.id}">
          ${tab.label}
        </button>
      `
      ).join('')}
    </div>
  `;
}

function renderKit() {
  let body = '';
  switch (kitHubTab) {
    case 'archivos':
      body = renderFiles();
      break;
    case 'vender':
      body = renderAccount();
      break;
    default:
      body = renderBonus();
  }

  return `
    <div class="kit-hub-page">
      ${renderKitHubNav()}
      <div class="kit-hub-body">${body}</div>
    </div>
  `;
}

function renderModeToggle() {
  return `
    <div class="mode-toggle" role="tablist">
      <button type="button" class="mode-btn ${inputMode === 'simple' ? 'active' : ''}" data-mode="simple">
        <span>Rápido</span>
      </button>
      <button type="button" class="mode-btn ${inputMode === 'full' ? 'active' : ''}" data-mode="full">
        <span>Completo</span>
      </button>
    </div>
  `;
}

function renderLiveSummary() {
  const r = currentResults;
  return `
    <div class="live-summary ${r.status}" id="live-summary">
      <div class="live-summary-main">
        <div class="live-summary-item">
          <span>Costo real</span>
          <strong>${money(r.realCostPerUnit)}</strong>
        </div>
        <div class="live-summary-item highlight">
          <span>Ganancia/un</span>
          <strong>${money(r.profitPerUnit)}</strong>
        </div>
        <div class="live-summary-item">
          <span>Margen</span>
          <strong>${percent(r.margin)}</strong>
        </div>
      </div>
      <div class="live-summary-foot">
        <span>${money(r.dailyProfit)}/día</span>
        <span>${money(r.monthlyProfit)}/mes</span>
      </div>
    </div>
  `;
}

function renderStepBar() {
  const STEPS = getCalcSteps();
  const step = STEPS[openStep - 1];
  const pills = STEPS.map(
    (s) => `
      <button type="button" class="step-pill ${openStep === s.id ? 'active' : openStep > s.id ? 'done' : ''}" data-step="${s.id}" aria-label="Paso ${s.id}: ${s.label}">
        ${openStep > s.id ? ICONS.check : s.id}
      </button>
    `
  ).join('');

  return `
    <div class="step-bar">
      <div class="step-pills">${pills}</div>
      <div class="step-bar-head">
        <span class="step-bar-count">Paso ${openStep} de ${STEPS.length}</span>
        <span class="step-bar-name">${step.label}</span>
      </div>
      <p class="step-bar-desc">${step.desc}</p>
    </div>
  `;
}

function renderCalcFooter() {
  if (activeView !== 'calc') return '';

  if (inputMode === 'simple') {
    return `
      <div class="calc-footer-bar">
        <button type="submit" form="calc-form" class="btn btn-primary btn-block">${ICONS.chart}<span>Ver mi ganancia</span></button>
      </div>
    `;
  }

  const STEPS = getCalcSteps();
  const isLast = openStep >= STEPS.length;
  return `
    <div class="calc-footer-bar">
      <div class="calc-footer-inner">
        ${openStep > 1 ? `<button type="button" class="btn btn-ghost" id="prev-step">${ICONS.chevronLeft}<span>Atrás</span></button>` : ''}
        ${
          isLast
            ? `<button type="submit" form="calc-form" class="btn btn-primary btn-block">${ICONS.chart}<span>Ver mi ganancia</span></button>`
            : `<button type="button" class="btn btn-primary btn-block" id="next-step"><span>Siguiente</span>${ICONS.chevronRight}</button>`
        }
      </div>
    </div>
  `;
}

function renderHome() {
  const r = currentResults;
  const brand = lineBrand();
  const name = escapeHtml(currentUser.displayName || getLocalDisplayName(currentUser.uid) || 'emprendedor/a');
  const currency = getCurrency();
  const statusLabel =
    r.status === 'prejuizo'
      ? 'Revisa tu precio — estás perdiendo'
      : r.status === 'alerta'
        ? 'Puedes mejorar tu margen'
        : `¡Tus ${brand.unitPlural} están dando ganancia!`;

  const quickLinks = [
    { id: 'calc', icon: 'calc', label: 'Calcular precio', desc: 'Modo rápido o completo' },
    { id: 'results', icon: 'chart', label: 'Ver ganancia', desc: `${money(r.profitPerUnit)} por ${brand.unitSingular}` },
    { id: 'kit', kitHub: 'recetas', icon: 'book', label: 'Recetas', desc: 'Sabores y combos' },
    { id: 'kit', kitHub: 'archivos', icon: 'folder', label: 'Archivos', desc: 'PDFs y plantillas' },
    { id: 'kit', kitHub: 'vender', icon: 'message', label: 'Vender', desc: 'Mensajes WhatsApp' },
  ];

  const currencyMenu = CURRENCIES.map(
    (c) => `
      <button type="button" class="home-currency-option ${c.code === currency.code ? 'active' : ''}" data-set-currency="${c.code}" role="menuitem">
        <span class="home-currency-flag" aria-hidden="true">${c.icon}</span>
        <strong>${escapeHtml(c.code)}</strong>
        <em>${escapeHtml(c.label)}</em>
      </button>
    `
  ).join('');

  return `
    <div class="home-page">
      ${renderKitPendingBanner()}
      ${renderPostPurchaseBanner()}

      <div class="home-hero ${r.status}">
        <div class="home-hero-top">
          <p class="home-greeting">Hola, <strong>${name}</strong></p>
          <div class="home-currency">
            <button type="button" class="home-currency-btn" data-home-currency-toggle aria-expanded="false" aria-haspopup="menu" title="${escapeHtml(currency.code)} · Cambiar moneda" aria-label="Moneda: ${escapeHtml(currency.code)}">
              <span class="home-currency-flag" aria-hidden="true">${currency.icon}</span>
            </button>
            <div class="home-currency-menu" role="menu" hidden>
              ${currencyMenu}
            </div>
          </div>
        </div>
        <div class="home-hero-stats">
          <div class="home-stat">
            <span>Ganancia/${brand.unitSingular}</span>
            <strong>${money(r.profitPerUnit)}</strong>
          </div>
          <div class="home-stat">
            <span>Margen</span>
            <strong>${percent(r.margin)}</strong>
          </div>
          <div class="home-stat">
            <span>Total / mes</span>
            <strong>${money(r.monthlyProfit)}</strong>
          </div>
        </div>
        <p class="home-hero-status">${statusLabel}</p>
        <button type="button" class="btn btn-primary btn-block home-cta" data-view="calc">
          ${ICONS.calc}<span>Calcular mi precio</span>
        </button>
      </div>

      <h2 class="home-section-title">Accesos rápidos</h2>
      <div class="home-grid">
        ${quickLinks
          .map(
            (link) => `
          <button type="button" class="home-tile" data-view="${link.id}"${link.kitHub ? ` data-kit-hub="${link.kitHub}"` : ''}>
            <span class="home-tile-icon">${ICONS[link.icon]}</span>
            <span class="home-tile-text">
              <strong>${link.label}</strong>
              <em>${link.desc}</em>
            </span>
            <span class="home-tile-arrow">${ICONS.chevronRight}</span>
          </button>
        `
          )
          .join('')}
      </div>

      ${
        !kitUnlocked
          ? `
        <div class="home-notice">
          <p>Tu kit se activa en breve. Mientras tanto, usa la calculadora gratis.</p>
        </div>
      `
          : ''
      }

      ${renderCrossSellOffer()}
    </div>
  `;
}

function renderProfile() {
  const displayName = currentUser.displayName || getLocalDisplayName(currentUser.uid) || '';
  const initial = (displayName || currentUser.email || '?').charAt(0).toUpperCase();
  const currencyOptions = CURRENCIES.map(
    (c) =>
      `<option value="${c.code}" ${c.code === getCurrencyCode() ? 'selected' : ''}>${escapeHtml(c.label)} (${c.symbol})</option>`
  ).join('');
  const kitsHtml = ownedLines
    .map(
      (line) =>
        `<span class="profile-kit-chip">${line.emoji} ${escapeHtml(line.short)}</span>`
    )
    .join('');

  return `
    <div class="profile-page">
      <div class="profile-hero">
        <div class="profile-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
        <h2 class="profile-name">${escapeHtml(displayName || 'Tu perfil')}</h2>
        <p class="profile-email">${escapeHtml(currentUser.email || '')}</p>
        <div class="profile-kits">
          ${
            kitsHtml ||
            (kitUnlocked
              ? `<span class="profile-kit-chip">${lineBrand().emoji} ${escapeHtml(lineBrand().short)}</span>`
              : '<span class="profile-badge pending">Acceso pendiente</span>')
          }
        </div>
      </div>

      <form id="profile-form" class="profile-form section-card">
        <h3 class="profile-card-title">Cuenta</h3>
        <div class="field">
          <label for="profile-name">Nombre</label>
          <input id="profile-name" name="name" type="text" value="${escapeHtml(displayName)}" placeholder="Ej: María" autocomplete="name">
        </div>
        <div class="field">
          <label for="profile-currency">Moneda</label>
          <select id="profile-currency" name="currency">${currencyOptions}</select>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${ICONS.check}<span>Guardar</span></button>
      </form>

      <div class="profile-links section-card">
        <button type="button" class="profile-link-row" id="replay-onboarding-profile">
          <span class="profile-link-icon">${ICONS.help}</span>
          <span class="profile-link-text">Ver tutorial</span>
          <span class="profile-link-chevron">${ICONS.chevronRight}</span>
        </button>
        ${
          shouldShowInstallButton()
            ? `<button type="button" class="profile-link-row" id="install-pwa">
          <span class="profile-link-icon">${ICONS.download}</span>
          <span class="profile-link-text">Instalar app</span>
          <span class="profile-link-chevron">${ICONS.chevronRight}</span>
        </button>`
            : ''
        }
        ${
          hasKitContentAccess()
            ? `<button type="button" class="profile-link-row" data-view="menuWeb">
          <span class="profile-link-icon">${ICONS.list}</span>
          <span class="profile-link-text">Menú web</span>
          <span class="profile-link-chevron">${ICONS.chevronRight}</span>
        </button>`
            : ''
        }
      </div>

      <div class="profile-foot">
        <button type="button" id="profile-logout" class="btn btn-ghost btn-sm btn-danger-text profile-logout-btn">
          ${ICONS.logOut}<span>Cerrar sesión</span>
        </button>
        ${
          userIsAdmin
            ? `<a href="/admin" class="profile-admin-btn" title="Panel admin">${ICONS.settings}<span>Admin</span></a>`
            : ''
        }
      </div>
    </div>
  `;
}

function openDocument(id) {
  const doc = getDocById(id);
  if (!doc || !isViewableDoc(doc)) return;
  if (!hasKitContentAccess()) {
    showToast('Archivo bloqueado — verificando tu compra.');
    return;
  }

  // Native deliverables → in-app sections (no PDF iframe)
  if (isNativeDoc(doc)) {
    closeDrawer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    switch (doc.native) {
      case 'recetas':
        kitHubTab = 'recetas';
        recipeCatalog = 'base';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'recetas-premium':
        kitHubTab = 'recetas';
        recipeCatalog = 'premium';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'menu':
        kitHubTab = 'vender';
        kitSection = 'menu';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'mensajes':
        kitHubTab = 'vender';
        kitSection = 'mensajes';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'plan':
        kitHubTab = 'vender';
        kitSection = 'plan';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'checklist':
        kitHubTab = 'vender';
        kitSection = 'checklist';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'lista':
        kitHubTab = 'vender';
        kitSection = 'lista';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'combos':
        kitHubTab = 'vender';
        kitSection = 'combos';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'menu-premium':
        kitHubTab = 'vender';
        kitSection = 'menu-premium';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'mensajes-premium':
        kitHubTab = 'vender';
        kitSection = 'mensajes-premium';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'fechas':
        kitHubTab = 'vender';
        kitSection = 'fechas';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'guia':
        kitHubTab = 'vender';
        kitSection = 'guia';
        activeView = 'kit';
        activeDocId = null;
        break;
      case 'tecnicas':
        kitHubTab = 'vender';
        kitSection = 'tecnicas';
        activeView = 'kit';
        activeDocId = null;
        break;
      default:
        activeDocId = id;
        activeView = 'document';
        kitHubTab = 'archivos';
    }
    render();
    return;
  }

  activeDocId = id;
  activeView = 'document';
  kitHubTab = 'archivos';
  closeDrawer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function closeDocument() {
  activeDocId = null;
  activeView = 'kit';
  kitHubTab = 'archivos';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function renderDocumentDownloadAction(doc) {
  const pdf = hasPdfDownload(doc);
  if (pdf) {
    return `<a class="btn btn-secondary btn-sm" href="${doc.downloadHref}" download>${ICONS.download}<span>PDF</span></a>`;
  }
  if (doc.kind === 'html' || doc.href?.endsWith('.html')) {
    return `<button type="button" class="btn btn-secondary btn-sm" id="doc-print">${ICONS.download}<span>PDF</span></button>`;
  }
  if (doc.downloadHref && doc.downloadHref !== '#') {
    return `<a class="btn btn-secondary btn-sm" href="${doc.downloadHref}" download>${ICONS.download}<span>Bajar</span></a>`;
  }
  return '';
}

function renderDocumentView() {
  const doc = getDocById(activeDocId);
  if (!doc || !isViewableDoc(doc)) {
    return `
      <div class="doc-viewer">
        <div class="doc-toolbar">
          <button type="button" class="btn btn-ghost btn-sm" id="doc-back">${ICONS.chevronLeft}<span>Volver</span></button>
        </div>
        <div class="doc-missing">
          <p>No encontramos este archivo.</p>
          <button type="button" class="btn btn-secondary" id="doc-back-alt">Ver archivos</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="doc-viewer">
      <div class="doc-toolbar">
        <button type="button" class="btn btn-ghost btn-sm doc-back-btn" id="doc-back">${ICONS.chevronLeft}<span>Volver</span></button>
        <div class="doc-toolbar-title">
          <strong>${escapeHtml(doc.title)}</strong>
        </div>
        <div class="doc-toolbar-actions">
          ${renderDocumentDownloadAction(doc)}
        </div>
      </div>
      <iframe
        class="doc-frame"
        title="${escapeHtml(doc.title)}"
        src="${doc.href}"
        loading="lazy"
      ></iframe>
    </div>
  `;
}

function renderMenuWeb() {
  return renderMenuWebView({
    locked: !hasKitContentAccess(),
    cloudAvailable: canUseMenusCloud(),
  });
}

function renderActiveView() {
  switch (activeView) {
    case 'home':
      return renderHome();
    case 'calc':
      return `${renderKitPendingBanner()}${renderPostPurchaseBanner()}${renderCalculatorForm()}`;
    case 'results':
      return `${renderKitPendingBanner()}${renderResults()}`;
    case 'kit':
      return renderKit();
    case 'document':
      return renderDocumentView();
    case 'bonus':
      return renderBonus();
    case 'account':
      return renderAccount();
    case 'files':
      return renderFiles();
    case 'profile':
      return renderProfile();
    case 'menuWeb':
      return renderMenuWeb();
    default:
      return renderHome();
  }
}

function renderFileRow(file, locked) {
  const featured = file.featured ? ' featured' : '';
  const desc = file.desc ? `<em>${escapeHtml(file.desc)}</em>` : '';

  if (file.kind === 'coming-soon') {
    return `
      <div class="file-row coming-soon${featured}" style="--file-accent:${file.accent}" aria-disabled="true">
        <span class="file-icon">${file.icon}</span>
        <span class="file-info">
          <strong>${escapeHtml(file.title)}</strong>
          ${desc}
        </span>
        <span class="file-chevron" aria-hidden="true">Pronto</span>
      </div>
    `;
  }

  if (locked) {
    return `
      <div class="file-row locked${featured}" style="--file-accent:${file.accent}" aria-disabled="true">
        <span class="file-icon">${file.icon}</span>
        <span class="file-info">
          <strong>${escapeHtml(file.title)}</strong>
          ${desc}
        </span>
        <span class="file-chevron" aria-hidden="true">🔒</span>
      </div>
    `;
  }

  if (file.kind === 'app-link') {
    const hubAttr = file.appHub ? ` data-kit-hub="${file.appHub}"` : '';
    const catalogAttr = file.appCatalog ? ` data-recipe-catalog="${file.appCatalog}"` : '';
    return `
      <button type="button" class="file-row${featured}" style="--file-accent:${file.accent}" data-view="${file.appView || 'kit'}"${hubAttr}${catalogAttr}>
        <span class="file-icon">${file.icon}</span>
        <span class="file-info">
          <strong>${escapeHtml(file.title)}</strong>
          ${desc}
        </span>
        <span class="file-chevron" aria-hidden="true">${ICONS.chevronRight}</span>
      </button>
    `;
  }

  if (file.kind === 'xlsx') {
    return `
      <a class="file-row${featured}" style="--file-accent:${file.accent}" href="${file.href}" download>
        <span class="file-icon">${file.icon}</span>
        <span class="file-info">
          <strong>${escapeHtml(file.title)}</strong>
          ${desc}
        </span>
        <span class="file-chevron" aria-hidden="true">${ICONS.download}</span>
      </a>
    `;
  }

  // native | html | pdf → abre dentro da app
  return `
    <button type="button" class="file-row${featured}" style="--file-accent:${file.accent}" data-doc="${file.id}">
      <span class="file-icon">${file.icon}</span>
      <span class="file-info">
        <strong>${escapeHtml(file.title)}</strong>
        ${desc}
      </span>
      <span class="file-chevron" aria-hidden="true">${ICONS.chevronRight}</span>
    </button>
  `;
}

function renderFiles() {
  const locked = !hasKitContentAccess();
  const kit = kitContentForLine();

  return `
    <div class="files-page">
      ${renderKitPendingBanner()}
      <p class="kit-section-lead">Toca para abrir. Dentro puedes imprimir o bajar el PDF.</p>
      <div class="files-list">${kit.downloads.map((f) => renderFileRow(f, locked)).join('')}</div>
      ${
        hasPremiumAccess()
          ? `
        <h3 class="kit-section-sub">Complemento premium</h3>
        <div class="files-list">${kit.premiumDownloads.map((f) => renderFileRow(f, locked)).join('')}</div>
      `
          : `
        <div class="section-card files-upsell">
          <p class="section-text">¿Quieres el complemento premium?</p>
          ${renderPremiumUpsell()}
        </div>
      `
      }
      ${renderCrossSellOffer()}
      <div class="section-card files-support">
        <p class="section-text">¿Dudas con tu acceso?</p>
        <a href="${lineWhatsApp('support').href}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer" data-wa-id="${lineWhatsApp('support').id}" data-wa-purpose="support">WhatsApp · ${lineWhatsApp('support').display}</a>
      </div>
    </div>
  `;
}

function renderCrossSellOffer() {
  const offers = crossSellLines(userProfile || {});
  // Also show non-sellable lines as "coming soon" teaser when user only has one kit
  const soon = getEnabledLines().filter(
    (line) => !line.sellable && !ownsLine(line.id) && ownedLines.length >= 1
  );
  if (!offers.length && !soon.length) return '';

  const offerCards = offers
    .map(
      (line) => `
      <div class="section-card cross-sell-card cross-sell-${escapeHtml(line.id)}">
        <span class="cross-sell-badge">También puedes vender</span>
        <div class="cross-sell-head">
          <span class="cross-sell-emoji" aria-hidden="true">${line.emoji}</span>
          <h3>${escapeHtml(line.kitName)}</h3>
        </div>
        <p>Mismo método 3P, otro producto: recetas, menú y mensajes listos para WhatsApp.</p>
        <div class="cross-sell-actions">
          <a href="${line.checkoutUrl}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">Agregar por ${escapeHtml(line.priceLabel)}</a>
          <a href="${line.landingPath}" class="btn btn-ghost btn-sm">Ver detalles</a>
        </div>
        <p class="cross-sell-note">Si ya compraste, escríbenos por WhatsApp con tu correo y lo liberamos en tu cuenta.</p>
      </div>
    `
    )
    .join('');

  const soonCards = soon
    .map(
      (line) => `
      <div class="section-card cross-sell-card cross-sell-soon cross-sell-${escapeHtml(line.id)}">
        <span class="cross-sell-badge">Próximamente</span>
        <div class="cross-sell-head">
          <span class="cross-sell-emoji" aria-hidden="true">${line.emoji}</span>
          <h3>${escapeHtml(line.kitName)}</h3>
        </div>
        <p>Estamos preparando este kit. Cuando esté listo, lo verás aquí para agregar a tu cuenta.</p>
        <a href="${line.landingPath}" class="btn btn-ghost btn-sm">Ver adelanto</a>
      </div>
    `
    )
    .join('');

  return offerCards + soonCards;
}

function formatWhatsAppMessage(text) {
  const emoji = lineBrand().emoji || BRAND_EMOJI;
  return String(text || '')
    .replace(/🍭/g, emoji)
    .replace(/🍮/g, emoji);
}

function render() {
  const shellClass = [
    'app-shell',
    'has-tabbar',
    activeView === 'calc' ? 'has-calc-footer' : '',
    activeView === 'document' ? 'has-doc-viewer' : '',
    drawerMinimized ? 'drawer-minimized' : '',
  ]
    .filter(Boolean)
    .join(' ');

  root.innerHTML = `
    <div class="${shellClass}">
      ${renderDrawer()}
      <header class="app-topbar">
        <button type="button" class="icon-btn menu-btn" id="menu-toggle" aria-label="Abrir menú">${ICONS.menu}</button>
        ${renderTopbarActions()}
      </header>

      <main class="app-content${activeView === 'document' ? ' app-content-doc' : ''}">
        ${renderActiveView()}
      </main>

      ${renderCalcFooter()}
      ${renderTabBar()}
    </div>
  `;

  document.body.classList.toggle('drawer-minimized', drawerMinimized);
  bindEvents();
}

function fieldGroup(title, desc, fieldsHtml) {
  return `
    <div class="field-group">
      <div class="field-group-head">
        <h3>${title}</h3>
        ${desc ? `<p>${desc}</p>` : ''}
      </div>
      <div class="field-stack">${fieldsHtml}</div>
    </div>
  `;
}

function moneyField(id, name, label, value, hint = '') {
  const sym = getCurrencySymbol();
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <div class="input-wrap">
        <span class="input-prefix">${sym}</span>
        <input id="${id}" name="${name}" inputmode="decimal" value="${value}">
      </div>
      ${hint ? `<span class="field-hint">${hint}</span>` : ''}
    </div>
  `;
}

function renderSimpleForm() {
  const s = simpleValues;
  return `
    <form id="calc-form" class="calc-form">
      ${renderModeToggle()}
      ${renderLiveSummary()}
      <div class="form-card">
        ${fieldGroup('Precio de venta', `Cuánto cobras hoy por ${lineBrand().unitSingular}.`, moneyField('simple_sellingPrice', 'simple_sellingPrice', 'Precio de venta', s.sellingPrice))}
        ${fieldGroup(
          `Costos por ${lineBrand().unitSingular}`,
          'Suma todo lo que entra en cada unidad vendida.',
          `
            ${moneyField('simple_foodCostPerUnit', 'simple_foodCostPerUnit', 'Ingredientes', s.foodCostPerUnit, 'Fruta, crema, chocolate...')}
            ${moneyField('simple_packaging', 'simple_packaging', 'Empaque', s.packaging)}
            ${moneyField('simple_gasPerUnit', 'simple_gasPerUnit', 'Extras (hielo, gas, energía)', s.gasPerUnit)}
            ${moneyField('simple_delivery', 'simple_delivery', 'Entrega o envío', s.delivery)}
            ${moneyField('simple_wastePerUnit', 'simple_wastePerUnit', 'Desperdicio', s.wastePerUnit)}
          `
        )}
        ${fieldGroup(
          'Producción y meta',
          null,
          `
            <div class="field">
              <label for="simple_marmitasPerDay">${escapeHtml(lineBrand().unitLabel)}</label>
              <input id="simple_marmitasPerDay" name="simple_marmitasPerDay" inputmode="numeric" value="${s.marmitasPerDay}">
            </div>
            <div class="field">
              <label for="simple_targetMarginPercent">Margen ideal (%)</label>
              <input id="simple_targetMarginPercent" name="simple_targetMarginPercent" inputmode="decimal" value="${s.targetMarginPercent}">
              <span class="field-hint">Recomendado: 40%</span>
            </div>
          `
        )}
      </div>
    </form>
  `;
}

function renderIngredientsStep() {
  return currentInputs.ingredients
    .map(
      (item, index) => `
        <div class="ingredient-card" data-index="${index}">
          <div class="ingredient-card-top">
            <input data-ingredient-name value="${escapeHtml(item.name)}" placeholder="Nombre del ingrediente" aria-label="Nombre">
            <button type="button" class="icon-btn icon-btn-danger remove-ingredient" data-index="${index}" aria-label="Eliminar">${ICONS.trash}</button>
          </div>
          <div class="ingredient-card-grid">
            <div>
              <label>Costo del preparo</label>
              <div class="input-wrap">
                <span class="input-prefix">US$</span>
                <input data-ingredient-cost="${index}" inputmode="decimal" value="${item.batchCost}">
              </div>
            </div>
            <div>
              <label>Rinde (${escapeHtml(lineBrand().unitPlural)})</label>
              <input data-ingredient-portions="${index}" inputmode="numeric" value="${item.portions}">
            </div>
          </div>
        </div>
      `
    )
    .join('');
}

function renderStepPanel(stepId) {
  switch (stepId) {
    case 1:
      return `
        <div class="form-card step-panel">
          <div class="field-stack">
            <div class="field">
              <label for="marmitasPerDay">${escapeHtml(lineBrand().unitLabel)}</label>
              <input id="marmitasPerDay" name="marmitasPerDay" inputmode="numeric" value="${currentInputs.marmitasPerDay}">
            </div>
            <div class="field">
              <label for="workDaysPerMonth">Días trabajados al mes</label>
              <input id="workDaysPerMonth" name="workDaysPerMonth" inputmode="numeric" value="${currentInputs.workDaysPerMonth}">
            </div>
          </div>
        </div>
      `;
    case 2:
      return `
        <div class="form-card step-panel">
          <div class="ingredient-list">${renderIngredientsStep()}</div>
          <button type="button" class="btn btn-secondary btn-add" id="add-ingredient">${ICONS.plus}<span>Agregar ingrediente</span></button>
        </div>
      `;
    case 3:
      return `
        <div class="form-card step-panel">
          <ul class="tip-list">
            <li>Empaque y materiales</li>
            <li>Hielo, gas y energía</li>
            <li>Entrega o envío</li>
            <li>Desperdicio del preparo</li>
          </ul>
          <div class="field-stack">
            ${moneyField('packagingPerUnit', 'packagingPerUnit', `Empaque por ${lineBrand().unitSingular}`, currentInputs.packagingPerUnit, 'Bolsa, palito, etiqueta')}
            ${moneyField('gasMonthly', 'gasMonthly', 'Gas / energía por mes', currentInputs.gasMonthly)}
            ${moneyField('spicesMonthly', 'spicesMonthly', 'Extras por mes', currentInputs.spicesMonthly)}
            ${moneyField('deliveryPerUnit', 'deliveryPerUnit', `Entrega por ${lineBrand().unitSingular}`, currentInputs.deliveryPerUnit)}
            <div class="field">
              <label for="platformFeePercent">Comisión de app (%)</label>
              <input id="platformFeePercent" name="platformFeePercent" inputmode="decimal" value="${currentInputs.platformFeePercent}">
            </div>
            <div class="field">
              <label for="wastePercent">Desperdicio (%)</label>
              <input id="wastePercent" name="wastePercent" inputmode="decimal" value="${currentInputs.wastePercent}">
            </div>
          </div>
        </div>
      `;
    case 4:
      return `
        <div class="form-card step-panel">
          <p class="step-panel-note">Deja en cero si no quieres incluirlo ahora.</p>
          <div class="field-stack">
            <div class="field">
              <label for="hoursPerDay">Horas por día</label>
              <input id="hoursPerDay" name="hoursPerDay" inputmode="decimal" value="${currentInputs.hoursPerDay}">
            </div>
            ${moneyField('hourlyRate', 'hourlyRate', 'Valor de tu hora', currentInputs.hourlyRate)}
          </div>
        </div>
      `;
    case 5:
      return `
        <div class="form-card step-panel">
          <div class="field-stack">
            ${moneyField('sellingPrice', 'sellingPrice', 'Precio que cobras hoy', currentInputs.sellingPrice)}
            <div class="field">
              <label for="targetMarginPercent">Margen ideal (%)</label>
              <input id="targetMarginPercent" name="targetMarginPercent" inputmode="decimal" value="${currentInputs.targetMarginPercent}">
              <span class="field-hint">Recomendado: 40%</span>
            </div>
          </div>
        </div>
      `;
    default:
      return '';
  }
}

function renderFullForm() {
  return `
    <form id="calc-form" class="calc-form">
      ${renderModeToggle()}
      ${renderLiveSummary()}
      ${renderStepBar()}
      ${renderStepPanel(openStep)}
    </form>
  `;
}

function renderCalculatorForm() {
  return inputMode === 'simple' ? renderSimpleForm() : renderFullForm();
}

function renderBreakdownBars() {
  const r = currentResults;
  const items = [
    { label: 'Ingredientes', value: r.breakdown.foodCost },
    { label: 'Desperdicio', value: r.breakdown.wasteCost },
    { label: 'Empaque', value: r.breakdown.packagingPerUnit },
    { label: 'Gas / energía', value: r.breakdown.gasPerUnit },
    { label: 'Extras', value: r.breakdown.spicesPerUnit },
    { label: 'Entrega', value: r.breakdown.deliveryPerUnit },
    { label: 'Tu tiempo', value: r.breakdown.timePerUnit },
    { label: 'Comisión app', value: r.breakdown.platformFee },
  ].filter((i) => i.value > 0);

  const total = items.reduce((s, i) => s + i.value, 0) || 1;

  return `
    <div class="breakdown-bars">
      ${items
        .map(
          (item) => `
            <div class="breakdown-bar-row">
              <div class="breakdown-bar-label"><span>${item.label}</span><strong>${money(item.value)}</strong></div>
              <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${(item.value / total) * 100}%"></div></div>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function isResultsEmpty(r) {
  return (
    Math.abs(r.sellingPrice) < 0.005 &&
    Math.abs(r.realCostPerUnit) < 0.005 &&
    Math.abs(r.profitPerUnit) < 0.005
  );
}

function renderInsight() {
  const status = currentResults.status;
  if (status === 'lucro') return '';
  const insight = INSIGHTS[status];
  if (!insight) return '';
  return `
    <div class="insight-card ${status}">
      <div class="insight-icon">${status === 'prejuizo' ? ICONS.trendDown : ICONS.info}</div>
      <div>
        <strong>${insight.title}</strong>
        <p>${insight.text}</p>
      </div>
    </div>
  `;
}

function renderSimulation() {
  const r = currentResults;
  return `
    <div class="section-card simulation-card">
      <h2>Simulación de ganancia diaria</h2>
      <div class="simulation-grid">
        ${SIMULATION_VOLUMES.map((qty) => {
          const profit = r.profitPerUnit * qty;
          const cls = profit >= 0 ? 'positive' : 'negative';
          return `
            <div class="simulation-item ${cls}">
              <span>${qty}/día</span>
              <strong>${money(profit)}</strong>
            </div>
          `;
        }).join('')}
      </div>
      <p class="simulation-month">En el mes (${r.workDaysPerMonth} días): <strong>${money(r.monthlyProfit)}</strong></p>
    </div>
  `;
}

function renderResultsDetails() {
  const r = currentResults;
  const marginWidth = Math.min(Math.max(r.margin, 0), 100);

  return `
    <div class="margin-meter">
      <div class="margin-meter-header">
        <span>Margen actual</span>
        <strong>${percent(r.margin)}</strong>
      </div>
      <div class="margin-track">
        <div class="margin-fill ${r.status}" style="width: ${marginWidth}%"></div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <span>Costo real</span>
        <strong>${money(r.realCostPerUnit)}</strong>
      </div>
      <div class="metric-card highlight">
        <span>Precio hoy</span>
        <strong>${money(r.sellingPrice)}</strong>
      </div>
      <div class="metric-card ${r.dailyProfit >= 0 ? 'green' : ''}">
        <span>Ganancia/día</span>
        <strong>${money(r.dailyProfit)}</strong>
      </div>
      <div class="metric-card ${r.monthlyProfit >= 0 ? 'green' : ''}">
        <span>Ganancia/mes</span>
        <strong>${money(r.monthlyProfit)}</strong>
      </div>
    </div>

    ${renderSimulation()}

    <div class="section-card">
      <h2>Desglose del costo</h2>
      ${renderBreakdownBars()}
      <ul class="breakdown-list compact">
        <li><span>Costo total</span><strong>${money(r.realCostPerUnit + r.breakdown.platformFee)}</strong></li>
      </ul>
    </div>

    <div class="section-card">
      <h2>Escenarios guardados</h2>
      ${renderScenarioList()}
    </div>
  `;
}

function renderResults() {
  const r = currentResults;
  const brand = lineBrand();
  const target = parseNumber(currentInputs.targetMarginPercent);

  if (isResultsEmpty(r)) {
    return `
      <div class="results-page">
        <div class="results-hero empty">
          <small>Aún no hay números</small>
          <h2>${money(0)}</h2>
          <p>Completa tus costos y precio en Precios para ver la ganancia real.</p>
        </div>
        <button type="button" class="btn btn-primary btn-block" data-view="calc">${ICONS.calc}<span>Ir a Precios</span></button>
      </div>
    `;
  }

  const statusText =
    r.status === 'prejuizo'
      ? 'Estás perdiendo dinero'
      : r.status === 'alerta'
        ? 'Ganancia baja — se puede mejorar'
        : `¡Tus ${brand.unitPlural} están dando ganancia!`;

  const statusDetail =
    r.status === 'prejuizo'
      ? `Pérdida de ${money(Math.abs(r.profitPerUnit))} por ${brand.unitSingular}`
      : `${money(r.dailyProfit)}/día · ${money(r.monthlyProfit)}/mes`;

  return `
    <div class="results-page">
      <div class="results-hero ${r.status}">
        <small>${statusText}</small>
        <h2>${money(r.profitPerUnit)}</h2>
        <p>Por ${brand.unitSingular} · ${statusDetail}</p>
        <span class="results-hero-badge">${percent(r.margin)} de margen</span>
      </div>

      ${renderInsight()}

      <div class="price-action">
        <div class="price-action-card ideal">
          <div class="price-action-ideal-top">
            <span class="card-label">Precio sugerido</span>
            <strong>${money(r.idealPrice)}</strong>
            <em>Meta ${percent(Math.min(target, 80))} de margen</em>
          </div>
          <button type="button" class="btn btn-ideal" id="apply-ideal-price">${ICONS.check}<span>Aplicar este precio</span></button>
        </div>
        <div class="price-min-row">
          <div class="price-min-copy">
            <span class="card-label">Precio mínimo</span>
            <em>Debajo de esto = pérdida</em>
          </div>
          <strong>${money(r.minPrice)}</strong>
        </div>
      </div>

      <div class="results-actions">
        <button type="button" class="btn btn-secondary" id="save-scenario-results">${ICONS.save}<span>Guardar</span></button>
        <button type="button" class="btn btn-primary" data-view="calc">${ICONS.edit}<span>Ajustar</span></button>
      </div>

      <details class="results-details">
        <summary>Ver análisis completo</summary>
        <div class="results-details-body">${renderResultsDetails()}</div>
      </details>
    </div>
  `;
}

function renderScenarioList() {
  if (!scenarios.length) {
    return '<p class="empty-state">Ningún escenario guardado. Guarda diferentes combinaciones de precio y costo.</p>';
  }

  return `
    <ul class="scenario-list">
      ${scenarios
        .map((item) => {
          const name = escapeHtml(item.name || 'Mi escenario');
          const price = money(item.results?.sellingPrice ?? item.inputs?.sellingPrice ?? 0);
          const profit = money(item.results?.profitPerUnit ?? 0);
          const status = item.results?.status || 'lucro';
          return `
            <li class="scenario-item ${status}">
              <div class="scenario-item-top">
                <h3>${name}</h3>
                <span class="scenario-status ${status}"></span>
              </div>
              <p>Precio ${price} · Ganancia ${profit}/un</p>
              <div class="scenario-actions">
                <button type="button" class="load" data-load="${item.id}">Cargar</button>
                <button type="button" class="delete" data-delete="${item.id}">Eliminar</button>
              </div>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function recipeTipoSlug(tipo) {
  const map = {
    Frutal: 'frutal',
    Cremosa: 'cremosa',
    Cremoso: 'cremoso',
    Rellena: 'rellena',
    'Estilo postre': 'postre',
    Bañada: 'banada',
  };
  return map[tipo] || String(tipo || 'default').toLowerCase();
}

function recipeSearchBlob(item) {
  return [
    item.dia,
    item.num,
    item.nombre,
    item.tipo,
    item.dificultad,
    item.consejo,
    item.tip,
    item.descripcion,
    ...(item.ingredientes || []),
    ...(item.pasos || []),
  ]
    .join(' ')
    .toLowerCase();
}

function recipeMatchesFilter(item, filter) {
  if (filter === 'all') return true;
  return recipeTipoSlug(item.tipo) === filter;
}

function recipeMeta(item) {
  const tiempo = item.tiempo || '';
  const [prepFromTime, coldFromTime] = String(tiempo)
    .split('+')
    .map((s) => s.trim());
  return {
    prep: item.prep || prepFromTime || '—',
    cold: item.congelacion || coldFromTime || '—',
    yield: item.rendimiento || item.porciones || '—',
    tip: item.consejo || item.tip || '',
  };
}

function renderRecipeItem(item, label, { premium = false } = {}) {
  const meta = recipeMeta(item);
  return `
    <details class="menu-item ${premium ? 'menu-item--premium' : ''}" data-search="${escapeHtml(recipeSearchBlob(item))}" data-tipo="${recipeTipoSlug(item.tipo)}">
      <summary class="menu-item-summary">
        <div class="menu-item-summary-main">
          <div class="menu-item-head">
            <span class="menu-item-day">${escapeHtml(label)}</span>
            <span class="menu-item-type menu-item-type--${recipeTipoSlug(item.tipo)}">${escapeHtml(item.tipo)}</span>
            ${premium ? '<span class="menu-item-premium-badge">Premium</span>' : ''}
          </div>
          <span class="menu-item-name">${escapeHtml(item.nombre)}</span>
          <span class="menu-item-preview">${escapeHtml(item.ingredientes?.[0] || '')}${item.ingredientes?.length > 1 ? ' · +' + (item.ingredientes.length - 1) + ' más' : ''}</span>
        </div>
        <span class="menu-item-chevron" aria-hidden="true">${ICONS.chevronRight}</span>
      </summary>
      <div class="menu-item-body">
        <div class="menu-item-meta">
          <span>${escapeHtml(meta.prep)} prep</span>
          <span>${escapeHtml(meta.cold)} frío</span>
          <span>Rinde ${escapeHtml(meta.yield)}</span>
          <span>${escapeHtml(item.dificultad || '')}</span>
        </div>
        ${item.descripcion ? `<p class="menu-item-desc">${escapeHtml(item.descripcion)}</p>` : ''}
        <h4 class="menu-item-section-title">Ingredientes</h4>
        <ul class="menu-item-ingredients">
          ${(item.ingredientes || []).map((ing) => `<li>${escapeHtml(ing)}</li>`).join('')}
        </ul>
        <h4 class="menu-item-section-title">Preparación</h4>
        <ol class="menu-item-steps">
          ${(item.pasos || []).map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
        </ol>
        <p class="menu-item-tip"><strong>Tip de venta:</strong> ${escapeHtml(meta.tip)}</p>
      </div>
    </details>
  `;
}

function renderMenuByWeek(recipes, { premium = false } = {}) {
  const weeks = [];
  for (let i = 0; i < recipes.length; i += 7) {
    weeks.push(recipes.slice(i, i + 7));
  }

  return weeks
    .map((week, wi) => {
      const dayRange =
        week[0].dia && week[week.length - 1].dia
          ? ` · Días ${week[0].dia}–${week[week.length - 1].dia}`
          : '';
      const countLabel = `${week.length} receta${week.length === 1 ? '' : 's'}`;
      const title = premium
        ? `Grupo ${wi + 1}`
        : `Semana ${wi + 1}${dayRange}`;

      return `
        <details class="menu-week ${premium ? 'menu-week--premium' : ''}">
          <summary>
            <span class="menu-week-title">${title}</span>
            <span class="menu-week-meta">${countLabel}</span>
          </summary>
          <div class="menu-week-body">
            ${week
              .map((item) =>
                renderRecipeItem(
                  item,
                  item.dia ? `Día ${item.dia}` : `Premium #${item.num}`,
                  { premium }
                )
              )
              .join('')}
          </div>
        </details>
      `;
    })
    .join('');
}

function renderRecipeListTools(recipeCount, { premium = false } = {}) {
  return `
    <div class="menu-list-tools">
      <p class="menu-list-count" id="menu-list-count">${recipeCount} recetas${premium ? ' premium' : ''}</p>
      <div class="menu-list-actions">
        <button type="button" class="menu-list-action" id="menu-expand-all">Abrir</button>
        <button type="button" class="menu-list-action" id="menu-collapse-all">Cerrar</button>
      </div>
    </div>
  `;
}

function renderRecipeCatalogToggle() {
  const locked = !hasPremiumAccess();
  const kit = kitContentForLine();
  const baseCount = kit.recipes?.length || 0;
  const premCount = kit.recipesPremium?.length || 0;
  return `
    <div class="catalog-toggle" role="tablist" aria-label="Catálogo">
      <button type="button" class="catalog-btn ${recipeCatalog === 'base' ? 'active' : ''}" data-recipe-catalog="base" role="tab" aria-selected="${recipeCatalog === 'base'}">
        <strong>Kit</strong>
        <em>${baseCount} recetas</em>
      </button>
      <button type="button" class="catalog-btn catalog-btn--premium ${recipeCatalog === 'premium' ? 'active' : ''}" data-recipe-catalog="premium" role="tab" aria-selected="${recipeCatalog === 'premium'}">
        <strong>Premium${locked ? ' 🔒' : ''}</strong>
        <em>${premCount} extras</em>
      </button>
    </div>
  `;
}

function renderCatalogLead(isPremium, recipes) {
  const brand = lineBrand();
  const summary = catalogTypeSummary(recipes);
  if (isPremium) {
    return `
      <div class="catalog-lead catalog-lead--premium">
        <strong>Complemento premium</strong>
        <p>Sabores de ticket alto para subir el precio. ${escapeHtml(summary)}.</p>
      </div>
    `;
  }
  return `
    <div class="catalog-lead">
      <strong>Kit principal · ${escapeHtml(brand.short)}</strong>
      <p>Plan de ${recipes.length} días para empezar a vender. ${escapeHtml(summary)}.</p>
    </div>
  `;
}

function renderRecipeFilterBar() {
  ensureValidRecipeFilter();
  const filters = recipeFiltersForLine();
  if (filters.length <= 1) return '';
  return `
    <div class="recipe-filters" id="recipe-filters" role="listbox" aria-label="Filtrar por tipo">
      ${filters
        .map(
          (f) => `
        <button type="button" class="recipe-filter-btn ${recipeFilter === f.id ? 'active' : ''}" data-recipe-filter="${f.id}" role="option" aria-selected="${recipeFilter === f.id}">
          ${f.label}
        </button>
      `
        )
        .join('')}
    </div>
  `;
}

function renderBonus() {
  const kit = kitContentForLine();
  const isPremium = recipeCatalog === 'premium';
  const title = isPremium ? kit.premiumRecipeTitle : kit.recipeTitle;
  const showFilters = !isPremium || hasPremiumAccess();

  let listHtml = '';
  if (!hasKitContentAccess()) {
    listHtml = `<div class="premium-locked-card">${renderKitLockedCard(title)}</div>`;
  } else if (isPremium && !hasPremiumAccess()) {
    const premiumTeaser =
      lineBrand().id === 'postres'
        ? 'Recetas premium, combos rentables y mensajes para fechas especiales'
        : 'Bañadas, rellenas y estilo postre de ticket alto';
    listHtml = `
      <div class="premium-locked-card">
        <h3>Complemento premium</h3>
        <p>${premiumTeaser} — incluidas en <strong>${escapeHtml(kit.upsellName)}</strong>.</p>
        ${renderPremiumUpsell()}
      </div>
    `;
  } else {
    const recipes = isPremium ? kit.recipesPremium : kit.recipes;
    listHtml = `
      ${renderCatalogLead(isPremium, recipes)}
      ${renderRecipeListTools(recipes.length, { premium: isPremium })}
      <div class="menu-list ${isPremium ? 'menu-list--premium' : ''}" id="menu-list">${renderMenuByWeek(recipes, { premium: isPremium })}</div>
      <p class="menu-empty hidden" id="menu-empty">Ninguna receta encontrada.</p>`;
  }

  return `
    <div class="bonus-page ${isPremium ? 'bonus-page--premium' : ''}">
      <div class="kit-toolbar">
        ${renderRecipeCatalogToggle()}
        ${
          showFilters
            ? `
          <div class="search-wrap">
            ${ICONS.search}
            <input type="search" class="bonus-search" id="bonus-search" placeholder="${isPremium ? 'Buscar premium...' : 'Buscar sabor...'}" autocomplete="off">
          </div>
          ${renderRecipeFilterBar()}
        `
            : ''
        }
      </div>
      ${listHtml}
    </div>
  `;
}

function renderMenuWhatsApp() {
  const brand = lineBrand();
  const recipes = kitContentForLine().recipes || [];
  const lineId = brand.id;
  menuWaDraft = loadMenuWaDraft(currentUser.uid, lineId, brand, recipes);
  return renderMenuWhatsAppView({
    draft: menuWaDraft,
    exportHref: menuWaExportHref(lineId),
    lineId,
  });
}

function renderKitSectionNav() {
  const lineId = lineBrand().id;
  const sections = [
    { id: 'menu', label: 'Menú' },
    { id: 'mensajes', label: 'Mensajes' },
    { id: 'combos', label: 'Combos', premium: true },
    { id: 'menu-premium', label: 'Menú ✨', premium: true },
    { id: 'mensajes-premium', label: 'Msgs ✨', premium: true },
    { id: 'fechas', label: 'Fechas', premium: true },
    { id: 'guia', label: 'Guía', premium: true },
    { id: 'plan', label: 'Plan' },
    { id: 'lista', label: 'Compras' },
    { id: 'checklist', label: 'Checklist' },
    ...(lineId === 'paletas' ? [{ id: 'tecnicas', label: 'Tips' }] : []),
    { id: 'ayuda', label: 'Ayuda' },
  ];

  return `
    <div class="kit-nav" id="kit-section-nav" role="tablist" aria-label="Herramientas para vender">
      ${sections
        .map(
          (s) => `
            <button type="button" class="kit-nav-btn ${kitSection === s.id ? 'active' : ''}" data-kit-section="${s.id}" role="tab" aria-selected="${kitSection === s.id}">
              ${escapeHtml(s.label)}${s.premium && !hasPremiumAccess() ? ' · 🔒' : ''}
            </button>
          `
        )
        .join('')}
    </div>
  `;
}

function renderCombosPremium() {
  if (!hasPremiumAccess()) {
    return `
      <div class="section-card">
        <h2>10 Combos Rentables</h2>
        <p class="section-text">Ideas con precio guía, público objetivo y mensaje listo para WhatsApp — incluidos en el complemento premium.</p>
        <div class="premium-locked-card">${renderPremiumUpsell()}</div>
      </div>
    `;
  }

  return `
    <div class="combos-page">
      <div class="section-card">
        <h2>10 Combos Rentables</h2>
        <p class="section-text">Usa la calculadora en Precios para fijar tu precio real. Los valores guía son orientativos.</p>
      </div>
      <div class="combo-list-app">
        ${kitContentForLine().combos.map(
          (combo, idx) => `
            <article class="combo-card-app">
              <div class="combo-card-head">
                <h3>${escapeHtml(combo.nombre)}</h3>
                <span class="combo-card-tag">Premium</span>
              </div>
              <dl class="combo-card-meta">
                <div><dt>Contenido</dt><dd>${escapeHtml(combo.contenido)}</dd></div>
                <div><dt>Precio guía</dt><dd>${escapeHtml(combo.precio_guia)}</dd></div>
                <div><dt>Público</dt><dd>${escapeHtml(combo.publico)}</dd></div>
              </dl>
              <div class="combo-card-message">
                <p>${escapeHtml(combo.mensaje)}</p>
                <div class="message-actions">
                  <button type="button" class="btn btn-sm btn-secondary copy-combo" data-combo-index="${idx}">
                    ${ICONS.copy}<span>Copiar</span>
                  </button>
                  <a href="${whatsAppShareUrl(combo.mensaje)}" class="btn btn-sm btn-wa" target="_blank" rel="noopener noreferrer">
                    ${ICONS.message}<span>Publicar</span>
                  </a>
                </div>
              </div>
              <button type="button" class="btn btn-ghost btn-sm combo-calc-link" data-view="calc">Calcular precio en Precios →</button>
            </article>
          `
        ).join('')}
      </div>
    </div>
  `;
}

function renderMensajesWhatsApp() {
  const lineId = lineBrand().id;
  const exportHref =
    lineId === 'postres'
      ? '/postres/produto/Mensajes_Postres.html'
      : '/paletas-de-whatsapp/produto/Mensajes_para_Vender_Paletas.html';
  return `<div data-mensajes-source="base">${renderMensajesList(kitContentForLine().mensajes, {
    exportHref,
    formatMessage: formatWhatsAppMessage,
  })}</div>`;
}

function renderMensajesPremium() {
  if (!hasPremiumAccess()) {
    return renderPremiumLocked('Mensajes premium', renderPremiumUpsell());
  }
  return `<div data-mensajes-source="premium">${renderMensajesList(kitContentForLine().mensajesPremium, {
    exportHref: premiumExportHref('mensajes-premium'),
    formatMessage: formatWhatsAppMessage,
  })}</div>`;
}

function renderMenuPremium() {
  if (!hasPremiumAccess()) {
    return renderPremiumLocked('Menú premium', renderPremiumUpsell());
  }
  const brand = lineBrand();
  const kit = kitContentForLine();
  const lineId = brand.id;
  menuPremiumDraft = loadMenuPremiumDraft(
    currentUser.uid,
    lineId,
    brand,
    kit.recipesPremium || [],
    kit.combos || []
  );
  return renderMenuPremiumView({
    draft: menuPremiumDraft,
    exportHref: menuPremiumExportHref(lineId),
  });
}

function renderFechasPremium() {
  if (!hasPremiumAccess()) {
    return renderPremiumLocked('Fechas especiales', renderPremiumUpsell());
  }
  return renderFechasEspeciales(kitContentForLine().fechasPremium, {
    exportHref: premiumExportHref('fechas'),
  });
}

function renderGuiaPremium() {
  if (!hasPremiumAccess()) {
    return renderPremiumLocked('Guía de presentación', renderPremiumUpsell());
  }
  return renderGuiaPresentacion(kitContentForLine().guiaPremium, {
    exportHref: premiumExportHref('guia'),
  });
}

function renderTecnicasKit() {
  const extras = kitContentForLine().kitExtras;
  if (!extras) return '';
  return renderKitExtras(extras, { exportHref: kitExtrasExportHref() });
}

function renderPlan7Dias() {
  const plan = kitContentForLine().plan;
  return `
    <div class="section-card">
      <div class="lista-head">
        <h2>Plan de 7 Días</h2>
        ${renderSectionPdfBtn({ href: planExportHref() })}
      </div>
      <p class="section-text">Sigue este paso a paso para organizar tu primera semana de ventas.</p>
      <ol class="plan-list">
        ${plan.map(
          (day) => `
            <li class="plan-day">
              <div class="plan-day-head">
                <span class="plan-day-num">Día ${day.dia}</span>
                <strong>${escapeHtml(day.titulo)}</strong>
              </div>
              ${day.duracion || day.meta ? `<p class="plan-day-meta">${escapeHtml([day.duracion, day.meta].filter(Boolean).join(' · '))}</p>` : ''}
              <ul>
                ${day.tareas.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
              </ul>
            </li>
          `
        ).join('')}
      </ol>
    </div>
  `;
}

function renderListaCompras() {
  const lista = kitContentForLine().lista;
  const checked = loadListaComprasState();
  const exportHref = listaExportHref();

  const renderGroup = (key, items) =>
    items
      .map((item, i) => {
        const id = `${key}:${i}`;
        return `
          <li>
            <label class="checklist-label">
              <input type="checkbox" data-lista-item="${id}" ${checked.includes(id) ? 'checked' : ''}>
              <span>${escapeHtml(item)}</span>
            </label>
          </li>
        `;
      })
      .join('');

  return `
    <div class="section-card">
      <div class="lista-head">
        <h2>Lista de Compras Inicial</h2>
        ${
          exportHref
            ? renderSectionPdfBtn({ href: exportHref })
            : renderSectionPdfBtn({ id: 'lista-print' })
        }
      </div>
      <h3>Ingredientes base</h3>
      <ul class="kit-checklist interactive">
        ${renderGroup('ingredientes', lista.ingredientes)}
      </ul>
      <h3>Materiales</h3>
      <ul class="kit-checklist interactive">
        ${renderGroup('materiales', lista.materiales)}
      </ul>
      <h3>Utensilios recomendados</h3>
      <ul class="kit-checklist interactive">
        ${renderGroup('utensilios', lista.utensilios)}
      </ul>
      <button type="button" class="btn btn-ghost btn-sm" id="reset-lista">Reiniciar lista</button>
    </div>
  `;
}

function renderPremiumUpsell() {
  if (hasPremiumAccess()) return '';
  const kit = kitContentForLine();

  return `
    <div class="premium-upsell-card">
      <span class="premium-upsell-badge">Complemento opcional</span>
      <h3>${escapeHtml(kit.upsellName)}</h3>
      <p>Recetas premium, combos rentables, menú editable y mensajes para fechas especiales. Ideal cuando ya dominas lo básico.</p>
      <div class="premium-upsell-actions">
        <a href="${kit.upsellCheckout}" class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">Agregar por ${kit.upsellPrice}</a>
        <a href="${kit.upsellPath}" class="btn btn-ghost btn-sm">Ver detalles</a>
      </div>
    </div>
  `;
}

function renderChecklistProduccion() {
  const checked = loadChecklistState();
  const checkedVenta = loadChecklistVentaState();
  const checklist = kitContentForLine().checklist;
  const checklistVenta = kitContentForLine().checklistVenta;
  const renderItems = (items, prefix, checkedSet) =>
    items
      .map(
        (item, i) => `
            <li>
              <label class="checklist-label">
                <input type="checkbox" data-checklist="${prefix}:${i}" ${checkedSet.includes(i) ? 'checked' : ''}>
                <span>${escapeHtml(item)}</span>
              </label>
            </li>
          `
      )
      .join('');

  return `
    <div class="section-card">
      <div class="lista-head">
        <h2>Checklist</h2>
        ${renderSectionPdfBtn({ href: checklistExportHref() })}
      </div>
      <p class="section-text">Compras, producción y venta. Se guarda en este dispositivo.</p>
      ${
        checklistVenta?.length
          ? `
        <h3>Antes de vender</h3>
        <ul class="kit-checklist interactive">
          ${renderItems(checklistVenta, 'venta', checkedVenta)}
        </ul>
      `
          : ''
      }
      <h3>${checklistVenta?.length ? 'Día de producción' : 'Producción'}</h3>
      <ul class="kit-checklist interactive">
        ${renderItems(checklist, 'prod', checked)}
      </ul>
      <button type="button" class="btn btn-ghost btn-sm" id="reset-checklist">Reiniciar checklist</button>
    </div>
  `;
}

function renderKitAyuda() {
  return `
    <div class="quick-cards">
      <button type="button" class="quick-card" data-view="calc">${ICONS.calc}<span>Precios</span></button>
      <button type="button" class="quick-card" data-view="results">${ICONS.chart}<span>Resultados</span></button>
      <button type="button" class="quick-card" data-view="bonus">${ICONS.strawberry}<span>Recetas</span></button>
    </div>

    <div class="section-card">
      <h2>Preguntas frecuentes</h2>
      <details class="faq-item" open>
        <summary>¿Cómo empiezo?</summary>
        <p>Usa el <strong>modo rápido</strong>, coloca el costo de cada ${lineBrand().unitSingular} y toca <strong>Ver mi ganancia</strong>. El valor aparece arriba mientras escribes.</p>
      </details>
      <details class="faq-item">
        <summary>¿Modo rápido vs completo?</summary>
        <p>El rápido es directo por ${lineBrand().unitSingular}. El completo divide producción, ingredientes, extras y tiempo — ideal cuando quieres precisión total.</p>
      </details>
      <details class="faq-item">
        <summary>¿La calculadora garantiza ganancias?</summary>
        <p>No. Te ayuda a organizar costos y precios, pero los resultados dependen de tus ingredientes, precios, ejecución y ventas.</p>
      </details>
      <details class="faq-item">
        <summary>¿Qué es el precio sugerido?</summary>
        <p>Es el valor para alcanzar tu margen ideal con los costos actuales. Usa "Aplicar este precio" en los resultados.</p>
      </details>
    </div>

    <div class="section-card support-card-compact">
      <a href="${lineWhatsApp('support').href}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener noreferrer" data-wa-id="${lineWhatsApp('support').id}" data-wa-purpose="support">${ICONS.whatsapp}<span>Soporte</span></a>
    </div>

    <div class="section-card">
      <h2>Tus datos</h2>
      <p class="account-note">Todo queda guardado en este dispositivo.</p>
      <button type="button" class="btn btn-secondary" id="replay-onboarding">${ICONS.help}<span>Ver tutorial de nuevo</span></button>
      <button type="button" class="btn btn-secondary btn-danger-text" id="reset-data">Limpiar mis datos</button>
    </div>
  `;
}

function renderKitArchivos() {
  const locked = !hasKitContentAccess();
  const kit = kitContentForLine();
  return `
    <div class="section-card">
      <h2>Archivos del kit</h2>
      <p class="section-text">Toca para abrir. Dentro puedes imprimir o bajar el PDF.</p>
      <div class="files-list kit-inline-files">${kit.downloads.map((f) => renderFileRow(f, locked)).join('')}</div>
    </div>
    ${
      hasPremiumAccess()
        ? `
      <div class="section-card">
        <h2>Archivos premium</h2>
        <div class="files-list kit-inline-files">${kit.premiumDownloads.map((f) => renderFileRow(f, locked)).join('')}</div>
      </div>
    `
        : ''
    }
  `;
}

function renderKitContent() {
  const lockedTitles = {
    menu: 'Menú para WhatsApp',
    mensajes: 'Mensajes para WhatsApp',
    combos: 'Combos rentables',
    'menu-premium': 'Menú premium',
    'mensajes-premium': 'Mensajes premium',
    fechas: 'Fechas especiales',
    guia: 'Guía de presentación',
    tecnicas: 'Técnicas y tips',
    plan: 'Plan de 7 días',
    lista: 'Lista de compras',
    checklist: 'Checklist',
    archivos: 'Archivos del kit',
  };

  if (kitSection === 'archivos') kitSection = 'mensajes';

  if (!hasKitContentAccess() && kitSection !== 'ayuda') {
    return renderKitLockedCard(lockedTitles[kitSection] || 'Contenido del kit');
  }

  switch (kitSection) {
    case 'menu':
      return renderMenuWhatsApp();
    case 'mensajes':
      return renderMensajesWhatsApp();
    case 'combos':
      return renderCombosPremium();
    case 'menu-premium':
      return renderMenuPremium();
    case 'mensajes-premium':
      return renderMensajesPremium();
    case 'fechas':
      return renderFechasPremium();
    case 'guia':
      return renderGuiaPremium();
    case 'tecnicas':
      return renderTecnicasKit();
    case 'plan':
      return renderPlan7Dias();
    case 'lista':
      return renderListaCompras();
    case 'checklist':
      return renderChecklistProduccion();
    default:
      return renderKitAyuda();
  }
}

function renderAccount() {
  return `
    <div class="kit-page">
      ${renderKitSectionNav()}
      <div class="kit-content">${renderKitContent()}${renderPremiumUpsell()}</div>
    </div>
  `;
}

function updateLivePreview() {
  const r = currentResults;

  const badge = document.getElementById('topbar-badge');
  if (badge) {
    badge.className = `topbar-badge ${r.status}`;
    badge.querySelector('.topbar-badge-val').textContent = money(r.profitPerUnit);
    badge.querySelector('.topbar-badge-sub').textContent = percent(r.margin);
  }

  const summary = document.getElementById('live-summary');
  if (summary) {
    summary.className = `live-summary ${r.status}`;
    const items = summary.querySelectorAll('.live-summary-item strong');
    if (items.length >= 3) {
      items[0].textContent = money(r.realCostPerUnit);
      items[1].textContent = money(r.profitPerUnit);
      items[2].textContent = percent(r.margin);
    }
    const foot = summary.querySelectorAll('.live-summary-foot span');
    if (foot.length >= 2) {
      foot[0].textContent = `${money(r.dailyProfit)}/día`;
      foot[1].textContent = `${money(r.monthlyProfit)}/mes`;
    }
  }

  root.querySelectorAll('.drawer-badge, .tab-badge').forEach((el) => {
    el.className = el.className.replace(/\b(lucro|alerta|prejuizo)\b/g, '').trim();
    el.classList.add(r.status);
  });

  const drawerSummary = root.querySelector('.drawer-summary');
  if (drawerSummary) {
    drawerSummary.className = `drawer-summary ${r.status}`;
    drawerSummary.querySelector('strong').textContent = money(r.profitPerUnit);
    drawerSummary.querySelector('em').textContent = `${percent(r.margin)} margen`;
  }
}

function applyIdealPrice() {
  const ideal = currentResults.idealPrice;
  currentInputs.sellingPrice = ideal;
  simpleValues.sellingPrice = ideal;
  currentResults = calculate(currentInputs);
  persistState();
  showToast(`Precio actualizado a ${money(ideal)}`);
  render();
}

function saveScenarioFlow() {
  showSaveModal(async (name) => {
    await saveScenario(currentUser.uid, {
      name,
      inputs: cloneInputs(currentInputs),
      results: currentResults,
    });
    scenarios = await listScenarios(currentUser.uid);
    showToast('¡Escenario guardado!');
    if (activeView !== 'results') activeView = 'results';
    render();
  });
}

function showSaveModal(onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <h3>Guardar escenario</h3>
      <p>Ponle un nombre (ej: "Con entrega", "Sabor premium").</p>
      <input type="text" id="scenario-name" placeholder="Nombre del escenario" value="Escenario ${scenarios.length + 1}">
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="modal-cancel">Cancelar</button>
        <button type="button" class="btn btn-primary" id="modal-save">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#scenario-name');
  input.focus();
  input.select();

  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('#modal-save').addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) return;
    overlay.remove();
    await onSave(name);
  });
}

function navigateTo(view) {
  if (view !== activeView) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (view !== 'document') activeDocId = null;
  if (view === 'kit' && !['recetas', 'archivos', 'vender'].includes(kitHubTab)) {
    kitHubTab = 'recetas';
  }

  const go = () => {
    activeView = view;
    closeDrawer();
    render();
  };

  if (view === 'menuWeb') {
    ensureMenuDraftLoaded(currentUser.uid).then(go);
    return;
  }

  go();
}

function bindEvents() {
  document.getElementById('welcome-banner-close')?.addEventListener('click', dismissPostPurchaseBanner);

  document.getElementById('menu-toggle')?.addEventListener('click', openDrawer);

  document.getElementById('drawer-logout')?.addEventListener('click', signOutToLanding);
  document.getElementById('drawer-theme')?.addEventListener('click', toggleTheme);

  bindMenuWebEvents({
    uid: currentUser.uid,
    root,
    showToast,
    render,
    locked: !hasKitContentAccess(),
  });

  if (kitSection === 'menu-premium' && hasPremiumAccess()) {
    const kit = kitContentForLine();
    bindMenuPremiumEvents({
      root,
      uid: currentUser.uid,
      lineId: lineBrand().id,
      recipes: kit.recipesPremium || [],
      combos: kit.combos || [],
      showToast,
      onChange: (draft) => {
        menuPremiumDraft = draft;
      },
      render,
    });
  }

  if (kitSection === 'menu' && hasKitContentAccess()) {
    bindMenuWhatsAppEvents({
      root,
      uid: currentUser.uid,
      lineId: lineBrand().id,
      recipes: kitContentForLine().recipes || [],
      showToast,
      onChange: (draft) => {
        menuWaDraft = draft;
      },
      render,
    });
  }

  document.getElementById('profile-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('profile-name')?.value ?? '';
    const currency = document.getElementById('profile-currency')?.value ?? 'USD';
    const saved = await saveDisplayName(currentUser, name);
    if (saved) currentUser.displayName = saved;
    setCurrencyCode(currency);
    showToast('Perfil actualizado');
    render();
  });

  document.getElementById('profile-logout')?.addEventListener('click', signOutToLanding);

  document.getElementById('install-pwa')?.addEventListener('click', triggerPwaInstall);

  document.getElementById('doc-back')?.addEventListener('click', closeDocument);
  document.getElementById('doc-back-alt')?.addEventListener('click', closeDocument);
  document.getElementById('doc-print')?.addEventListener('click', () => {
    const frame = root.querySelector('.doc-frame');
    try {
      frame?.contentWindow?.focus();
      frame?.contentWindow?.print();
    } catch {
      window.open(frame?.getAttribute('src') || '#', '_blank', 'noopener');
    }
  });

  root.querySelectorAll('.file-row.locked').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      showToast('Archivo bloqueado — verificando tu compra.');
    });
  });

  root.querySelectorAll('[data-doc]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      openDocument(el.dataset.doc);
    });
  });

  root.querySelectorAll('[data-drawer-close]').forEach((el) => {
    el.addEventListener('click', closeDrawer);
  });

  root.querySelectorAll('[data-drawer-minimize]').forEach((el) => {
    el.addEventListener('click', () => {
      if (!window.matchMedia('(min-width: 768px)').matches) return;
      setDrawerMinimized(!drawerMinimized);
    });
  });

  root.querySelectorAll('[data-topbar-line-toggle]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const wrap = btn.closest('.topbar-line-switch');
      const menu = wrap?.querySelector('.topbar-line-menu');
      if (!menu) return;
      const willOpen = menu.hasAttribute('hidden');
      root.querySelectorAll('.topbar-line-menu').forEach((el) => el.setAttribute('hidden', ''));
      root.querySelectorAll('[data-topbar-line-toggle]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
      if (!willOpen) return;
      menu.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => {
        document.addEventListener(
          'click',
          () => {
            menu.setAttribute('hidden', '');
            btn.setAttribute('aria-expanded', 'false');
          },
          { once: true }
        );
      }, 0);
    });
  });

  root.querySelectorAll('[data-set-line]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = PRODUCT_LINE_BY_ID[btn.dataset.setLine];
      if (!next || !ownsLine(next.id) || next.id === activeLine.id) return;
      if (ownedLines.length < 2) return;
      persistState();
      activeLine = next;
      rememberActiveLine(next.id);
      loadCalculatorForLine(next.id);
      recipeCatalog = 'base';
      recipeFilter = 'all';
      showToast(`${next.emoji} ${next.short}`);
      render();
    });
  });

  root.querySelectorAll('[data-home-currency-toggle]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const wrap = btn.closest('.home-currency');
      const menu = wrap?.querySelector('.home-currency-menu');
      if (!menu) return;
      const willOpen = menu.hasAttribute('hidden');
      root.querySelectorAll('.home-currency-menu').forEach((el) => el.setAttribute('hidden', ''));
      root.querySelectorAll('[data-home-currency-toggle]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
      if (!willOpen) return;
      menu.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => {
        document.addEventListener(
          'click',
          () => {
            menu.setAttribute('hidden', '');
            btn.setAttribute('aria-expanded', 'false');
          },
          { once: true }
        );
      }, 0);
    });
  });

  root.querySelectorAll('[data-set-currency]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const code = btn.dataset.setCurrency;
      if (!code || code === getCurrencyCode()) {
        root.querySelectorAll('.home-currency-menu').forEach((el) => el.setAttribute('hidden', ''));
        return;
      }
      setCurrencyCode(code);
      showToast(`Moneda: ${code}`);
      render();
    });
  });

  root.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.dataset.kitHub) kitHubTab = el.dataset.kitHub;
      if (el.dataset.recipeCatalog) recipeCatalog = el.dataset.recipeCatalog;
      navigateTo(el.dataset.view);
    });
  });

  root.querySelectorAll('[data-kit-hub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kitHubTab = btn.dataset.kitHub;
      if (activeView !== 'kit') activeView = 'kit';
      activeDocId = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      render();
    });
  });

  root.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('calc-form');
      if (form) updateFromForm(form);

      const nextMode = btn.dataset.mode;
      if (nextMode === inputMode) return;

      inputMode = nextMode;
      openStep = 1;
      persistState();
      render();
      showToast(inputMode === 'simple' ? 'Modo rápido activado' : 'Modo completo activado');
    });
  });

  root.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('calc-form');
      if (form) updateFromForm(form);
      openStep = parseNumber(btn.dataset.step);
      render();
    });
  });

  document.getElementById('next-step')?.addEventListener('click', () => {
    const form = document.getElementById('calc-form');
    if (form) updateFromForm(form);
    if (openStep < getCalcSteps().length) {
      openStep += 1;
      render();
    }
  });

  document.getElementById('prev-step')?.addEventListener('click', () => {
    const form = document.getElementById('calc-form');
    if (form) updateFromForm(form);
    if (openStep > 1) {
      openStep -= 1;
      render();
    }
  });

  document.getElementById('apply-ideal-price')?.addEventListener('click', applyIdealPrice);

  const form = document.getElementById('calc-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      updateFromForm(form);
      navigateTo('results');
      showToast(
        currentResults.status === 'prejuizo'
          ? '¡Pérdida detectada — hora de ajustar!'
          : currentResults.status === 'alerta'
            ? 'Ganancia baja — revisa el precio sugerido'
            : '¡Bien! Tus paletas dan ganancia'
      );
    });

    form.addEventListener('input', () => {
      updateFromForm(form);
      updateLivePreview();
    });

    document.getElementById('add-ingredient')?.addEventListener('click', () => {
      currentInputs.ingredients.push({
        name: '',
        batchCost: 0,
        portions: currentInputs.marmitasPerDay || 20,
      });
      render();
    });

    form.querySelectorAll('.remove-ingredient').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (currentInputs.ingredients.length <= 1) {
          showToast('Deja al menos 1 ingrediente.');
          return;
        }
        currentInputs.ingredients.splice(parseNumber(btn.dataset.index), 1);
        render();
      });
    });
  }

  document.getElementById('save-scenario-results')?.addEventListener('click', saveScenarioFlow);

  const bonusSearch = document.getElementById('bonus-search');
  if (bonusSearch) {
    bonusSearch.addEventListener('input', applyRecipeListFilters);
    applyRecipeListFilters();
  }

  document.getElementById('menu-expand-all')?.addEventListener('click', () => {
    document.querySelectorAll('#menu-list .menu-week').forEach((week) => {
      if (week.style.display !== 'none') week.open = true;
    });
  });

  document.getElementById('menu-collapse-all')?.addEventListener('click', () => {
    document.querySelectorAll('#menu-list .menu-week').forEach((week) => {
      week.open = false;
    });
    document.querySelectorAll('#menu-list .menu-item').forEach((item) => {
      item.open = false;
    });
  });

  enableHorizontalDragScroll(document.getElementById('recipe-filters'));
  enableHorizontalDragScroll(document.getElementById('kit-section-nav'));

  root.querySelectorAll('[data-recipe-filter]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      if (btn.dataset.dragMoved === '1') {
        event.preventDefault();
        event.stopPropagation();
        delete btn.dataset.dragMoved;
        return;
      }
      recipeFilter = btn.dataset.recipeFilter || 'all';
      applyRecipeListFilters();
    });
  });

  root.querySelectorAll('[data-recipe-catalog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      recipeCatalog = btn.dataset.recipeCatalog;
      recipeFilter = 'all';
      render();
    });
  });

  root.querySelectorAll('[data-load]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = scenarios.find((s) => s.id === btn.dataset.load);
      if (!item?.inputs) return;
      currentInputs = cloneInputs(item.inputs);
      simpleValues = fullToSimple(currentInputs);
      currentResults = calculate(currentInputs);
      persistState();
      openStep = 1;
      navigateTo('calc');
      showToast('¡Escenario cargado!');
    });
  });

  root.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!window.confirm('¿Eliminar este escenario?')) return;
      await deleteScenario(currentUser.uid, btn.dataset.delete);
      scenarios = await listScenarios(currentUser.uid);
      render();
      showToast('Escenario eliminado.');
    });
  });

  document.getElementById('replay-onboarding')?.addEventListener('click', () => {
    showOnboarding({ brand: lineBrand() });
  });

  document.getElementById('replay-onboarding-profile')?.addEventListener('click', () => {
    showOnboarding({ brand: lineBrand() });
  });

  root.querySelectorAll('[data-kit-section]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kitSection = btn.dataset.kitSection;
      render();
    });
  });

  root.querySelectorAll('.copy-combo').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = parseNumber(btn.dataset.comboIndex);
      const text = kitContentForLine().combos[idx]?.mensaje;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('¡Mensaje del combo copiado!');
      } catch {
        showToast('No se pudo copiar.');
      }
    });
  });

  root.querySelectorAll('.combo-calc-link').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo('calc'));
  });

  root.querySelectorAll('.copy-msg').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = parseNumber(btn.dataset.copyIndex);
      const source = btn.closest('[data-mensajes-source]')?.dataset.mensajesSource;
      const kit = kitContentForLine();
      const pool = source === 'premium' ? kit.mensajesPremium : kit.mensajes;
      const text = formatWhatsAppMessage(pool?.[idx]?.texto);
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('¡Mensaje copiado!');
      } catch {
        showToast('No se pudo copiar. Selecciona el texto manualmente.');
      }
    });
  });

  root.querySelectorAll('.share-msg').forEach((link) => {
    const idx = parseNumber(link.dataset.shareIndex);
    const source = link.closest('[data-mensajes-source]')?.dataset.mensajesSource;
    const kit = kitContentForLine();
    const pool = source === 'premium' ? kit.mensajesPremium : kit.mensajes;
    const text = formatWhatsAppMessage(pool?.[idx]?.texto);
    if (text) {
      link.href = whatsAppShareUrl(text);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });

  root.querySelectorAll('[data-checklist]').forEach((input) => {
    input.addEventListener('change', () => {
      const venta = [...root.querySelectorAll('[data-checklist^="venta:"]:checked')].map((el) =>
        parseNumber(el.dataset.checklist.split(':')[1])
      );
      const prod = [...root.querySelectorAll('[data-checklist^="prod:"]:checked')].map((el) =>
        parseNumber(el.dataset.checklist.split(':')[1])
      );
      saveChecklistVentaState(venta);
      saveChecklistState(prod);
    });
  });

  document.getElementById('reset-checklist')?.addEventListener('click', () => {
    saveChecklistState([]);
    saveChecklistVentaState([]);
    render();
    showToast('Checklist reiniciado.');
  });

  root.querySelectorAll('[data-lista-item]').forEach((input) => {
    input.addEventListener('change', () => {
      const checked = [...root.querySelectorAll('[data-lista-item]:checked')].map(
        (el) => el.dataset.listaItem
      );
      saveListaComprasState(checked);
    });
  });

  document.getElementById('reset-lista')?.addEventListener('click', () => {
    saveListaComprasState([]);
    render();
    showToast('Lista reiniciada.');
  });

  document.getElementById('lista-print')?.addEventListener('click', () => {
    const lista = kitContentForLine().lista;
    const section = (title, items) =>
      `<h2>${title}</h2><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Lista de compras</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#3D2228;max-width:560px;margin:0 auto}
        h1{font-size:1.25rem;margin:0 0 16px}
        h2{font-size:0.95rem;margin:18px 0 8px}
        ul{padding-left:1.1rem;margin:0}
        li{margin:6px 0;line-height:1.4}
      </style></head><body>
      <h1>Lista de compras</h1>
      ${section('Ingredientes base', lista.ingredientes)}
      ${section('Materiales', lista.materiales)}
      ${section('Utensilios recomendados', lista.utensilios)}
      <script>window.onload=()=>{window.print()}<\/script>
      </body></html>`;
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) {
      showToast('Permite ventanas emergentes para imprimir.');
      return;
    }
    w.document.write(html);
    w.document.close();
  });

  document.getElementById('reset-data')?.addEventListener('click', () => {
    if (!window.confirm('¿Borrar borrador y escenarios guardados en este dispositivo?')) return;
    clearDraft(currentUser.uid);
    clearScenarios(currentUser.uid);
    clearOnboardingSeen();
    inputMode = 'simple';
    simpleValues = { ...SIMPLE_DEFAULTS };
    currentInputs = simpleToFull(SIMPLE_DEFAULTS);
    currentResults = calculate(currentInputs);
    scenarios = [];
    openStep = 1;
    navigateTo('calc');
    showToast('Datos limpiados. Empezando de cero.');
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawerOpen) closeDrawer();
});

function updateFromForm(form) {
  if (inputMode === 'simple') {
    simpleValues = readSimpleFromForm(form);
    currentInputs = simpleToFull(simpleValues);
  } else {
    currentInputs = readInputsFromForm(form);
    simpleValues = fullToSimple(currentInputs);
  }
  currentResults = calculate(currentInputs);
  persistState();
}
