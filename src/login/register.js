import { WHATSAPP_NUMBER_ID, WHATSAPP_SUPPORT_LINK } from '../landing/config.js';
import { register, guardAuthPage } from '../lib/auth.js';
import { clearCheckoutPending } from '../lib/meta-pixel.js';
import { isPostPurchaseUiIntent } from '../lib/purchase-flags.js';
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
const postPurchaseUi = isPostPurchaseUiIntent(window.location.search);

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

if (postPurchaseUi && purchaseBanner) {
  purchaseBanner.hidden = false;
  purchaseBanner.textContent = `Usa el mismo correo de Hotmart · liberamos el acceso al confirmar el pago`;
  const sub = document.querySelector('.auth-sub');
  if (sub) {
    sub.textContent = `Si acabas de comprar ${authLine.short}, crea la cuenta con ese correo. El kit se activa solo cuando Hotmart confirma el pago.`;
  }
}

// Never fire Meta Purchase from register. Clear stale pending flags.
clearCheckoutPending('paletas');
clearCheckoutPending('postres');

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
      accessCode
        ? '¡Cuenta creada! Tu acceso con código ya está activo.'
        : postPurchaseUi
          ? '¡Cuenta creada! Si Hotmart ya confirmó el pago, tu kit se libera en minutos.'
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
