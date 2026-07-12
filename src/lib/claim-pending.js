/** Claim Hotmart/webhook pending purchases for the signed-in user. */
export async function claimPendingPurchases(idToken) {
  if (!idToken) return { ok: false, claimed: false };

  try {
    const res = await fetch('/api/claim-pending', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, claimed: false, error: data.error || 'claim failed' };
    }
    return { ok: true, ...data };
  } catch (error) {
    return { ok: false, claimed: false, error: error?.message || 'claim failed' };
  }
}
