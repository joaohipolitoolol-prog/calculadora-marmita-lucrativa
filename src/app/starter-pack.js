import { escapeHtml } from '../lib/format.js';
import { ICONS } from './icons.js';
import { applyPlaceholders } from '../lib/whatsapp-placeholders.js';

const STARTER_NAMES_PALETAS = [
  'Paleta de fresa natural',
  'Paleta de mango con limón',
  'Paleta de chocolate bañada',
];

const STARTER_IDS_POSTRES = ['postre-fresa', 'postre-oreo', 'postre-maracuya'];

export function starterPackKey(lineId, uid) {
  return `starter_pack_done_${lineId || 'paletas'}_${uid || 'local'}_v1`;
}

export function isStarterPackDone(lineId, uid) {
  try {
    return localStorage.getItem(starterPackKey(lineId, uid)) === '1';
  } catch {
    return false;
  }
}

export function markStarterPackDone(lineId, uid) {
  try {
    localStorage.setItem(starterPackKey(lineId, uid), '1');
  } catch {
    /* ignore */
  }
}

export function getStarterRecipes(lineId, recipes = []) {
  if (lineId === 'postres') {
    const byId = STARTER_IDS_POSTRES.map((id) => recipes.find((r) => r.id === id)).filter(Boolean);
    if (byId.length >= 3) return byId.slice(0, 3);
  }
  const byName = STARTER_NAMES_PALETAS.map((n) => recipes.find((r) => r.nombre === n)).filter(Boolean);
  if (byName.length >= 2) return byName.slice(0, 3);
  return recipes.filter((r) => /fácil/i.test(r.dificultad || '')).slice(0, 3);
}

function starterMessageTemplate(brand, recipes, vars) {
  const sabores =
    (vars?.sabores && String(vars.sabores).trim()) ||
    recipes.map((r) => r.nombre.replace(/^Paleta de |^Postre /i, '')).join(', ');
  const precio = (vars?.precio && String(vars.precio).trim()) || '[precio]';
  const zona = (vars?.zona && String(vars.zona).trim()) || '[zona]';
  const raw = `${brand.emoji || ''} ¡Hola! Esta semana tengo ${brand.unitPlural} caseros listos. Sabores: ${sabores}. Desde ${precio}. Entrega en ${zona} o recogida. ¿Te aparto alguno?`;
  return applyPlaceholders(raw, { sabores, precio, zona, direccion: vars?.direccion || '' });
}

/**
 * @param {{ brand, recipes, vars, whatsAppShareUrl, kitUnlocked }} opts
 */
export function renderStarterPackCard(opts) {
  const { brand, recipes, vars, whatsAppShareUrl, kitUnlocked } = opts;
  if (!kitUnlocked) return '';
  const picks = getStarterRecipes(brand.id, recipes);
  if (!picks.length) return '';

  const msg = starterMessageTemplate(brand, picks, vars || {});
  const wa = typeof whatsAppShareUrl === 'function' ? whatsAppShareUrl(msg) : '#';

  return `
    <section class="starter-pack" aria-label="Tu primer pack">
      <div class="starter-pack-head">
        <strong>Tu primer pack · 3 pasos</strong>
        <button type="button" class="starter-pack-dismiss" id="starter-pack-dismiss" aria-label="Cerrar">×</button>
      </div>
      <p class="starter-pack-lead">No abras las 30 recetas. Empieza con estos 3 sabores fáciles y publica hoy.</p>
      <ol class="starter-pack-steps">
        <li>
          <span class="starter-pack-step-num">1</span>
          <div>
            <strong>Elige estos sabores</strong>
            <ul class="starter-pack-flavors">
              ${picks.map((r) => `<li>${escapeHtml(r.nombre)} · ${escapeHtml(r.prep || '')}</li>`).join('')}
            </ul>
            <button type="button" class="btn btn-ghost btn-sm" data-starter-goto="recetas">Ver en Recetas</button>
          </div>
        </li>
        <li>
          <span class="starter-pack-step-num">2</span>
          <div>
            <strong>Calcula el precio real</strong>
            <p>Pon el costo de 1 ${escapeHtml(brand.unitSingular)} y tu margen.</p>
            <button type="button" class="btn btn-ghost btn-sm" data-starter-goto="calc">Abrir Precios</button>
          </div>
        </li>
        <li>
          <span class="starter-pack-step-num">3</span>
          <div>
            <strong>Publica en WhatsApp</strong>
            <p class="starter-pack-msg-preview">${escapeHtml(msg)}</p>
            <div class="message-actions">
              <button type="button" class="btn btn-sm btn-secondary" id="starter-pack-copy">${ICONS.copy}<span>Copiar</span></button>
              <a class="btn btn-sm btn-wa" href="${wa}" target="_blank" rel="noopener noreferrer" id="starter-pack-wa">${ICONS.message}<span>Abrir WhatsApp</span></a>
            </div>
            <p class="starter-pack-hint">Tip: completa sabores/precio/zona en Kit → Mensajes para que no queden corchetes.</p>
          </div>
        </li>
      </ol>
    </section>
  `;
}
