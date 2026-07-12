/** Send page dwell time on exit (LP, quiz, etc.). */

import { trackEvent } from './track.js';

/**
 * @param {string} pageKey — home | diagnostico | postres
 * @param {{ line?: string, minSeconds?: number }} [opts]
 */
export function initPageDwell(pageKey, opts = {}) {
  if (typeof window === 'undefined' || !pageKey) return () => {};
  const minSeconds = opts.minSeconds ?? 2;
  const start = Date.now();
  let sent = false;

  const flush = () => {
    if (sent) return;
    const seconds = Math.round((Date.now() - start) / 1000);
    if (seconds < minSeconds) return;
    sent = true;
    trackEvent('page_dwell', {
      page: pageKey,
      line: opts.line,
      seconds,
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);

  return flush;
}
