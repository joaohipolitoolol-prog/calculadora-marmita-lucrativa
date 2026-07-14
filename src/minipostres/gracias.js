/**
 * Thank-you page for Mini Postres.
 * Does NOT fire Meta Purchase (browser Purchase disabled — false positives).
 */
import { ACCESS_URL, line } from './config.js';
import { captureAttribution } from '../lib/utm.js';
import { trackCurrentPage } from '../lib/track.js';
import { clearCheckoutPending } from '../lib/meta-pixel.js';

captureAttribution();
trackCurrentPage({ line });
clearCheckoutPending(line);

const btn = document.getElementById('mp-access-btn');
if (btn && ACCESS_URL) {
  btn.href = ACCESS_URL;
}
