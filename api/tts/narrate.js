import { TTS_AUDIO_CONFIG, TTS_VOICE_CANDIDATES } from '../../server/lib/tts-voices.js';

const MAX_TEXT_LENGTH = 4800;

function getApiKey() {
  return process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || '';
}

async function synthesizeOnce(apiKey, text, voice, audioConfig) {
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
        },
        audioConfig,
      }),
    }
  );

  const payload = await response.json().catch(() => ({}));
  return { response, payload, voice };
}

function isVoiceRetryable(message = '') {
  return /voice|not found|invalid|does not exist|unsupported/i.test(message);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(503).json({ error: 'TTS no configurado (GOOGLE_TTS_API_KEY)' });
  }

  try {
    const body = req.body || {};
    const text = String(body.text || '').trim();

    if (!text) {
      return res.status(400).json({ error: 'text requerido' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: 'texto demasiado largo' });
    }

    const audioConfig = { ...TTS_AUDIO_CONFIG, ...(body.audioConfig || {}) };
    const preferred = body.voice?.name ? body.voice : null;
    const candidates = preferred
      ? [preferred, ...TTS_VOICE_CANDIDATES.filter((v) => v.name !== preferred.name)]
      : TTS_VOICE_CANDIDATES;

    let lastError = 'Error al sintetizar audio';

    for (const voice of candidates) {
      const { response, payload } = await synthesizeOnce(apiKey, text, voice, audioConfig);

      if (response.ok && payload.audioContent) {
        res.setHeader('Cache-Control', 'private, max-age=86400');
        return res.status(200).json({
          audioContent: payload.audioContent,
          voice: voice.name,
          languageCode: voice.languageCode,
          encoding: audioConfig.audioEncoding || 'MP3',
        });
      }

      lastError = payload?.error?.message || lastError;

      if (!isVoiceRetryable(lastError)) {
        break;
      }
    }

    if (/API_KEY|referer|permission|billing|enable/i.test(lastError)) {
      return res.status(502).json({
        error:
          'Google TTS no disponible. Verifica que la API Text-to-Speech esté activa, con billing, y que la clave no esté restringida solo a navegador.',
        detail: lastError,
      });
    }

    return res.status(502).json({ error: lastError });
  } catch (err) {
    console.error('[tts/narrate]', err);
    return res.status(500).json({ error: 'Error interno TTS' });
  }
}
