import { writeFileSync, mkdirSync } from 'fs';
import {
  RECETAS_POSTRES,
  RECETAS_POSTRES_PREMIUM,
  COMBOS_POSTRES_PREMIUM,
  MENSAJES_POSTRES,
  MENSAJES_POSTRES_PREMIUM,
  FECHAS_POSTRES_PREMIUM,
  GUIA_POSTRES_PREMIUM,
  PLAN_7_DIAS_POSTRES,
  LISTA_COMPRAS_POSTRES,
  CHECKLIST_POSTRES,
} from '../src/data/kit-postres.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const css = `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
:root{--rosa:#EC3F7A;--crema:#FFF4E6;--chocolate:#5C2E1F;--blanco:#fff;--gris:#6B5E57;--gris-claro:#F3EDE8;}
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:14mm}
body{font-family:Nunito,system-ui,sans-serif;color:var(--chocolate);background:#fff;font-size:11pt;line-height:1.5}
.page{max-width:210mm;margin:0 auto;padding:12mm 14mm}
.cover{min-height:70vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(160deg,#FFF4E6,#FFE8F0 45%,#CFF7E2);border-radius:18px;padding:40px 28px;margin-bottom:28px}
.badge{background:var(--rosa);color:#fff;font-size:9pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:6px 16px;border-radius:999px;margin-bottom:16px}
.cover h1{font-size:28pt;font-weight:800;line-height:1.1;margin:8px 0}
.cover p{color:var(--gris);max-width:420px}
.toolbar{display:flex;gap:8px;justify-content:flex-end;margin:0 0 16px;position:sticky;top:0;background:#fff;padding:8px 0;z-index:2}
.btn{border:none;border-radius:10px;padding:10px 14px;font:inherit;font-weight:800;cursor:pointer}
.btn-print{background:var(--rosa);color:#fff}
.btn-back{background:var(--gris-claro);color:var(--chocolate);text-decoration:none}
h2{font-size:16pt;margin:22px 0 10px;color:var(--rosa)}
h4{margin:10px 0 4px;font-size:11pt}
.card{border:1px solid #eadfd6;border-radius:14px;padding:14px 16px;margin:0 0 12px;background:#fff;break-inside:avoid}
.card h3{font-size:13pt;margin:0 0 6px}
.meta{display:flex;flex-wrap:wrap;gap:8px;font-size:9pt;color:var(--gris);margin-bottom:8px}
.meta span{background:var(--gris-claro);padding:3px 8px;border-radius:999px}
ul,ol{padding-left:18px;margin:6px 0}
li{margin:3px 0}
.tip{margin-top:8px;padding:8px 10px;background:#fff7fb;border-left:3px solid var(--rosa);border-radius:8px;font-size:10pt}
.msg{padding:10px 12px;border-radius:12px;background:var(--gris-claro);margin:0 0 8px}
.cat{font-size:9pt;font-weight:800;color:var(--rosa);text-transform:uppercase;letter-spacing:.04em;margin:16px 0 8px}
.check{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f0e8e2}
.check input{margin-top:4px}
@media print{.toolbar{display:none}.cover{min-height:auto;page-break-after:always}}`;

function shell(title, body) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body>
<div class="page">
  <div class="toolbar"><a class="btn btn-back" href="/app">Volver a la app</a><button class="btn btn-print" onclick="window.print()">Imprimir / PDF</button></div>
  ${body}
</div></body></html>`;
}

function normalizeRecipe(r, i, premium = false) {
  const tiempo = r.tiempo || r.prep || '25 min';
  const [prepPart, coldPart] = String(tiempo).split('+').map((s) => s.trim());
  return {
    ...r,
    dia: premium ? undefined : r.dia || i + 1,
    num: premium ? r.num || i + 1 : undefined,
    prep: r.prep || prepPart || '20 min',
    congelacion: r.congelacion || coldPart || '1-2 horas',
    rendimiento: r.rendimiento || r.porciones || '8 vasos',
    consejo: r.consejo || r.tip || '',
  };
}

const base = RECETAS_POSTRES.map((r, i) => normalizeRecipe(r, i, false));
const premium = RECETAS_POSTRES_PREMIUM.map((r, i) => normalizeRecipe(r, i, true));

function recipeCards(list) {
  return list
    .map(
      (r) => `<article class="card"><h3>${r.dia ? `Día ${r.dia} · ` : r.num ? `#${r.num} · ` : ''}${esc(r.nombre)}</h3>
  <div class="meta"><span>${esc(r.tipo)}</span><span>${esc(r.dificultad)}</span><span>${esc(r.prep)} prep</span><span>${esc(r.congelacion)} frío</span><span>${esc(r.rendimiento)}</span></div>
  ${r.descripcion ? `<p>${esc(r.descripcion)}</p>` : ''}
  <h4>Ingredientes</h4><ul>${(r.ingredientes || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  <h4>Preparación</h4><ol>${(r.pasos || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
  ${r.consejo ? `<p class="tip"><strong>Tip:</strong> ${esc(r.consejo)}</p>` : ''}
  </article>`
    )
    .join('');
}

mkdirSync('public/postres/produto', { recursive: true });
mkdirSync('public/postres-premium/produto', { recursive: true });

writeFileSync(
  'public/postres/produto/Kit_Postres_en_Vaso.html',
  shell(
    'Kit Principal · Postres en Vaso',
    `
<div class="cover"><div class="badge">Kit Principal</div><div style="font-size:48pt">🍨</div><h1>Postres en Vaso</h1><p>${base.length} recetas nativas + método para vender por WhatsApp. Usa Imprimir para guardar PDF.</p></div>
<h2>Recetas del kit</h2>${recipeCards(base)}
`
  )
);

const byCat = MENSAJES_POSTRES.reduce((a, m) => {
  (a[m.categoria] ||= []).push(m.texto);
  return a;
}, {});

writeFileSync(
  'public/postres/produto/Mensajes_Postres.html',
  shell(
    'Mensajes WhatsApp · Postres',
    `
<div class="cover"><div class="badge">Vender</div><h1>Mensajes listos</h1><p>Copia, pega y adapta precios y zona.</p></div>
${Object.entries(byCat)
  .map(
    ([cat, msgs]) =>
      `<div class="cat">${esc(cat)}</div>${msgs.map((t) => `<div class="msg">${esc(t)}</div>`).join('')}`
  )
  .join('')}
`
  )
);

writeFileSync(
  'public/postres/produto/Plan_7_Dias_Postres.html',
  shell(
    'Plan 7 días · Postres',
    `
<div class="cover"><div class="badge">Plan</div><h1>7 días para vender</h1><p>De la primera tanda al ajuste de precios.</p></div>
${PLAN_7_DIAS_POSTRES.map(
  (d) => `<article class="card"><h3>Día ${d.dia}: ${esc(d.titulo)}</h3><div class="meta"><span>${esc(d.duracion)}</span><span>${esc(d.meta)}</span></div><ol>${d.tareas.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></article>`
).join('')}
`
  )
);

writeFileSync(
  'public/postres/produto/Checklist_Postres.html',
  shell(
    'Checklist · Postres',
    `
<div class="cover"><div class="badge">Producción</div><h1>Checklist del día</h1><p>Marca en pantalla o imprime.</p></div>
${CHECKLIST_POSTRES.map((t) => `<label class="check"><input type="checkbox"><span>${esc(t)}</span></label>`).join('')}
`
  )
);

writeFileSync(
  'public/postres/produto/Menu_Editable_Postres.html',
  shell(
    'Menú editable · Postres',
    `
<div class="cover"><div class="badge">Menú</div><h1>Menú para WhatsApp</h1><p>Edita precios y copia el bloque.</p></div>
<article class="card" contenteditable="true">
<strong>🍨 POSTRES EN VASO</strong><br><br>
${base.map((r) => `• ${esc(r.nombre)}, $[PRECIO]<br>`).join('')}
<br>Combos y encargos disponibles.<br>Escríbeme para apartar 💬
</article>
<p class="tip">Toca el menú para editar precios, luego selecciona y copia.</p>
`
  )
);

writeFileSync(
  'public/postres/produto/Lista_Compras_Postres.html',
  shell(
    'Lista de compras · Postres',
    `
<div class="cover"><div class="badge">Compras</div><h1>Lista de compras</h1></div>
<h2>Ingredientes</h2>${LISTA_COMPRAS_POSTRES.ingredientes.map((t) => `<label class="check"><input type="checkbox"><span>${esc(t)}</span></label>`).join('')}
<h2>Materiales</h2>${LISTA_COMPRAS_POSTRES.materiales.map((t) => `<label class="check"><input type="checkbox"><span>${esc(t)}</span></label>`).join('')}
<h2>Utensilios</h2>${LISTA_COMPRAS_POSTRES.utensilios.map((t) => `<label class="check"><input type="checkbox"><span>${esc(t)}</span></label>`).join('')}
`
  )
);

writeFileSync(
  'public/postres-premium/produto/Kit_Premium_Postres.html',
  shell(
    'Kit Premium · Postres',
    `
<div class="cover"><div class="badge">Premium</div><h1>Recetas premium</h1><p>${premium.length} recetas para subir ticket.</p></div>
${recipeCards(premium)}
`
  )
);

writeFileSync(
  'public/postres-premium/produto/Combos_Rentables_Postres.html',
  shell(
    'Combos · Postres',
    `
<div class="cover"><div class="badge">Premium</div><h1>Combos rentables</h1></div>
${COMBOS_POSTRES_PREMIUM.map(
  (c) =>
    `<article class="card"><h3>${esc(c.nombre)}</h3><div class="meta"><span>${esc(c.precio_guia)}</span><span>${esc(c.publico)}</span></div><p>${esc(c.contenido)}</p><p class="tip"><strong>Mensaje:</strong> ${esc(c.mensaje)}</p></article>`
).join('')}
`
  )
);

writeFileSync(
  'public/postres-premium/produto/Menu_Premium_Postres.html',
  shell(
    'Menú premium · Postres',
    `
<div class="cover"><div class="badge">Premium</div><h1>Menú premium</h1></div>
<article class="card" contenteditable="true">
<strong>✨ POSTRES PREMIUM</strong><br><br>
${premium.map((r) => `• ${esc(r.nombre)}, $[PRECIO]<br>`).join('')}
<br>${COMBOS_POSTRES_PREMIUM.map((c) => `• ${esc(c.nombre)}, ${esc(c.precio_guia)}<br>`).join('')}
</article>
`
  )
);

const byCatPremium = MENSAJES_POSTRES_PREMIUM.reduce((a, m) => {
  (a[m.categoria] ||= []).push(m.texto);
  return a;
}, {});

writeFileSync(
  'public/postres-premium/produto/Mensajes_Premium_Postres.html',
  shell(
    'Mensajes premium · Postres',
    `
<div class="cover"><div class="badge">Premium</div><h1>Mensajes premium</h1><p>Combos, ediciones especiales y fechas.</p></div>
${Object.entries(byCatPremium)
  .map(
    ([cat, msgs]) =>
      `<div class="cat">${esc(cat)}</div>${msgs.map((t) => `<div class="msg">${esc(t)}</div>`).join('')}`
  )
  .join('')}
`
  )
);

writeFileSync(
  'public/postres-premium/produto/Fechas_Especiales_Postres.html',
  shell(
    'Fechas especiales · Postres',
    `
<div class="cover"><div class="badge">Premium</div><h1>Fechas especiales</h1><p>Ideas y promos para el calendario.</p></div>
${FECHAS_POSTRES_PREMIUM.map(
  (f) =>
    `<article class="card"><h3>${esc(f.fecha)}</h3><ul>${(f.ideas || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul><p class="tip"><strong>Promo:</strong> ${esc(f.promo)}</p></article>`
).join('')}
`
  )
);

writeFileSync(
  'public/postres-premium/produto/Guia_Presentacion_Postres.html',
  shell(
    'Guía presentación · Postres',
    `
<div class="cover"><div class="badge">Premium</div><h1>Fotos y empaque</h1></div>
${GUIA_POSTRES_PREMIUM.map(
  (s) =>
    `<article class="card"><h3>${esc(s.titulo)}</h3><ul>${(s.items || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></article>`
).join('')}
`
  )
);

console.log(`Generated Postres kit HTML (${base.length} base, ${premium.length} premium)`);
