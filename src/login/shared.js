import { isFirebaseConfigured } from '../lib/firebase.js';
import {
  resolveLineFromSearch,
  rememberActiveLine,
  readRememberedLineId,
  authHomeHref,
  withLineQuery,
  PRODUCT_LINE_BY_ID,
} from '../lib/product-lines.js';

export function showAlert(el, message, type = 'error') {
  if (!el) return;
  el.textContent = message;
  el.className = `auth-alert show ${type}`;
}

export function hideAlert(el) {
  if (!el) return;
  el.className = 'auth-alert';
  el.textContent = '';
}

export function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.password-field')?.querySelector('input');
      if (!input) return;

      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.classList.toggle('visible', show);
      btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
      btn.setAttribute('aria-pressed', String(show));
    });
  });
}

export function initConfigAlert() {
  const configAlert = document.getElementById('config-alert');
  if (!configAlert || isFirebaseConfigured) return;

  showAlert(
    configAlert,
    'Firebase no está configurado en este entorno. Agrega las variables VITE_FIREBASE_* en Vercel.',
    'info'
  );
}

/** Resolve + remember product line for auth pages. */
export function getAuthProductLine() {
  const fromUrl = resolveLineFromSearch(window.location.search);
  if (fromUrl) {
    rememberActiveLine(fromUrl.id);
    return fromUrl;
  }

  // Keep brand if user already came from a product LP this session.
  const rememberedId = readRememberedLineId();
  if (rememberedId && PRODUCT_LINE_BY_ID[rememberedId]?.enabled) {
    return PRODUCT_LINE_BY_ID[rememberedId];
  }

  return PRODUCT_LINE_BY_ID.paletas;
}

/** Apply product brand to login/register chrome. */
export function applyAuthBrand(line = getAuthProductLine()) {
  if (!line) return line;

  document.title = document.title.replace(/\|.+$/, `| ${line.name}`);
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute('content', line.accent);

  const logo = document.querySelector('.auth-logo');
  if (logo) {
    logo.setAttribute('href', authHomeHref(line));
    const icon = logo.querySelector('.auth-logo-icon, .auth-logo-emoji');
    if (icon) {
      const emoji = document.createElement('span');
      emoji.className = 'auth-logo-emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = line.emoji;
      icon.replaceWith(emoji);
    }
    const label = logo.querySelector('span:not(.auth-logo-emoji)');
    if (label) label.textContent = line.name;
  }

  const cardIcon = document.querySelector('.auth-card-icon');
  if (cardIcon) cardIcon.textContent = line.emoji;

  document.querySelectorAll('.auth-switch a, .auth-footer a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('/login') || href.startsWith('/cadastrar')) {
      a.setAttribute('href', withLineQuery(href.split('?')[0], line.id));
    } else if (href === '/' || href.startsWith('/#')) {
      a.setAttribute('href', authHomeHref(line));
      if (a.closest('.auth-footer')) {
        a.textContent = `Ver kit · ${line.priceLabel}`;
      }
    }
  });

  document.documentElement.style.setProperty('--auth-accent', line.accent);
  document.body.dataset.productLine = line.id;

  return line;
}

export function getAfterLoginUrl(line = getAuthProductLine()) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('compra') === '1') {
    const next = new URLSearchParams();
    next.set('compra', '1');
    if (params.get('premium') === '1') next.set('premium', '1');
    if (params.get('postres') === '1') next.set('postres', '1');
    if (params.get('postres_premium') === '1') next.set('postres_premium', '1');
    if (params.get('paletas') === '1') next.set('paletas', '1');
    if (params.get('donuts') === '1') next.set('donuts', '1');
    if (line?.id) next.set('line', line.id);
    return `/app?${next.toString()}`;
  }
  const next = params.get('next');
  if (next && next.startsWith('/')) {
    return withLineQuery(next, line?.id);
  }
  return withLineQuery('/app', line?.id);
}

export function translateAuthError(error) {
  const code = error?.code || '';
  const map = {
    'auth/invalid-email': 'Correo electrónico inválido.',
    'auth/user-disabled': 'Cuenta desactivada. Contacta soporte.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Este correo ya está registrado. Prueba entrar.',
    'auth/weak-password': 'Contraseña débil. Usa al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
    'auth/configuration-not-found':
      'El registro aún no está activo. Escríbenos por WhatsApp y te ayudamos a entrar.',
    'auth/operation-not-allowed':
      'El registro por email aún no está activado. Escríbenos por WhatsApp.',
  };

  if (map[code]) return map[code];
  return error?.message || 'No se pudo completar. Intenta de nuevo.';
}
