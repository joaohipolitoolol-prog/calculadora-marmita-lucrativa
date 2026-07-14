import { WHATSAPP_PURCHASE_LINK } from '../landing/config.js';
import { getUserLabel, logout, watchAuth } from '../lib/auth.js';
import { getUserProfile, hasKitAccess, resolveUserProfile } from '../lib/user-profile.js';

const THEME_KEY = 'paletas-kit-theme';
const PREMIUM_KEY = 'paletas_premium';

function getRedirectLogin() {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  return `/login?next=${next}`;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  btn?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

function unlockPremiumFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('premium') === '1') {
    localStorage.setItem(PREMIUM_KEY, '1');
    params.delete('premium');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }
}

function hasPremium(profile) {
  if (profile?.hasPremium) return true;
  return localStorage.getItem(PREMIUM_KEY) === '1';
}

function renderPremiumSection(profile) {
  if (!hasPremium(profile)) return;

  const host = document.getElementById('premium-downloads');
  if (!host) return;

  host.hidden = false;
  host.innerHTML = `
    <div class="section-label">Complemento premium</div>
    <div class="downloads">
      <a class="dl-card featured" href="/paletas-premium/produto/Kit_Premium_Paletas.html" target="_blank" rel="noopener" style="--card-accent:#ffc94a">
        <div class="dl-icon">✨</div>
        <div class="dl-info">
          <h3>Kit Premium <span class="dl-tag">20 recetas</span></h3>
          <p>Recetas bañadas, rellenas y estilo postre</p>
        </div>
        <span class="dl-action">→</span>
      </a>
      <a class="dl-card" href="/paletas-premium/produto/Combos_Rentables.html" target="_blank" rel="noopener" style="--card-accent:#ff7a1a">
        <div class="dl-icon">📦</div>
        <div class="dl-info"><h3>Combos Rentables</h3><p>10 ideas con precio guía</p></div>
        <span class="dl-action">→</span>
      </a>
      <a class="dl-card" href="/paletas-premium/produto/Menu_Premium_Editable.html" target="_blank" rel="noopener" style="--card-accent:#5ecf9a">
        <div class="dl-icon">📋</div>
        <div class="dl-info"><h3>Menú Premium</h3><p>Copia y pega en WhatsApp</p></div>
        <span class="dl-action">→</span>
      </a>
      <a class="dl-card" href="/paletas-premium/produto/Mensajes_Premium.html" target="_blank" rel="noopener" style="--card-accent:#a78bfa">
        <div class="dl-icon">💬</div>
        <div class="dl-info"><h3>Mensajes Premium</h3><p>Combos y fechas especiales</p></div>
        <span class="dl-action">→</span>
      </a>
      <a class="dl-card" href="/paletas-premium/produto/Fechas_Especiales.html" target="_blank" rel="noopener" style="--card-accent:#60a5fa">
        <div class="dl-icon">🎉</div>
        <div class="dl-info"><h3>Fechas Especiales</h3><p>Día de la Madre, San Valentín, Navidad…</p></div>
        <span class="dl-action">→</span>
      </a>
      <a class="dl-card" href="/paletas-premium/produto/Guia_Presentacion.html" target="_blank" rel="noopener" style="--card-accent:#f472b6">
        <div class="dl-icon">📸</div>
        <div class="dl-info"><h3>Guía de Presentación</h3><p>Fotos, empaque y nombres que venden</p></div>
        <span class="dl-action">→</span>
      </a>
    </div>
  `;
}

function renderPremiumUpsellTeaser(profile) {
  const host = document.getElementById('premium-upsell-teaser');
  if (!host || hasPremium(profile)) return;

  host.hidden = false;
  host.innerHTML = `
    <div class="section-label">¿Quieres diferenciarte más?</div>
    <div class="panel premium-teaser">
      <h3 style="margin-bottom:8px;font-size:16px">Paletas Premium y Combos Rentables</h3>
      <p style="font-size:13px;color:var(--text-muted);line-height:1.5;margin-bottom:12px">
        Complemento opcional: 20 recetas premium, combos con precio guía, menú editable, mensajes para fechas especiales y guía de fotos.
      </p>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:14px">
        <strong>Cuándo tiene sentido:</strong> después de vender tus primeros 3-5 sabores básicos y querer subir ticket medio con combos y presentación.
      </p>
      <a href="/upsell-paletas-premium" style="display:inline-block;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#ffc94a,#ff7a1a);color:#3d2218;font-weight:800;text-decoration:none;font-size:13px">Ver complemento premium</a>
    </div>
  `;
}

function applyKitLocks() {
  const wrap = document.querySelector('.wrap');
  if (!wrap || wrap.querySelector('.kit-pending-strip')) return;

  const strip = document.createElement('div');
  strip.className = 'kit-pending-strip';
  strip.innerHTML =
    '<p>⏳ Verificando tu compra, las descargas se desbloquean en minutos. <a href="/app">Abrir calculadora</a></p>';
  wrap.prepend(strip);

  const badge = document.querySelector('.hero-badge');
  if (badge) badge.textContent = 'Cuenta creada';

  document.querySelectorAll('.downloads .dl-card').forEach((card) => {
    card.classList.add('locked');
    const action = card.querySelector('.dl-action');
    if (action) action.textContent = '🔒';
    card.addEventListener('click', (event) => {
      event.preventDefault();
    });
  });
}

function showFirstVisitGuide() {
  if (sessionStorage.getItem('paletas_membros_intro') === '1') return;
  sessionStorage.setItem('paletas_membros_intro', '1');

  const guide = document.createElement('div');
  guide.className = 'first-visit-guide';
  guide.innerHTML = `
    <div class="first-visit-guide-inner">
      <strong>¿Por dónde empiezo?</strong>
      <p>1. Abre la <a href="/app">app</a> y calcula tus precios · 2. Elige 3 recetas · 3. Copia mensajes en Vender</p>
      <button type="button" id="guide-dismiss">Entendido</button>
    </div>
  `;
  document.body.appendChild(guide);
  guide.querySelector('#guide-dismiss')?.addEventListener('click', () => guide.remove());
  guide.querySelector('a[href="/app"]')?.addEventListener('click', () => guide.remove());
}

function bindUserUI(user) {
  const label = document.getElementById('userLabel');
  const logoutBtn = document.getElementById('logoutBtn');
  const waLink = document.getElementById('wa-support');

  if (label) label.textContent = getUserLabel(user);
  if (waLink) waLink.href = WHATSAPP_PURCHASE_LINK;

  logoutBtn?.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    await logout();
    window.location.href = '/login';
  });
}

watchAuth(async (user) => {
  if (!user) {
    window.location.replace(getRedirectLogin());
    return;
  }

  const profile = await resolveUserProfile(user);
  if (profile?.hasPremium) localStorage.setItem(PREMIUM_KEY, '1');

  unlockPremiumFromQuery();
  initTheme();
  bindUserUI(user);

  if (!hasKitAccess(profile, user)) {
    applyKitLocks();
  }

  renderPremiumSection(profile);
  renderPremiumUpsellTeaser(profile);
  showFirstVisitGuide();

  const params = new URLSearchParams(window.location.search);
  if (params.get('compra') === '1') {
    const badge = document.querySelector('.hero-badge');
    if (badge) {
      badge.textContent = params.get('premium') === '1' ? 'Premium activado' : 'Compra confirmada';
    }
    params.delete('compra');
    params.delete('premium');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }
});
