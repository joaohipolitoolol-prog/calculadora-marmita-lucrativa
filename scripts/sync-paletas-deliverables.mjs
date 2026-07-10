/**
 * Sync Paletas deliverables: JSON (app) → content.py → HTML/PDF via build.py
 */
import { readFileSync, writeFileSync, cpSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function pyQuote(str) {
  return JSON.stringify(String(str));
}

function pyList(arr) {
  return `[${arr.map((s) => pyQuote(s)).join(', ')}]`;
}

function recipeToPy(r) {
  const num = r.num ?? r.dia;
  const lines = [
    '    {',
    `        "num": ${num}, "nombre": ${pyQuote(r.nombre)}, "tipo": ${pyQuote(r.tipo)}, "dificultad": ${pyQuote(r.dificultad)},`,
    `        "prep": ${pyQuote(r.prep)}, "congelacion": ${pyQuote(r.congelacion)}, "rendimiento": ${pyQuote(r.rendimiento)},`,
    `        "ingredientes": ${pyList(r.ingredientes)},`,
    `        "pasos": ${pyList(r.pasos)},`,
    `        "consejo": ${pyQuote(r.consejo || r.dica || '')}`,
    '    }',
  ];
  return lines.join('\n');
}

function replaceBlock(source, name, body) {
  const re = new RegExp(`^${name} = \\[[\\s\\S]*?^\\]`, 'm');
  if (!re.test(source)) throw new Error(`Block ${name} not found`);
  return source.replace(re, `${name} = [\n${body}\n]`);
}

function syncRecetas(contentPath, jsonPath, blockName = 'RECETAS') {
  const recipes = JSON.parse(readFileSync(jsonPath, 'utf8'));
  let py = readFileSync(contentPath, 'utf8');
  const body = recipes.map((r) => recipeToPy(r)).join(',\n');
  py = replaceBlock(py, blockName, body);
  writeFileSync(contentPath, py);
  console.log(`✓ ${blockName} ← ${path.relative(ROOT, jsonPath)} (${recipes.length} recetas)`);
}

function mensajesJsonToPy(mensajes) {
  const groups = {};
  const catToKey = {
    'A) Mensajes para anunciar menú': 'menu',
    'B) Mensajes de estado / story': 'status',
    'C) Mensajes de promoción de fin de semana': 'promo',
    'D) Mensajes para clientes antiguos': 'clientes',
    'E) Mensajes de últimas unidades': 'ultimas',
    'F) Mensajes para pedidos': 'pedidos',
    'G) Respuestas a preguntas frecuentes': 'faq',
  };
  for (const m of mensajes) {
    const key = catToKey[m.categoria];
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m.texto);
  }
  const order = ['menu', 'status', 'promo', 'clientes', 'ultimas', 'pedidos', 'faq'];
  const lines = ['MENSAJES = {'];
  for (const key of order) {
    const items = groups[key] || [];
    lines.push(`    "${key}": [`);
    items.forEach((t, i) => {
      lines.push(`        ${pyQuote(t)}${i < items.length - 1 ? ',' : ''}`);
    });
    lines.push('    ],');
  }
  lines.push('}');
  return lines.join('\n');
}

function syncMensajes(contentPath, jsonPath) {
  const mensajes = JSON.parse(readFileSync(jsonPath, 'utf8'));
  let py = readFileSync(contentPath, 'utf8');
  const block = mensajesJsonToPy(mensajes);
  py = py.replace(/^MENSAJES = \{[\s\S]*?^\}/m, block);
  writeFileSync(contentPath, py);
  console.log(`✓ MENSAJES ← ${path.relative(ROOT, jsonPath)} (${mensajes.length} mensajes)`);
}

// ── Run ──
const baseContent = path.join(ROOT, 'paletas-de-whatsapp/build/content.py');
const premContent = path.join(ROOT, 'paletas-premium/build/content_premium.py');
const baseJson = path.join(ROOT, 'src/data/recetas-paletas.json');
const premJson = path.join(ROOT, 'src/data/recetas-premium.json');
const mensajesJson = path.join(ROOT, 'src/data/mensajes-paletas.json');

syncRecetas(baseContent, baseJson, 'RECETAS');
syncRecetas(premContent, premJson, 'RECETAS_PREMIUM');
syncMensajes(baseContent, mensajesJson);

// Premium JSON (app source for native sections)
const premMensajesJson = path.join(ROOT, 'src/data/mensajes-paletas-premium.json');
const premFechasJson = path.join(ROOT, 'src/data/fechas-paletas-premium.json');
const premGuiaJson = path.join(ROOT, 'src/data/guia-paletas-premium.json');

function syncPremiumMensajes(contentPath, jsonPath) {
  const mensajes = JSON.parse(readFileSync(jsonPath, 'utf8'));
  let py = readFileSync(contentPath, 'utf8');
  const catToKey = {
    Combos: 'combos',
    Especiales: 'especiales',
    Fechas: 'fechas',
    Valor: 'valor',
  };
  const groups = {};
  for (const m of mensajes) {
    const key = catToKey[m.categoria];
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m.texto);
  }
  const order = ['combos', 'especiales', 'fechas', 'valor'];
  const lines = ['MENSAJES_PREMIUM = {'];
  for (const key of order) {
    const items = groups[key] || [];
    lines.push(`    "${key}": [`);
    items.forEach((t, i) => lines.push(`        ${pyQuote(t)}${i < items.length - 1 ? ',' : ''}`));
    lines.push('    ],');
  }
  lines.push('}');
  py = py.replace(/^MENSAJES_PREMIUM = \{[\s\S]*?^\}/m, lines.join('\n'));
  writeFileSync(contentPath, py);
  console.log(`✓ MENSAJES_PREMIUM ← ${path.relative(ROOT, jsonPath)}`);
}

function syncPremiumFechas(contentPath, jsonPath) {
  const fechas = JSON.parse(readFileSync(jsonPath, 'utf8'));
  let py = readFileSync(contentPath, 'utf8');
  const body = fechas
    .map(
      (f) =>
        `    {"fecha": ${pyQuote(f.fecha)}, "ideas": ${pyList(f.ideas)}, "promo": ${pyQuote(f.promo)}}`
    )
    .join(',\n');
  py = replaceBlock(py, 'FECHAS_ESPECIALES', body);
  writeFileSync(contentPath, py);
  console.log(`✓ FECHAS_ESPECIALES ← ${path.relative(ROOT, jsonPath)}`);
}

function syncPremiumGuia(contentPath, jsonPath) {
  const guia = JSON.parse(readFileSync(jsonPath, 'utf8'));
  let py = readFileSync(contentPath, 'utf8');
  const keys = { 'Fotos que venden': 'fotos', 'Nombres en el menú': 'nombres', Empaque: 'empaque', 'Precios premium': 'precios' };
  const obj = {};
  for (const sec of guia) {
    const key = keys[sec.titulo];
    if (key) obj[key] = sec.items;
  }
  const lines = ['GUIA_PRESENTACION = {'];
  for (const [key, items] of Object.entries(obj)) {
    lines.push(`    "${key}": ${pyList(items)},`);
  }
  lines.push('}');
  py = py.replace(/^GUIA_PRESENTACION = \{[\s\S]*?^\}/m, lines.join('\n'));
  writeFileSync(contentPath, py);
  console.log(`✓ GUIA_PRESENTACION ← ${path.relative(ROOT, jsonPath)}`);
}

syncPremiumMensajes(premContent, premMensajesJson);
syncPremiumFechas(premContent, premFechasJson);
syncPremiumGuia(premContent, premGuiaJson);

const builds = [
  ['paletas-de-whatsapp/build/build.py', 'paletas-de-whatsapp/produto'],
  ['paletas-premium/build/build_premium.py', 'paletas-premium/produto'],
];

for (const [script, out] of builds) {
  const dir = path.join(ROOT, path.dirname(script));
  console.log(`\n▶ python ${script}`);
  execSync(`python "${path.join(ROOT, script)}"`, { cwd: dir, stdio: 'inherit' });
  console.log(`✓ Built → ${out}`);
}

// Copy produto → public
const copies = [
  ['paletas-de-whatsapp/produto', 'public/paletas-de-whatsapp/produto'],
  ['paletas-premium/produto', 'public/paletas-premium/produto'],
];
for (const [from, to] of copies) {
  const src = path.join(ROOT, from);
  const dest = path.join(ROOT, to);
  cpSync(src, dest, { recursive: true });
  console.log(`✓ Copied ${from} → ${to}`);
}

console.log('\nDone.');
