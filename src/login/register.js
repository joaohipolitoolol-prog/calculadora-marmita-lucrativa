import { WHATSAPP_NUMBER_ID, WHATSAPP_SUPPORT_LINK, MAIN_PRICE } from '../landing/config.js';
import { MAIN_PRICE as POSTRES_PRICE, PRODUCT_NAME as POSTRES_NAME } from '../postres/config.js';
import { UPSELL_PRICE_USD as PALETAS_PREMIUM_PRICE } from '../upsell/config.js';
import { UPSELL_PRICE_USD as POSTRES_PREMIUM_PRICE } from '../postres-upsell/config.js';
import { register, guardAuthPage } from '../lib/auth.js';
import { BRAND_KIT } from '../site/brand.js';
import { trackMetaPurchaseOnce, hasCheckoutPending, clearCheckoutPending, hasMetaPurchaseFired } from '../lib/meta-pixel.js';
import { purchaseIntentFromSearch, isPostPurchaseUiIntent } from '../lib/purchase-flags.js';
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
const purchaseIntent = purchaseIntentFromSearch(window.location.search);
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

function shouldFireRegisterPurchase(line) {
  // Sólo tras clic a checkout en este browser + intent pós-compra en URL.
  // ?compra=1&src=hotmart solo NO libera kit ni Purchase.
  return hasCheckoutPending(line) && Boolean(purchaseIntent);
}

const firePaletasPurchase = shouldFireRegisterPurchase('paletas');
const firePostresPurchase = shouldFireRegisterPurchase('postres');

if (purchaseIntent?.hasKit && firePaletasPurchase) {
  trackMetaPurchaseOnce({
    value: MAIN_PRICE,
    contentName: BRAND_KIT,
    contentIds: ['paletas_kit'],
  });
}
if (purchaseIntent?.hasPostres && firePostresPurchase) {
  trackMetaPurchaseOnce({
    value: POSTRES_PRICE,
    contentName: POSTRES_NAME,
    contentIds: ['postres_kit'],
  });
}
if (purchaseIntent?.hasPremium) {
  if (firePaletasPurchase) {
    trackMetaPurchaseOnce({
      value: PALETAS_PREMIUM_PRICE,
      contentName: 'Pack Premium Paletas',
      contentIds: ['paletas_premium'],
    });
  }
}
if (purchaseIntent?.hasPostresPremium) {
  if (firePostresPurchase) {
    trackMetaPurchaseOnce({
      value: POSTRES_PREMIUM_PRICE,
      contentName: 'Pack Premium Postres',
      contentIds: ['postres_premium'],
    });
  }
}

// Clear pending only after a Purchase was recorded (or already fired this browser).
if (
  firePaletasPurchase &&
  (purchaseIntent?.hasKit || purchaseIntent?.hasPremium) &&
  (hasMetaPurchaseFired(['paletas_kit']) || hasMetaPurchaseFired(['paletas_premium']))
) {
  clearCheckoutPending('paletas');
}
if (
  firePostresPurchase &&
  (purchaseIntent?.hasPostres || purchaseIntent?.hasPostresPremium) &&
  (hasMetaPurchaseFired(['postres_kit']) || hasMetaPurchaseFired(['postres_premium']))
) {
  clearCheckoutPending('postres');
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
