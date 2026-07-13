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

export async function fetchAdminAnalytics(idToken, line = 'all', range = 'today') {
  const params = new URLSearchParams();
  if (line && line !== 'all') params.set('line', line);
  if (range && range !== 'today') params.set('range', range);
  const qs = params.toString() ? `?${params.toString()}` : '';
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

export async function fetchAdminEmailActivity(idToken, limit = 60) {
  const qs = limit ? `?limit=${encodeURIComponent(limit)}` : '';
  return adminFetch(idToken, `/api/admin/email-activity${qs}`, { method: 'GET' });
}
