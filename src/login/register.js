import { WHATSAPP_NUMBER_ID, WHATSAPP_SUPPORT_LINK } from '../landing/config.js';
import { register, guardAuthPage } from '../lib/auth.js';
import { bindTrackClicks, trackCurrentPage } from '../lib/track.js';
import { defaultNumberIdForLine, getWhatsAppUrl } from '../lib/whatsapp-numbers.js';
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

trackCurrentPage({ line: authLine?.id });
bindTrackClicks({
  page: 'cadastrar',
  line: authLine?.id,
  numberId: defaultNumberIdForLine(authLine?.id || 'paletas', 'support'),
});

if (registerWaSupport) {
  const waId = defaultNumberIdForLine(authLine?.id || 'paletas', 'support');
  registerWaSupport.href =
    authLine?.id === 'postres' ? getWhatsAppUrl(waId) : WHATSAPP_SUPPORT_LINK;
  registerWaSupport.dataset.waId = waId || WHATSAPP_NUMBER_ID;
  registerWaSupport.dataset.waPurpose = 'support';
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
    const bought = params.get('compra') === '1' || Boolean(accessCode);
    showAlert(
      formAlert,
      bought
        ? '¡Cuenta creada! Tu kit ya está activo — entra y empieza a usar.'
        : '¡Cuenta creada! Entra a la app; el acceso se libera con tu compra.',
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
