import { TTS_VOICE } from './tts-config.js';

const audioCache = new Map();
let currentAudio = null;
let currentUtterance = null;
let playToken = 0;
let handlersReady = false;
let getRecipeContextRef = () => null;
let appRootRef = null;

let state = {
  key: null,
  recipeName: '',
  status: 'idle',
  stepIndex: null,
  chunkLabel: '',
  mode: 'idle',
};

let onStateChange = null;

const FETCH_TIMEOUT_MS = 12000;

function emit() {
  onStateChange?.({ ...state });
}

function getRoot() {
  return appRootRef || document.getElementById('app-root') || document;
}

function base64ToBlob(base64, mime = 'audio/mpeg') {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function recipeStableKey(item, { lineId, premium = false } = {}) {
  const id = item.id || item.dia || item.num || item.nombre;
  return `${lineId || 'kit'}-${premium ? 'premium' : 'base'}-${id}`;
}

function coldLabel(lineId) {
  return lineId === 'postres' ? 'refrigeración' : 'frío';
}

export function buildGuidedChunks(item, lineId = 'paletas') {
  const meta = {
    prep: item.prep || '—',
    cold: item.congelacion || '—',
    yield: item.rendimiento || item.porciones || '—',
    tip: item.consejo || item.tip || '',
  };

  const chunks = [];
  const introParts = [
    `Hoy preparamos ${item.nombre}.`,
    item.descripcion ? item.descripcion : '',
    `Receta ${item.tipo || ''}, dificultad ${item.dificultad || 'fácil'}.`,
    `Preparación ${meta.prep}. Tiempo de ${coldLabel(lineId)}: ${meta.cold}. Rinde ${meta.yield}.`,
  ].filter(Boolean);

  chunks.push({
    id: 'intro',
    label: 'Introducción',
    stepIndex: null,
    text: introParts.join(' '),
  });

  const ingredients = item.ingredientes || [];
  if (ingredients.length) {
    const list = ingredients
      .map((ing, i) => `${i + 1}. ${ing.replace(/\.$/, '')}`)
      .join('. ');
    chunks.push({
      id: 'ingredients',
      label: 'Ingredientes',
      stepIndex: null,
      text: `Ingredientes. Necesitarás: ${list}.`,
    });
  }

  (item.pasos || []).forEach((step, index) => {
    chunks.push({
      id: `step-${index}`,
      label: `Paso ${index + 1}`,
      stepIndex: index,
      text: `Paso ${index + 1}. ${step.replace(/\.$/, '')}.`,
    });
  });

  if (meta.tip) {
    chunks.push({
      id: 'tip',
      label: 'Tip de venta',
      stepIndex: null,
      text: `Tip de venta: ${meta.tip}`,
    });
  }

  return chunks;
}

function hashText(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchAudioUrl(text, cacheKey) {
  const key = `${cacheKey}::${hashText(text)}`;
  if (audioCache.has(key)) return { url: audioCache.get(key), mode: 'api' };

  const res = await fetchWithTimeout('/api/tts/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: TTS_VOICE }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'No se pudo generar el audio');
  }

  const blob = base64ToBlob(payload.audioContent);
  const url = URL.createObjectURL(blob);
  audioCache.set(key, url);
  return { url, mode: 'api' };
}

function warmSpeechVoices() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
}

function pickSpanishVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return (
    voices.find(
      (v) =>
        v.lang.startsWith('es') &&
        /Google español|Paulina|Helena|Lucia|Mónica|Monica|español de Estados Unidos|español de México/i.test(
          v.name
        )
    ) || voices.find((v) => v.lang.startsWith('es'))
  );
}

function playUrl(url, token) {
  return new Promise((resolve, reject) => {
    if (token !== playToken) {
      resolve('cancelled');
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      resolve('ended');
    };
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      reject(new Error('Error al reproducir audio'));
    };

    audio.play().catch(reject);
  });
}

function speakWithWebSpeech(text, token) {
  return new Promise((resolve, reject) => {
    if (token !== playToken) {
      resolve('cancelled');
      return;
    }

    if (!window.speechSynthesis) {
      reject(new Error('Audio no disponible en este navegador'));
      return;
    }

    window.speechSynthesis.cancel();
    warmSpeechVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickSpanishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'es-MX';
    utterance.rate = 0.92;
    utterance.pitch = 1;

    currentUtterance = utterance;

    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
      resolve('ended');
    };
    utterance.onerror = (event) => {
      if (currentUtterance === utterance) currentUtterance = null;
      if (event.error === 'interrupted' || event.error === 'canceled') {
        resolve('cancelled');
        return;
      }
      reject(new Error('Error al narrar con la voz del dispositivo'));
    };

    window.speechSynthesis.speak(utterance);
  });
}

async function playChunk(text, cacheKey, token, preferSpeech) {
  if (token !== playToken) return 'cancelled';

  if (preferSpeech) {
    state = { ...state, mode: 'speech' };
    return speakWithWebSpeech(text, token);
  }

  try {
    const { url } = await fetchAudioUrl(text, cacheKey);
    state = { ...state, mode: 'api' };
    return playUrl(url, token);
  } catch (apiErr) {
    console.warn('[recipe-narration] API TTS no disponible, usando voz del dispositivo', apiErr);
    state = { ...state, mode: 'speech' };
    return speakWithWebSpeech(text, token);
  }
}

export function stopRecipeNarration() {
  playToken += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
  state = {
    key: null,
    recipeName: '',
    status: 'idle',
    stepIndex: null,
    chunkLabel: '',
    mode: 'idle',
  };
  emit();
}

export function getNarrationState() {
  return { ...state };
}

export function initRecipeNarration({ onChange } = {}) {
  onStateChange = onChange || null;
}

export function setRecipeNarrationContext({ getRecipeContext, root } = {}) {
  if (typeof getRecipeContext === 'function') {
    getRecipeContextRef = getRecipeContext;
  }
  if (root) appRootRef = root;
}

function highlightStep(detailsEl, stepIndex) {
  if (!detailsEl) return;
  detailsEl.querySelectorAll('[data-recipe-step]').forEach((li) => {
    li.classList.toggle(
      'menu-item-step--active',
      stepIndex != null && Number(li.dataset.recipeStep) === stepIndex
    );
  });
  detailsEl.querySelectorAll('[data-recipe-section]').forEach((el) => {
    el.classList.remove('menu-item-section--active');
  });
  if (stepIndex == null) {
    detailsEl.querySelector('[data-recipe-section="ingredients"]')?.classList.add('menu-item-section--active');
  }
}

function clearHighlights(root) {
  root?.querySelectorAll('.menu-item-step--active, .menu-item-section--active').forEach((el) => {
    el.classList.remove('menu-item-step--active', 'menu-item-section--active');
  });
}

export function syncRecipeNarrationUi(root = getRoot()) {
  const { key, status } = state;
  root.querySelectorAll('[data-recipe-play]').forEach((btn) => {
    const isActive = Boolean(
      key && btn.dataset.recipePlay === key && (status === 'playing' || status === 'loading')
    );
    const isLoading = Boolean(key && btn.dataset.recipePlay === key && status === 'loading');
    const isPlaying = Boolean(key && btn.dataset.recipePlay === key && status === 'playing');

    btn.classList.toggle('is-playing', isPlaying);
    btn.classList.toggle('is-loading', isLoading);
    btn.setAttribute('aria-pressed', String(isActive));
    btn.setAttribute(
      'aria-label',
      isLoading ? 'Generando audio…' : isPlaying ? 'Pausar audio guiado' : 'Escuchar receta en modo audio guiado'
    );
  });

  const bar = root.getElementById('recipe-audio-bar');
  if (bar) {
    const visible = status === 'loading' || status === 'playing';
    bar.hidden = !visible;
    if (visible) {
      bar.querySelector('[data-audio-recipe-name]').textContent = state.recipeName || 'Receta';
      bar.querySelector('[data-audio-step-label]').textContent = state.chunkLabel || '';
    }
  }
}

export async function toggleRecipeNarration(item, { lineId, premium = false, root = getRoot() } = {}) {
  const key = recipeStableKey(item, { lineId, premium });
  const detailsEl = root.querySelector(`[data-recipe-key="${CSS.escape(key)}"]`);

  if (state.key === key && (state.status === 'playing' || state.status === 'loading')) {
    stopRecipeNarration();
    clearHighlights(root);
    syncRecipeNarrationUi(root);
    return;
  }

  stopRecipeNarration();
  clearHighlights(root);

  const token = playToken;
  state = {
    key,
    recipeName: item.nombre || 'Receta',
    status: 'loading',
    stepIndex: null,
    chunkLabel: 'Preparando voz…',
    mode: 'idle',
  };
  emit();
  syncRecipeNarrationUi(root);

  if (detailsEl) {
    detailsEl.open = true;
    detailsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  warmSpeechVoices();
  const chunks = buildGuidedChunks(item, lineId);
  let preferSpeech = false;
  let nextPrefetch =
    chunks.length > 1 && !preferSpeech
      ? fetchAudioUrl(chunks[1].text, `${key}-${chunks[1].id}`).catch(() => null)
      : null;

  try {
    for (let i = 0; i < chunks.length; i += 1) {
      if (token !== playToken) break;

      const chunk = chunks[i];

      state = {
        ...state,
        status: 'playing',
        stepIndex: chunk.stepIndex,
        chunkLabel: chunk.label,
      };
      emit();
      highlightStep(detailsEl, chunk.stepIndex);
      syncRecipeNarrationUi(root);

      if (chunk.stepIndex != null) {
        const stepEl = detailsEl?.querySelector(`[data-recipe-step="${chunk.stepIndex}"]`);
        stepEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      let result = 'cancelled';

      if (preferSpeech) {
        result = await speakWithWebSpeech(chunk.text, token);
      } else if (i === 0) {
        result = await playChunk(chunk.text, `${key}-${chunk.id}`, token, false);
        if (state.mode === 'speech') preferSpeech = true;
      } else {
        try {
          const prefetched = await nextPrefetch;
          nextPrefetch = null;
          if (!prefetched?.url) throw new Error('prefetch failed');
          state = { ...state, mode: 'api' };
          result = await playUrl(prefetched.url, token);
        } catch {
          preferSpeech = true;
          result = await speakWithWebSpeech(chunk.text, token);
        }
      }

      const upcoming = chunks[i + 1];
      if (!preferSpeech && upcoming) {
        nextPrefetch = fetchAudioUrl(upcoming.text, `${key}-${upcoming.id}`).catch(() => null);
      } else {
        nextPrefetch = null;
      }

      if (result === 'cancelled' || token !== playToken) break;
      if (i < chunks.length - 1) await wait(250);
    }
  } catch (err) {
    stopRecipeNarration();
    clearHighlights(root);
    syncRecipeNarrationUi(root);
    throw err;
  }

  if (token === playToken) {
    stopRecipeNarration();
    clearHighlights(root);
    syncRecipeNarrationUi(root);
  }
}

async function handleRecipePlayClick(event) {
  const btn = event.target.closest('[data-recipe-play]');
  if (!btn) return;

  event.preventDefault();
  event.stopPropagation();

  const key = btn.dataset.recipePlay;
  const item = getRecipeContextRef(key);
  if (!item) return;

  try {
    await toggleRecipeNarration(item, {
      lineId: item.__lineId,
      premium: item.__premium,
      root: getRoot(),
    });
  } catch (err) {
    console.error('[recipe-narration]', err);
    window.alert?.(err.message || 'No se pudo reproducir el audio. Intenta de nuevo.');
  }
}

function handleRecipeAudioStop() {
  stopRecipeNarration();
  clearHighlights(getRoot());
  syncRecipeNarrationUi(getRoot());
}

export function setupRecipeNarration({ getRecipeContext, root } = {}) {
  setRecipeNarrationContext({ getRecipeContext, root });

  if (handlersReady) return;
  handlersReady = true;

  const host = getRoot();
  host.addEventListener('click', (event) => {
    if (event.target.closest('[data-recipe-play]')) {
      handleRecipePlayClick(event);
      return;
    }
    if (event.target.closest('#recipe-audio-stop')) {
      handleRecipeAudioStop();
    }
  });

  warmSpeechVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = warmSpeechVoices;
  }
}

/** @deprecated use setupRecipeNarration — evita listeners duplicados */
export function bindRecipeNarration(root, options = {}) {
  setupRecipeNarration({ ...options, root });
}
