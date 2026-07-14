/**
 * Mini VSL embed: YouTube, Vimeo, Panda Video, raw HTML embed, or local <video>.
 * No autoplay with sound.
 */

import { trackMetaCustom } from '../lib/meta-pixel.js';
import { trackEvent } from '../lib/track.js';

function youtubeId(url) {
  const m = String(url).match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/|live\/))([A-Za-z0-9_-]{6,})/
  );
  return m ? m[1] : null;
}

function vimeoId(url) {
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url) || url.startsWith('/') && /\.(mp4|webm|ogg)/i.test(url);
}

function isHtmlEmbed(url) {
  return /<\s*(iframe|video|script)/i.test(url);
}

function fireProgress(prefix, pct, fired) {
  if (fired.has(pct)) return;
  fired.add(pct);
  const map = { 0: 'VSLPlay', 25: 'VSL25', 50: 'VSL50', 75: 'VSL75', 100: 'VSLComplete' };
  const name = map[pct];
  if (!name) return;
  trackMetaCustom(`${prefix}_${name}`, { percent: pct });
  trackEvent(`${prefix.toLowerCase()}_vsl`, { page: 'minipostres', line: 'minipostres', percent: pct });
}

/**
 * @param {HTMLElement} root
 * @param {{ url: string, poster?: string, analyticsPrefix?: string, title?: string }} opts
 */
export function mountVslPlayer(root, opts = {}) {
  if (!root) return;
  const url = (opts.url || '').trim();
  const poster = opts.poster || '/minipostres/video/vsl-poster.svg';
  const prefix = opts.analyticsPrefix || 'MiniPostres';
  const fired = new Set();

  const shell = document.createElement('div');
  shell.className = 'mp-vsl-shell';

  if (!url) {
    shell.innerHTML = `
      <button type="button" class="mp-vsl-poster" aria-label="Video próximamente">
        <img src="${poster}" alt="3 bases. 12 sabores." width="860" height="484" loading="lazy" decoding="async">
        <span class="mp-vsl-play" aria-hidden="true"></span>
        <span class="mp-vsl-poster-caption">3 bases. 12 sabores.</span>
      </button>
      <p class="mp-vsl-soon">El video estará disponible pronto.</p>
    `;
    root.appendChild(shell);
    return;
  }

  const startTracking = (getTime, getDuration) => {
    fireProgress(prefix, 0, fired);
    const tick = () => {
      const d = getDuration();
      const t = getTime();
      if (!d || !Number.isFinite(d) || d <= 0) return;
      const pct = (t / d) * 100;
      if (pct >= 25) fireProgress(prefix, 25, fired);
      if (pct >= 50) fireProgress(prefix, 50, fired);
      if (pct >= 75) fireProgress(prefix, 75, fired);
      if (pct >= 95) fireProgress(prefix, 100, fired);
    };
    const id = window.setInterval(tick, 1200);
    return () => window.clearInterval(id);
  };

  if (isHtmlEmbed(url)) {
    shell.innerHTML = `<div class="mp-vsl-frame">${url}</div>`;
    root.appendChild(shell);
    fireProgress(prefix, 0, fired);
    return;
  }

  const yt = youtubeId(url);
  if (yt) {
    shell.innerHTML = `
      <div class="mp-vsl-frame">
        <iframe
          src="https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1"
          title="${opts.title || 'Video Mini Postres'}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`;
    root.appendChild(shell);
    // YouTube iframe API not loaded; mark play when frame is interacted
    shell.querySelector('iframe')?.addEventListener('load', () => fireProgress(prefix, 0, fired), { once: true });
    return;
  }

  const vm = vimeoId(url);
  if (vm) {
    shell.innerHTML = `
      <div class="mp-vsl-frame">
        <iframe
          src="https://player.vimeo.com/video/${vm}?title=0&byline=0&portrait=0"
          title="${opts.title || 'Video Mini Postres'}"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`;
    root.appendChild(shell);
    shell.querySelector('iframe')?.addEventListener('load', () => fireProgress(prefix, 0, fired), { once: true });
    return;
  }

  // Panda / generic iframe URL
  if (/pandavideo|player\.|embed/i.test(url) || /^https?:\/\//i.test(url)) {
    if (isDirectVideo(url)) {
      // fall through to video
    } else {
      shell.innerHTML = `
        <div class="mp-vsl-frame">
          <iframe
            src="${url}"
            title="${opts.title || 'Video Mini Postres'}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>`;
      root.appendChild(shell);
      shell.querySelector('iframe')?.addEventListener('load', () => fireProgress(prefix, 0, fired), { once: true });
      return;
    }
  }

  // Local / direct video with custom poster
  shell.innerHTML = `
    <button type="button" class="mp-vsl-poster" data-mp-vsl-start aria-label="Reproducir video">
      <img src="${poster}" alt="3 bases. 12 sabores." width="860" height="484" loading="lazy" decoding="async">
      <span class="mp-vsl-play" aria-hidden="true"></span>
      <span class="mp-vsl-poster-caption">3 bases. 12 sabores.</span>
    </button>
  `;
  root.appendChild(shell);

  const startBtn = shell.querySelector('[data-mp-vsl-start]');
  startBtn?.addEventListener('click', () => {
    const frame = document.createElement('div');
    frame.className = 'mp-vsl-frame';
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('playsinline', '');
    frame.appendChild(video);
    shell.innerHTML = '';
    shell.appendChild(frame);
    startTracking(
      () => video.currentTime,
      () => video.duration
    );
    video.play().catch(() => {});
  });
}
