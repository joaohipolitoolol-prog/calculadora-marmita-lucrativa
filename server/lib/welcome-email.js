import { getWhatsAppUrl, defaultNumberIdForLine } from '../../src/lib/whatsapp-numbers.js';
import { BRAND_KIT } from '../../src/site/brand.js';

const SITE_URL = process.env.SITE_URL || 'https://paletasparawhatsapp.vercel.app';

export function welcomeEmailSubject(line = 'paletas') {
  return line === 'postres'
    ? 'Tu Kit Postres en Vaso está listo — crea tu acceso aquí 🍨'
    : `Tu ${BRAND_KIT} está listo — crea tu acceso aquí 🍓`;
}

export function buildWelcomeEmailHtml(name, siteUrl = SITE_URL, { line = 'paletas' } = {}) {
  const greeting = name ? `Hola ${name},` : 'Hola,';
  const isPostres = line === 'postres';
  const accessUrl = isPostres
    ? `${siteUrl}/postres/cadastrar?compra=1&src=email&line=postres&postres=1`
    : `${siteUrl}/cadastrar?compra=1&src=email&line=paletas`;
  const appUrl = isPostres
    ? `${siteUrl}/app?compra=1&src=email&line=postres&postres=1`
    : `${siteUrl}/app?compra=1&src=email&line=paletas`;
  const membrosUrl = `${siteUrl}/membros`;
  const emoji = isPostres ? '🍨' : '🍓';
  const productName = isPostres ? 'Kit Postres en Vaso' : BRAND_KIT;
  const title = isPostres ? '¡Tu kit de Postres está listo!' : '¡Tu kit está listo!';
  const accent = isPostres ? '#EC3F7A' : '#ff4f8b';
  const waId = defaultNumberIdForLine(line, 'support');
  const waMessage = isPostres
    ? 'Hola! Acabo de comprar el Kit Postres y necesito ayuda para crear mi acceso.'
    : 'Hola! Acabo de comprar el Kit Paletas y necesito ayuda para crear mi acceso.';
  const waUrl = getWhatsAppUrl(waId, waMessage);

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff8f3;font-family:Nunito,Segoe UI,sans-serif;color:#3d2218;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <tr><td style="text-align:center;padding-bottom:16px;">
      <span style="display:inline-block;background:#ffe8f0;color:${accent};font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Compra confirmada</span>
      <h1 style="font-size:24px;margin:16px 0 8px;">${title} ${emoji}</h1>
      <p style="font-size:15px;color:#7a655c;line-height:1.5;margin:0;">${greeting} gracias por tu compra de <strong>${productName}</strong>.</p>
    </td></tr>

    <tr><td style="background:#fff3e8;border-radius:16px;padding:16px 20px;border:1px solid rgba(255,122,26,0.25);margin-bottom:12px;">
      <p style="font-size:14px;line-height:1.55;margin:0;color:#5c2e1f;">
        <strong>Importante:</strong> tu producto <u>no está dentro de Hotmart</u>.
        El acceso es en nuestra app. Crea tu cuenta con el mismo correo de la compra.
      </p>
    </td></tr>

    <tr><td style="height:12px;"></td></tr>

    <tr><td style="background:#fff;border-radius:16px;padding:20px;border:1px solid rgba(92,46,31,0.1);">
      <p style="font-size:14px;line-height:1.5;margin:0 0 16px;text-align:center;">
        Pulsa el botón y crea tu acceso en menos de 1 minuto:
      </p>
      <p style="text-align:center;margin:0 0 8px;">
        <a href="${accessUrl}" style="display:inline-block;background:linear-gradient(135deg,${accent},#ff7a1a);color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 28px;border-radius:999px;">Crear mi acceso →</a>
      </p>
      <p style="font-size:12px;color:#7a655c;text-align:center;margin:12px 0 0;">
        ¿Ya tienes cuenta? <a href="${appUrl}" style="color:${accent};font-weight:700;">Abrir la app</a>
        · <a href="${membrosUrl}" style="color:${accent};font-weight:700;">Descargar PDFs</a>
      </p>
    </td></tr>

    <tr><td style="height:12px;"></td></tr>

    <tr><td style="background:#fff;border-radius:16px;padding:20px;border:1px solid rgba(92,46,31,0.1);">
      <p style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#ff7a1a;margin:0 0 12px;">Empieza en 3 pasos</p>
      <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#5c2e1f;">
        <li>Crea tu cuenta con el correo de la compra</li>
        <li>Entra a la calculadora y elige 3 recetas</li>
        <li>Copia mensajes listos en <strong>Vender</strong></li>
      </ol>
    </td></tr>

    <tr><td style="height:12px;"></td></tr>

    <tr><td style="background:#e8fff3;border-radius:16px;padding:20px;border:1px solid rgba(16,140,80,0.2);text-align:center;">
      <p style="font-size:14px;line-height:1.5;margin:0 0 14px;color:#1a5c38;">
        ¿No encuentras el acceso o tienes dudas? Escríbenos por WhatsApp y te ayudamos al momento.
      </p>
      <a href="${waUrl}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-weight:800;font-size:14px;padding:12px 24px;border-radius:999px;">Hablar por WhatsApp →</a>
    </td></tr>

    <tr><td style="padding:20px 8px;text-align:center;font-size:12px;color:#7a655c;">
      También puedes responder este correo. Estamos para ayudarte.
    </td></tr>
  </table>
</body>
</html>`;
}
