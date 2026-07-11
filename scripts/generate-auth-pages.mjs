import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const SITE_URL = 'https://paletasparawhatsapp.vercel.app';

const POSTRES = {
  id: 'postres',
  name: 'Postres en Vaso',
  accent: '#EC3F7A',
  emoji: '🍨',
  ogImage: `${SITE_URL}/postres/postre-fresa.webp`,
  registerTitle: 'Crear cuenta | Postres en Vaso',
  loginTitle: 'Entrar | Postres en Vaso',
  registerDesc:
    'Crea tu cuenta y accede a recetas, calculadora y mensajes para vender postres en vaso por WhatsApp.',
  loginDesc: 'Entra con el correo de tu compra para ver recetas, precios y mensajes de postres en vaso.',
  footerPrice: 'US$6,97',
  footerLp: '/postres',
  logoHref: '/postres',
  loginHref: '/postres/login',
  registerHref: '/postres/cadastrar',
};

function ogBlock({ title, description, image, url }) {
  return `
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Postres en Vaso">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="es_LA">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">`;
}

function buildPostresAuthPage(sourceName, outName, kind) {
  const line = POSTRES;
  const isRegister = kind === 'register';
  const title = isRegister ? line.registerTitle : line.loginTitle;
  const description = isRegister ? line.registerDesc : line.loginDesc;
  const pageUrl = `${SITE_URL}${isRegister ? line.registerHref : line.loginHref}`;

  let html = readFileSync(resolve(ROOT, sourceName), 'utf8');

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="theme-color" content="[^"]*">/,
    `<meta name="theme-color" content="${line.accent}">`
  );
  html = html.replace('</head>', `${ogBlock({ title, description, image: line.ogImage, url: pageUrl })}\n</head>`);

  html = html.replace(
    /<body class="([^"]*)">/,
    `<body class="$1" data-auth-line="${line.id}">`
  );

  html = html.replace('<span>Paletas para WhatsApp</span>', `<span>${line.name}</span>`);
  html = html.replace(
    /<a href="\/" class="auth-logo">/,
    `<a href="${line.logoHref}" class="auth-logo">`
  );
  html = html.replace(
    /<div class="auth-card-icon"[^>]*>🍓<\/div>/,
    `<div class="auth-card-icon" aria-hidden="true">${line.emoji}</div>`
  );

  if (isRegister) {
    html = html.replace(
      '<p class="auth-sub">Usa el mismo correo con el que compraste. Liberamos tu acceso en minutos.</p>',
      '<p class="auth-sub">Usa el mismo correo con el que compraste Postres en Vaso. Liberamos tu acceso en minutos.</p>'
    );
    html = html.replace(
      '<p class="form-hint">Te avisaremos por correo cuando tu kit esté listo.</p>',
      '<p class="form-hint">Te avisaremos por correo cuando tu kit de postres esté listo.</p>'
    );
    html = html.replace('<a href="/login">Entrar</a>', `<a href="${line.loginHref}">Entrar</a>`);
  } else {
    html = html.replace(
      '<p class="auth-sub">Entra con el correo y contraseña de tu cuenta.</p>',
      '<p class="auth-sub">Entra con el correo de tu compra para ver recetas, precios y mensajes de postres.</p>'
    );
    html = html.replace(
      '<a href="/cadastrar">Crear cuenta</a>',
      `<a href="${line.registerHref}">Crear cuenta</a>`
    );
  }

  html = html.replace(
    /<p>¿Aún no compraste\? <a href="[^"]*">Ver kit · US\$ [0-9]+,[0-9]{2}<\/a><\/p>/,
    `<p>¿Aún no compraste? <a href="${line.footerLp}">Ver kit Postres · ${line.footerPrice}</a></p>`
  );

  writeFileSync(resolve(ROOT, outName), html);
  console.log(`wrote ${outName}`);
}

buildPostresAuthPage('cadastrar.html', 'cadastrar-postres.html', 'register');
buildPostresAuthPage('login.html', 'login-postres.html', 'login');
