const SITE_URL = process.env.SITE_URL || 'https://paletasparawhatsapp.vercel.app';

export function buildWelcomeEmailHtml(name, siteUrl = SITE_URL, { line = 'paletas' } = {}) {
  const greeting = name ? `Hola ${name},` : 'Hola,';
  const isPostres = line === 'postres';
  const accessUrl = isPostres
    ? `${siteUrl}/postres/cadastrar?compra=1&line=postres`
    : `${siteUrl}/acesso`;
  const appUrl = isPostres
    ? `${siteUrl}/app?compra=1&line=postres&postres=1`
    : `${siteUrl}/app?compra=1`;
  const membrosUrl = `${siteUrl}/membros`;
  const emoji = isPostres ? '🍨' : '🍓';
  const title = isPostres ? '¡Tu kit de Postres está listo!' : '¡Tu kit está listo!';
  const accent = isPostres ? '#EC3F7A' : '#ff4f8b';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff8f3;font-family:Nunito,Segoe UI,sans-serif;color:#3d2218;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <tr><td style="text-align:center;padding-bottom:16px;">
      <span style="display:inline-block;background:#ffe8f0;color:${accent};font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Acceso liberado</span>
      <h1 style="font-size:24px;margin:16px 0 8px;">${title} ${emoji}</h1>
      <p style="font-size:15px;color:#7a655c;line-height:1.5;margin:0;">${greeting} ya puedes usar la calculadora, recetas y mensajes.</p>
    </td></tr>
    <tr><td style="background:#fff;border-radius:16px;padding:20px;border:1px solid rgba(92,46,31,0.1);">
      <p style="font-size:14px;line-height:1.5;margin:0 0 16px;">Entra con el mismo correo de tu cuenta:</p>
      <p style="text-align:center;margin:0 0 8px;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,${accent},#ff7a1a);color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 28px;border-radius:999px;">Abrir calculadora y recetas →</a>
      </p>
      <p style="font-size:12px;color:#7a655c;text-align:center;margin:12px 0 0;">Si no has iniciado sesión: <a href="${accessUrl}" style="color:${accent};font-weight:700;">crear acceso aquí</a></p>
    </td></tr>
    <tr><td style="height:12px;"></td></tr>
    <tr><td style="background:#fff;border-radius:16px;padding:20px;border:1px solid rgba(92,46,31,0.1);">
      <p style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#ff7a1a;margin:0 0 12px;">Empieza en 3 pasos</p>
      <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#5c2e1f;">
        <li>Modo rápido en <strong>Precios</strong></li>
        <li>Elige 3 recetas</li>
        <li>Copia mensajes en <strong>Vender</strong></li>
      </ol>
      <p style="text-align:center;margin:16px 0 0;font-size:13px;"><a href="${membrosUrl}" style="color:${accent};font-weight:700;">Descargar PDFs del kit</a></p>
    </td></tr>
    <tr><td style="padding:20px 8px;text-align:center;font-size:12px;color:#7a655c;">¿Dudas? Responde este correo.</td></tr>
  </table>
</body>
</html>`;
}
