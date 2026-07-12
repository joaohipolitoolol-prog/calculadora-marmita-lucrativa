import './diagnostico.css';
import { createDiagnostico } from './engine.js';
import { ensureQuizAbTracking } from '../lib/ab-entry.js';
import { trackPageView } from '../lib/track.js';

const root = document.querySelector('[data-diagnostico]');
if (root) {
  if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  ensureQuizAbTracking();
  createDiagnostico(root);
  trackPageView('diagnostico');
}
