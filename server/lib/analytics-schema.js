/** Shared analytics allowlists + page metadata for public + admin APIs. */

export const PAGE_META = {
  home: { path: '/', label: 'Paletas LP', line: 'paletas' },
  diagnostico: { path: '/diagnostico', label: 'Diagnóstico Quiz', line: 'paletas' },
  postres: { path: '/postres', label: 'Postres LP', line: 'postres' },
  minipostres: { path: '/minipostres', label: 'Mini Postres LP', line: 'minipostres' },
  'minipostres-gracias': {
    path: '/minipostres/gracias',
    label: 'Mini Postres Gracias',
    line: 'minipostres',
  },
  'upsell-paletas': { path: '/upsell-paletas-premium', label: 'Upsell Paletas', line: 'paletas' },
  'upsell-postres': { path: '/postres/upsell', label: 'Upsell Postres', line: 'postres' },
  'aviso-postres': { path: '/postresaviso', label: 'Aviso Postres', line: 'postres' },
  acesso: { path: '/acesso', label: 'Acceso', line: null },
  cadastrar: { path: '/cadastrar', label: 'Registro Paletas', line: 'paletas' },
  'cadastrar-postres': { path: '/postres/cadastrar', label: 'Registro Postres', line: 'postres' },
  login: { path: '/login', label: 'Login Paletas', line: 'paletas' },
  'login-postres': { path: '/postres/login', label: 'Login Postres', line: 'postres' },
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
  'ab_assign',
  'diagnostico_quiz_start',
  'diagnostico_view_offer',
  'diagnostico_step',
  'diagnostico_abandon',
  'page_dwell',
]);

export const AB_VARIANTS = new Set(['lp', 'quiz']);

export const LINES = new Set(['paletas', 'postres', 'donuts', 'minipostres']);

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
