/** Native overflow scroll + light desktop drag for WA print carousels. */

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

  // Avoid accidental click after drag
  el.addEventListener('click', (event) => {
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }
  }, true);
}
