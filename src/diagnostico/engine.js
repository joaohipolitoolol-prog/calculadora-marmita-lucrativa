/**
 * Diagnóstico WhatsApp — motor de UI, estado e navegação.
 * Cada transição dá feedback; nunca deixa a tela “morta”.
 */

import { icon } from './icons.js';
import {
  SCREEN_FLOW,
  QUESTION_IDS,
  buildScreen,
  computeDiagnosis,
} from './copy.js';
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
  reviewForExperience,
  pickReview,
  pickUnusedReviews,
  diagnosisReviewIds,
} from './config.js';
import {
  trackMetaInitiateCheckout,
  trackMetaCustom,
} from '../lib/meta-pixel.js';
import { trackEvent, trackCheckout } from '../lib/track.js';
import { withAbCheckoutParam } from '../lib/ab-entry.js';

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const QUESTION_SET = new Set(QUESTION_IDS);

export function createDiagnostico(root) {
  const state = {
    index: 0,
    answers: {},
    diagnosisId: 'inicio',
    transitioning: false,
    selected: null,
    pedidosSeen: 0,
    usedReviews: [],
    trackedProgress50: false,
    trackedComplete: false,
    trackedViewOffer: false,
  };

  const els = {
    progressFill: root.querySelector('[data-progress-fill]'),
    progressWrap: root.querySelector('[data-progress]'),
    progressMeta: root.querySelector('[data-progress-meta]'),
    stepLabel: root.querySelector('[data-step-label]'),
    stepPct: root.querySelector('[data-step-pct]'),
    socialText: root.querySelector('[data-social-text]'),
    stage: root.querySelector('[data-stage]'),
    ambient: root.querySelector('[data-ambient]'),
  };

  const toasts = createPedidoToasts(root, { reducedMotion: REDUCED_MOTION });

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
    });
  }

  function updateSocial() {
    if (!els.socialText) return;
    const phase = phaseFromScreen(currentId());
    els.socialText.textContent = socialLineFor(phase, state.answers);
  }

  function answeredQuestionCount() {
    return QUESTION_IDS.filter((id) => {
      const key = questionKey(id);
      return key && state.answers[key] != null && state.answers[key] !== '';
    }).length;
  }

  function questionKey(screenId) {
    const map = {
      q_experience: 'experience',
      q_blocker: 'blocker',
      q_channel: 'channel',
      q_start: 'start',
      q_victory: 'victory',
    };
    return map[screenId];
  }

  function setProgress() {
    const id = currentId();
    const isWelcome = id === 'welcome';
    const isQuestion = QUESTION_SET.has(id);
    const totalQ = QUESTION_IDS.length;
    const done = answeredQuestionCount();

    root.classList.toggle('is-welcome', isWelcome);
    root.classList.toggle('is-questions', isQuestion);
    root.classList.toggle('is-result', !isWelcome && !isQuestion);

    let pct = 0;
    let label = '';

    if (isWelcome) {
      pct = 0;
      label = '';
    } else if (isQuestion) {
      const qIndex = QUESTION_IDS.indexOf(id);
      const step = Math.max(1, qIndex + 1);
      // Primeira pergunta já ~15% — sensação de avanço imediato
      pct = step === 1 ? 15 : Math.round((step / totalQ) * 100);
      label = `${step} de ${totalQ}`;
    } else if (id === 'affirm_1' || id === 'q_name') {
      pct = Math.max(70, Math.round((done / totalQ) * 100));
      label = done >= totalQ ? 'Casi listo' : `${done} de ${totalQ}`;
    } else if (id === 'loading') {
      pct = 90;
      label = 'Armando tu plan';
    } else {
      pct = 100;
      label = 'Tu diagnóstico';
    }

    if (els.progressFill) els.progressFill.style.width = `${pct}%`;
    els.progressWrap?.setAttribute('aria-valuenow', String(pct));
    if (els.stepLabel) els.stepLabel.textContent = label;
    if (els.stepPct) {
      els.stepPct.textContent = isWelcome ? '' : `${pct}%`;
      els.stepPct.hidden = isWelcome || !pct;
    }
    root.dataset.screen = id;
    updateSocial();
  }

  function pulseAmbient() {
    if (!els.ambient || REDUCED_MOTION) return;
    els.ambient.classList.remove('is-pulse');
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

  function fireFunnelEvents(id) {
    if (id === 'q_channel' && !state.trackedProgress50) {
      state.trackedProgress50 = true;
      trackMetaCustom('QuizProgress', { step: id, progress: 50 });
    }

    if (id === 'diagnosis' && !state.trackedComplete) {
      state.trackedComplete = true;
      trackMetaCustom('QuizComplete', {
        diagnosis: state.diagnosisId,
      });
    }

    if (id === 'offer' && !state.trackedViewOffer) {
      state.trackedViewOffer = true;
      trackMetaCustom('ViewOffer', {
        diagnosis: state.diagnosisId,
        value: MAIN_PRICE,
        currency: 'USD',
      });
      trackEvent('diagnostico_view_offer', {
        page: 'diagnostico',
        line: 'paletas',
        diagnosis: state.diagnosisId,
      });
    }
  }

  function goNext() {
    if (state.transitioning) return;
    const next = state.index + 1;
    if (next >= SCREEN_FLOW.length) return;
    state.index = next;
    const id = currentId();

    if (id === 'diagnosis') {
      state.diagnosisId = computeDiagnosis(state.answers);
    }

    fireFunnelEvents(id);

    transitionTo(() => render()).then(() => {
      if (id === 'loading') runLoading();
      state.pedidosSeen = toasts.show(id);
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

    wait(REDUCED_MOTION ? 120 : 380).then(() => {
      goNext();
    });
  }

  function render() {
    const screen = screenData();
    setProgress();
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
      case 'plan':
        html = renderPlan(screen);
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
      el.addEventListener('click', () => {
        if (screen.type === 'welcome') {
          trackMetaCustom('QuizStart', { page: 'diagnostico' });
          trackEvent('diagnostico_quiz_start', {
            page: 'diagnostico',
            line: 'paletas',
          });
        }
        goNext();
      });
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
        trackCheckout('kit', {
          page: 'diagnostico',
          line: 'paletas',
          ctaId: 'diagnostico_checkout',
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
      await wait(REDUCED_MOTION ? 200 : 900);
      row?.classList.remove('is-active');
      row?.classList.add('is-done');
    }

    const loader = els.stage.querySelector('[data-loader]');
    const core = els.stage.querySelector('[data-loader-core]');
    const title = els.stage.querySelector('#dx-title');
    loader?.classList.add('is-confirmed');
    if (core) core.innerHTML = icon('check', 'dx-icon dx-icon-lg');
    if (title) title.textContent = 'Diagnóstico listo';
    await wait(REDUCED_MOTION ? 200 : 1000);
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

  function markReviewUsed(review) {
    if (review?.id && !state.usedReviews.includes(review.id)) {
      state.usedReviews.push(review.id);
    }
  }

  function renderAffirm(s) {
    let review = s.review || null;
    if (s.reviewKey === 'experience') {
      review = reviewForExperience(state.answers.experience);
      markReviewUsed(review);
      review = {
        ...review,
        caption: 'Mujeres como tú ya están recibiendo pedidos',
      };
    }

    const reviewHtml = review
      ? `
        <figure class="dx-review dx-review-solo">
          <img src="${esc(review.src)}" alt="${esc(review.alt)}" width="320" height="568" loading="lazy" decoding="async">
          ${review.caption ? `<figcaption>${esc(review.caption)}</figcaption>` : ''}
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
        ${reviewHtml}
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
        <div class="dx-loader" data-loader aria-hidden="true">
          <span class="dx-loader-ring"></span>
          <span class="dx-loader-core" data-loader-core>${icon('search')}</span>
        </div>
        <h1 id="dx-title" class="dx-title">Armando tu diagnóstico…</h1>
        <p class="dx-body">Estamos organizando tus respuestas para encontrar el bloqueo principal.</p>
        <ul class="dx-load-list">${steps}</ul>
      </section>
    `;
  }

  function renderDiagnosis(s) {
    const preferred = diagnosisReviewIds(state.diagnosisId);
    const review = pickReview(preferred, state.usedReviews);
    markReviewUsed(review);
    const reviewHtml = review
      ? `
        <figure class="dx-review dx-review-solo dx-review-diag">
          <img src="${esc(review.src)}" alt="${esc(review.alt)}" width="320" height="480" loading="lazy" decoding="async">
          <figcaption>Mujeres con el mismo bloqueo ya empezaron</figcaption>
        </figure>
      `
      : '';

    const pathHtml = (s.path || []).length
      ? `
        <ol class="dx-path">
          ${(s.path || []).map((step) => `<li>${esc(step)}</li>`).join('')}
        </ol>
        ${s.pathNote ? `<p class="dx-note">${esc(s.pathNote)}</p>` : ''}
      `
      : '';

    return `
      <section class="dx-screen dx-diagnosis" aria-labelledby="dx-title">
        <p class="dx-badge dx-badge-warn">${icon(s.icon, 'dx-icon dx-icon-sm')} ${esc(s.badge)}</p>
        ${s.profile ? `<p class="dx-profile">Tu perfil: ${esc(s.profile)}</p>` : ''}
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        <div class="dx-card dx-card-soft">
          <p class="dx-card-label">Lo que necesitas</p>
          <p class="dx-card-text">${esc(s.need)}</p>
        </div>
        ${pathHtml ? `<div class="dx-card dx-card-soft"><p class="dx-card-label">Tu mejor camino</p>${pathHtml}</div>` : ''}
        ${reviewHtml}
        <button type="button" class="dx-btn dx-btn-primary" data-next>
          ${esc(s.cta)}
        </button>
        <p class="dx-micro">${esc(s.micro)}</p>
      </section>
    `;
  }

  function renderPlan(s) {
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
      <section class="dx-screen dx-plan" aria-labelledby="dx-title">
        <p class="dx-eyebrow">${esc(s.eyebrow)}</p>
        <h1 id="dx-title" class="dx-title">${esc(s.title)}</h1>
        <p class="dx-body">${esc(s.body)}</p>
        ${points ? `<ul class="dx-points">${points}</ul>` : ''}
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
    const preferred = diagnosisReviewIds(state.diagnosisId);
    const reviews = pickUnusedReviews(preferred, state.usedReviews, 2);
    reviews.forEach(markReviewUsed);
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

        <div class="dx-objections" aria-label="Dudas frecuentes">
          ${objections}
        </div>

        <a
          class="dx-btn dx-btn-primary dx-btn-checkout"
          href="${esc(withAbCheckoutParam(CHECKOUT_URL))}"
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
