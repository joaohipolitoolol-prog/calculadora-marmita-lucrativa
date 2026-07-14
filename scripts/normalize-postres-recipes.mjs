import { readFileSync, writeFileSync } from 'fs';

const path = 'src/data/kit-postres.js';
let src = readFileSync(path, 'utf8');

function normalizeBlock(obj, i, premium) {
  const tiempo = obj.tiempo || (obj.prep && obj.congelacion ? `${obj.prep} + ${obj.congelacion}` : obj.prep) || '25 min';
  const parts = String(tiempo)
    .split('+')
    .map((s) => s.trim());
  let prep = obj.prep && obj.prep !== 'frío' ? obj.prep : parts[0] || '20 min';
  let cold = obj.congelacion && obj.congelacion !== 'frío' ? obj.congelacion : parts[1] || '';
  if (!cold || cold === 'frío') cold = '1-2 horas';
  if (prep.includes('frío')) prep = prep.replace(/\s*\+?\s*frío/i, '').trim() || '20 min';

  const out = { ...obj };
  if (!premium) out.dia = obj.dia || i + 1;
  else out.num = obj.num || i + 1;
  out.prep = prep;
  out.congelacion = cold;
  out.rendimiento = obj.rendimiento || obj.porciones || '8 vasos';
  out.consejo = obj.consejo || obj.tip || '';
  delete out.tiempo;
  delete out.porciones;
  delete out.tip;
  return out;
}

function extractArray(name) {
  const re = new RegExp(`export const ${name} = (\\[[\\s\\S]*?\\n\\];)`);
  const m = src.match(re);
  if (!m) throw new Error(`missing ${name}`);
  return { full: m[0], jsonLike: m[1] };
}

function rewrite(name, premium) {
  const { full, jsonLike } = extractArray(name);
  const arr = Function(`return (${jsonLike.replace(/;\s*$/, '')})`)();
  const normalized = arr.map((r, i) => normalizeBlock(r, i, premium));
  const pretty = JSON.stringify(normalized, null, 2).replace(/^(\s*)"([^"]+)":/gm, '$1$2:');
  const next = `export const ${name} = ${pretty};`;
  src = src.replace(full, next);
}

rewrite('RECETAS_POSTRES', false);
rewrite('RECETAS_POSTRES_PREMIUM', true);
writeFileSync(path, src);
console.log('re-normalized recipes ok');
