import { isFirebaseConfigured } from '../lib/firebase.js';
import {
  login,
  register,
  resetPassword,
  redirectIfAuthenticated,
  watchAuth,
} from '../lib/auth.js';

const configAlert = document.getElementById('config-alert');
const formAlert = document.getElementById('form-alert');
const purchaseBanner = document.getElementById('purchase-banner');
const tabs = document.querySelectorAll('.auth-tab');
const panels = document.querySelectorAll('.panel');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotBtn = document.getElementById('forgot-btn');

const purchaseParams = new URLSearchParams(window.location.search);

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

function getAfterLoginUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('compra') === '1') {
    const premium = params.get('premium') === '1' ? '&premium=1' : '';
    return `/app?compra=1${premium}`;
  }
  const next = params.get('next');
  if (next && next.startsWith('/')) return next;
  return '/app';
}

watchAuth((user) => redirectIfAuthenticated(user));

if (purchaseParams.get('compra') === '1') {
  purchaseBanner.hidden = false;
  setTab('register');
}

if (purchaseParams.get('premium') === '1') {
  localStorage.setItem('paletas_premium', '1');
}

if (!isFirebaseConfigured) {
  showAlert(
    configAlert,
    'Firebase no está configurado en este entorno. Agrega las variables VITE_FIREBASE_* en Vercel.',
    'info'
  );
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
    button.textContent = 'Entrar al área de miembros';
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
