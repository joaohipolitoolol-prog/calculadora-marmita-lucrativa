/** Kit preview carousel: equal slides, one-step swipe, page scroll stays free. */

export function initKitPreview(root = document) {
  root.querySelectorAll('[data-kit-preview]').forEach((preview) => {
    if (preview.dataset.kitBound === '1') return;
    preview.dataset.kitBound = '1';

    const viewport = preview.querySelector('[data-kit-viewport]') || preview;
    const track = preview.querySelector('[data-kit-track]');
    const slides = [...preview.querySelectorAll('[data-kit-slide]')];
    if (!track || !slides.length) return;

    let index = 0;
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let dragging = false;
    let moved = false;
    let axis = null; // null | 'x' | 'y'
    let pointerId = null;
    let width = 0;
    let animTimer = 0;

    const TRANSITION_MS = 280;
    const clamp = (n) => Math.max(0, Math.min(slides.length - 1, n));

    function measure() {
      width = viewport.getBoundingClientRect().width || preview.getBoundingClientRect().width || 1;
    }

    function clearAnimating() {
      track.classList.remove('is-animating');
      if (animTimer) {
        window.clearTimeout(animTimer);
        animTimer = 0;
      }
    }

    function paint(offsetPx = 0, animate = true) {
      if (animate) {
        track.classList.add('is-animating');
        track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        if (animTimer) window.clearTimeout(animTimer);
        animTimer = window.setTimeout(clearAnimating, TRANSITION_MS + 80);
      } else {
        clearAnimating();
        track.style.transition = 'none';
      }
      track.style.transform = `translate3d(${-(index * width) + offsetPx}px, 0, 0)`;
      slides.forEach((slide, si) => {
        const on = si === index;
        slide.classList.toggle('is-active', on);
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
        slide.style.visibility = '';
      });
    }

    function goTo(i, animate = true) {
      index = clamp(i);
      paint(0, animate);
    }

    track.addEventListener('transitionend', (e) => {
      if (e.target !== track || e.propertyName !== 'transform') return;
      clearAnimating();
    });

    function releaseCapture() {
      if (pointerId == null) return;
      try {
        if (track.hasPointerCapture?.(pointerId)) track.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('input, button, a, label')) return;

      measure();
      dragging = true;
      moved = false;
      axis = null;
      deltaX = 0;
      startX = e.clientX;
      startY = e.clientY;
      pointerId = e.pointerId;
      // Do NOT capture yet — keep vertical page scroll free until X is confirmed.
    }

    function onPointerMove(e) {
      if (!dragging || e.pointerId !== pointerId) return;
      if (axis === 'y') return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!axis) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

        // Prefer vertical when both move — page scroll must win easily.
        if (Math.abs(dy) >= Math.abs(dx) * 0.85) {
          axis = 'y';
          dragging = false;
          track.classList.remove('is-dragging');
          releaseCapture();
          pointerId = null;
          return;
        }

        axis = 'x';
        track.classList.add('is-dragging');
        paint(0, false);
        try {
          track.setPointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }

      deltaX = dx;
      if (Math.abs(deltaX) > 6) moved = true;

      let x = deltaX;
      if ((index === 0 && x > 0) || (index === slides.length - 1 && x < 0)) {
        x *= 0.35;
      }
      paint(x, false);
      if (e.cancelable) e.preventDefault();
    }

    function onPointerUp(e) {
      if (pointerId != null && e && e.pointerId !== pointerId) return;

      const wasHorizontal = axis === 'x';
      const dx = deltaX;

      dragging = false;
      track.classList.remove('is-dragging');
      releaseCapture();
      pointerId = null;
      axis = null;
      deltaX = 0;

      if (!wasHorizontal) return;

      // One slide only — never skip by distance/velocity.
      const threshold = Math.min(56, width * 0.16);
      if (dx <= -threshold) goTo(index + 1);
      else if (dx >= threshold) goTo(index - 1);
      else goTo(index);
    }

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove, { passive: false });
    track.addEventListener('pointerup', onPointerUp);
    track.addEventListener('pointercancel', onPointerUp);
    track.addEventListener('lostpointercapture', () => {
      if (!dragging) return;
      if (axis === 'x') onPointerUp();
      else {
        dragging = false;
        track.classList.remove('is-dragging');
        pointerId = null;
        axis = null;
        deltaX = 0;
      }
    });

    track.addEventListener(
      'click',
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      },
      true
    );

    preview.querySelectorAll('[data-kit-prev]').forEach((btn) => {
      btn.addEventListener('click', () => goTo(index - 1));
    });
    preview.querySelectorAll('[data-kit-next]').forEach((btn) => {
      btn.addEventListener('click', () => goTo(index + 1));
    });

    preview.querySelectorAll('[data-mini-calc]').forEach(initMiniCalc);

    measure();
    goTo(0, false);
    window.addEventListener(
      'resize',
      () => {
        measure();
        goTo(index, false);
      },
      { passive: true }
    );
  });
}

function initMiniCalc(card) {
  if (card.dataset.miniCalcBound === '1') return;
  card.dataset.miniCalcBound = '1';

  const priceEl = card.querySelector('[data-mc-price]');
  const costEl = card.querySelector('[data-mc-cost]');
  const profitEl = card.querySelector('[data-mc-profit]');
  const marginEl = card.querySelector('[data-mc-margin]');
  if (!priceEl || !costEl || !profitEl || !marginEl) return;

  const money = (n) => `US$ ${n.toFixed(2).replace('.', ',')}`;

  function render() {
    const price = Number(priceEl.value) || 0;
    const cost = Number(costEl.value) || 0;
    const profit = Math.max(0, price - cost);
    const margin = price > 0 ? (profit / price) * 100 : 0;
    profitEl.textContent = money(profit);
    marginEl.textContent = `${margin.toFixed(0)}%`;
  }

  priceEl.addEventListener('input', render);
  costEl.addEventListener('input', render);
  card.querySelectorAll('[data-mc-nudge]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.mcNudge;
      const field = target === 'price' ? priceEl : costEl;
      const step = Number(btn.dataset.mcStep) || 0.1;
      const next = Math.max(0, (Number(field.value) || 0) + step);
      field.value = next.toFixed(2);
      render();
    });
  });

  render();
}
