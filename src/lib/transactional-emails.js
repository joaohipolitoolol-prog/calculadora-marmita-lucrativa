/**
 * Transactional purchase emails — single source for Resend + admin preview.
 * Visual: product photography, soft brand palette, one clear CTA.
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

const FONT =
  "'Nunito',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const PRODUCT_META = {
  paletas_kit: {
    line: 'paletas',
    tier: 'kit',
    labelKey: 'emails.paletasKit',
    accent: '#E8437A',
    accentSoft: '#FFECF3',
    ink: '#3D2228',
    muted: '#6B5560',
    productName: BRAND_KIT,
    brandLine: BRAND_NAME,
    badge: 'Compra confirmada',
    title: 'Tu acceso ya está listo',
    lead: 'Recetas, precios y mensajes para vender paletas por WhatsApp.',
    hero: '/email/paletas-hero.jpg',
    heroAlt: 'Paletas de fresa en vaso listas para vender',
    flavors: [
      { src: '/email/sabor-fresa.jpg', label: 'Fresa' },
      { src: '/email/sabor-mango.jpg', label: 'Mango' },
      { src: '/email/sabor-chocolate.jpg', label: 'Chocolate' },
    ],
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
    accent: '#E8437A',
    accentSoft: '#FFF0F5',
    ink: '#3D2228',
    muted: '#6B5560',
    productName: 'Paletas Premium',
    brandLine: BRAND_NAME,
    badge: 'Premium activado',
    title: 'Tu Premium ya está activo',
    lead: '20 recetas premium y combos rentables ya están en tu acceso.',
    hero: '/email/paletas-resultado.jpg',
    heroAlt: 'Paletas listas para fotografiar y vender',
    flavors: [],
    bullets: [
      '20 recetas premium en la app',
      'Combos rentables en Vender',
      'Mismo correo de la compra',
    ],
  },
  postres_kit: {
    line: 'postres',
    tier: 'kit',
    labelKey: 'emails.postresKit',
    accent: '#EC3F7A',
    accentSoft: '#FFE8F0',
    ink: '#3D2228',
    muted: '#6B5560',
    productName: 'Kit Postres en Vaso',
    brandLine: 'Postres en Vaso',
    badge: 'Compra confirmada',
    title: 'Tu acceso ya está listo',
    lead: 'Recetas en vaso, precios y mensajes para vender por WhatsApp.',
    hero: '/email/postres-hero.jpg',
    heroAlt: 'Postres en vaso — fresa, oreo y chocolate',
    flavors: [
      { src: '/email/postre-fresa.jpg', label: 'Fresa' },
      { src: '/email/postre-oreo.jpg', label: 'Oreo' },
      { src: '/email/postre-chocolate.jpg', label: 'Chocolate' },
    ],
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
    accent: '#EC3F7A',
    accentSoft: '#FFE8F0',
    ink: '#3D2228',
    muted: '#6B5560',
    productName: 'Postres Premium',
    brandLine: 'Postres en Vaso',
    badge: 'Premium activado',
    title: 'Tu Premium ya está activo',
    lead: 'El contenido premium ya está incluido en tu acceso.',
    hero: '/email/postres-premium.jpg',
    heroAlt: 'Postres premium en vaso',
    flavors: [],
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
    ? `${meta.productName} activado — entra a tu acceso`
    : `${meta.productName} — crea tu acceso`;

  const plain = [
    greeting,
    '',
    isPremium
      ? `Tu compra de ${meta.productName} ya está activada.`
      : `Gracias por tu compra de ${meta.productName}.`,
    '',
    meta.lead,
    '',
    'El acceso no está dentro de Hotmart. Entra por nuestra app.',
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

  const flavors = meta.flavors || [];
  const flavorsHtml =
    flavors.length === 3
      ? `
          <tr>
            <td style="padding:28px 24px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${flavors
                    .map(
                      (f) => `
                  <td width="33.33%" align="center" style="padding:0 6px;vertical-align:top;">
                    <img src="${base}${f.src}" width="96" height="96" alt="${esc(f.label)}" style="display:block;width:96px;height:96px;border:0;border-radius:12px;object-fit:cover;margin:0 auto;">
                    <p style="margin:8px 0 0;font-family:${FONT};font-size:12px;font-weight:700;color:${meta.ink};">${esc(f.label)}</p>
                  </td>`
                    )
                    .join('')}
                </tr>
              </table>
            </td>
          </tr>`
      : '';

  const bulletsHtml = meta.bullets
    .map(
      (b, i) => `
                <tr>
                  <td style="padding:${i === 0 ? '0' : '10px'} 0 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${meta.ink};">
                    <span style="color:${meta.accent};font-weight:800;">${i + 1}.</span> ${esc(b)}
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
  <title>${esc(subject)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:${FONT};color:${meta.ink};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;">
    ${esc(meta.lead)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-collapse:collapse;">

          <!-- Brand text only -->
          <tr>
            <td style="padding:28px 24px 12px;text-align:center;border-bottom:1px solid #f0e4ea;">
              <p style="margin:0;font-family:${FONT};font-size:15px;font-weight:800;letter-spacing:0.02em;color:${meta.accent};">
                ${esc(meta.brandLine)}
              </p>
            </td>
          </tr>

          <!-- Hero full bleed -->
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <img src="${heroUrl}" width="600" alt="${esc(meta.heroAlt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 24px 8px;">
              <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${meta.accent};">
                ${esc(meta.badge)}
              </p>
              <p style="margin:0 0 8px;font-family:${FONT};font-size:15px;color:${meta.muted};">
                ${greeting}
              </p>
              <h1 style="margin:0 0 12px;font-family:${FONT};font-size:26px;line-height:1.25;font-weight:800;color:${meta.ink};">
                ${esc(meta.title)}
              </h1>
              <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${meta.muted};">
                ${esc(meta.lead)}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:20px 24px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="${meta.accent}" style="background:${meta.accent};border-radius:8px;">
                    <a href="${primaryHref}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">
                      ${esc(ctaLabel(product))}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;text-align:center;font-family:${FONT};font-size:13px;line-height:1.5;color:${meta.muted};">
                ${
                  isPremium
                    ? `¿Primera vez? <a href="${links.register}" style="color:${meta.accent};font-weight:700;">Crea tu cuenta</a>`
                    : `Usa el mismo correo de la compra · <a href="${links.app}" style="color:${meta.accent};font-weight:700;">Ya tengo cuenta</a>`
                }
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 24px 4px;">
              <p style="margin:0;padding:12px 14px;background:#fff8f3;border:1px solid #f5e6d8;font-family:${FONT};font-size:13px;line-height:1.5;color:#5c473e;">
                El acceso es en nuestra app, <strong>no dentro de Hotmart</strong>. Entra con el botón de arriba.
              </p>
            </td>
          </tr>

          ${flavorsHtml}

          <tr>
            <td style="padding:24px 24px 8px;">
              <p style="margin:0 0 12px;font-family:${FONT};font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${meta.accent};">
                Incluye
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${bulletsHtml}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 24px 32px;text-align:center;border-top:1px solid #f0e4ea;">
              <p style="margin:0 0 10px;font-family:${FONT};font-size:13px;color:${meta.muted};">
                ¿Dudas con el acceso? Escríbenos por WhatsApp.
              </p>
              <a href="${waUrl}" style="font-family:${FONT};font-size:13px;font-weight:800;color:#128C7E;text-decoration:underline;">
                Abrir WhatsApp
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 28px;text-align:center;">
              <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.5;color:#a09086;">
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
