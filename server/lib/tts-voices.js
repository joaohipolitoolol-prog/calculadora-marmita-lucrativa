/** Voces femeninas en español, de más natural a fallback */
export const TTS_VOICE_CANDIDATES = [
  { languageCode: 'es-MX', name: 'es-MX-Neural2-A' },
  { languageCode: 'es-US', name: 'es-US-Neural2-A' },
  { languageCode: 'es-ES', name: 'es-ES-Neural2-F' },
  { languageCode: 'es-MX', name: 'es-MX-Wavenet-A' },
  { languageCode: 'es-US', name: 'es-US-Wavenet-A' },
  { languageCode: 'es-ES', name: 'es-ES-Wavenet-C' },
];

export const TTS_AUDIO_CONFIG = {
  audioEncoding: 'MP3',
  speakingRate: 0.92,
  pitch: 0.5,
  volumeGainDb: 0,
};
