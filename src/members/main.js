import { WHATSAPP_PURCHASE_LINK } from '../landing/config.js';
import { getUserLabel, logout, watchAuth } from '../lib/auth.js';
import { getUserProfile } from '../lib/user-profile.js';

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
    </div>
  `;
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

  const profile = await getUserProfile(user.uid);
  if (profile?.hasPremium) localStorage.setItem(PREMIUM_KEY, '1');

  unlockPremiumFromQuery();
  initTheme();
  bindUserUI(user);
  renderPremiumSection(profile);

  const params = new URLSearchParams(window.location.search);
  if (params.get('compra') === '1') {
    const badge = document.querySelector('.hero-badge');
    if (badge) badge.textContent = 'Compra confirmada';
    window.history.replaceState({}, '', '/membros');
  }
});
