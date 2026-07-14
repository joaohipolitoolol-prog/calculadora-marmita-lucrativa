/** Server bootstrap: stamp allowlisted admin; ensures profile row exists. */
export async function bootstrapUserSession(user) {
  if (!user?.getIdToken) return null;
  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/me/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: '{}',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, ...data };
  } catch (error) {
    return { ok: false, error: error?.message || 'bootstrap failed' };
  }
}
