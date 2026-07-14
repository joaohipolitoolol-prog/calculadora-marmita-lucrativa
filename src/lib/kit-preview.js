/** Swipeable kit preview carousel (no visible scrollbar) + mini calc. */

export function initKitPreview(root = document) {
  root.querySelectorAll('[data-kit-preview]').forEach((preview) => {
    if (preview.dataset.kitBound === '1') return;
    preview.dataset.kitBound = '1';

    const track = preview.querySelector('[data-kit-track]');
    const slides = [...preview.querySelectorAll('[data-kit-slide]')];
    const dots = [...preview.querySelectorAll('[data-kit-dot]')];
    if (!track || !slides.length) return;

    let index = 0;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let moved = false;
    let pointerId = null;

    const clamp = (n) => Math.max(0, Math.min(slides.length - 1, n));

    function slideWidth() {
      const first = slides[0];
      if (!first) return track.clientWidth;
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function goTo(i, smooth = true) {
      index = clamp(i);
      const left = index * slideWidth();
      track.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
      dots.forEach((dot, di) => {
        const on = di === index;
        dot.classList.toggle('is-active', on);
        dot.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      slides.forEach((slide, si) => {
        slide.classList.toggle('is-active', si === index);
      });
    }

    function nearestIndex() {
      const w = slideWidth() || 1;
      return clamp(Math.round(track.scrollLeft / w));
    }

    dots.forEach((dot, di) => {
      dot.addEventListener('click', () => goTo(di));
    });

    track.addEventListener(
      'scroll',
      () => {
        if (dragging) return;
        const next = nearestIndex();
        if (next !== index) {
          index = next;
          dots.forEach((dot, di) => {
            const on = di === index;
            dot.classList.toggle('is-active', on);
            dot.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          slides.forEach((slide, si) => {
            slide.classList.toggle('is-active', si === index);
          });
        }
      },
      { passive: true }
    );

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // native inertial scroll
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      try {
        track.setPointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    });

    track.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });

    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== pointerId)) return;
      dragging = false;
      track.classList.remove('is-dragging');
      goTo(nearestIndex());
      pointerId = null;
    }

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    track.addEventListener('click', (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    }, true);

    let touchStartX = 0;
    track.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.touches[0]?.clientX || 0;
      },
      { passive: true }
    );
    track.addEventListener(
      'touchend',
      () => {
        window.setTimeout(() => goTo(nearestIndex()), 40);
      },
      { passive: true }
    );
    void touchStartX;

    preview.querySelectorAll('[data-kit-prev]').forEach((btn) => {
      btn.addEventListener('click', () => goTo(index - 1));
    });
    preview.querySelectorAll('[data-kit-next]').forEach((btn) => {
      btn.addEventListener('click', () => goTo(index + 1));
    });

    preview.querySelectorAll('[data-mini-calc]').forEach(initMiniCalc);

    goTo(0, false);
    window.addEventListener('resize', () => goTo(index, false), { passive: true });
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

  const money = (n) =>
    `US$ ${n.toFixed(2).replace('.', ',')}`;

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
