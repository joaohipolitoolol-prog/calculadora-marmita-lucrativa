const COLLAPSED_KEY = 'paletas_pwa_hint_collapsed';

export function isPwaInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isIos() {
  const ua = navigator.userAgent || '';
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function shouldShowPwaHint() {
  return !isPwaInstalled();
}

export function isPwaHintCollapsed() {
  return localStorage.getItem(COLLAPSED_KEY) !== '0';
}

export function collapsePwaHint() {
  localStorage.setItem(COLLAPSED_KEY, '1');
}

export function expandPwaHint() {
  localStorage.setItem(COLLAPSED_KEY, '0');
}

function renderExpandedSteps(canInstallNative) {
  const ios = isIos();

  if (ios) {
    return `
      <ol class="pwa-guide-steps">
        <li><span>1</span> Toca <em>Compartir</em> <span class="pwa-step-pill">□↑</span> en la barra de Safari</li>
        <li><span>2</span> Desliza y elige <em>Añadir a inicio</em></li>
        <li><span>3</span> Toca <em>Añadir</em> arriba a la derecha</li>
      </ol>`;
  }

  if (canInstallNative) {
    return `
      <p class="pwa-hint-lead">Un toque y queda en tu pantalla de inicio, como una app.</p>
      <button type="button" class="btn btn-primary btn-sm" id="pwa-hint-install">Instalar ahora</button>`;
  }

  return `
    <ol class="pwa-guide-steps">
      <li><span>1</span> Abre el menú <em>⋮</em> del navegador</li>
      <li><span>2</span> Elige <em>Instalar app</em> o <em>Añadir a inicio</em></li>
    </ol>`;
}

export function renderPwaHintBanner(canInstallNative) {
  if (!shouldShowPwaHint()) return '';

  const collapsed = isPwaHintCollapsed();

  return `
    <div class="pwa-hint${collapsed ? ' is-collapsed' : ''}" id="pwa-hint" role="region" aria-label="Instalar en pantalla de inicio">
      <button type="button" class="pwa-hint-bar" id="pwa-hint-toggle" aria-expanded="${collapsed ? 'false' : 'true'}">
        <span class="pwa-hint-bar-icon" aria-hidden="true">📲</span>
        <span class="pwa-hint-bar-text">Añadir a pantalla de inicio</span>
        <span class="pwa-hint-chevron" aria-hidden="true"></span>
      </button>
      <div class="pwa-hint-panel" id="pwa-hint-panel"${collapsed ? ' hidden' : ''}>
        <div class="pwa-hint-panel-head">
          <div>
            <strong>Acceso rápido en tu celular</strong>
            <p>Guarda el kit en tu pantalla de inicio para abrirlo al instante.</p>
          </div>
          <button type="button" class="pwa-hint-minimize" id="pwa-hint-minimize" aria-label="Minimizar">−</button>
        </div>
        ${renderExpandedSteps(canInstallNative)}
      </div>
    </div>
  `;
}

export function renderPwaGuideModal() {
  const ios = isIos();
  const body = ios
    ? `
      <ol class="pwa-guide-steps">
        <li><span>1</span> Toca <em>Compartir</em> <span class="pwa-step-pill">□↑</span> en la barra de Safari</li>
        <li><span>2</span> Desliza y elige <em>Añadir a inicio</em></li>
        <li><span>3</span> Toca <em>Añadir</em> arriba a la derecha</li>
      </ol>`
    : `
      <ol class="pwa-guide-steps">
        <li><span>1</span> Menú <em>⋮</em> del navegador (arriba a la derecha)</li>
        <li><span>2</span> <em>Instalar app</em> o <em>Añadir a pantalla de inicio</em></li>
      </ol>
      <p class="pwa-guide-note">Si ves el botón <em>Instalar ahora</em> abajo, úsalo directo.</p>`;

  return `
    <div class="pwa-guide-overlay visible" id="pwa-guide-overlay">
      <div class="pwa-guide-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-guide-title">
        <div class="pwa-guide-handle" aria-hidden="true"></div>
        <h2 id="pwa-guide-title">Añadir a pantalla de inicio</h2>
        <p class="pwa-guide-sub">Así abres el kit como una app, sin buscar el enlace cada vez.</p>
        ${body}
        <button type="button" class="btn btn-primary btn-block" id="pwa-guide-install" hidden>Instalar ahora</button>
        <button type="button" class="btn btn-ghost btn-block" id="pwa-guide-close">Entendido</button>
      </div>
    </div>
  `;
}

function setPwaHintCollapsed(collapsed) {
  const hint = document.getElementById('pwa-hint');
  const toggle = document.getElementById('pwa-hint-toggle');
  const panel = document.getElementById('pwa-hint-panel');
  if (!hint || !toggle || !panel) return;

  hint.classList.toggle('is-collapsed', collapsed);
  toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  panel.hidden = collapsed;

  if (collapsed) collapsePwaHint();
  else expandPwaHint();
}

export function bindPwaHint({ onInstall }) {
  const toggle = document.getElementById('pwa-hint-toggle');
  const minimize = document.getElementById('pwa-hint-minimize');

  toggle?.addEventListener('click', () => {
    if (isPwaHintCollapsed()) setPwaHintCollapsed(false);
    else setPwaHintCollapsed(true);
  });

  minimize?.addEventListener('click', (e) => {
    e.stopPropagation();
    setPwaHintCollapsed(true);
  });

  document.getElementById('pwa-hint-install')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (onInstall) await onInstall();
  });
}

export function openPwaGuide({ deferredInstallPrompt, showToast, onAccepted } = {}) {
  const existing = document.getElementById('pwa-guide-overlay');
  existing?.remove();

  document.body.insertAdjacentHTML('beforeend', renderPwaGuideModal());

  const overlay = document.getElementById('pwa-guide-overlay');
  const installBtn = document.getElementById('pwa-guide-install');

  if (deferredInstallPrompt && installBtn) {
    installBtn.hidden = false;
    installBtn.addEventListener('click', async () => {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      overlay?.remove();
      if (outcome === 'accepted') {
        showToast?.('¡App instalada!');
        onAccepted?.();
      }
    });
  }

  const close = () => overlay?.remove();
  document.getElementById('pwa-guide-close')?.addEventListener('click', close);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}
