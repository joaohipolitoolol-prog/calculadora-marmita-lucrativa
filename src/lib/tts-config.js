/** Google Cloud Text-to-Speech — español latino, voz femenina neural */
export const TTS_VOICE_CANDIDATES = [
  { languageCode: 'es-MX', name: 'es-MX-Neural2-A' },
  { languageCode: 'es-US', name: 'es-US-Neural2-A' },
  { languageCode: 'es-ES', name: 'es-ES-Neural2-F' },
];

/** Preferida — el servidor prueba otras si falla */
export const TTS_VOICE = TTS_VOICE_CANDIDATES[0];

export const TTS_VOICE_LABEL = 'Voz femenina · español (México)';

export const TTS_AUDIO_CONFIG = {
  audioEncoding: 'MP3',
  speakingRate: 0.92,
  pitch: 0.5,
};

/** Versión de caché — subir al cambiar voz */
export const TTS_CACHE_VERSION = 'v4';
