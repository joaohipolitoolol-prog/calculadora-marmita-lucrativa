import { isFirebaseConfigured } from '../lib/firebase.js';

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

export function getAfterLoginUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('compra') === '1') {
    const premium = params.get('premium') === '1' ? '&premium=1' : '';
    return `/app?compra=1${premium}`;
  }
  const next = params.get('next');
  if (next && next.startsWith('/')) return next;
  return '/app';
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
