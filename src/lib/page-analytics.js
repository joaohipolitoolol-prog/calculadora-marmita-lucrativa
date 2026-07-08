const TRACKED_PAGES = {
  home: '/',
  postres: '/postres',
  'upsell-paletas': '/upsell-paletas-premium',
  'upsell-postres': '/postres/upsell',
  acesso: '/acesso',
  cadastrar: '/cadastrar',
};

export function trackPageView(pageKey) {
  if (!pageKey || !TRACKED_PAGES[pageKey]) return;

  const payload = JSON.stringify({ page: pageKey });
  const url = '/api/analytics/pageview';

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
    return;
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function trackCurrentPage() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const entry = Object.entries(TRACKED_PAGES).find(([, value]) => {
    const normalized = value.replace(/\/$/, '') || '/';
    return normalized === path;
  });
  if (entry) trackPageView(entry[0]);
}
