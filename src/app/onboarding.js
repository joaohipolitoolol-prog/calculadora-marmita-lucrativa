import { ICONS } from './icons.js';

/** Bumped when flow/copy changes so users see the updated tutorial once. */
export const ONBOARDING_KEY = 'kit_onboarding_v4_mini';

function buildSlides(brand) {
  const unit = brand?.unitSingular || 'unidad';
  const units = brand?.unitPlural || 'unidades';
  const kitName = brand?.kitName || brand?.short || 'tu kit';
  const emoji = brand?.emoji || '🍓';
  const isMini = brand?.id === 'postres';

  return [
    {
      icon: 'logo',
      title: kitName,
      body: isMini
        ? `Método de <strong>3 bases → 12 sabores</strong> sin horno, precios y mensajes para vender ${units} por WhatsApp.`
        : `Recetas, precios y mensajes para vender ${units} desde casa, todo en la app.`,
      highlight: 'Usa la barra de abajo: Inicio, Precios, Kit y Perfil.',
    },
    {
      icon: 'calc',
      title: 'Calcula en Precios',
      body: `En <strong>Precios</strong>, modo <strong>Rápido</strong>: pon el precio de venta y los costos de cada ${unit}.`,
      highlight: isMini
        ? 'Calcula antes de producir. Evita comprar ingredientes a ciegas.'
        : 'Toma unos 2 minutos. El modo Completo es opcional.',
    },
    {
      icon: 'chart',
      title: 'Mira tu ganancia',
      body: 'Toca <strong>Ver mi ganancia</strong>. Verás la ganancia por unidad, el margen y el <strong>precio sugerido</strong>.',
      highlight: 'Usa “Aplicar este precio” si quieres el valor recomendado.',
    },
    {
      icon: 'strawberry',
      title: isMini ? 'Menú 12 en el Kit' : 'Abre el Kit',
      body: isMini
        ? 'En <strong>Kit → Recetas</strong> filtra por <strong>Menú 12</strong> o por base (crema, chocolate, frutal). También hay Descargas y Vender.'
        : 'En la pestaña <strong>Kit</strong> están las <strong>Recetas</strong>, las <strong>Descargas</strong> (PDF) y <strong>Vender</strong>.',
      highlight: isMini
        ? 'Empieza con 3 o 4 sabores; el resto es ampliación.'
        : 'En Descargas toca “Kit completo” para bajar el PDF.',
    },
    {
      icon: 'message',
      title: 'Vende por WhatsApp',
      body: 'En <strong>Kit → Vender</strong> armas tu <strong>Menú WhatsApp</strong> y copias <strong>Textos listos</strong>. También hay plan de 7 días.',
      highlight: 'Usa “Más” si necesitas checklist, compras o ayuda.',
    },
  ];
}

export function hasSeenOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function markOnboardingSeen() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

export function clearOnboardingSeen() {
  localStorage.removeItem(ONBOARDING_KEY);
}

export function showOnboarding({ onFinish, brand } = {}) {
  if (document.getElementById('onboarding-root')) return;

  const slides = buildSlides(brand);
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
    const slide = slides[index];
    const iconHtml =
      slide.icon === 'logo'
        ? `<span class="app-logo-emoji" aria-hidden="true">${brand?.emoji || '🍓'}</span>`
        : ICONS[slide.icon] || ICONS.info;
    const isFirst = index === 0;
    const isLast = index === slides.length - 1;

    root.innerHTML = `
      <div class="onboarding-shell">
        <div class="onboarding-card">
          <button type="button" class="onboarding-skip" id="onboarding-skip">Saltar</button>

          <div class="onboarding-visual ${slide.icon === 'logo' || slide.icon === 'strawberry' ? 'is-logo' : ''}">
            ${iconHtml}
          </div>

          <div class="onboarding-progress" aria-hidden="true">
            ${slides.map((_, i) => `<span class="onboarding-dot ${i === index ? 'active' : i < index ? 'done' : ''}"></span>`).join('')}
          </div>

          <p class="onboarding-step-label">Paso ${index + 1} de ${slides.length}</p>
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
