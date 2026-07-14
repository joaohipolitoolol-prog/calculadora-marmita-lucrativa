import { ICONS } from './icons.js';
import { escapeHtml } from '../lib/format.js';

export function renderSectionExportBtn({ href }) {
  if (!href || href === '#') return '';
  return `<a class="lista-pdf-btn" href="${href}" target="_blank" rel="noopener" title="Ver HTML" aria-label="Ver HTML">${ICONS.download}</a>`;
}

export function renderMensajesList(mensajes, { formatMessage, resolveText, whatsAppShareUrl } = {}) {
  const grouped = mensajes.reduce((acc, msg, idx) => {
    if (!acc[msg.categoria]) acc[msg.categoria] = [];
    acc[msg.categoria].push({ ...msg, idx });
    return acc;
  }, {});

  const fmt = formatMessage || ((t) => t);
  const resolve =
    resolveText ||
    ((msg) => fmt(msg.texto));
  const waUrl =
    typeof whatsAppShareUrl === 'function'
      ? whatsAppShareUrl
      : () => '#';

  return `
    <div class="kit-mensajes-page">
      <p class="mensajes-hint">Completa sabores, precio y zona arriba. Edita si quieres, copia o ábrelo directo en WhatsApp.</p>
      ${Object.entries(grouped)
        .map(
          ([cat, items]) => `
        <div class="section-card">
          <h2>${escapeHtml(cat)}</h2>
          <ul class="message-list">
            ${items
              .map((msg) => {
                const text = resolve(msg);
                const customized = Boolean(msg.customized);
                return `
                  <li class="message-item${customized ? ' is-custom' : ''}" data-msg-index="${msg.idx}">
                    <label class="message-edit-label" for="msg-edit-${msg.idx}">Tu mensaje</label>
                    <textarea class="message-edit" id="msg-edit-${msg.idx}" rows="4" data-msg-edit="${msg.idx}">${escapeHtml(text)}</textarea>
                    <div class="message-actions">
                      <button type="button" class="btn btn-sm btn-secondary copy-msg" data-copy-index="${msg.idx}">
                        ${ICONS.copy}<span>Copiar</span>
                      </button>
                      <a class="btn btn-sm btn-wa wa-msg" href="${escapeHtml(waUrl(text))}" target="_blank" rel="noopener noreferrer" data-wa-index="${msg.idx}">
                        ${ICONS.message}<span>WhatsApp</span>
                      </a>
                      <button type="button" class="btn btn-sm btn-primary save-msg" data-save-index="${msg.idx}">
                        ${ICONS.save}<span>Guardar</span>
                      </button>
                      ${
                        customized
                          ? `<button type="button" class="btn btn-sm btn-ghost reset-msg" data-reset-index="${msg.idx}">Restablecer</button>`
                          : ''
                      }
                    </div>
                  </li>
                `;
              })
              .join('')}
          </ul>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

export function renderFechasEspeciales(fechas, { exportHref } = {}) {
  return `
    <div class="section-card">
      <div class="lista-head">
        <h2>Fechas especiales</h2>
        ${renderSectionExportBtn({ href: exportHref })}
      </div>
      <p class="section-text">Ideas y promos listas para San Valentín, Día de la Madre, fin de semana y más.</p>
      <div class="fechas-list">
        ${fechas
          .map(
            (f) => `
          <article class="fechas-card">
            <h3>${escapeHtml(f.fecha)}</h3>
            <p class="fechas-promo">${escapeHtml(f.promo)}</p>
            <ul>
              ${(f.ideas || []).map((idea) => `<li>${escapeHtml(idea)}</li>`).join('')}
            </ul>
          </article>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

export function renderGuiaPresentacion(secciones, { exportHref } = {}) {
  return `
    <div class="section-card">
      <div class="lista-head">
        <h2>Guía de presentación</h2>
        ${renderSectionExportBtn({ href: exportHref })}
      </div>
      <p class="section-text">Fotos, nombres, empaque y precios para elevar la percepción de valor.</p>
      ${secciones
        .map(
          (sec) => `
        <div class="guia-block">
          <h3>${escapeHtml(sec.titulo)}</h3>
          <ul class="guia-list">
            ${(sec.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

export function renderKitExtras(extras, { exportHref } = {}) {
  return `
    <div class="kit-extras-page">
      <div class="section-card">
        <div class="lista-head">
          <h2>Técnicas básicas</h2>
          ${renderSectionExportBtn({ href: exportHref })}
        </div>
        <div class="tecnicas-list">
          ${(extras.tecnicas || [])
            .map(
              (t) => `
            <article class="tecnica-block">
              <h3>${escapeHtml(t.titulo)}</h3>
              <ol class="tecnica-pasos">
                ${(t.pasos || []).map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
              </ol>
            </article>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="section-card">
        <h2>Errores comunes</h2>
        <ul class="guia-list errores-list">
          ${(extras.errores || []).map((e) => `<li>${escapeHtml(e)}</li>`).join('')}
        </ul>
      </div>
      <div class="section-card">
        <h2>Tips para fotos</h2>
        <ul class="guia-list">
          ${(extras.fotosTips || []).map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

export function renderPremiumLocked(title, upsellHtml) {
  return `
    <div class="section-card">
      <h2>${escapeHtml(title)}</h2>
      <p class="section-text">Incluido en el complemento premium.</p>
      <div class="premium-locked-card">${upsellHtml}</div>
    </div>
  `;
}
