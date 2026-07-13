/**
 * Transactional purchase emails — single source for Resend + admin preview.
 * One job: confirm purchase → one photo → one CTA to access.
 */

import { getWhatsAppUrl, defaultNumberIdForLine } from './whatsapp-numbers.js';
import { BRAND_KIT, BRAND_NAME } from '../site/brand.js';
import { SITE_URL as DEFAULT_SITE } from '../site/config.js';

export const EMAIL_PRODUCTS = [
  'paletas_kit',
  'paletas_premium',
  'postres_kit',
  'postres_premium',
];

/** Stack that looks good even when web fonts are stripped. */
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const PRODUCT_META = {
  paletas_kit: {
    line: 'paletas',
    tier: 'kit',
    labelKey: 'emails.paletasKit',
    accent: '#D94878',
    ink: '#2A1A1E',
    muted: '#6E5A61',
    lineSoft: '#EFE4E8',
    productName: BRAND_KIT,
    brandLine: BRAND_NAME,
    badge: 'Compra confirmada',
    title: 'Tu acceso ya está listo',
    lead:
      'Recetas, precios y mensajes listos para vender paletas por WhatsApp. Entra con el mismo correo de la compra.',
    hero: '/email/paletas-variedad.jpg',
    heroAlt: 'Paletas de mango, fresa y chocolate listas para vender',
    bullets: [
      'Calculadora de costo, precio y ganancia',
      'Recetas claras para empezar hoy',
      'Mensajes listos para copiar a WhatsApp',
    ],
  },
  paletas_premium: {
    line: 'paletas',
    tier: 'premium',
    labelKey: 'emails.paletasPremium',
    accent: '#D94878',
    ink: '#2A1A1E',
    muted: '#6E5A61',
    lineSoft: '#EFE4E8',
    productName: 'Paletas Premium',
    brandLine: BRAND_NAME,
    badge: 'Premium activado',
    title: 'Tu Premium ya está activo',
    lead:
      'Las 20 recetas premium y los combos rentables ya están en tu acceso. Ábrelo con el mismo correo de la compra.',
    hero: '/email/paletas-resultado.jpg',
    heroAlt: 'Paletas gourmet listas para fotografiar y vender',
    bullets: [
      '20 recetas premium dentro de la app',
      'Combos rentables en Vender',
      'Mismo correo de la compra',
    ],
  },
  postres_kit: {
    line: 'postres',
    tier: 'kit',
    labelKey: 'emails.postresKit',
    accent: '#D94878',
    ink: '#2A1A1E',
    muted: '#6E5A61',
    lineSoft: '#EFE4E8',
    productName: 'Kit Postres en Vaso',
    brandLine: 'Postres en Vaso',
    badge: 'Compra confirmada',
    title: 'Tu acceso ya está listo',
    lead:
      'Recetas en vaso, precios y mensajes para vender por WhatsApp. Entra con el mismo correo de la compra.',
    hero: '/email/postres-hero.jpg',
    heroAlt: 'Postres en vaso — fresa, oreo y chocolate',
    bullets: [
      'Recetas en vaso listas para fotografiar',
      'Calcula ganancia por porción',
      'Mensajes listos para WhatsApp',
    ],
  },
  postres_premium: {
    line: 'postres',
    tier: 'premium',
    labelKey: 'emails.postresPremium',
    accent: '#D94878',
    ink: '#2A1A1E',
    muted: '#6E5A61',
    lineSoft: '#EFE4E8',
    productName: 'Postres Premium',
    brandLine: 'Postres en Vaso',
    badge: 'Premium activado',
    title: 'Tu Premium ya está activo',
    lead:
      'El contenido premium ya está incluido en tu acceso. Ábrelo con el mismo correo de la compra.',
    hero: '/email/postres-premium.jpg',
    heroAlt: 'Postres premium en vaso',
    bullets: [
      'Más recetas dentro de la app',
      'Ideas listas para vender más',
      'Mismo correo de la compra',
    ],
  },
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function normalizeEmailProduct(input = {}) {
  const raw = String(input.product || input.productId || '').trim();
  if (EMAIL_PRODUCTS.includes(raw)) return raw;

  const line = String(input.line || 'paletas').toLowerCase();
  const tier = String(input.tier || 'kit').toLowerCase();
  if (line === 'postres' && tier === 'premium') return 'postres_premium';
  if (line === 'postres') return 'postres_kit';
  if (tier === 'premium' || tier === 'upsell') return 'paletas_premium';
  return 'paletas_kit';
}

function linksFor(product, siteUrl) {
  const meta = PRODUCT_META[product];
  const isPostres = meta.line === 'postres';
  const isPremium = meta.tier === 'premium';

  if (isPostres && isPremium) {
    return {
      access: `${siteUrl}/app?compra=1&src=email&line=postres&postres=1&postres_premium=1`,
      register: `${siteUrl}/postres/cadastrar?compra=1&src=email&line=postres&postres=1&postres_premium=1`,
      app: `${siteUrl}/app?compra=1&src=email&line=postres&postres=1&postres_premium=1`,
    };
  }
  if (isPostres) {
    return {
      access: `${siteUrl}/postres/cadastrar?compra=1&src=email&line=postres&postres=1`,
      register: `${siteUrl}/postres/cadastrar?compra=1&src=email&line=postres&postres=1`,
      app: `${siteUrl}/app?compra=1&src=email&line=postres&postres=1`,
    };
  }
  if (isPremium) {
    return {
      access: `${siteUrl}/app?compra=1&premium=1&src=email&line=paletas`,
      register: `${siteUrl}/cadastrar?compra=1&premium=1&src=email&line=paletas`,
      app: `${siteUrl}/app?compra=1&premium=1&src=email&line=paletas`,
    };
  }
  return {
    access: `${siteUrl}/cadastrar?compra=1&src=email&line=paletas`,
    register: `${siteUrl}/cadastrar?compra=1&src=email&line=paletas`,
    app: `${siteUrl}/app?compra=1&src=email&line=paletas`,
  };
}

function ctaLabel(product) {
  return PRODUCT_META[product].tier === 'premium' ? 'Abrir mi acceso' : 'Crear mi acceso';
}

function waMessage(product) {
  const meta = PRODUCT_META[product];
  if (meta.tier === 'premium') {
    return meta.line === 'postres'
      ? 'Hola! Compré el Premium de Postres y necesito ayuda con el acceso.'
      : 'Hola! Compré el Premium de Paletas y necesito ayuda con el acceso.';
  }
  return meta.line === 'postres'
    ? 'Hola! Acabo de comprar el Kit Postres y necesito ayuda para crear mi acceso.'
    : 'Hola! Acabo de comprar el Kit Paletas y necesito ayuda para crear mi acceso.';
}

/**
 * @param {string} [name]
 * @param {string} [siteUrl]
 * @param {{ product?: string, line?: string, tier?: string }} [opts]
 */
export function buildTransactionalEmail(name = '', siteUrl = DEFAULT_SITE, opts = {}) {
  const product = normalizeEmailProduct(opts);
  const meta = PRODUCT_META[product];
  const base = String(siteUrl || DEFAULT_SITE).replace(/\/$/, '');
  const links = linksFor(product, base);
  const firstName = String(name || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `Hola ${esc(firstName)},` : 'Hola,';
  const heroUrl = `${base}${meta.hero}`;
  const waUrl = getWhatsAppUrl(defaultNumberIdForLine(meta.line, 'support'), waMessage(product));
  const primaryHref = meta.tier === 'premium' ? links.app : links.access;
  const isPremium = meta.tier === 'premium';

  const subject = isPremium
    ? `${meta.productName}: tu acceso ya está activo`
    : `${meta.productName}: crea tu acceso`;

  const preheader = isPremium
    ? 'Abre tu acceso con el mismo correo de la compra.'
    : 'Un clic para crear tu cuenta y empezar a vender.';

  const plain = [
    greeting,
    '',
    isPremium
      ? `Tu compra de ${meta.productName} ya está activada.`
      : `Gracias por tu compra de ${meta.productName}.`,
    '',
    meta.lead,
    '',
    'Importante: el acceso es en nuestra app, no dentro de Hotmart.',
    '',
    `${isPremium ? 'Abrir acceso' : 'Crear acceso'}: ${primaryHref}`,
    isPremium ? `Primera vez: ${links.register}` : `Ya tienes cuenta: ${links.app}`,
    '',
    ...meta.bullets.map((b, i) => `${i + 1}. ${b}`),
    '',
    `WhatsApp: ${waUrl}`,
    '',
    `— ${meta.brandLine}`,
  ].join('\n');

  const bulletsHtml = meta.bullets
    .map(
      (b, i) => `
                <tr>
                  <td width="28" valign="top" style="padding:${i === 0 ? '0' : '12px'} 0 0;font-family:${FONT};font-size:16px;line-height:1.45;color:${meta.accent};font-weight:700;">✓</td>
                  <td style="padding:${i === 0 ? '0' : '12px'} 0 0;font-family:${FONT};font-size:15px;line-height:1.45;color:${meta.ink};">
                    ${esc(b)}
                  </td>
                </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${esc(subject)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f0eeed;font-family:${FONT};color:${meta.ink};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;font-size:1px;line-height:1px;">
    ${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0eeed;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-collapse:collapse;border-radius:12px;overflow:hidden;">

          <!-- Brand wordmark (no icon) -->
          <tr>
            <td align="center" style="padding:22px 28px 18px;">
              <p style="margin:0;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${meta.ink};">
                ${esc(meta.brandLine)}
              </p>
            </td>
          </tr>

          <!-- Product photo -->
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <img src="${heroUrl}" width="560" alt="${esc(meta.heroAlt)}" style="display:block;width:100%;max-width:560px;height:auto;border:0;">
            </td>
          </tr>

          <!-- Copy + CTA -->
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0 0 14px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${meta.accent};">
                ${esc(meta.badge)}
              </p>
              <p style="margin:0 0 6px;font-family:${FONT};font-size:15px;line-height:1.4;color:${meta.muted};">
                ${greeting}
              </p>
              <h1 style="margin:0 0 12px;font-family:${FONT};font-size:24px;line-height:1.28;font-weight:700;color:${meta.ink};">
                ${esc(meta.title)}
              </h1>
              <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${meta.muted};">
                ${esc(meta.lead)}
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:22px 28px 6px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="${meta.accent}" style="background:${meta.accent};border-radius:10px;">
                    <a href="${primaryHref}" style="display:inline-block;padding:15px 32px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                      ${esc(ctaLabel(product))}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:10px 28px 4px;">
              <p style="margin:0;text-align:center;font-family:${FONT};font-size:13px;line-height:1.55;color:${meta.muted};">
                ${
                  isPremium
                    ? `¿Primera vez? <a href="${links.register}" style="color:${meta.accent};font-weight:700;text-decoration:underline;">Crea tu cuenta</a>`
                    : `¿Ya tienes cuenta? <a href="${links.app}" style="color:${meta.accent};font-weight:700;text-decoration:underline;">Entra aquí</a>`
                }
              </p>
              <p style="margin:10px 0 0;text-align:center;font-family:${FONT};font-size:12px;line-height:1.5;color:#8a7a80;">
                El acceso es en nuestra app — no dentro de Hotmart.
              </p>
            </td>
          </tr>

          <!-- Includes -->
          <tr>
            <td style="padding:28px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${meta.lineSoft};padding-top:24px;">
                    <p style="margin:0 0 14px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${meta.ink};">
                      Qué incluye
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${bulletsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding:28px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid ${meta.lineSoft};padding-top:22px;text-align:center;">
                    <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:1.5;color:${meta.muted};">
                      ¿Dudas con el acceso?
                    </p>
                    <a href="${waUrl}" style="font-family:${FONT};font-size:14px;font-weight:700;color:#0E7A6B;text-decoration:underline;">
                      Escribir por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 28px 26px;text-align:center;">
              <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.55;color:#9a8b91;">
                Puedes responder este correo.<br>
                ${esc(meta.brandLine)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    product,
    line: meta.line,
    tier: meta.tier,
    labelKey: meta.labelKey,
    subject,
    plain,
    html,
    previewName: name || 'María',
    meta: {
      brandLine: meta.brandLine,
      accent: meta.accent,
      productName: meta.productName,
    },
  };
}

export function listEmailTemplates(siteUrl = DEFAULT_SITE) {
  return EMAIL_PRODUCTS.map((product) => {
    const built = buildTransactionalEmail('María', siteUrl, { product });
    return {
      id: product,
      product,
      line: built.line,
      tier: built.tier,
      labelKey: built.labelKey,
      subject: built.subject,
      plain: built.plain,
      html: built.html,
      meta: built.meta,
    };
  });
}

export function welcomeEmailSubject(line = 'paletas', tier = 'kit') {
  return buildTransactionalEmail('', DEFAULT_SITE, { line, tier }).subject;
}

export function buildWelcomeEmailHtml(name, siteUrl = DEFAULT_SITE, opts = {}) {
  return buildTransactionalEmail(name, siteUrl, opts).html;
}

export function buildWelcomeEmailPlain(name, siteUrl = DEFAULT_SITE, opts = {}) {
  return buildTransactionalEmail(name, siteUrl, opts).plain;
}
