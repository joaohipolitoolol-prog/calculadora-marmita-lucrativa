/**
 * Diagnóstico WhatsApp — motor de UI, estado y navegación.
 * Cada transición da feedback; nunca deja la pantalla “muerta”.
 */

import { icon } from './icons.js';
import { SCREEN_FLOW, buildScreen, computeDiagnosis } from './copy.js';
import { computeDaySimulation } from './simulation.js';
import {
  socialLineFor,
  phaseFromScreen,
} from './social-proof.js';
import { createPedidoToasts } from './toasts.js';
import {
  KIT_ITEMS,
  CHECKOUT_URL,
  MAIN_PRICE,
  KIT_NAME,
  reviewsForDiagnosis,
} from './config.js';
import { trackMetaInitiateCheckout } from '../lib/meta-pixel.js';
import { trackEvent, trackCta } from '../lib/track.js';

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Telas que só aparecem se o bloqueio pedir — funil mais curto, mesmo sentimento de app */
function shouldSkipScreen(id, answers) {
  // Sem blocker ainda → não pular (ainda não sabemos o caminho)
  if (!answers.blocker) return false;

  if (id === 'q_cooking') {
    return answers.blocker !== 'recetas' && answers.blocker !== 'empezar';
  }
  if (id === 'q_whatsapp') {
    return answers.blocker !== 'whatsapp' && answers.blocker !== 'ventas';
  }
  return false;
}

function applySkipDefaults(id, answers) {
  if (id === 'q_cooking' && !answers.cooking) answers.cooking = 'mid';
  if (id === 'q_whatsapp' && !answers.whatsappLevel) answers.whatsappLevel = 'sometimes';
}

export function createDiagnostico(root) {
  const state = {
    index: 0,
    answers: {},
    diagnosisId: 'inicio',
    transitioning: false,
    selected: null,
    pedidosSeen: 0,
    simulation: null,
  };

  const els = {
    progressFill: root.querySelector('[data-progress-fill]'),
    progressWrap: root.querySelector('[data-progress]'),
    stepLabel: root.querySelector('[data-step-label]'),
    stepPct: root.querySelector('[data-step-pct]'),
    socialText: root.querySelector('[data-social-text]'),
    stage: root.querySelector('[data-stage]'),
    ambient: root.querySelector('[data-ambient]'),
  };

  const toasts = createPedidoToasts(root, { reducedMotion: REDUCED_MOTION });

  // Audio só depois do primeiro toque (política do browser)
  root.addEventListener(
    'pointerdown',
    () => {
      toasts.unlockAudio();
    },
    { once: true, passive: true },
  );

  function currentId() {
    return SCREEN_FLOW[state.index];
  }

  function screenData() {
    return buildScreen(currentId(), state.answers, state.diagnosisId, {
      pedidosSeen: state.pedidosSeen || toasts.getCount(),
      simulation: state.simulation,
    });
  }

  function updateSocial() {
    if (!els.socialText) return;
    const phase = phaseFromScreen(currentId());
    els.socialText.textContent = socialLineFor(phase, state.answers);
  }

  function visiblePath() {
    return SCREEN_FLOW.filter((id) => !shouldSkipScreen(id, state.answers));
  }

  function setProgress(pct) {
    const path = visiblePath();
    const pos = Math.max(0, path.indexOf(currentId()));
    const step = pos + 1;
    const total = path.length;
    const safe =
      pct != null
        ? Math.max(0, Math.min(100, pct))
        : Math.round((pos / Math.max(1, total - 1)) * 100);

    if (els.progressFill) els.progressFill.style.width = `${safe}%`;
    els.progressWrap?.setAttribute('aria-valuenow', String(Math.round(safe)));
    if (els.stepLabel) {
      els.stepLabel.textContent = `PASO ${step} DE ${total}`;
    }
    if (els.stepPct) {
      els.stepPct.textContent = `${Math.round(safe)}%`;
    }
    root.dataset.screen = currentId();
    updateSocial();
  }

  function advanceIndex() {
    let next = state.index + 1;
    while (next < SCREEN_FLOW.length && shouldSkipScreen(SCREEN_FLOW[next], state.answers)) {
      applySkipDefaults(SCREEN_FLOW[next], state.answers);
      next += 1;
    }
    return next;
  }

  function pulseAmbient() {
    if (!els.ambient || REDUCED_MOTION) return;
    els.ambient.classList.remove('is-pulse');
    // force reflow
    void els.ambient.offsetWidth;
    els.ambient.classList.add('is-pulse');
  }

  function celebrate(x, y) {
    if (REDUCED_MOTION) return;
    const burst = document.createElement('div');
    burst.className = 'dx-burst';
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    for (let i = 0; i < 8; i += 1) {
      const p = document.createElement('span');
      p.style.setProperty('--i', String(i));
      burst.appendChild(p);
    }
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
  }

  async function transitionTo(renderFn) {
    if (state.transitioning) return;
    state.transitioning = true;
    els.stage.classList.add('is-out');
    await wait(REDUCED_MOTION ? 0 : 220);
    renderFn();
    els.stage.classList.remove('is-out');
    els.stage.classList.add('is-in');
    pulseAmbient();
    await wait(REDUCED_MOTION ? 0 : 280);
    els.stage.classList.remove('is-in');
    state.transitioning = false;
  }

  function goNext() {
    if (state.transitioning) return;
    const next = advanceIndex();
    if (next >= SCREEN_FLOW.length) return;
    state.index = next;
    const id = currentId();

    if (id === 'diagnosis') {
      state.diagnosisId = computeDiagnosis(state.answers);
      state.simulation = computeDaySimulation(state.answers);
      trackEvent('diagnostico_result', {
        page: 'diagnostico',
        line: 'paletas',
        diagnosis: state.diagnosisId,
        simAmount: state.simulation?.amountNum,
        ...state.answers,
      });
    }

    transitionTo(() => render()).then(() => {
      if (id === 'loading') runLoading();
      // 1 toast por tela, depois da transição (sem overlap com header)
      state.pedidosSeen = toasts.show(id);
    });

    trackEvent('diagnostico_step', {
      page: 'diagnostico',
      line: 'paletas',
      step: id,
      index: state.index,
    });
  }

  function answer(key, value, event) {
    state.answers[key] = value;
    state.selected = value;

    const btn = event?.currentTarget;
    if (btn) {
      btn.classList.add('is-selected');
      const rect = btn.getBoundingClientRect();
      celebrate(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    // micro delay so the selection feels satisfying
    wait(REDUCED_MOTION ? 120 : 380).then(() => {
      goNext();
    });
  }

  function render() {
    const screen = screenData();
    setProgress(screen.progress ?? 0);
    state.selected = null;
    root.classList.toggle('is-welcome', screen.type === 'welcome');

    let html = '';
    switch (screen.type) {
      case 'welcome':
        html = renderWelcome(screen);
        break;
      case 'question':
        html = renderQuestion(screen);
        break;
      case 'affirm':
        html = renderAffirm(screen);
        break;
      case 'name':
        html = renderName(screen);
        break;
      case 'loading':
        html = renderLoading(screen);
        break;
      case 'diagnosis':
        html = renderDiagnosis(screen);
        break;
      case 'simulation':
        html = renderSimulation(screen);
        break;
      case 'insight':
        html = renderInsight(screen);
        break;
      case 'kit':
        html = renderKit(screen);
        break;
      case 'trust':
        html = renderTrust(screen);
        break;
      case 'offer':
        html = renderOffer(screen);
        break;
      default:
        html = '';
    }

    els.stage.innerHTML = html;
    bindScreen(screen);
    els.stage.focus({ preventScroll: true });
  }

  function bindScreen(screen) {
    els.stage.querySelectorAll('[data-next]').forEach((el) => {
      el.addEventListener('click', () => goNext());
    });

    els.stage.querySelectorAll('[data-answer]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (state.transitioning) return;
        const value = el.getAttribute('data-answer');
        answer(screen.key, value, e);
      });
    });

    const nameForm = els.stage.querySelector('[data-name-form]');
    if (nameForm) {
      const input = nameForm.querySelector('[data-name-input]');
      input?.focus({ preventScroll: true });

      nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (state.transitioning) return;
        state.answers.name = formatFirstName(input?.value || '');
        goNext();
      });

      els.stage.querySelector('[data-name-skip]')?.addEventListener('click', () => {
        if (state.transitioning) return;
        state.answers.name = '';
        goNext();
      });
    }

    els.stage.querySelectorAll('[data-checkout]').forEach((el) => {
      el.addEventListener('click', () => {
        trackCta('diagnostico_checkout', {
          page: 'diagnostico',
          line: 'paletas',
          diagnosis: state.diagnosisId,
          hasName: Boolean(state.answers.name),
        });
        trackMetaInitiateCheckout({
          value: MAIN_PRICE,
          contentName: KIT_NAME,
          contentIds: ['kit', `diag_${state.diagnosisId}`],
        });
      });
    });
  }

  function formatFirstName(raw) {
    const part = String(raw || '')
      .trim()
      .split(/\s+/)[0];
    if (!part) return '';
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }

  async function runLoading() {
    const screen = screenData();
    const steps = screen.steps || [];
    for (let i = 0; i < steps.length; i += 1) {
      const row = els.stage.querySelector(`[data-load-step="${i}"]`);
      row?.classList.add('is-active');
      // ~2s más de anticipación antes del diagnóstico
      await wait(REDUCED_MOTION ? 200 : 1400);
      row?.classList.remove('is-active');
      row?.classList.add('is-done');
    }
    await wait(REDUCED_MOTION ? 100 : 600);
    goNext();
  }

  // ——— Render helpers ———

  function renderWelcome(s) {
    return `
      <section class="dx-screen dx-welcome" aria-labelledby="dx-title">
        <h1 id="dx-title" class="dx-title dx-title-display">${esc(s.title)}</h1>
        <p class="dx-body dx-body-center">${esc(s.body)}</p>
        <figure class="dx-hero-photo">
          <img
            src="${esc(s.image)}"
            alt="${esc(s.imageAlt)}"
            width="720"
            height="540"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          >
        </figure>
        <p class="dx-note dx-note-center">${esc(s.note)}</p>
        <button type="button" class="dx-btn dx-btn-primary dx-btn-glow" data-next>
          ${esc(s.cta)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderQuestion(s) {
    const options = (s.options || [])
      .map(
        (o) => `
        <button type="button" class="dx-option" data-answer="${esc(o.value)}">
          <span class="dx-option-icon">${icon(o.icon)}</span>
          <span class="dx-option-text">
            <span class="dx-option-label">${esc(o.label)}</span>
            <span class="dx-option-hint">${esc(o.hint)}</span>
          </span>
          <span class="dx-option-check" aria-hidden="true">${icon('check', 'dx-icon dx-icon-sm')}</span>
        </button>
      `,
      )
      .join('');

    return `
      <section class="dx-screen dx-question" aria-labelledby="dx-title">
        <p class="dx-game-hint">Elige una opción para seguir</p>
        <div class="dx-q-icon">${icon(s.icon)}</div>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        <div class="dx-options" role="group" aria-label="${esc(s.title)}">
          ${options}
        </div>
      </section>
    `;
  }

  function renderName(s) {
    return `
      <section class="dx-screen dx-name" aria-labelledby="dx-title">
        <div class="dx-q-icon">${icon(s.icon)}</div>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        <form class="dx-name-form" data-name-form>
          <label class="dx-sr-only" for="dx-name-input">Primer nombre</label>
          <input
            id="dx-name-input"
            class="dx-name-input"
            type="text"
            name="name"
            autocomplete="given-name"
            maxlength="24"
            placeholder="${esc(s.placeholder)}"
            data-name-input
          >
          <button type="submit" class="dx-btn dx-btn-primary">
            ${esc(s.cta)}
          </button>
        </form>
        <button type="button" class="dx-btn-text" data-name-skip>
          ${esc(s.skip)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderAffirm(s) {
    const review = s.review
      ? `
        <figure class="dx-review dx-review-solo">
          <img src="${esc(s.review.src)}" alt="${esc(s.review.alt)}" width="320" height="568" loading="lazy" decoding="async">
          ${s.review.caption ? `<figcaption>${esc(s.review.caption)}</figcaption>` : ''}
        </figure>
      `
      : '';

    return `
      <section class="dx-screen dx-affirm" aria-labelledby="dx-title">
        <div class="dx-affirm-badge" aria-hidden="true">
          ${icon(s.icon, 'dx-icon dx-icon-lg')}
        </div>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        ${s.chip ? `<p class="dx-chip">${esc(s.chip)}</p>` : ''}
        ${review}
        <button type="button" class="dx-btn dx-btn-primary" data-next>
          ${esc(s.cta)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderLoading(s) {
    const steps = (s.steps || [])
      .map(
        (step, i) => `
        <li class="dx-load-step" data-load-step="${i}">
          <span class="dx-load-icon">${icon(step.icon)}</span>
          <span class="dx-load-text">${esc(step.text)}</span>
          <span class="dx-load-check">${icon('check', 'dx-icon dx-icon-sm')}</span>
        </li>
      `,
      )
      .join('');

    return `
      <section class="dx-screen dx-loading" aria-labelledby="dx-title" aria-live="polite">
        <div class="dx-loader" aria-hidden="true">
          <span class="dx-loader-ring"></span>
          <span class="dx-loader-core">${icon('search')}</span>
        </div>
        <h1 id="dx-title" class="dx-title">Armando tu diagnóstico…</h1>
        <p class="dx-body">Estamos cruzando tus respuestas para encontrar el bloqueo principal.</p>
        <ul class="dx-load-list">${steps}</ul>
      </section>
    `;
  }

  function renderDiagnosis(s) {
    const review = reviewsForDiagnosis(state.diagnosisId)[0];
    const reviewHtml = review
      ? `
        <figure class="dx-review dx-review-solo dx-review-diag">
          <img src="${esc(review.src)}" alt="${esc(review.alt)}" width="320" height="480" loading="lazy" decoding="async">
          <figcaption>Mujeres con el mismo bloqueo ya empezaron</figcaption>
        </figure>
      `
      : '';

    return `
      <section class="dx-screen dx-diagnosis" aria-labelledby="dx-title">
        <p class="dx-badge dx-badge-warn">${icon(s.icon, 'dx-icon dx-icon-sm')} ${esc(s.badge)}</p>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        <div class="dx-card dx-card-soft">
          <p class="dx-card-label">Lo que necesitas</p>
          <p class="dx-card-text">${esc(s.need)}</p>
        </div>
        ${reviewHtml}
        <button type="button" class="dx-btn dx-btn-primary" data-next>
          ${esc(s.cta)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderSimulation(s) {
    return `
      <section class="dx-screen dx-simulation" aria-labelledby="dx-title">
        <p class="dx-eyebrow">${esc(s.eyebrow)}</p>
        <div class="dx-sim-card">
          <p class="dx-sim-label">${icon('star', 'dx-icon dx-icon-sm')} Simulación de hoy</p>
          <p class="dx-sim-amount">${esc(s.amount)}</p>
          <p class="dx-sim-sub">eso es lo que podrías haber generado hoy con paletas bien publicadas en WhatsApp</p>
        </div>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        <p class="dx-note">${esc(s.note)} · ~${esc(String(s.units))} paletas</p>
        <button type="button" class="dx-btn dx-btn-primary" data-next>
          ${esc(s.cta)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderInsight(s) {
    const points = (s.points || [])
      .map(
        (p) => `
        <li class="dx-point">
          <span class="dx-point-icon">${icon(p.icon)}</span>
          <span>${esc(p.text)}</span>
        </li>
      `,
      )
      .join('');

    return `
      <section class="dx-screen dx-insight" aria-labelledby="dx-title">
        <div class="dx-q-icon dx-q-icon-pink">${icon(s.icon)}</div>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        <ul class="dx-points">${points}</ul>
        <button type="button" class="dx-btn dx-btn-primary" data-next>
          ${esc(s.cta)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderKit(s) {
    const focusSet = new Set(s.focusIds || []);
    const items = KIT_ITEMS.map((item) => {
      const isFocus = focusSet.has(item.id);
      return `
        <li class="dx-kit-item${isFocus ? ' is-focus' : ''}">
          <span class="dx-kit-icon">${icon(item.icon)}</span>
          <span class="dx-kit-label">${esc(item.label)}</span>
          ${isFocus ? '<span class="dx-kit-tag">Para ti</span>' : ''}
        </li>
      `;
    }).join('');

    return `
      <section class="dx-screen dx-kit" aria-labelledby="dx-title">
        <p class="dx-eyebrow">${esc(s.eyebrow)}</p>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        <ul class="dx-kit-list">${items}</ul>
        <button type="button" class="dx-btn dx-btn-primary" data-next>
          ${esc(s.cta)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderReviewStrip(reviews, caption) {
    if (!reviews?.length) return '';
    const figs = reviews
      .map(
        (r) => `
        <figure class="dx-review">
          <img src="${esc(r.src)}" alt="${esc(r.alt)}" width="280" height="400" loading="lazy" decoding="async">
        </figure>
      `,
      )
      .join('');
    return `
      <div class="dx-reviews">
        ${caption ? `<p class="dx-reviews-caption">${esc(caption)}</p>` : ''}
        <div class="dx-reviews-row">${figs}</div>
      </div>
    `;
  }

  function renderTrust(s) {
    const reviews = reviewsForDiagnosis(state.diagnosisId);
    const points = (s.points || [])
      .map(
        (p) => `
        <li class="dx-trust-item">
          <span class="dx-trust-icon">${icon(p.icon)}</span>
          <div>
            <p class="dx-trust-title">${esc(p.title)}</p>
            <p class="dx-trust-text">${esc(p.text)}</p>
          </div>
        </li>
      `,
      )
      .join('');

    return `
      <section class="dx-screen dx-trust" aria-labelledby="dx-title">
        <div class="dx-q-icon dx-q-icon-green">${icon(s.icon)}</div>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body || '')}</p>
        ${renderReviewStrip(reviews, 'Capturas reales de WhatsApp')}
        <ul class="dx-trust-list">${points}</ul>
        <button type="button" class="dx-btn dx-btn-primary" data-next>
          ${esc(s.cta)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderOffer(s) {
    const reviews = reviewsForDiagnosis(state.diagnosisId).slice(0, 2);
    const objections = (s.objections || [])
      .map(
        (o) => `
        <details class="dx-obj">
          <summary>${esc(o.q)}</summary>
          <p>${esc(o.a)}</p>
        </details>
      `,
      )
      .join('');

    const items = KIT_ITEMS.map(
      (item) => `
      <li>
        <span class="dx-check-dot">${icon('check', 'dx-icon dx-icon-sm')}</span>
        ${esc(item.label)}
      </li>
    `,
    ).join('');

    return `
      <section class="dx-screen dx-offer" aria-labelledby="dx-title">
        <p class="dx-eyebrow">${esc(s.eyebrow)}</p>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>

        <div class="dx-price-card">
          <p class="dx-price">${esc(s.price)}</p>
          <p class="dx-price-note">${esc(s.priceNote)}</p>
          <p class="dx-guarantee">${icon('shield', 'dx-icon dx-icon-sm')} ${esc(s.guarantee)}</p>
        </div>

        <ul class="dx-include">${items}</ul>

        ${renderReviewStrip(reviews, 'Lo que otras ya lograron')}

        <div class="dx-objections" aria-label="Dudas frecuentes">
          ${objections}
        </div>

        <a
          class="dx-btn dx-btn-primary dx-btn-checkout"
          href="${esc(CHECKOUT_URL)}"
          rel="noopener"
          data-checkout
          data-checkout-hard
        >
          ${esc(s.cta)}
          ${icon('arrow', 'dx-icon dx-icon-inline')}
        </a>
        <p class="dx-micro">${esc(s.micro)}</p>
        <p class="dx-sticky-note">${esc(s.stickyNote)}</p>
      </section>
    `;
  }

  // boot
  updateSocial();
  render();
  trackEvent('diagnostico_start', {
    page: 'diagnostico',
    line: 'paletas',
  });

  return {
    getState: () => ({ ...state, answers: { ...state.answers } }),
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
