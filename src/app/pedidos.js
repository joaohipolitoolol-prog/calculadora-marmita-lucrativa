import { escapeHtml } from '../lib/format.js';
import { ICONS } from './icons.js';
import { applyPlaceholders, findUnresolvedPlaceholders } from '../lib/whatsapp-placeholders.js';
import { markKitLocalEdit } from '../lib/kit-workspace-sync.js';

const STATUSES = [
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'confirmado', label: 'Confirmado' },
  { id: 'listo', label: 'Listo' },
  { id: 'entregado', label: 'Entregado' },
  { id: 'cancelado', label: 'Cancelado' },
];

export function pedidosKey(lineId, uid) {
  return `kit_pedidos_${lineId || 'paletas'}_${uid || 'local'}_v1`;
}

export function loadPedidos(lineId, uid) {
  try {
    const parsed = JSON.parse(localStorage.getItem(pedidosKey(lineId, uid)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePedidos(lineId, uid, list) {
  try {
    localStorage.setItem(pedidosKey(lineId, uid), JSON.stringify(list || []));
    markKitLocalEdit(uid);
  } catch {
    /* ignore */
  }
}

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

export function createPedido(partial = {}) {
  return {
    id: uid(),
    cliente: String(partial.cliente || '').trim(),
    telefono: String(partial.telefono || '').trim(),
    sabores: String(partial.sabores || '').trim(),
    cantidad: String(partial.cantidad || '').trim(),
    total: String(partial.total || '').trim(),
    nota: String(partial.nota || '').trim(),
    status: partial.status || 'nuevo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function statusLabel(id) {
  return STATUSES.find((s) => s.id === id)?.label || id;
}

function confirmMsg(pedido, brand, vars) {
  const raw = `Hola${pedido.cliente ? ` ${pedido.cliente}` : ''}! Confirmo tu pedido: ${pedido.sabores || '[sabores]'} (${pedido.cantidad || '—'}). Total: ${pedido.total || '[precio]'}. Te aviso cuando esté listo. Gracias 😊`;
  return applyPlaceholders(raw, {
    ...vars,
    sabores: pedido.sabores || vars.sabores,
    precio: pedido.total || vars.precio,
  });
}

/**
 * @param {{ brand, pedidos, vars, whatsAppShareUrl }} opts
 */
export function renderPedidosCrm(opts = {}) {
  const { brand, pedidos = [], vars = {}, whatsAppShareUrl } = opts;
  const open = pedidos.filter((p) => !['entregado', 'cancelado'].includes(p.status));
  const done = pedidos.filter((p) => ['entregado', 'cancelado'].includes(p.status));

  const renderCard = (p) => {
    const msg = confirmMsg(p, brand, vars);
    const wa = typeof whatsAppShareUrl === 'function' ? whatsAppShareUrl(msg) : '#';
    const telWa =
      p.telefono && String(p.telefono).replace(/\D/g, '').length >= 8
        ? `https://wa.me/${String(p.telefono).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
        : wa;
    return `
      <article class="pedido-card status-${escapeHtml(p.status)}" data-pedido-id="${escapeHtml(p.id)}">
        <div class="pedido-card-top">
          <strong>${escapeHtml(p.cliente || 'Sin nombre')}</strong>
          <span class="pedido-status">${escapeHtml(statusLabel(p.status))}</span>
        </div>
        <p class="pedido-sabores">${escapeHtml(p.sabores || '—')} · ${escapeHtml(p.cantidad || '1')}</p>
        ${p.total ? `<p class="pedido-total">Total: ${escapeHtml(p.total)}</p>` : ''}
        ${p.nota ? `<p class="pedido-nota">${escapeHtml(p.nota)}</p>` : ''}
        <label class="pedido-status-label">
          <span>Estado</span>
          <select data-pedido-status>
            ${STATUSES.map(
              (s) =>
                `<option value="${s.id}" ${p.status === s.id ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
            ).join('')}
          </select>
        </label>
        <div class="message-actions">
          <button type="button" class="btn btn-sm btn-secondary" data-pedido-copy>${ICONS.copy}<span>Copiar confirmación</span></button>
          <a class="btn btn-sm btn-wa" href="${telWa}" target="_blank" rel="noopener noreferrer">${ICONS.message}<span>WhatsApp</span></a>
          <button type="button" class="btn btn-sm btn-ghost" data-pedido-delete>Eliminar</button>
        </div>
      </article>
    `;
  };

  return `
    <div class="pedidos-page">
      <div class="section-card">
        <h2>Pedidos</h2>
        <p class="section-text">Anota pedidos de WhatsApp aquí. Se guarda en este celular y se sincroniza si tienes cuenta.</p>
        <form class="pedido-form" id="pedido-form">
          <div class="pedido-form-grid">
            <label><span>Cliente</span><input name="cliente" maxlength="60" placeholder="María" required autocomplete="name"></label>
            <label><span>WhatsApp</span><input name="telefono" maxlength="20" placeholder="52155..." inputmode="tel" autocomplete="tel"></label>
            <label class="span-2"><span>Sabores</span><input name="sabores" maxlength="160" placeholder="2 fresa, 1 Oreo" required></label>
            <label><span>Cantidad</span><input name="cantidad" maxlength="40" placeholder="3 ${escapeHtml(brand.unitPlural || '')}"></label>
            <label><span>Total</span><input name="total" maxlength="40" placeholder="precio" inputmode="decimal"></label>
            <label class="span-2"><span>Nota</span><input name="nota" maxlength="160" placeholder="entrega 6pm / recogida"></label>
          </div>
          <button type="submit" class="btn btn-primary btn-sm">${ICONS.plus}<span>Agregar pedido</span></button>
        </form>
      </div>

      <div class="section-card">
        <h3 class="playbook-subtitle" style="margin-top:0">Activos (${open.length})</h3>
        ${open.length ? `<div class="pedidos-list">${open.map(renderCard).join('')}</div>` : '<p class="empty-state">Ningún pedido activo. Cuando escriban por WhatsApp, anótalo aquí.</p>'}
      </div>

      ${
        done.length
          ? `<div class="section-card">
        <h3 class="playbook-subtitle" style="margin-top:0">Cerrados (${done.length})</h3>
        <div class="pedidos-list">${done.map(renderCard).join('')}</div>
      </div>`
          : ''
      }
    </div>
  `;
}

export { findUnresolvedPlaceholders, confirmMsg, STATUSES };
