import { SITE_URL } from '../site/config.js';
import { PRODUCT_LINE_BY_ID } from '../lib/product-lines.js';

/** Copy + routes for auth pages per product line. */
export const AUTH_LINE_UI = {
  paletas: {
    registerPath: '/cadastrar',
    loginPath: '/login',
    ogImage: '/paletas/hero-paletas-fresas.webp',
    registerPageTitle: 'Crear cuenta',
    loginPageTitle: 'Entrar',
    metaDescription:
      'Crea tu cuenta y accede a recetas, calculadora y mensajes para vender paletas por WhatsApp.',
    registerSub:
      'Usa el mismo correo con el que compraste Paletas. Liberamos tu acceso en minutos.',
    loginSub: 'Entra con el correo de tu compra para ver recetas, precios y mensajes.',
    footerCta: 'Ver kit',
    kitHint: 'Te avisaremos por correo cuando tu kit de paletas esté listo.',
    purchaseBanner: 'Compra Paletas confirmada',
  },
  postres: {
    registerPath: '/postres/cadastrar',
    loginPath: '/postres/login',
    ogImage: '/minipostres/hero/hero-desire.webp?v=1',
    registerPageTitle: 'Crear cuenta',
    loginPageTitle: 'Entrar',
    metaDescription:
      'Crea tu cuenta y accede al método de 3 bases, calculadora y catálogo de mini postres fríos para WhatsApp.',
    registerSub:
      'Usa el mismo correo con el que compraste Mini Postres. Liberamos tu acceso en minutos.',
    loginSub: 'Entra con el correo de tu compra para ver el método, precios y catálogo.',
    footerCta: 'Ver Mini Postres',
    kitHint: 'Te avisaremos por correo cuando tu acceso a Mini Postres esté listo.',
    purchaseBanner: 'Compra Mini Postres confirmada',
  },
};

export function getAuthBrand(lineOrId) {
  const line =
    typeof lineOrId === 'string' ? PRODUCT_LINE_BY_ID[lineOrId] : lineOrId || PRODUCT_LINE_BY_ID.paletas;
  const ui = AUTH_LINE_UI[line?.id] || AUTH_LINE_UI.paletas;
  return { ...line, ...ui };
}

export function authRegisterPath(lineId = 'paletas', query = {}) {
  const brand = getAuthBrand(lineId);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') params.set(key, String(value));
  }
  if (lineId && !params.has('line')) params.set('line', lineId);
  if (lineId === 'postres' && params.get('compra') === '1' && !params.has('postres')) {
    params.set('postres', '1');
  }
  if (lineId === 'paletas' && params.get('compra') === '1' && !params.has('paletas')) {
    params.set('paletas', '1');
  }
  if (params.get('compra') === '1' && !params.has('src')) {
    params.set('src', 'hotmart');
  }
  const qs = params.toString();
  return qs ? `${brand.registerPath}?${qs}` : brand.registerPath;
}

export function authLoginPath(lineId = 'paletas', query = {}) {
  const brand = getAuthBrand(lineId);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') params.set(key, String(value));
  }
  if (lineId && !params.has('line')) params.set('line', lineId);
  const qs = params.toString();
  return qs ? `${brand.loginPath}?${qs}` : brand.loginPath;
}

export function absoluteOgImage(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
