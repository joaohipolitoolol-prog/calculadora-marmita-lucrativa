import { WHATSAPP_NUMBER_ID, WHATSAPP_SUPPORT_LINK, MAIN_PRICE } from '../landing/config.js';
import { MAIN_PRICE as POSTRES_PRICE, PRODUCT_NAME as POSTRES_NAME } from '../postres/config.js';
import { UPSELL_PRICE_USD as PALETAS_PREMIUM_PRICE } from '../upsell/config.js';
import { UPSELL_PRICE_USD as POSTRES_PREMIUM_PRICE } from '../postres-upsell/config.js';
import { register, guardAuthPage } from '../lib/auth.js';
import { BRAND_KIT } from '../site/brand.js';
import { trackMetaPurchaseOnce, hasCheckoutPending, clearCheckoutPending, hasMetaPurchaseFired } from '../lib/meta-pixel.js';
import { purchaseFlagsFromSearch } from '../lib/purchase-flags.js';
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
const purchaseFlags = purchaseFlagsFromSearch(window.location.search);

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

if (purchaseFlags && purchaseBanner) {
  purchaseBanner.hidden = false;
  purchaseBanner.textContent = `✓ Compra ${authLine.short} confirmada`;
  const sub = document.querySelector('.auth-sub');
  if (sub) {
    sub.textContent = `Usa el mismo correo con el que compraste ${authLine.short}. Liberamos tu acceso en minutos.`;
  }
}

function shouldFireRegisterPurchase(line) {
  // Mesma regra do thank-you: só após clique em checkout neste browser.
  // Link ?compra=1&src=hotmart sozinho NÃO dispara Purchase no Meta.
  return hasCheckoutPending(line);
}

const firePaletasPurchase = shouldFireRegisterPurchase('paletas');
const firePostresPurchase = shouldFireRegisterPurchase('postres');

if (purchaseFlags?.hasKit && firePaletasPurchase) {
  trackMetaPurchaseOnce({
    value: MAIN_PRICE,
    contentName: BRAND_KIT,
    contentIds: ['paletas_kit'],
  });
}
if (purchaseFlags?.hasPostres && firePostresPurchase) {
  trackMetaPurchaseOnce({
    value: POSTRES_PRICE,
    contentName: POSTRES_NAME,
    contentIds: ['postres_kit'],
  });
}
if (purchaseFlags?.hasPremium) {
  if (firePaletasPurchase) {
    trackMetaPurchaseOnce({
      value: PALETAS_PREMIUM_PRICE,
      contentName: 'Pack Premium Paletas',
      contentIds: ['paletas_premium'],
    });
  }
  localStorage.setItem('kit_premium_paletas_v1', '1');
  localStorage.setItem('paletas_premium', '1');
}
if (purchaseFlags?.hasPostresPremium) {
  if (firePostresPurchase) {
    trackMetaPurchaseOnce({
      value: POSTRES_PREMIUM_PRICE,
      contentName: 'Pack Premium Postres',
      contentIds: ['postres_premium'],
    });
  }
  localStorage.setItem('kit_premium_postres_v1', '1');
}

// Clear pending only after a Purchase was recorded (or already fired this browser).
// Avoid clearing when fbq was missing / track failed — keeps upsell recovery path.
if (
  firePaletasPurchase &&
  (purchaseFlags?.hasKit || purchaseFlags?.hasPremium) &&
  (hasMetaPurchaseFired(['paletas_kit']) || hasMetaPurchaseFired(['paletas_premium']))
) {
  clearCheckoutPending('paletas');
}
if (
  firePostresPurchase &&
  (purchaseFlags?.hasPostres || purchaseFlags?.hasPostresPremium) &&
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
    const bought = Boolean(purchaseFlags) || Boolean(accessCode);
    showAlert(
      formAlert,
      bought
        ? '¡Cuenta creada! Tu kit ya está activo. Entra y empieza a usar.'
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
