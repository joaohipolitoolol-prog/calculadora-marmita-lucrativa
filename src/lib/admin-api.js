async function adminFetch(idToken, path, options = {}) {
  const { method = 'POST', body } = options;
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }
  return data;
}

export async function fetchAdminUsers(idToken) {
  return adminFetch(idToken, '/api/admin/users', { method: 'GET' });
}

export async function syncAdminUsers(idToken) {
  return adminFetch(idToken, '/api/admin/users', { method: 'POST', body: { action: 'sync' } });
}

export async function createAdminUser(idToken, payload) {
  return adminFetch(idToken, '/api/admin/users', { method: 'POST', body: payload });
}

export async function fetchAdminAnalytics(idToken, line = 'all') {
  const qs = line && line !== 'all' ? `?line=${encodeURIComponent(line)}` : '';
  return adminFetch(idToken, `/api/admin/analytics${qs}`, { method: 'GET' });
}

export async function deleteUserAccount(idToken, uid) {
  return adminFetch(idToken, '/api/admin/delete-user', { body: { uid } });
}

export async function saveAdminSettings(idToken, payload) {
  return adminFetch(idToken, '/api/admin/settings', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchAdminSettings(idToken) {
  return adminFetch(idToken, '/api/admin/settings', { method: 'GET' });
}
