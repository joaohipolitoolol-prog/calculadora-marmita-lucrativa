/**
 * Single source of truth for transactional purchase emails.
 * Used by Resend (server) AND admin preview/copy (client).
 *
 * Products: paletas_kit | paletas_premium | postres_kit | postres_premium
 */

import { getWhatsAppUrl, defaultNumberIdForLine } from './whatsapp-numbers.js';
import { BRAND_KIT, BRAND_NAME, BRAND_SHORT } from '../site/brand.js';
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
    emoji: '🍓',
    accent: '#ff4f8b',
    accent2: '#ff7a1a',
    productName: BRAND_KIT,
    badge: 'Compra confirmada',
    title: '¡Tu kit está listo!',
    hero: '/paletas/kit-inside-cards.png',
    heroAlt: 'Kit Paletas para WhatsApp — recetas, precios y mensajes',
  },
  paletas_premium: {
    line: 'paletas',
    tier: 'premium',
    labelKey: 'emails.paletasPremium',
    emoji: '✨',
    accent: '#d97706',
    accent2: '#ff7a1a',
    productName: 'Paletas Premium + Combos',
    badge: 'Premium activado',
    title: '¡Tu Premium está activo!',
    hero: '/paletas/authority-mujer-paletas.png',
    heroAlt: 'Paletas premium listas para vender',
  },
  postres_kit: {
    line: 'postres',
    tier: 'kit',
    labelKey: 'emails.postresKit',
    emoji: '🍨',
    accent: '#EC3F7A',
    accent2: '#ff7a1a',
    productName: 'Kit Postres en Vaso',
    badge: 'Compra confirmada',
    title: '¡Tu kit de Postres está listo!',
    hero: '/postres/kit-inside-cards.png',
    heroAlt: 'Kit Postres en Vaso — recetas y precios',
  },
  postres_premium: {
    line: 'postres',
    tier: 'premium',
    labelKey: 'emails.postresPremium',
    emoji: '✨',
    accent: '#EC3F7A',
    accent2: '#f59e0b',
    productName: 'Postres Premium',
    badge: 'Premium activado',
    title: '¡Tu Premium de Postres está activo!',
    hero: '/postres/upsell-postres-premium.png',
    heroAlt: 'Postres premium en vaso',
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
          'Usa los combos y mensajes listos para vender',
        ]
      : [
          'Entra a la app con el mismo correo de la compra',
          'Ve a Recetas → 20 premium',
          'En Vender → abre Combos rentables',
        ];
  }
  return meta.line === 'postres'
    ? [
        'Crea tu cuenta con el correo de la compra',
        'Entra a la calculadora y elige 3 recetas',
        'Copia mensajes listos en Vender',
      ]
    : [
        'Crea tu cuenta con el correo de la compra',
        'Calcula precios y elige 3 recetas',
        'Copia mensajes listos en Vender',
      ];
}

function ctaLabel(product) {
  const meta = PRODUCT_META[product];
  if (meta.tier === 'premium') return 'Abrir mi acceso Premium →';
  return 'Crear mi acceso →';
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
  const greeting = name ? `Hola ${esc(name)},` : 'Hola,';
  const logoUrl = `${base}/icons/icon-192.png`;
  const heroUrl = `${base}${meta.hero}`;
  const waId = defaultNumberIdForLine(meta.line, 'support');
  const waUrl = getWhatsAppUrl(waId, waMessage(product));
  const steps = stepsFor(product);
  const primaryHref = meta.tier === 'premium' ? links.app : links.access;
  const isPremium = meta.tier === 'premium';

  const subject = isPremium
    ? meta.line === 'postres'
      ? 'Tu Postres Premium está activo — entra aquí ✨'
      : 'Tu Paletas Premium está activo — entra aquí ✨'
    : meta.line === 'postres'
      ? 'Tu Kit Postres en Vaso está listo — crea tu acceso aquí 🍨'
      : `Tu ${BRAND_KIT} está listo — crea tu acceso aquí 🍓`;

  const plain = [
    `${greeting}`,
    '',
    isPremium
      ? `Tu compra de ${meta.productName} ya está activada.`
      : `Gracias por tu compra de ${meta.productName}.`,
    '',
    'IMPORTANTE: el acceso NO está dentro de Hotmart. Es en nuestra app.',
    '',
    isPremium ? `Entra aquí: ${primaryHref}` : `Crea tu acceso aquí: ${primaryHref}`,
    isPremium ? '' : `¿Ya tienes cuenta? ${links.app}`,
    '',
    'Pasos:',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    `WhatsApp soporte: ${waUrl}`,
    '',
    `— ${BRAND_NAME}`,
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');

  const stepsHtml = steps
    .map(
      (s, i) => `
      <tr>
        <td style="padding:0 0 10px;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:999px;background:${meta.accent};color:#fff;font-size:12px;font-weight:800;">${i + 1}</span>
        </td>
        <td style="padding:0 0 10px 8px;font-size:14px;line-height:1.5;color:#5c2e1f;">${esc(s)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${esc(subject)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#fff5f0;font-family:'Nunito',Segoe UI,Helvetica,Arial,sans-serif;color:#3d2218;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${isPremium ? 'Tu complemento ya está en tu acceso.' : 'Crea tu cuenta y entra al kit en menos de 1 minuto.'}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid rgba(92,46,31,0.08);box-shadow:0 8px 28px rgba(61,34,24,0.08);">

          <!-- Header / logo -->
          <tr>
            <td style="padding:22px 24px 8px;text-align:center;background:linear-gradient(180deg,#fff8f3 0%,#ffffff 100%);">
              <img src="${logoUrl}" width="56" height="56" alt="${esc(BRAND_SHORT)}" style="display:inline-block;border:0;border-radius:14px;">
              <p style="margin:10px 0 0;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${meta.accent};">
                ${esc(meta.line === 'postres' ? 'Postres en Vaso' : BRAND_NAME)}
              </p>
            </td>
          </tr>

          <!-- Hero image -->
          <tr>
            <td style="padding:8px 16px 0;">
              <img src="${heroUrl}" width="528" alt="${esc(meta.heroAlt)}" style="display:block;width:100%;max-width:528px;height:auto;border:0;border-radius:16px;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:20px 28px 8px;text-align:center;">
              <span style="display:inline-block;background:#ffe8f0;color:${meta.accent};font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:6px 14px;border-radius:999px;">${esc(meta.badge)}</span>
              <h1 style="font-size:26px;line-height:1.25;margin:14px 0 8px;color:#3d2218;font-weight:800;">
                ${esc(meta.title)} ${meta.emoji}
              </h1>
              <p style="font-size:15px;line-height:1.55;margin:0;color:#7a655c;">
                ${greeting} ${
                  isPremium
                    ? `tu <strong style="color:#3d2218;">${esc(meta.productName)}</strong> ya está incluido en tu acceso.`
                    : `gracias por tu compra de <strong style="color:#3d2218;">${esc(meta.productName)}</strong>.`
                }
              </p>
            </td>
          </tr>

          <!-- Important box -->
          <tr>
            <td style="padding:12px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff3e8;border-radius:14px;border:1px solid rgba(255,122,26,0.28);">
                <tr>
                  <td style="padding:14px 16px;font-size:13px;line-height:1.55;color:#5c2e1f;">
                    <strong>Importante:</strong> tu producto <u>no está dentro de Hotmart</u>.
                    El acceso es en nuestra app${isPremium ? ' (mismo correo de la compra)' : '. Crea tu cuenta con el mismo correo de la compra'}.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 24px 4px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:999px;background:linear-gradient(135deg,${meta.accent},${meta.accent2});">
                    <a href="${primaryHref}" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">
                      ${esc(ctaLabel(product))}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#7a655c;margin:14px 0 0;line-height:1.5;">
                ${
                  isPremium
                    ? `¿Primera vez? <a href="${links.register}" style="color:${meta.accent};font-weight:700;text-decoration:none;">Crea tu cuenta aquí</a>`
                    : `¿Ya tienes cuenta? <a href="${links.app}" style="color:${meta.accent};font-weight:700;text-decoration:none;">Abrir la app</a>
                       · <a href="${links.membros}" style="color:${meta.accent};font-weight:700;text-decoration:none;">Descargar PDFs</a>`
                }
              </p>
            </td>
          </tr>

          <!-- Steps -->
          <tr>
            <td style="padding:20px 28px 8px;">
              <p style="font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${meta.accent2};margin:0 0 12px;">
                Empieza en 3 pasos
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${stepsHtml}
              </table>
            </td>
          </tr>

          <!-- WhatsApp -->
          <tr>
            <td style="padding:8px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8fff3;border-radius:14px;border:1px solid rgba(16,140,80,0.22);">
                <tr>
                  <td style="padding:18px 16px;text-align:center;">
                    <p style="font-size:14px;line-height:1.5;margin:0 0 14px;color:#1a5c38;">
                      ¿No encuentras el acceso o tienes dudas? Escríbenos por WhatsApp y te ayudamos al momento.
                    </p>
                    <a href="${waUrl}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:12px 24px;border-radius:999px;">
                      Hablar por WhatsApp →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 24px 24px;text-align:center;font-size:12px;line-height:1.5;color:#9a857c;">
              También puedes responder este correo. Estamos para ayudarte.<br>
              <span style="color:#b5a49c;">${esc(BRAND_NAME)} · Email de compra (transaccional)</span>
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
