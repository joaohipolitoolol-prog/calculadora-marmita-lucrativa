const text = 'Hola, hoy preparamos paletas de fresa. Paso uno, mezcla los ingredientes.';

const base = process.env.TTS_URL || 'https://paletasparawhatsapp.vercel.app/api/tts/narrate';

const res = await fetch(base, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text }),
});

const payload = await res.json().catch(() => ({}));

console.log('status:', res.status);
console.log('voice:', payload.voice);
console.log('languageCode:', payload.languageCode);
console.log('encoding:', payload.encoding);
console.log('audioLen:', payload.audioContent?.length || 0);
if (payload.error) console.log('error:', payload.error);
if (payload.detail) console.log('detail:', payload.detail);

process.exit(res.ok ? 0 : 1);
