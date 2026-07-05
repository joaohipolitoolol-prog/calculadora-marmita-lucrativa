import { isFirebaseConfigured } from '../lib/firebase.js';
import {
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

watchAuth((user) => redirectIfAuthenticated(user));

if (isDemoMode()) {
  showAlert(
    configAlert,
    'Modo demonstração ativo (dados salvos neste navegador). Para produção, configure Firebase no .env.local e na Vercel.',
    'info'
  );
} else if (!isFirebaseConfigured) {
  showAlert(configAlert, 'Firebase parcialmente configurado. Revise o .env.local.', 'info');
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
    window.location.href = '/app.html';
  } catch (error) {
    showAlert(formAlert, translateAuthError(error), 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Entrar na calculadora';
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAlert(formAlert);

  const data = new FormData(registerForm);
  const button = registerForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Criando conta...';

  try {
    await register(
      data.get('name'),
      data.get('email'),
      data.get('password'),
      data.get('accessCode')
    );
    showAlert(formAlert, 'Conta criada! Redirecionando...', 'success');
    setTimeout(() => {
      window.location.href = '/app.html';
    }, 700);
  } catch (error) {
    showAlert(formAlert, translateAuthError(error), 'error');
    button.disabled = false;
    button.textContent = 'Criar minha conta';
  }
});

forgotBtn.addEventListener('click', async () => {
  hideAlert(formAlert);
  const email = document.getElementById('login-email').value.trim();
  if (!email) {
    showAlert(formAlert, 'Digite seu e-mail no campo acima primeiro.', 'error');
    return;
  }

  try {
    await resetPassword(email);
    showAlert(formAlert, 'Enviamos um link de recuperação para seu e-mail.', 'success');
  } catch (error) {
    showAlert(formAlert, translateAuthError(error), 'error');
  }
});

function translateAuthError(error) {
  const code = error?.code || '';
  const map = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Conta desativada. Fale com o suporte.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
  };

  if (map[code]) return map[code];
  return error?.message || 'Não foi possível concluir. Tente de novo.';
}
