import { isFirebaseConfigured } from '../lib/firebase.js';
import {
  enterDemo,
  isDemoMode,
  login,
  register,
  resetPassword,
  redirectIfAuthenticated,
  watchAuth,
} from '../lib/auth.js';

const configAlert = document.getElementById('config-alert');
const formAlert = document.getElementById('form-alert');
const tabs = document.querySelectorAll('.auth-tab');
const panels = document.querySelectorAll('.panel');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotBtn = document.getElementById('forgot-btn');

function showAlert(el, message, type = 'error') {
  el.textContent = message;
  el.className = `auth-alert show ${type}`;
}

function hideAlert(el) {
  el.className = 'auth-alert';
  el.textContent = '';
}

function setTab(name) {
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
  panels.forEach((panel) => panel.classList.toggle('active', panel.id === `panel-${name}`));
  hideAlert(formAlert);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setTab(tab.dataset.tab));
});

const purchaseParams = new URLSearchParams(window.location.search);

function getAfterLoginUrl() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  if (next && next.startsWith('/')) return next;
  if (params.get('premium') === '1') {
    localStorage.setItem('paletas_premium', '1');
    return '/membros?premium=1';
  }
  if (params.get('compra') === '1') return '/membros?compra=1';
  return '/membros';
}

watchAuth((user) => redirectIfAuthenticated(user));

if (purchaseParams.get('compra') === '1') {
  const banner = document.createElement('div');
  banner.className = 'auth-alert show success';
  banner.style.marginBottom = '16px';
  banner.textContent = '✓ Compra confirmada. Crea tu cuenta o entra para acceder al kit.';
  document.querySelector('.auth-card')?.prepend(banner);
}
if (purchaseParams.get('premium') === '1') {
  localStorage.setItem('paletas_premium', '1');
}

if (isDemoMode()) {
  showAlert(
    configAlert,
    '¿Compraste? Usa la pestaña Crear cuenta con el código del correo. ¿Solo quieres probar? Usa el botón verde de arriba.',
    'success'
  );
} else if (!isFirebaseConfigured) {
  showAlert(configAlert, 'Firebase parcialmente configurado. Revisa el .env.local.', 'info');
}

document.getElementById('demo-enter-btn')?.addEventListener('click', async () => {
  const btn = document.getElementById('demo-enter-btn');
  btn.disabled = true;
  btn.textContent = 'Abriendo demo...';
  try {
    await enterDemo();
    window.location.href = getAfterLoginUrl();
  } catch (error) {
    showAlert(formAlert, error.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Probar gratis ahora';
  }
});

if (new URLSearchParams(window.location.search).get('demo') === '1') {
  document.getElementById('demo-enter-btn')?.click();
}

if (new URLSearchParams(window.location.search).get('compra') === '1') {
  setTab('register');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAlert(formAlert);

  const data = new FormData(loginForm);
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Entrando...';

  try {
    await login(data.get('email'), data.get('password'));
    window.location.href = getAfterLoginUrl();
  } catch (error) {
    showAlert(formAlert, translateAuthError(error), 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Entrar al kit';
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAlert(formAlert);

  const data = new FormData(registerForm);
  const button = registerForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Creando cuenta...';

  try {
    await register(
      data.get('name'),
      data.get('email'),
      data.get('password'),
      data.get('accessCode')
    );
    showAlert(formAlert, '¡Cuenta creada! Redirigiendo...', 'success');
    if (purchaseParams.get('premium') === '1') {
      localStorage.setItem('paletas_premium', '1');
    }
    setTimeout(() => {
      window.location.href = getAfterLoginUrl();
    }, 700);
  } catch (error) {
    showAlert(formAlert, translateAuthError(error), 'error');
    button.disabled = false;
    button.textContent = 'Crear mi cuenta';
  }
});

forgotBtn.addEventListener('click', async () => {
  hideAlert(formAlert);
  const email = document.getElementById('login-email').value.trim();
  if (!email) {
    showAlert(formAlert, 'Escribe tu correo en el campo de arriba primero.', 'error');
    return;
  }

  try {
    await resetPassword(email);
    showAlert(formAlert, 'Enviamos un enlace de recuperación a tu correo.', 'success');
  } catch (error) {
    showAlert(formAlert, translateAuthError(error), 'error');
  }
});

function translateAuthError(error) {
  const code = error?.code || '';
  const map = {
    'auth/invalid-email': 'Correo electrónico inválido.',
    'auth/user-disabled': 'Cuenta desactivada. Contacta soporte.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/weak-password': 'Contraseña débil. Usa al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
  };

  if (map[code]) return map[code];
  return error?.message || 'No se pudo completar. Intenta de nuevo.';
}
