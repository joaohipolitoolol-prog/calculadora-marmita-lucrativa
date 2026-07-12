/** Soft infinite marquee for WA print carousels (+ drag fallback). */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Native overflow scroll + light desktop drag.
 * @param {HTMLElement} el
 */
export function bindWaReviewsDrag(el) {
  if (!el) return;

  let active = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;

  el.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'touch') return;
      active = true;
      moved = false;
      startX = event.clientX;
      startScroll = el.scrollLeft;
      el.classList.add('is-dragging');
      el.setPointerCapture?.(event.pointerId);
    },
    { passive: true }
  );

  el.addEventListener(
    'pointermove',
    (event) => {
      if (!active) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 3) moved = true;
      el.scrollLeft = startScroll - delta;
    },
    { passive: true }
  );

  const end = () => {
    active = false;
    el.classList.remove('is-dragging');
  };

  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', end);

  el.addEventListener(
    'click',
    (event) => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    },
    true
  );
}

/**
 * Light continuous slide. Pauses on hover / focus / off-screen.
 * @param {HTMLElement} el
 */
export function bindWaReviewsMarquee(el) {
  if (!el || el.dataset.marqueeReady === '1') return;

  if (prefersReducedMotion()) {
    bindWaReviewsDrag(el);
    return;
  }

  const originals = Array.from(el.children);
  if (originals.length < 2) {
    bindWaReviewsDrag(el);
    return;
  }

  const inner = document.createElement('div');
  inner.className = 'wa-reviews-marquee-inner';
  originals.forEach((node) => inner.appendChild(node));

  originals.forEach((node) => {
    const copy = node.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('img').forEach((img) => {
      img.setAttribute('alt', '');
      img.setAttribute('loading', 'lazy');
    });
    inner.appendChild(copy);
  });

  el.replaceChildren(inner);
  el.classList.add('is-marquee', 'is-marquee-paused');
  el.dataset.marqueeReady = '1';

  // Soft pace: ~7s per print
  const seconds = Math.max(32, originals.length * 7);
  inner.style.setProperty('--wa-marquee-duration', `${seconds}s`);

  const pause = () => el.classList.add('is-marquee-paused');
  const resume = () => {
    if (el.classList.contains('is-in-view')) {
      el.classList.remove('is-marquee-paused');
    }
  };

  el.addEventListener('pointerenter', pause);
  el.addEventListener('pointerleave', resume);
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', resume);

  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add('is-in-view');
          resume();
        } else {
          el.classList.remove('is-in-view');
          pause();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
  } else {
    el.classList.add('is-in-view');
    resume();
  }
}

/** Bind marquee on all print tracks. */
export function initWaReviewsPrints(root = document) {
  root.querySelectorAll('.wa-reviews-track-prints').forEach((el) => {
    bindWaReviewsMarquee(el);
  });
}
