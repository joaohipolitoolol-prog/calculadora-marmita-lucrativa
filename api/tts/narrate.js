const MAX_TEXT_LENGTH = 4800;

/** Voz feminina neural — es-US-Neural2-A (natural, latino) */
const DEFAULT_VOICE = {
  languageCode: 'es-US',
  name: 'es-US-Neural2-A',
};

const DEFAULT_AUDIO_CONFIG = {
  audioEncoding: 'MP3',
  speakingRate: 0.92,
  pitch: 0,
};

function getApiKey() {
  return process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || '';
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

    const voice = body.voice?.name ? body.voice : DEFAULT_VOICE;
    const audioConfig = { ...DEFAULT_AUDIO_CONFIG, ...(body.audioConfig || {}) };

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

    if (!response.ok) {
      const message = payload?.error?.message || 'Error al sintetizar audio';
      return res.status(response.status >= 400 ? response.status : 502).json({ error: message });
    }

    if (!payload.audioContent) {
      return res.status(502).json({ error: 'Respuesta TTS inválida' });
    }

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json({
      audioContent: payload.audioContent,
      voice: voice.name,
      encoding: audioConfig.audioEncoding || 'MP3',
    });
  } catch (err) {
    console.error('[tts/narrate]', err);
    return res.status(500).json({ error: 'Error interno TTS' });
  }
}
