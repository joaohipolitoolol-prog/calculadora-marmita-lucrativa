/**
 * Authenticated URLs for paid kit files served by /api/kit-file.
 */
import { auth, isFirebaseConfigured } from './firebase.js';

const PUBLIC_PREFIXES = [
  '/paletas-de-whatsapp/produto/',
  '/paletas-premium/produto/',
  '/postres/produto/',
  '/postres-premium/produto/',
];

export function isProtectedKitPath(path) {
  const p = String(path || '');
  return PUBLIC_PREFIXES.some((prefix) => p === prefix.slice(0, -1) || p.startsWith(prefix));
}

/** Convert /line/produto/file → relative key for the API. */
export function kitFileKeyFromPath(path) {
  const raw = String(path || '').split('?')[0].split('#')[0];
  if (!raw.startsWith('/')) return null;
  const withoutSlash = raw.slice(1);
  if (!isProtectedKitPath(raw)) return null;
  return withoutSlash;
}

export async function getAuthAccessToken() {
  if (!isFirebaseConfigured || !auth?.currentUser?.getIdToken) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Build URL for download / iframe / window.open.
 * Falls back to original path only when not a protected kit asset.
 */
export async function resolveKitAssetUrl(path) {
  if (!path || path === '#') return path;
  const key = kitFileKeyFromPath(path);
  if (!key) return path;

  const token = await getAuthAccessToken();
  if (!token) return '/login?next=/app';

  const qs = new URLSearchParams({ f: key, access_token: token });
  return `/api/kit-file?${qs.toString()}`;
}

/** Sync helper when token already known (batch render). */
export function kitAssetUrlWithToken(path, token) {
  if (!path || path === '#') return path;
  const key = kitFileKeyFromPath(path);
  if (!key) return path;
  if (!token) return '/login?next=/app';
  const qs = new URLSearchParams({ f: key, access_token: token });
  return `/api/kit-file?${qs.toString()}`;
}
