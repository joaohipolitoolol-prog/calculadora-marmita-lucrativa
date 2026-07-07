import { BRAND_KIT } from '../site/brand.js';
import { ICONS } from './icons.js';

export const ONBOARDING_KEY = 'paletas_onboarding_v1';

const SLIDES = [
  {
    icon: 'logo',
    title: `Tu ${BRAND_KIT}`,
    body: 'Recetas, calculadora de precios, menú y mensajes listos para empezar a vender desde casa.',
    highlight: null,
  },
  {
    icon: 'zap',
    title: 'Empieza en modo rápido',
    body: 'Coloca el precio de venta y los costos <strong>de cada paleta</strong>: ingredientes, empaque, extras, entrega y desperdicio.',
    highlight: 'Completa los campos en Precios. Toma unos 2 minutos.',
  },
  {
    icon: 'chart',
    title: 'Ganancia en vivo',
    body: 'Mientras escribes, el resumen muestra costo, ganancia y margen. El valor arriba también cambia al instante.',
    highlight: 'Mira el card de resumen debajo del modo Rápido/Completo.',
  },
  {
    icon: 'dollar',
    title: 'Mira el precio sugerido',
    body: 'Toca <strong>Ver mi ganancia</strong> y revisa el precio recomendado para alcanzar tu margen meta.',
    highlight: 'Usa "Aplicar este precio" para usar el valor sugerido.',
  },
  {
    icon: 'book',
    title: '30 recetas de paletas',
    body: 'Abre <strong>Recetas</strong> en el menú de abajo — cremosas, frutales, rellenas y estilo postre.',
    highlight: 'Busca por nombre o tipo de paleta.',
  },
  {
    icon: 'message',
    title: 'Mensajes y plan de 7 días',
    body: 'En <strong>Vender</strong> encuentras mensajes, combos premium, plan semanal, PDFs y checklist de producción.',
    highlight: 'Copia los mensajes y publícalos en tu estado.',
  },
];

export function hasSeenOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function markOnboardingSeen() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

export function clearOnboardingSeen() {
  localStorage.removeItem(ONBOARDING_KEY);
}

export function showOnboarding({ onFinish } = {}) {
  if (document.getElementById('onboarding-root')) return;

  let index = 0;
  const root = document.createElement('div');
  root.id = 'onboarding-root';
  root.className = 'onboarding-overlay';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Tutorial del kit');

  document.body.appendChild(root);
  document.body.classList.add('onboarding-open');

  function finish() {
    markOnboardingSeen();
    root.remove();
    document.body.classList.remove('onboarding-open');
    onFinish?.();
  }

  function renderSlide() {
    const slide = SLIDES[index];
    const iconHtml = slide.icon === 'logo' ? ICONS.logo : ICONS[slide.icon] || ICONS.info;
    const isFirst = index === 0;
    const isLast = index === SLIDES.length - 1;

    root.innerHTML = `
      <div class="onboarding-shell">
        <div class="onboarding-card">
          <button type="button" class="onboarding-skip" id="onboarding-skip">Saltar</button>

          <div class="onboarding-visual ${slide.icon === 'logo' ? 'is-logo' : ''}">
            ${iconHtml}
          </div>

          <div class="onboarding-progress" aria-hidden="true">
            ${SLIDES.map((_, i) => `<span class="onboarding-dot ${i === index ? 'active' : i < index ? 'done' : ''}"></span>`).join('')}
          </div>

          <p class="onboarding-step-label">Paso ${index + 1} de ${SLIDES.length}</p>
          <h2 class="onboarding-title">${slide.title}</h2>
          <p class="onboarding-body">${slide.body}</p>
          ${slide.highlight ? `<div class="onboarding-tip">${ICONS.info}<span>${slide.highlight}</span></div>` : ''}

          <div class="onboarding-actions">
            ${!isFirst ? `<button type="button" class="btn btn-ghost onboarding-back" id="onboarding-back">${ICONS.chevronLeft}<span>Atrás</span></button>` : '<span></span>'}
            <button type="button" class="btn btn-primary onboarding-next" id="onboarding-next">
              ${isLast ? '<span>Empezar ahora</span>' : `<span>Siguiente</span>${ICONS.chevronRight}`}
            </button>
          </div>
        </div>
      </div>
    `;

    root.querySelector('#onboarding-skip')?.addEventListener('click', finish);
    root.querySelector('#onboarding-back')?.addEventListener('click', () => {
      index -= 1;
      renderSlide();
    });
    root.querySelector('#onboarding-next')?.addEventListener('click', () => {
      if (isLast) finish();
      else {
        index += 1;
        renderSlide();
      }
    });
  }

  renderSlide();
}
