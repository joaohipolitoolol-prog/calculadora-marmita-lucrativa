import { logout, watchAuth } from '../lib/auth.js';
import {
  getUserProfile,
  isUserAdmin,
  listUsers,
  updateUserProfile,
} from '../lib/user-profile.js';
import { sendWelcomeEmail } from '../lib/send-welcome.js';
import { isFirebaseConfigured } from '../lib/firebase.js';
import {
  KIWIFY_EMAIL_KIT,
  KIWIFY_EMAIL_PREMIUM,
  KIWIFY_SETUP_STEPS,
  KIWIFY_URLS,
  kiwifyKitEmailHtml,
  kiwifyPremiumEmailHtml,
} from '../kiwify/email-templates.js';

const root = document.getElementById('admin-root');
let currentAdminUser = null;

async function copyText(text, label = 'Copiado') {
  try {
    await navigator.clipboard.writeText(text);
    return label;
  } catch {
    return 'No se pudo copiar';
  }
}

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
  if (currentAdminUser) await renderDashboard(currentAdminUser);
}

async function toggleKit(uid, current, userRecord, authUser) {
  const next = !current;
  await updateUserProfile(uid, { hasKit: next });

  if (next) {
    try {
      const token = await authUser.getIdToken();
      await sendWelcomeEmail(token, {
        email: userRecord.email,
        name: userRecord.displayName,
      });
    } catch (error) {
      alert(`Kit liberado, pero el email no se envió: ${error.message}`);
    }
  }

  if (currentAdminUser) await renderDashboard(currentAdminUser);
}

async function renderDashboard(user, profile) {
  const users = await listUsers();

  const totalUsers = users.length;
  const activeKit = users.filter((u) => u.hasKit).length;
  const pendingKit = users.filter((u) => !u.hasKit && !u.isAdmin).length;
  const premiumUsers = users.filter((u) => u.hasPremium).length;

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
        <div class="stat-card"><span>Kit activo</span><strong>${activeKit}</strong></div>
        <div class="stat-card"><span>Pendientes</span><strong>${pendingKit}</strong></div>
        <div class="stat-card"><span>Premium</span><strong>${premiumUsers}</strong></div>
      </div>

      <section class="admin-section kiwify-section">
        <h2>Emails Kiwify — plantillas</h2>
        <p class="admin-hint">Pega en Kiwify → Produto → Emails. Link corto recomendado: <code>${KIWIFY_URLS.accessShort}</code></p>
        <div class="kiwify-url-grid">
          ${KIWIFY_SETUP_STEPS.filter((s) => typeof s.value === 'string' && s.value.startsWith('http')).map(
            (step) => `
              <div class="kiwify-url-card">
                <strong>${step.title}</strong>
                <code class="kiwify-value">${step.value}</code>
                <p>${step.note}</p>
                <button type="button" class="admin-btn copy-btn" data-copy="${encodeURIComponent(step.value)}">Copiar</button>
              </div>
            `
          ).join('')}
        </div>
        <div class="email-template-block">
          <div class="email-template-head"><h3>Asunto kit</h3><button type="button" class="admin-btn copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_KIT.subject)}">Copiar</button></div>
          <pre>${KIWIFY_EMAIL_KIT.subject}</pre>
        </div>
        <div class="email-template-block">
          <div class="email-template-head"><h3>Texto kit</h3><button type="button" class="admin-btn copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_KIT.plain)}">Copiar</button></div>
          <pre>${KIWIFY_EMAIL_KIT.plain.replace(/</g, '&lt;')}</pre>
        </div>
        <div class="email-template-block">
          <div class="email-template-head"><h3>HTML kit</h3><button type="button" class="admin-btn copy-btn" data-copy-html="kit">Copiar HTML</button></div>
          <p class="admin-hint">Sin código de acceso — el cliente crea cuenta y tú liberas en la tabla de abajo.</p>
        </div>
        <div class="email-template-block">
          <div class="email-template-head"><h3>Texto premium</h3><button type="button" class="admin-btn copy-btn" data-copy="${encodeURIComponent(KIWIFY_EMAIL_PREMIUM.plain)}">Copiar</button></div>
          <pre>${KIWIFY_EMAIL_PREMIUM.plain.replace(/</g, '&lt;')}</pre>
        </div>
        <div class="email-template-block">
          <div class="email-template-head"><h3>HTML premium</h3><button type="button" class="admin-btn copy-btn" data-copy-html="premium">Copiar HTML</button></div>
        </div>
      </section>

      <section class="admin-section">
        <h2>Usuarios registrados</h2>
        <p style="font-size:0.82rem;color:var(--muted);margin-bottom:12px">
          Libera el kit manualmente después de verificar la compra en Kiwify. Al liberar, se envía un email automático con Resend.
        </p>
        <div class="admin-table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Kit</th><th>Premium</th><th>Admin</th><th>Registro</th><th></th></tr></thead>
            <tbody>
              ${users.map((u) => `
                <tr>
                  <td>${u.displayName || '—'}</td>
                  <td>${u.email || '—'}</td>
                  <td>${u.hasKit ? '<span class="badge green">Activo</span>' : '<span class="badge">Pendiente</span>'}</td>
                  <td>${u.hasPremium ? '<span class="badge gold">Sí</span>' : '—'}</td>
                  <td>${u.isAdmin ? '<span class="badge green">Admin</span>' : '—'}</td>
                  <td>${formatDate(u.createdAt)}</td>
                  <td style="white-space:nowrap">
                    <button type="button" class="toggle-btn" data-user-kit="${u.id}" data-has-kit="${Boolean(u.hasKit)}" data-email="${u.email || ''}" data-name="${u.displayName || ''}">${u.hasKit ? 'Revocar kit' : 'Liberar kit'}</button>
                    <button type="button" class="toggle-btn" data-user-premium="${u.id}" data-has-premium="${Boolean(u.hasPremium)}">${u.hasPremium ? 'Quitar premium' : 'Dar premium'}</button>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="7">Aún no hay usuarios.</td></tr>'}
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

  root.querySelectorAll('[data-user-kit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await toggleKit(
        btn.dataset.userKit,
        btn.dataset.hasKit === 'true',
        { email: btn.dataset.email, displayName: btn.dataset.name },
        user
      );
    });
  });

  root.querySelectorAll('[data-user-premium]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await togglePremium(btn.dataset.userPremium, btn.dataset.hasPremium === 'true');
    });
  });

  root.querySelectorAll('.copy-btn[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = decodeURIComponent(btn.dataset.copy || '');
      if (!text) return;
      btn.textContent = await copyText(text);
      setTimeout(() => {
        btn.textContent = 'Copiar URL';
      }, 2000);
    });
  });

  root.querySelectorAll('.copy-btn[data-copy-html]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const html =
        btn.dataset.copyHtml === 'premium'
          ? kiwifyPremiumEmailHtml()
          : kiwifyKitEmailHtml();
      btn.textContent = await copyText(html, 'HTML copiado');
      setTimeout(() => {
        btn.textContent = 'Copiar HTML';
      }, 2000);
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
    await updateUserProfile(user.uid, { isAdmin: true, hasKit: true });
  }

  currentAdminUser = user;
  await renderDashboard(user, profile);
});
