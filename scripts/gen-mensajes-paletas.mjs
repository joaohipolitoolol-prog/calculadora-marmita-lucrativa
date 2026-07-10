/** One-time generator: content.py MENSAJES → mensajes-paletas.json */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const py = readFileSync(path.join(ROOT, 'paletas-de-whatsapp/build/content.py'), 'utf8');

const CAT = {
  menu: 'A) Mensajes para anunciar menú',
  status: 'B) Mensajes de estado / story',
  promo: 'C) Mensajes de promoción de fin de semana',
  clientes: 'D) Mensajes para clientes antiguos',
  ultimas: 'E) Mensajes de últimas unidades',
  pedidos: 'F) Mensajes para pedidos',
  faq: 'G) Respuestas a preguntas frecuentes',
};

const out = [];
for (const [key, categoria] of Object.entries(CAT)) {
  const re = new RegExp(`"${key}":\\s*\\[([\\s\\S]*?)\\]`, 'm');
  const m = py.match(re);
  if (!m) continue;
  const strings = [...m[1].matchAll(/"((?:[^"\\\\]|\\\\.)*)"/g)].map((x) =>
    x[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  );
  strings.forEach((texto) => out.push({ categoria, texto }));
}

writeFileSync(path.join(ROOT, 'src/data/mensajes-paletas.json'), JSON.stringify(out, null, 2) + '\n');
console.log('Wrote', out.length, 'mensajes');
