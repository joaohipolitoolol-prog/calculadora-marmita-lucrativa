import { ICONS } from './icons.js';
import { escapeHtml } from '../lib/format.js';
import {
  PLAYBOOKS_CRECIMIENTO,
  adaptPlaybookText,
} from '../data/playbooks-crecimiento.js';
import { applyPlaceholders } from '../lib/whatsapp-placeholders.js';
import { markKitLocalEdit } from '../lib/kit-workspace-sync.js';

export function playbookProgressKey(lineId, uid) {
  return `kit_playbooks_${lineId || 'paletas'}_${uid || 'local'}_v1`;
}

export function loadPlaybookProgress(lineId, uid) {
  try {
    const parsed = JSON.parse(localStorage.getItem(playbookProgressKey(lineId, uid)) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function savePlaybookProgress(lineId, uid, map) {
  try {
    localStorage.setItem(playbookProgressKey(lineId, uid), JSON.stringify(map || {}));
    markKitLocalEdit(uid);
  } catch {
    /* ignore */
  }
}

/**
 * @param {{ lineId, vars, whatsAppShareUrl, progress }} opts
 */
export function renderPlaybooksCrecimiento(opts = {}) {
  const { lineId = 'paletas', vars = {}, whatsAppShareUrl, progress = {} } = opts;
  const totalTasks = PLAYBOOKS_CRECIMIENTO.reduce((n, w) => n + w.tareas.length, 0);
  const done = Object.values(progress).filter(Boolean).length;
  const pct = totalTasks ? Math.round((done / totalTasks) * 100) : 0;

  return `
    <div class="playbooks-page">
      <div class="section-card">
        <h2>Semanas 2–4 · Crecer</h2>
        <p class="section-text">
          El plan de 7 días te hace publicar. Esto te saca del silencio cuando el círculo cercano
          ya vio tu menú y no alcanza para vivir de eso.
        </p>
        <div class="plan-progress" data-playbook-progress aria-live="polite">
          <strong>${done}/${totalTasks}</strong> tareas · ${pct}%
          <div class="plan-progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <span style="width:${pct}%"></span>
          </div>
        </div>
      </div>

      ${PLAYBOOKS_CRECIMIENTO.map((week) => {
        const titulo = escapeHtml(adaptPlaybookText(week.titulo, lineId));
        const meta = escapeHtml(adaptPlaybookText(week.meta, lineId));
        const porQue = escapeHtml(adaptPlaybookText(week.porQue, lineId));
        return `
          <details class="playbook-week section-card" data-playbook="${escapeHtml(week.id)}" ${week.semana === 2 ? 'open' : ''}>
            <summary class="playbook-week-summary">
              <span class="plan-day-num">S${week.semana}</span>
              <span class="playbook-week-copy">
                <strong>${titulo}</strong>
                <em>${meta} · ${escapeHtml(week.duracion)}</em>
              </span>
            </summary>
            <div class="playbook-week-body">
              <p class="playbook-why">${porQue}</p>
              <h3 class="playbook-subtitle">Tareas</h3>
              <ul class="kit-checklist interactive">
                ${week.tareas
                  .map((t, ti) => {
                    const key = `${week.id}:${ti}`;
                    const checked = Boolean(progress[key]);
                    return `
                      <li>
                        <label class="checklist-label">
                          <input type="checkbox" data-playbook-task="${key}" ${checked ? 'checked' : ''}>
                          <span>${escapeHtml(adaptPlaybookText(t, lineId))}</span>
                        </label>
                      </li>
                    `;
                  })
                  .join('')}
              </ul>
              <h3 class="playbook-subtitle">Mensajes listos</h3>
              <ul class="message-list playbook-messages">
                ${week.mensajes
                  .map((msg) => {
                    const raw = adaptPlaybookText(msg.texto, lineId);
                    const text = applyPlaceholders(raw, vars);
                    const wa =
                      typeof whatsAppShareUrl === 'function' ? whatsAppShareUrl(text) : '#';
                    return `
                      <li class="message-item" data-playbook-msg="${escapeHtml(msg.id)}">
                        <label class="message-edit-label">${escapeHtml(msg.label)}</label>
                        <textarea class="message-edit" rows="3" data-playbook-edit>${escapeHtml(text)}</textarea>
                        <div class="message-actions">
                          <button type="button" class="btn btn-sm btn-secondary" data-playbook-copy>${ICONS.copy}<span>Copiar</span></button>
                          <a class="btn btn-sm btn-wa" href="${wa}" target="_blank" rel="noopener noreferrer" data-playbook-wa>${ICONS.message}<span>WhatsApp</span></a>
                        </div>
                      </li>
                    `;
                  })
                  .join('')}
              </ul>
              <h3 class="playbook-subtitle">Tips</h3>
              <ul class="guia-list">
                ${week.checklistTips
                  .map((tip) => `<li>${escapeHtml(adaptPlaybookText(tip, lineId))}</li>`)
                  .join('')}
              </ul>
            </div>
          </details>
        `;
      }).join('')}

      <button type="button" class="btn btn-ghost btn-sm" id="reset-playbooks">Reiniciar Semanas 2–4</button>
    </div>
  `;
}

export function playbooksTaskTotal() {
  return PLAYBOOKS_CRECIMIENTO.reduce((n, w) => n + w.tareas.length, 0);
}
