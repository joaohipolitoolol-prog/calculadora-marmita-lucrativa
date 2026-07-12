import {
  KIWIFY_EMAIL_KIT,
  KIWIFY_EMAIL_PREMIUM,
  KIWIFY_URLS,
  kiwifyKitEmailHtml,
  kiwifyPremiumEmailHtml,
} from '../kiwify/email-templates.js';
import { BRAND_KIT } from '../site/brand.js';
import { SITE_URL } from '../site/config.js';

const WEBHOOK_URL = `${SITE_URL}/api/webhooks/hotmart`;

function postresWelcomeHtml() {
  const accessUrl = `${SITE_URL}/postres/cadastrar?compra=1&src=email&line=postres&postres=1`;
  const appUrl = `${SITE_URL}/app?compra=1&src=email&line=postres&postres=1`;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff8f3;font-family:Nunito,Segoe UI,sans-serif;color:#3d2218;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <tr><td style="text-align:center;padding-bottom:16px;">
      <span style="display:inline-block;background:#ffe8f0;color:#EC3F7A;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Compra confirmada</span>
      <h1 style="font-size:24px;margin:16px 0 8px;">¡Tu kit de Postres está listo! 🍨</h1>
      <p style="font-size:15px;color:#7a655c;line-height:1.5;margin:0;">Gracias por tu compra de <strong>Kit Postres en Vaso</strong>.</p>
    </td></tr>
    <tr><td style="background:#fff3e8;border-radius:16px;padding:16px 20px;border:1px solid rgba(255,122,26,0.25);">
      <p style="font-size:14px;line-height:1.55;margin:0;color:#5c2e1f;">
        <strong>Importante:</strong> tu producto <u>no está dentro de Hotmart</u>.
        El acceso es en nuestra app. Crea tu cuenta con el mismo correo de la compra.
      </p>
    </td></tr>
    <tr><td style="height:12px;"></td></tr>
    <tr><td style="background:#fff;border-radius:16px;padding:20px;border:1px solid rgba(92,46,31,0.1);text-align:center;">
      <p style="font-size:14px;line-height:1.5;margin:0 0 16px;">Pulsa el botón y crea tu acceso en menos de 1 minuto:</p>
      <a href="${accessUrl}" style="display:inline-block;background:linear-gradient(135deg,#EC3F7A,#ff7a1a);color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 28px;border-radius:999px;">Crear mi acceso →</a>
      <p style="font-size:12px;color:#7a655c;margin:12px 0 0;">
        ¿Ya tienes cuenta? <a href="${appUrl}" style="color:#EC3F7A;font-weight:700;">Abrir la app</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

export const EMAIL_TEMPLATES = {
  paletas_kit: {
    id: 'paletas_kit',
    line: 'paletas',
    labelKey: 'emails.paletasKit',
    subject: KIWIFY_EMAIL_KIT.subject,
    plain: KIWIFY_EMAIL_KIT.plain,
    html: () => kiwifyKitEmailHtml(),
  },
  paletas_premium: {
    id: 'paletas_premium',
    line: 'paletas',
    labelKey: 'emails.paletasPremium',
    subject: KIWIFY_EMAIL_PREMIUM.subject,
    plain: KIWIFY_EMAIL_PREMIUM.plain,
    html: () => kiwifyPremiumEmailHtml(),
  },
  postres_kit: {
    id: 'postres_kit',
    line: 'postres',
    labelKey: 'emails.postresKit',
    subject: 'Tu Kit Postres en Vaso está listo — crea tu acceso aquí 🍨',
    plain: `¡Hola!

Gracias por tu compra del Kit Postres en Vaso.

PASO 1 — Crea tu cuenta
${SITE_URL}/postres/cadastrar?compra=1&src=email&line=postres&postres=1

Usa el mismo correo de esta compra.

PASO 2 — Entra a la app
${SITE_URL}/app?compra=1&src=email&line=postres&postres=1

¿Dudas? Responde este correo.

— Postres en Vaso`,
    html: () => postresWelcomeHtml(),
  },
};

export const HOTMART_WEBHOOK_URL = WEBHOOK_URL;
export { KIWIFY_URLS, BRAND_KIT };
