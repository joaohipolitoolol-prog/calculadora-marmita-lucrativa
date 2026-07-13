export async function sendWelcomeEmail(
  idToken,
  { email, name, line = 'paletas', tier = 'kit', product = null },
) {
  const res = await fetch('/api/send-welcome', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ email, name, line, tier, product }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'No se pudo enviar el email');
  }
  return data;
}
