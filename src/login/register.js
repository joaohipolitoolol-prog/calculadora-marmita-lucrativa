import { WHATSAPP_SUPPORT_LINK } from '../landing/config.js';
import { register, guardAuthPage } from '../lib/auth.js';
import {
  applyAuthBrand,
  getAfterLoginUrl,
  getAuthProductLine,
  hideAlert,
  initConfigAlert,
  initPasswordToggles,
  showAlert,
  translateAuthError,
} from './shared.js';

const formAlert = document.getElementById('form-alert');
const purchaseBanner = document.getElementById('purchase-banner');
const registerForm = document.getElementById('register-form');
const registerWaSupport = document.getElementById('register-wa-support');

const params = new URLSearchParams(window.location.search);
const authLine = applyAuthBrand(getAuthProductLine());

if (registerWaSupport) {
  registerWaSupport.href = WHATSAPP_SUPPORT_LINK;
}

initPasswordToggles();
initConfigAlert();
guardAuthPage();

if (params.get('compra') === '1' && purchaseBanner) {
  purchaseBanner.hidden = false;
  purchaseBanner.textContent = `✓ Compra ${authLine.short} confirmada`;
  const sub = document.querySelector('.auth-sub');
  if (sub) {
    sub.textContent = `Usa el mismo correo con el que compraste ${authLine.short}. Liberamos tu acceso en minutos.`;
  }
}

if (params.get('premium') === '1') {
  localStorage.setItem('kit_premium_paletas_v1', '1');
  localStorage.setItem('paletas_premium', '1');
}
if (params.get('postres_premium') === '1') {
  localStorage.setItem('kit_premium_postres_v1', '1');
}

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAlert(formAlert);

  const data = new FormData(registerForm);
  const accessCode = params.get('code')?.trim() || '';
  const button = registerForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Creando cuenta...';

  try {
    await register(data.get('name'), data.get('email'), data.get('password'), { accessCode });
    showAlert(
      formAlert,
      '¡Cuenta creada! Tu kit ya está activo — entra y empieza a usar.',
      'success'
    );
    setTimeout(() => {
      window.location.replace(getAfterLoginUrl(authLine));
    }, 700);
  } catch (error) {
    showAlert(formAlert, translateAuthError(error), 'error');
    button.disabled = false;
    button.textContent = 'Crear mi cuenta';
  }
});
