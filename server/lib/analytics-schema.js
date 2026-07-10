/** Shared analytics allowlists + page metadata for public + admin APIs. */

export const PAGE_META = {
  home: { path: '/', label: 'Paletas LP', line: 'paletas' },
  postres: { path: '/postres', label: 'Postres LP', line: 'postres' },
  'upsell-paletas': { path: '/upsell-paletas-premium', label: 'Upsell Paletas', line: 'paletas' },
  'upsell-postres': { path: '/postres/upsell', label: 'Upsell Postres', line: 'postres' },
  'aviso-postres': { path: '/postresaviso', label: 'Aviso Postres', line: 'postres' },
  acesso: { path: '/acesso', label: 'Acceso', line: null },
  cadastrar: { path: '/cadastrar', label: 'Registro', line: null },
  login: { path: '/login', label: 'Login', line: null },
  app: { path: '/app', label: 'App', line: null },
};

export const EVENT_TYPES = new Set([
  'page_view',
  'cta_click',
  'whatsapp_click',
  'checkout_click',
  'register',
  'login',
  'app_open',
]);

export const LINES = new Set(['paletas', 'postres', 'donuts']);

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function sanitizeKey(value, max = 64) {
  if (value == null) return null;
  const s = String(value).trim().slice(0, max);
  if (!s) return null;
  if (!/^[a-zA-Z0-9_.:/-]+$/.test(s)) return null;
  return s;
}
