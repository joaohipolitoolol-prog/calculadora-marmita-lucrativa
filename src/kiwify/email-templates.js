import {
  POST_PURCHASE_UPSELL_URL,
  REGISTER_PATH,
  MEMBERS_PATH,
  SITE_URL,
  UPSELL_PATH,
} from '../site/config.js';
import { BRAND_KIT, BRAND_NAME } from '../site/brand.js';

/** URLs para colar na Kiwify, página de obrigado e emails */
export const KIWIFY_URLS = {
  accessShort: `${SITE_URL}${REGISTER_PATH}?compra=1&src=email`,
  accessPremiumShort: `${SITE_URL}${REGISTER_PATH}?compra=1&premium=1&src=email`,
  loginKit: `${SITE_URL}${REGISTER_PATH}?compra=1&src=email`,
  loginPremium: `${SITE_URL}${REGISTER_PATH}?compra=1&premium=1&src=email`,
  membros: `${SITE_URL}/app?view=files`,
  upsell: POST_PURCHASE_UPSELL_URL,
  upsellPath: `${SITE_URL}${UPSELL_PATH}`,
};

export const KIWIFY_EMAIL_KIT = {
  subject: `Tu ${BRAND_KIT} está listo 🍓`,
  preheader: 'Crea tu cuenta y accede al kit en minutos.',
  plain: `¡Hola!

Gracias por tu compra del ${BRAND_KIT}.

PASO 1, Crea tu cuenta (2 minutos)
${KIWIFY_URLS.accessShort}

Usa el mismo correo de esta compra. Verificamos el pago y liberamos tu acceso en minutos, te avisaremos por email cuando esté listo.

PASO 2, Entra al área de miembros
${KIWIFY_URLS.membros}

Ahí encontrarás PDFs, calculadora, recetas y mensajes para WhatsApp.

¿Primera vez?
1. Modo rápido en Precios → pon costos de tu ciudad
2. Toca "Ver mi ganancia"
3. Abre Recetas y elige 3 sabores
4. En Vender → copia mensajes para WhatsApp

¿Dudas con el acceso? Responde a este correo con tu email de compra., ${BRAND_NAME}
Prepara · Calcula · Publica`,
};

export const KIWIFY_EMAIL_PREMIUM = {
  subject: 'Complemento Premium activado ✨',
  preheader: '20 recetas premium + combos rentables listos.',
  plain: `¡Hola!

Tu complemento Paletas Premium y Combos Rentables ya está incluido en tu acceso.

Entra aquí (usa el mismo correo de compra):
${KIWIFY_URLS.accessPremiumShort}

Dentro del área de miembros encontrarás los PDFs premium y en la app:
• 20 recetas premium (pestaña Recetas → 20 premium)
• 10 combos rentables (pestaña Vender → Combos)

Si aún no creaste tu cuenta del kit principal, el enlace de arriba activa todo junto., ${BRAND_NAME}`,
};

export function kiwifyKitEmailHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff8f3;font-family:Nunito,Segoe UI,sans-serif;color:#3d2218;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <tr><td style="text-align:center;padding-bottom:16px;">
      <span style="display:inline-block;background:#ffe8f0;color:#ff4f8b;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Compra confirmada</span>
      <h1 style="font-size:24px;margin:16px 0 8px;">¡Gracias por tu compra! 🍓</h1>
      <p style="font-size:15px;color:#7a655c;line-height:1.5;margin:0;">Recetas, calculadora de precios y mensajes para vender paletas por WhatsApp.</p>
    </td></tr>
    <tr><td style="background:#fff;border-radius:16px;padding:20px;border:1px solid rgba(92,46,31,0.1);">
      <p style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#ff4f8b;margin:0 0 12px;">Paso 1, Crea tu cuenta</p>
      <p style="font-size:14px;line-height:1.5;margin:0 0 16px;">Usa el mismo correo de esta compra. Verificamos el pago y te avisamos por email cuando el kit esté listo.</p>
      <p style="text-align:center;margin:0 0 8px;">
        <a href="${KIWIFY_URLS.accessShort}" style="display:inline-block;background:linear-gradient(135deg,#ff4f8b,#ff7a1a);color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 28px;border-radius:999px;">Crear mi cuenta →</a>
      </p>
    </td></tr>
    <tr><td style="height:12px;"></td></tr>
    <tr><td style="background:#fff;border-radius:16px;padding:20px;border:1px solid rgba(92,46,31,0.1);">
      <p style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#ff7a1a;margin:0 0 12px;">Paso 2, Empieza en el kit</p>
      <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#5c2e1f;">
        <li>Calcula precios en <strong>modo rápido</strong></li>
        <li>Elige <strong>3 recetas</strong></li>
        <li>Copia mensajes en <strong>Vender</strong></li>
      </ol>
      <p style="text-align:center;margin:16px 0 0;">
        <a href="${KIWIFY_URLS.membros}" style="color:#ff4f8b;font-weight:800;font-size:14px;">Ir al área de miembros</a>
      </p>
    </td></tr>
    <tr><td style="padding:20px 8px;text-align:center;font-size:12px;color:#7a655c;line-height:1.5;">
      PDFs y archivos descargables en <a href="${KIWIFY_URLS.membros}" style="color:#ff4f8b;">tu área de miembros</a>.<br>
      ¿Problemas? Responde este email con tu correo de compra.
    </td></tr>
  </table>
</body>
</html>`;
}

export function kiwifyPremiumEmailHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff8f3;font-family:Nunito,Segoe UI,sans-serif;color:#3d2218;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <tr><td style="text-align:center;">
      <h1 style="font-size:22px;">Complemento Premium activado ✨</h1>
      <p style="color:#7a655c;font-size:14px;line-height:1.5;">20 recetas premium + 10 combos rentables ya están en tu acceso.</p>
      <p style="margin:20px 0;">
        <a href="${KIWIFY_URLS.accessPremiumShort}" style="display:inline-block;background:linear-gradient(135deg,#ffc94a,#ff7a1a);color:#3d2218;text-decoration:none;font-weight:800;padding:14px 28px;border-radius:999px;">Entrar a mi área premium →</a>
      </p>
      <p style="font-size:13px;color:#7a655c;">En la app: <strong>Recetas → 20 premium</strong> y <strong>Vender → Combos</strong>.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Instruções para configurar na Kiwify (painel do produtor) */
export const KIWIFY_SETUP_STEPS = [
  {
    title: 'Página de obrigado (kit principal)',
    path: 'Produto → Página de Obrigado / Upsell',
    value: KIWIFY_URLS.upsell,
    note: 'Cliente vê upsell premium e depois cria a conta.',
  },
  {
    title: 'Email pós-compra (kit)',
    path: 'Produto → Emails → Confirmação de compra',
    value: 'Usar HTML abaixo (sem código de acesso)',
    note: 'Cliente cria conta com o email da compra; você libera manualmente no admin.',
  },
  {
    title: 'Link curto no email',
    path: 'Corpo do email',
    value: KIWIFY_URLS.accessShort,
    note: 'Redireciona para registro com compra confirmada.',
  },
  {
    title: 'Email pós-compra (premium)',
    path: 'Produto upsell → Email de entrega',
    value: KIWIFY_URLS.accessPremiumShort,
    note: 'Para quem compra só o complemento ou kit+premium.',
  },
];
