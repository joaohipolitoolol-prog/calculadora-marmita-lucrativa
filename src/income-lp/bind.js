/** Shared income LP behaviors: sticky CTA, FAQ a11y. */

/**
 * Sticky CTA: show after leaving hero; hide near offer / final CTA / footer.
 * @param {HTMLElement | null} sticky
 * @param {{ heroSelector?: string, hideSelectors?: string[] }} [opts]
 */
export function bindIncomeSticky(sticky, opts = {}) {
  if (!sticky) return;

  const hero = document.querySelector(opts.heroSelector || '.hero, [data-lp-hero]');
  const hideEls = (opts.hideSelectors || ['#oferta', '.final-cta', '.footer'])
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);

  const sync = () => {
    const pastHero = hero
      ? window.scrollY > hero.offsetTop + hero.offsetHeight * 0.55
      : window.scrollY > 420;

    let nearCheckout = false;
    for (const el of hideEls) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        nearCheckout = true;
        break;
      }
    }

    const visible = pastHero && !nearCheckout;
    sticky.classList.toggle('visible', visible);
    sticky.setAttribute('aria-hidden', visible ? 'false' : 'true');
  };

  sync();
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
}

/** FAQ details: keep open state in sync with aria-expanded. */
export function bindIncomeFaq(root = document) {
  root.querySelectorAll('.faq-item').forEach((item, i) => {
    const summary = item.querySelector('.faq-question, summary');
    const answer = item.querySelector('.faq-answer');
    if (!summary || !answer) return;

    const qId = summary.id || `faq-q-${i}`;
    const aId = answer.id || `faq-a-${i}`;
    summary.id = qId;
    answer.id = aId;
    summary.setAttribute('aria-controls', aId);
    answer.setAttribute('role', 'region');
    answer.setAttribute('aria-labelledby', qId);

    const sync = () => {
      summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');
    };
    sync();
    item.addEventListener('toggle', sync);
  });
}
