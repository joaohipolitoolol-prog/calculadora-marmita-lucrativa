import './diagnostico.css';
import { createDiagnostico } from './engine.js';
import { trackPageView } from '../lib/track.js';

const root = document.querySelector('[data-diagnostico]');
if (root) {
  createDiagnostico(root);
  trackPageView('diagnostico');
}
