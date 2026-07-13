/**
 * Single source of truth for transactional purchase emails.
 * Used by Resend (server) AND admin preview/copy (client).
 *
 * Products: paletas_kit | paletas_premium | postres_kit | postres_premium
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

const PRODUCT_META = {
  paletas_kit: {
    line: 'paletas',
    tier: 'kit',
    labelKey: 'emails.paletasKit',
    accent: '#E8437A',
    accentDeep: '#C2185B',
    productName: BRAND_KIT,
    brandLine: BRAND_NAME,
    badge: 'Pago confirmado',
    title: 'Tu kit ya está listo',
    subtitle: 'Recetas, precios y mensajes para vender por WhatsApp — empieza hoy.',
    hero: '/paletas/authority-mujer-paletas.png',
    heroAlt: 'Emprendedora vendiendo paletas por WhatsApp',
    thumbs: [
      { src: '/paletas/kit-inside-cards.png', label: 'Calculadora' },
      { src: '/paletas/authority-mujer-paletas.png', label: 'Recetas' },
      { src: '/icons/icon-192.png', label: 'Mensajes' },
    ],
    features: [
      { title: 'Precios claros', body: 'Calcula costo y ganancia sin adivinar' },
      { title: 'Recetas listas', body: 'Sabores atractivos y fáciles de repetir' },
      { title: 'Mensajes WA', body: 'Copia, pega y publica tu menú' },
    ],
  },
  paletas_premium: {
    line: 'paletas',
    tier: 'premium',
    labelKey: 'emails.paletasPremium',
    accent: '#D97706',
    accentDeep: '#B45309',
    productName: 'Paletas Premium + Combos',
    brandLine: BRAND_NAME,
    badge: 'Premium activado',
    title: 'Tu Premium ya está activo',
    subtitle: '20 recetas premium y combos rentables ya están en tu acceso.',
    hero: '/paletas/kit-inside-cards.png',
    heroAlt: 'Contenido premium del kit de paletas',
    thumbs: [],
    features: [
      { title: '20 premium', body: 'Recetas extras en la pestaña Recetas' },
      { title: 'Combos', body: 'Packs listos en Vender → Combos' },
      { title: 'Mismo acceso', body: 'Entra con el correo de la compra' },
    ],
  },
  postres_kit: {
    line: 'postres',
    tier: 'kit',
    labelKey: 'emails.postresKit',
    accent: '#EC3F7A',
    accentDeep: '#BE185D',
    productName: 'Kit Postres en Vaso',
    brandLine: 'Postres en Vaso',
    badge: 'Pago confirmado',
    title: 'Tu kit de Postres está listo',
    subtitle: 'Recetas en vaso, precios y mensajes para vender por WhatsApp.',
    hero: '/postres/hero-variedad-postres.png',
    heroAlt: 'Variedad de postres en vaso',
    thumbs: [
      { src: '/postres/postre-fresa.png', label: 'Fresa' },
      { src: '/postres/postre-oreo.png', label: 'Oreo' },
      { src: '/postres/postre-chocolate.png', label: 'Chocolate' },
    ],
    features: [
      { title: 'Recetas en vaso', body: 'Presentación lista para fotografiar' },
      { title: 'Precios', body: 'Calcula ganancia por porción' },
      { title: 'WhatsApp', body: 'Mensajes listos para pedir' },
    ],
  },
  postres_premium: {
    line: 'postres',
    tier: 'premium',
    labelKey: 'emails.postresPremium',
    accent: '#EC3F7A',
    accentDeep: '#BE185D',
    productName: 'Postres Premium',
    brandLine: 'Postres en Vaso',
    badge: 'Premium activado',
    title: 'Tu Premium de Postres está activo',
    subtitle: 'El contenido premium ya está incluido en tu acceso.',
    hero: '/postres/upsell-postres-premium.png',
    heroAlt: 'Postres premium en vaso',
    thumbs: [],
    features: [
      { title: 'Más recetas', body: 'Opciones premium dentro de la app' },
      { title: 'Combos', body: 'Ideas listas para vender más' },
      { title: 'Mismo acceso', body: 'Entra con el correo de la compra' },
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
      membros: `${siteUrl}/membros`,
    };
  }
  if (isPostres) {
    return {
      access: `${siteUrl}/postres/cadastrar?compra=1&src=email&line=postres&postres=1`,
      register: `${siteUrl}/postres/cadastrar?compra=1&src=email&line=postres&postres=1`,
      app: `${siteUrl}/app?compra=1&src=email&line=postres&postres=1`,
      membros: `${siteUrl}/membros`,
    };
  }
  if (isPremium) {
    return {
      access: `${siteUrl}/app?compra=1&premium=1&src=email&line=paletas`,
      register: `${siteUrl}/cadastrar?compra=1&premium=1&src=email&line=paletas`,
      app: `${siteUrl}/app?compra=1&premium=1&src=email&line=paletas`,
      membros: `${siteUrl}/membros`,
    };
  }
  return {
    access: `${siteUrl}/cadastrar?compra=1&src=email&line=paletas`,
    register: `${siteUrl}/cadastrar?compra=1&src=email&line=paletas`,
    app: `${siteUrl}/app?compra=1&src=email&line=paletas`,
    membros: `${siteUrl}/membros`,
  };
}

function stepsFor(product) {
  const meta = PRODUCT_META[product];
  if (meta.tier === 'premium') {
    return meta.line === 'postres'
      ? [
          'Entra a la app con el mismo correo de la compra',
          'Abre Recetas y mira las opciones premium',
          'Usa los mensajes listos para vender',
        ]
      : [
          'Entra a la app con el mismo correo de la compra',
          'Ve a Recetas → 20 premium',
          'En Vender → abre Combos rentables',
        ];
  }
  return [
    'Crea tu cuenta con el correo de esta compra',
    'Entra a la app y calcula tus primeros precios',
    'Elige 3 recetas y copia un mensaje para WhatsApp',
  ];
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
  const logoUrl = `${base}/icons/icon-192.png`;
  const heroUrl = `${base}${meta.hero}`;
  const waId = defaultNumberIdForLine(meta.line, 'support');
  const waUrl = getWhatsAppUrl(waId, waMessage(product));
  const steps = stepsFor(product);
  const primaryHref = meta.tier === 'premium' ? links.app : links.access;
  const isPremium = meta.tier === 'premium';

  const subject = isPremium
    ? meta.line === 'postres'
      ? 'Tu Postres Premium está activo — entra aquí'
      : 'Tu Paletas Premium está activo — entra aquí'
    : meta.line === 'postres'
      ? 'Tu Kit Postres está listo — crea tu acceso'
      : `Tu ${BRAND_KIT} está listo — crea tu acceso`;

  const plain = [
    `${greeting}`,
    '',
    isPremium
      ? `Tu compra de ${meta.productName} ya está activada.`
      : `Gracias por tu compra de ${meta.productName}.`,
    '',
    'IMPORTANTE: el acceso NO está dentro de Hotmart. Es en nuestra app.',
    '',
    `${isPremium ? 'Entra aquí' : 'Crea tu acceso'}: ${primaryHref}`,
    isPremium ? `¿Primera vez? ${links.register}` : `¿Ya tienes cuenta? ${links.app}`,
    '',
    'Pasos:',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    `WhatsApp: ${waUrl}`,
    '',
    `— ${meta.brandLine}`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');

  const thumbs = meta.thumbs || [];
  const thumbsHtml =
    thumbs.length === 3
      ? `
          <tr>
            <td style="padding:0 24px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${thumbs
                    .map(
                      (th) => `
                  <td width="33.33%" style="padding:4px;vertical-align:top;text-align:center;">
                    <img src="${base}${th.src}" width="150" alt="${esc(th.label)}" style="display:block;width:100%;max-width:150px;height:96px;object-fit:cover;border:0;border-radius:12px;margin:0 auto;">
                    <p style="margin:8px 0 0;font-size:11px;font-weight:700;color:#8a746a;letter-spacing:0.04em;text-transform:uppercase;">${esc(th.label)}</p>
                  </td>`
                    )
                    .join('')}
                </tr>
              </table>
            </td>
          </tr>`
      : '';

  const featuresHtml = `
          <tr>
            <td style="padding:8px 24px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;border-radius:16px;">
                <tr>
                  <td style="padding:18px 16px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${meta.accent};">Qué incluye</p>
                    ${meta.features
                      .map(
                        (f, i) => `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${i < meta.features.length - 1 ? 'margin-bottom:12px;' : ''}">
                      <tr>
                        <td width="28" valign="top" style="padding-top:2px;">
                          <span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;border-radius:999px;background:${meta.accent};color:#fff;font-size:11px;font-weight:800;">${i + 1}</span>
                        </td>
                        <td style="padding-left:8px;">
                          <p style="margin:0;font-size:14px;font-weight:800;color:#2A1810;line-height:1.3;">${esc(f.title)}</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#7A655C;line-height:1.4;">${esc(f.body)}</p>
                        </td>
                      </tr>
                    </table>`
                      )
                      .join('')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  const stepsHtml = steps
    .map(
      (s, i) => `
                    <tr>
                      <td style="padding:0 0 10px;font-size:14px;line-height:1.45;color:#4A342C;">
                        <strong style="color:${meta.accent};">${i + 1}.</strong> ${esc(s)}
                      </td>
                    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${esc(subject)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F3EEE8;font-family:Georgia,'Times New Roman',serif;color:#2A1810;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${esc(meta.subtitle)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3EEE8;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:4px;overflow:hidden;border:1px solid #E8DFD6;">

          <!-- Brand bar -->
          <tr>
            <td style="background:${meta.accentDeep};padding:14px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${logoUrl}" width="36" height="36" alt="" style="display:inline-block;border:0;border-radius:8px;vertical-align:middle;">
                    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#FFFFFF;">
                      ${esc(meta.brandLine)}
                    </span>
                  </td>
                  <td align="right" style="vertical-align:middle;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                    ${esc(meta.badge)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Full-bleed hero -->
          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <img src="${heroUrl}" width="560" alt="${esc(meta.heroAlt)}" style="display:block;width:100%;max-width:560px;height:auto;border:0;">
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding:28px 28px 8px;text-align:left;">
              <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#7A655C;">
                ${greeting}
              </p>
              <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:700;color:#1F120C;letter-spacing:-0.02em;">
                ${esc(meta.title)}
              </h1>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#5C473E;">
                ${esc(meta.subtitle)}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:20px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="border-radius:4px;background:${meta.accentDeep};">
                    <a href="${primaryHref}" style="display:block;padding:16px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:#FFFFFF;text-decoration:none;letter-spacing:0.01em;">
                      ${esc(ctaLabel(product))} →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#8A746A;">
                ${
                  isPremium
                    ? `¿Primera vez? <a href="${links.register}" style="color:${meta.accentDeep};font-weight:700;text-decoration:underline;">Crea tu cuenta</a>`
                    : `Usa el <strong>mismo correo</strong> de la compra · <a href="${links.app}" style="color:${meta.accentDeep};font-weight:700;text-decoration:underline;">Ya tengo cuenta</a>`
                }
              </p>
            </td>
          </tr>

          <!-- Hotmart note — quiet -->
          <tr>
            <td style="padding:12px 28px 4px;">
              <p style="margin:0;padding:12px 14px;background:#FFF8F0;border-left:3px solid ${meta.accent};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#5C473E;">
                El acceso <strong>no está en Hotmart</strong>. Entra por el botón de arriba a nuestra app.
              </p>
            </td>
          </tr>

          ${thumbsHtml}
          ${featuresHtml}

          <!-- Steps -->
          <tr>
            <td style="padding:16px 28px 8px;">
              <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${meta.accent};">
                Empieza en 3 pasos
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                ${stepsHtml}
              </table>
            </td>
          </tr>

          <!-- WhatsApp -->
          <tr>
            <td style="padding:12px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:4px;border:1px solid #BBF7D0;">
                <tr>
                  <td style="padding:18px 16px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                    <p style="margin:0 0 12px;font-size:13px;line-height:1.45;color:#166534;">
                      ¿Dudas con el acceso? Te ayudamos por WhatsApp.
                    </p>
                    <a href="${waUrl}" style="display:inline-block;background:#16A34A;color:#FFFFFF;text-decoration:none;font-weight:800;font-size:13px;padding:11px 20px;border-radius:4px;">
                      Escribir por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 28px 24px;border-top:1px solid #F0E8E0;">
              <p style="margin:18px 0 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.55;color:#A09086;">
                Puedes responder este correo.<br>
                ${esc(meta.brandLine)} · Email de compra
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
  };
}

/** Catalog for admin UI */
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
    };
  });
}

/** Back-compat aliases */
export function welcomeEmailSubject(line = 'paletas', tier = 'kit') {
  return buildTransactionalEmail('', DEFAULT_SITE, { line, tier }).subject;
}

export function buildWelcomeEmailHtml(name, siteUrl = DEFAULT_SITE, opts = {}) {
  return buildTransactionalEmail(name, siteUrl, opts).html;
}

export function buildWelcomeEmailPlain(name, siteUrl = DEFAULT_SITE, opts = {}) {
  return buildTransactionalEmail(name, siteUrl, opts).plain;
}
