import { login, resetPassword, redirectIfAuthenticated, watchAuth } from '../lib/auth.js';
import {
  getAfterLoginUrl,
  hideAlert,
  initConfigAlert,
  initPasswordToggles,
  showAlert,
  translateAuthError,
} from './shared.js';

const formAlert = document.getElementById('form-alert');
const loginForm = document.getElementById('login-form');
const forgotBtn = document.getElementById('forgot-btn');

const params = new URLSearchParams(window.location.search);

if (params.get('compra') === '1') {
  const qs = params.toString();
  window.location.replace(`/cadastrar${qs ? `?${qs}` : ''}`);
}

initPasswordToggles();
initConfigAlert();
watchAuth((user) => redirectIfAuthenticated(user));

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAlert(formAlert);

  const data = new FormData(loginForm);
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Entrando...';

  try {
    const rememberMe = loginForm.querySelector('#login-remember')?.checked ?? true;
    await login(data.get('email'), data.get('password'), { rememberMe });
    window.location.href = getAfterLoginUrl();
  } catch (error) {
    showAlert(formAlert, translateAuthError(error), 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Entrar';
  }
});

forgotBtn?.addEventListener('click', async () => {
  hideAlert(formAlert);
  const email = document.getElementById('login-email')?.value.trim();
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
