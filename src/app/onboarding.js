import { ICONS } from './icons.js';

export const ONBOARDING_KEY = 'marmita_onboarding_v1';

const SLIDES = [
  {
    icon: 'logo',
    title: 'Sua calculadora de lucro',
    body: 'Descubra quanto sobra de verdade em cada marmita — com custos que quase ninguém coloca na conta.',
    highlight: null,
  },
  {
    icon: 'zap',
    title: 'Comece no modo rápido',
    body: 'Coloque o preço de venda e os custos <strong>de cada marmita</strong>: ingredientes, embalagem, gás, entrega e desperdício.',
    highlight: 'Preencha os campos na tela Calcular. Leva cerca de 2 minutos.',
  },
  {
    icon: 'chart',
    title: 'Lucro atualiza ao vivo',
    body: 'Enquanto você digita, o card de resumo mostra custo, lucro e margem. O valor no topo também muda na hora.',
    highlight: 'Fique de olho no card branco abaixo do modo Rápido/Completo.',
  },
  {
    icon: 'dollar',
    title: 'Veja o preço ideal',
    body: 'Toque em <strong>Ver meu lucro</strong> e confira o preço recomendado para bater sua margem meta.',
    highlight: 'Use "Usar este preço" para aplicar o valor sugerido automaticamente.',
  },
  {
    icon: 'save',
    title: 'Salve e compare cenários',
    body: 'Testou com entrega? Sem entrega? Salve cada combinação com um nome e carregue depois para comparar.',
    highlight: null,
  },
  {
    icon: 'book',
    title: 'Cardápio de 30 dias',
    body: 'Precisa variar o menu? Abra <strong>Cardápio</strong> no menu de baixo — ideias prontas com dicas de custo.',
    highlight: 'Use a barra inferior ou o menu ☰ para navegar.',
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
  root.setAttribute('aria-label', 'Tutorial da calculadora');

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
          <button type="button" class="onboarding-skip" id="onboarding-skip">Pular</button>

          <div class="onboarding-visual ${slide.icon === 'logo' ? 'is-logo' : ''}">
            ${iconHtml}
          </div>

          <div class="onboarding-progress" aria-hidden="true">
            ${SLIDES.map((_, i) => `<span class="onboarding-dot ${i === index ? 'active' : i < index ? 'done' : ''}"></span>`).join('')}
          </div>

          <p class="onboarding-step-label">Passo ${index + 1} de ${SLIDES.length}</p>
          <h2 class="onboarding-title">${slide.title}</h2>
          <p class="onboarding-body">${slide.body}</p>
          ${slide.highlight ? `<div class="onboarding-tip">${ICONS.info}<span>${slide.highlight}</span></div>` : ''}

          <div class="onboarding-actions">
            ${!isFirst ? `<button type="button" class="btn btn-ghost onboarding-back" id="onboarding-back">${ICONS.chevronLeft}<span>Voltar</span></button>` : '<span></span>'}
            <button type="button" class="btn btn-primary onboarding-next" id="onboarding-next">
              ${isLast ? '<span>Começar a calcular</span>' : `<span>Próximo</span>${ICONS.chevronRight}`}
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
