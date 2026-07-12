/**
 * Notificações WhatsApp — 1 por tela, abaixo do header, sem overlap.
 */

const PEDIDOS = [
  { who: 'Laura', text: 'Nuevo pedido' },
  { who: 'Andrea', text: 'Nuevo mensaje' },
  { who: 'Sofía', text: 'Te escribió' },
  { who: 'Valeria', text: 'Nuevo pedido' },
  { who: 'Camila', text: 'Quiere comprar' },
  { who: 'Daniela', text: 'Nuevo mensaje' },
  { who: 'Mariana', text: 'Nuevo pedido' },
  { who: 'Paula', text: 'Te escribió' },
];

/** Todas as telas depois do welcome */
const TOAST_SCREENS = new Set([
  'q_experience',
  'q_goal',
  'affirm_1',
  'q_blocker',
  'q_name',
  'q_cooking',
  'q_whatsapp',
  'q_speed',
  'affirm_2',
  // Sem toast em loading/diagnosis/offer — não competir com o “diagnóstico”
  'simulation',
  'insight',
  'kit_match',
  'trust',
]);

const WA_ICON = `
  <svg class="dx-toast-wa" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#fff" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.92-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56 1.17 1.79 2.93 3.04 3.1 3.18.15.12 1.34.89 2.72.89 1.11 0 1.87-.33 2.27-.77.29-.32.58-.94.66-1.14.08-.2.08-.37.05-.52-.03-.14-.12-.23-.25-.31l-1.06-.52c-.12-.06-.29-.09-.45.09-.16.17-.62.74-.76.89-.14.14-.28.16-.51.05-.24-.1-.98-.36-1.87-1.15-.69-.61-1.15-1.37-1.29-1.6-.13-.24-.01-.37.1-.49.1-.1.22-.26.33-.39.11-.14.14-.23.22-.39.07-.16.03-.31-.02-.43-.05-.12-.48-1.14-.66-1.56-.17-.41-.35-.35-.48-.36z"/>
  </svg>
`;

export function createPedidoToasts(root, { reducedMotion = false } = {}) {
  // Sempre no body (topo da tela = celular real)
  root.querySelectorAll('[data-toast-layer]').forEach((el) => el.remove());
  let layer = document.body.querySelector(':scope > .dx-toast-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'dx-toast-layer';
    layer.setAttribute('data-toast-layer', '');
    layer.setAttribute('aria-live', 'polite');
    document.body.appendChild(layer);
  }

  let cursor = Math.floor(Math.random() * PEDIDOS.length);
  let count = 0;
  let lastScreen = '';
  let hideTimer = null;
  let removeTimer = null;
  let currentEl = null;
  let audioCtx = null;
  let audioReady = false;

  function unlockAudio() {
    audioReady = true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch {
      /* ignore */
    }
  }

  function playWaSound() {
    if (!audioReady || reducedMotion) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const t0 = audioCtx.currentTime;
      const freqs = [880, 1180];
      freqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        const start = t0 + i * 0.07;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        filter.type = 'lowpass';
        filter.frequency.value = 2200;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.028, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch {
      /* ignore */
    }
  }

  function clearCurrent() {
    if (hideTimer) clearTimeout(hideTimer);
    if (removeTimer) clearTimeout(removeTimer);
    hideTimer = null;
    removeTimer = null;
    if (currentEl) {
      currentEl.remove();
      currentEl = null;
    }
    layer.replaceChildren();
  }

  function show(screenId) {
    if (!TOAST_SCREENS.has(screenId)) return count;
    // 1 notificação por tela — evita double-fire answer+goNext
    if (screenId === lastScreen) return count;
    lastScreen = screenId;

    clearCurrent();

    const pedido = PEDIDOS[cursor % PEDIDOS.length];
    cursor += 1;
    count += 1;

    const el = document.createElement('div');
    el.className = 'dx-toast';
    el.innerHTML = `
      <span class="dx-toast-icon" aria-hidden="true">${WA_ICON}</span>
      <span class="dx-toast-body">
        <span class="dx-toast-app">WhatsApp</span>
        <span class="dx-toast-line"><strong>${escapeHtml(pedido.who)}</strong> · ${escapeHtml(pedido.text)}</span>
      </span>
      <span class="dx-toast-now">ahora</span>
    `;
    layer.appendChild(el);
    currentEl = el;
    playWaSound();

    requestAnimationFrame(() => el.classList.add('is-in'));

    hideTimer = setTimeout(() => {
      el.classList.remove('is-in');
      el.classList.add('is-out');
      removeTimer = setTimeout(() => {
        if (currentEl === el) {
          el.remove();
          currentEl = null;
        }
      }, 380);
    }, 2400);

    return count;
  }

  return {
    show,
    clear: clearCurrent,
    unlockAudio,
    getCount: () => count,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
