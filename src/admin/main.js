import { logout, watchAuth } from '../lib/auth.js';
import {
  createAccessCode,
  listAccessCodes,
  toggleAccessCode,
} from '../lib/access-codes-db.js';
import {
  getUserProfile,
  isUserAdmin,
  listUsers,
  updateUserProfile,
} from '../lib/user-profile.js';
import { isFirebaseConfigured } from '../lib/firebase.js';

const root = document.getElementById('admin-root');

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderDenied(message) {
  root.innerHTML = `
    <div class="admin-error">
      <h1>Acceso restringido</h1>
      <p>${message}</p>
      <a href="/login" class="admin-btn primary">Ir al login</a>
    </div>
  `;
}

async function togglePremium(uid, current) {
  await updateUserProfile(uid, { hasPremium: !current });
  await renderDashboard();
}

async function handleCreateCode(event) {
  event.preventDefault();
  const form = event.target;
  const code = form.code.value.trim();
  const type = form.type.value;
  const maxUses = form.maxUses.value ? Number(form.maxUses.value) : null;
  if (!code) return;
  await createAccessCode({ code, type, maxUses });
  form.reset();
  await renderDashboard();
}

async function renderDashboard(user, profile) {
  const [users, codes] = await Promise.all([listUsers(), listAccessCodes()]);

  const totalUsers = users.length;
  const premiumUsers = users.filter((u) => u.hasPremium).length;
  const activeCodes = codes.filter((c) => c.active).length;

  root.innerHTML = `
    <div class="admin-shell">
      <header class="admin-topbar">
        <div>
          <h1>Panel Admin</h1>
          <p style="font-size:0.78rem;color:var(--muted);margin-top:4px">${user.email}</p>
        </div>
        <div class="admin-topbar-actions">
          <a href="/membros" class="admin-btn">Área miembros</a>
          <button type="button" class="admin-btn" id="admin-logout">Salir</button>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card"><span>Usuarios</span><strong>${totalUsers}</strong></div>
        <div class="stat-card"><span>Premium</span><strong>${premiumUsers}</strong></div>
        <div class="stat-card"><span>Códigos activos</span><strong>${activeCodes}</strong></div>
      </div>

      <section class="admin-section">
        <h2>Crear código de acceso</h2>
        <form class="code-form" id="code-form">
          <input name="code" placeholder="ej: paletas27" required>
          <select name="type">
            <option value="kit">Kit</option>
            <option value="premium">Premium</option>
            <option value="both">Kit + Premium</option>
          </select>
          <input name="maxUses" type="number" min="1" placeholder="Usos (∞)">
          <button type="submit" class="admin-btn primary">Crear</button>
        </form>
        <div class="admin-table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Tipo</th><th>Usos</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              ${codes.map((c) => `
                <tr>
                  <td><code>${c.code}</code></td>
                  <td><span class="badge">${c.type || 'kit'}</span></td>
                  <td>${c.usedCount || 0}${c.maxUses != null ? ` / ${c.maxUses}` : ''}</td>
                  <td>${c.active ? '<span class="badge green">Activo</span>' : '<span class="badge">Inactivo</span>'}</td>
                  <td><button type="button" class="toggle-btn" data-code-id="${c.id}" data-active="${c.active}">${c.active ? 'Desactivar' : 'Activar'}</button></td>
                </tr>
              `).join('') || '<tr><td colspan="5">Sin códigos en Firestore. Crea uno arriba o usa VITE_ACCESS_CODE.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>

      <section class="admin-section">
        <h2>Usuarios registrados</h2>
        <div class="admin-table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Premium</th><th>Admin</th><th>Registro</th><th></th></tr></thead>
            <tbody>
              ${users.map((u) => `
                <tr>
                  <td>${u.displayName || '—'}</td>
                  <td>${u.email || '—'}</td>
                  <td>${u.hasPremium ? '<span class="badge gold">Sí</span>' : '—'}</td>
                  <td>${u.isAdmin ? '<span class="badge green">Admin</span>' : '—'}</td>
                  <td>${formatDate(u.createdAt)}</td>
                  <td><button type="button" class="toggle-btn" data-user-premium="${u.id}" data-has-premium="${Boolean(u.hasPremium)}">${u.hasPremium ? 'Quitar premium' : 'Dar premium'}</button></td>
                </tr>
              `).join('') || '<tr><td colspan="6">Aún no hay usuarios.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  document.getElementById('admin-logout')?.addEventListener('click', async () => {
    await logout();
    window.location.href = '/login';
  });

  document.getElementById('code-form')?.addEventListener('submit', handleCreateCode);

  root.querySelectorAll('[data-code-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.codeId;
      const active = btn.dataset.active === 'true';
      await toggleAccessCode(id, !active);
      await renderDashboard(user, profile);
    });
  });

  root.querySelectorAll('[data-user-premium]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await togglePremium(btn.dataset.userPremium, btn.dataset.hasPremium === 'true');
    });
  });
}

watchAuth(async (user) => {
  if (!user) {
    window.location.replace('/login?next=/admin');
    return;
  }

  if (!isFirebaseConfigured) {
    renderDenied('Firebase no está configurado. Agrega las variables en Vercel.');
    return;
  }

  const profile = await getUserProfile(user.uid);
  const admin = await isUserAdmin(user, profile);

  if (!admin) {
    renderDenied('Tu cuenta no tiene permisos de administrador. Agrega tu email en VITE_ADMIN_EMAILS en Vercel.');
    return;
  }

  if (!profile?.isAdmin && admin) {
    await updateUserProfile(user.uid, { isAdmin: true });
  }

  await renderDashboard(user, profile);
});
