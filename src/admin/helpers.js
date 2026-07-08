export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(value) {
  if (!value) return '—';
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getUserInitial(user) {
  const name = user?.displayName || user?.email || '?';
  return name.charAt(0).toUpperCase();
}

export function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay visible';
    overlay.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true">
        <h3>${escapeHtml(title)}</h3>
        <p>${message}</p>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn ghost" data-modal-cancel>Cancelar</button>
          <button type="button" class="admin-btn ${danger ? 'danger' : 'primary'}" data-modal-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    overlay.querySelector('[data-modal-cancel]')?.addEventListener('click', () => close(false));
    overlay.querySelector('[data-modal-confirm]')?.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
  });
}

let toastTimer;
export function showToast(message) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

export async function copyText(text, label = 'Copiado') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
  } catch {
    showToast('No se pudo copiar');
  }
}
