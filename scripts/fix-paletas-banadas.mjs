/**
 * Align Paletas recipe tipos with LP + filters:
 * - Base kit gets real Bañada recipes (dipped)
 * - Premium retags dipped recipes to Bañada
 */
import { readFileSync, writeFileSync } from 'fs';

const basePath = 'src/data/recetas-paletas.json';
const premPath = 'src/data/recetas-premium.json';

const base = JSON.parse(readFileSync(basePath, 'utf8'));
const prem = JSON.parse(readFileSync(premPath, 'utf8'));

function byDia(dia) {
  return base.find((r) => r.dia === dia);
}
function byNum(num) {
  return prem.find((r) => r.num === num);
}

// ── Base: convert 5 recipes into proper Bañadas ──
{
  const r = byDia(9);
  r.nombre = 'Paleta de chocolate bañada';
  r.tipo = 'Bañada';
  r.dificultad = 'Media';
  if (!r.ingredientes.some((i) => /chocolate.*bañ|baño|cobertura/i.test(i))) {
    r.ingredientes.push('150 g de chocolate semiamargo para bañar');
  }
  r.pasos = [
    'Prepara la base cremosa de chocolate (leche, cacao, azúcar) y cocina hasta espesar. Enfría.',
    'Vierte en moldes, congela 2 h, inserta palitos y congela hasta firmar (4-6 h).',
    'Derrite el chocolate para bañar a baño maría. Deja enfriar un poco (tibio, no caliente).',
    'Desmolda, sumerge cada paleta hasta la mitad o completa, deja escurrir sobre papel encerado.',
    'Vuelve a congelar 20-30 min para fijar el baño antes de empacar.',
  ];
  r.consejo =
    'Esta es la “chocolate bañada” del kit: úsala en fotos del menú. El baño debe estar tibio o se agrieta.';
}

{
  const r = byDia(14);
  r.nombre = 'Paleta de dulce de leche bañada';
  r.tipo = 'Bañada';
  r.dificultad = 'Media';
  if (!r.ingredientes.some((i) => /chocolate/i.test(i))) {
    r.ingredientes.push('120 g de chocolate con leche para bañar');
  }
  r.pasos = [
    ...(r.pasos || []).filter((p) => !/congela/i.test(p)).slice(0, 2),
    'Vierte en moldes, congela 2 h, inserta palitos y congela hasta firmar.',
    'Derrite chocolate con leche. Baña la mitad inferior de cada paleta.',
    'Deja escurrir y congela 20 min para fijar el baño.',
  ];
  if (r.pasos.length < 3) {
    r.pasos = [
      'Mezcla dulce de leche con crema o leche hasta textura vertible.',
      'Vierte en moldes, congela 2 h, inserta palitos y congela hasta firmar.',
      'Derrite chocolate con leche. Baña la mitad de cada paleta.',
      'Escurre sobre papel encerado y congela 20 min.',
    ];
  }
  r.consejo = 'El contraste dulce de leche + baño de chocolate sube el ticket. Foto con corte lateral.';
}

{
  const r = byDia(18);
  r.nombre = 'Paleta de avellana bañada';
  r.tipo = 'Bañada';
  r.dificultad = 'Media';
  if (!r.ingredientes.some((i) => /chocolate.*bañ|baño|cobertura|semiamargo/i.test(i))) {
    r.ingredientes.push('150 g de chocolate semiamargo para bañar');
  }
  r.pasos = (r.pasos || []).map((p) =>
    /opcional.*baño/i.test(p) ? 'Baña completa o a la mitad con chocolate derretido y deja escurrir.' : p
  );
  if (!r.pasos.some((p) => /bañ/i.test(p))) {
    r.pasos.push('Baña con chocolate derretido y deja escurrir sobre papel encerado.');
    r.pasos.push('Congela 20 min para fijar el baño.');
  }
  r.consejo = 'Sabor premium del kit base. Cobra más que las frutales. Avisa alérgeno (avellana).';
}

{
  const r = byDia(27);
  r.nombre = 'Paleta de maní bañada en chocolate';
  r.tipo = 'Bañada';
  r.dificultad = 'Media';
  if (!r.ingredientes.some((i) => /chocolate.*bañ|baño|cobertura/i.test(i))) {
    r.ingredientes.push('150 g de chocolate semiamargo para bañar');
  }
  if (!r.pasos.some((p) => /bañ|sumerge/i.test(p))) {
    r.pasos = [
      ...r.pasos.filter((p) => !/advierte|congela\.?\s*$/i.test(p)),
      'Derrite chocolate. Sumerge cada paleta y espolvorea maní picado antes de que seque.',
      'Congela 20 min. Advierte sobre alérgenos (maní).',
    ];
  }
  r.consejo = 'IMPORTANTE: informa que contiene maní. El baño + crunch vende muy bien en foto.';
}

{
  const r = byDia(30);
  r.nombre = 'Paleta tropical bañada';
  r.tipo = 'Bañada';
  r.dificultad = 'Media';
  if (!r.ingredientes.some((i) => /chocolate.*blanco|baño/i.test(i))) {
    r.ingredientes.push('120 g de chocolate blanco para bañar');
    r.ingredientes.push('Coco rallado o chispas para decorar el baño');
  }
  if (!r.pasos.some((p) => /bañ|sumerge/i.test(p))) {
    r.pasos.push('Derrite chocolate blanco. Baña la punta o la mitad de cada paleta.');
    r.pasos.push('Espolvorea coco o chispas y congela 20 min para fijar.');
  }
  r.consejo =
    'Tu producto estrella visual del kit: capas + baño. Úsala como imagen principal del menú.';
}

// ── Premium: retag dipped recipes ──
const premiumBanadas = {
  1: {
    nombre: 'Cheesecake de fresa bañada',
    tip: 'Nombre “cheesecake bañada” eleva el precio. Foto con corte rosado + baño blanco.',
  },
  2: {
    nombre: 'Chocolate belga bañado crocante',
    tip: 'Baño oscuro + galleta = look pastelería. Combo infantil con 2 frutales.',
  },
  6: {
    nombre: 'Dulce de leche bañado estilo alfajor',
    tip: 'Baño parcial + migas de alfajor. Anuncia como edición especial.',
  },
  13: {
    nombre: 'Pistacho bañado en chocolate blanco',
    tip: 'Ticket alto. El baño blanco se ve premium en vaso/foto.',
  },
  16: {
    nombre: 'Nutella bañada con avellanas',
    tip: 'Baño + avellana picada arriba. Avisa alérgeno.',
  },
  19: {
    nombre: 'Caramelo salado bañado con almendras',
    tip: 'Baño parcial (mitad) se ve pro. Ideal para combos premium.',
  },
};

for (const [numStr, meta] of Object.entries(premiumBanadas)) {
  const r = byNum(Number(numStr));
  if (!r) continue;
  r.tipo = 'Bañada';
  r.nombre = meta.nombre;
  r.consejo = meta.tip;
  if (!r.pasos.some((p) => /bañ|sumerge|chocolate derret/i.test(p))) {
    r.pasos.push('Baña con chocolate derretido y deja escurrir sobre papel encerado.');
  }
}

function count(arr) {
  return arr.reduce((a, r) => {
    a[r.tipo] = (a[r.tipo] || 0) + 1;
    return a;
  }, {});
}

writeFileSync(basePath, JSON.stringify(base, null, 2) + '\n');
writeFileSync(premPath, JSON.stringify(prem, null, 2) + '\n');
console.log('BASE', base.length, count(base));
console.log('PREM', prem.length, count(prem));
console.log(
  'base banadas:',
  base.filter((r) => r.tipo === 'Bañada').map((r) => `${r.dia}. ${r.nombre}`)
);
console.log(
  'prem banadas:',
  prem.filter((r) => r.tipo === 'Bañada').map((r) => `#${r.num} ${r.nombre}`)
);
