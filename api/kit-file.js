/**
 * Serve paid kit files only to entitled signed-in users.
 * GET /api/kit-file?f=postres/produto/Kit.pdf
 * Auth: Authorization Bearer <idToken> OR ?access_token= (iframes / window.open)
 */
import { createReadStream, existsSync, statSync } from 'fs';
import { dirname, extname, join, normalize, sep } from 'path';
import { fileURLToPath } from 'url';
import { verifyUserRequest } from '../../server/lib/user-auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'private-kit');

export const config = {
  includeFiles: ['private-kit/**'],
  maxDuration: 30,
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const LINE_ACCESS = {
  'paletas-de-whatsapp': (p) => p.hasKit || p.hasPremium || p.isAdmin,
  'paletas-premium': (p) => p.hasPremium || p.isAdmin,
  postres: (p) => p.hasPostres || p.hasPostresPremium || p.isAdmin,
  'postres-premium': (p) => p.hasPostresPremium || p.isAdmin,
};

function resolveSafePath(raw) {
  const cleaned = String(raw || '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/');
  if (!cleaned || cleaned.includes('..')) return null;

  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length < 2 || parts[1] !== 'produto') return null;

  const line = parts[0];
  if (!LINE_ACCESS[line]) return null;

  const abs = normalize(join(ROOT, ...parts));
  const rootNorm = normalize(ROOT + sep);
  if (!abs.startsWith(rootNorm) && abs !== normalize(ROOT)) return null;
  return { abs, line, rel: parts.join('/') };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firebaseAdmin, decoded } = await verifyUserRequest(req);
    const fileKey = req.query?.f || req.query?.path || '';
    const resolved = resolveSafePath(fileKey);
    if (!resolved) {
      return res.status(400).json({ error: 'Archivo inválido' });
    }

    const profileSnap = await firebaseAdmin.firestore().doc(`users/${decoded.uid}`).get();
    const profile = profileSnap.exists ? profileSnap.data() : {};
    const allowed = LINE_ACCESS[resolved.line]({
      hasKit: Boolean(profile.hasKit),
      hasPremium: Boolean(profile.hasPremium),
      hasPostres: Boolean(profile.hasPostres),
      hasPostresPremium: Boolean(profile.hasPostresPremium),
      isAdmin: Boolean(profile.isAdmin),
    });

    if (!allowed) {
      return res.status(403).json({ error: 'Sin acceso a este archivo' });
    }

    if (!existsSync(resolved.abs)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const ext = extname(resolved.abs).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const stats = statSync(resolved.abs);

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', String(stats.size));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    await new Promise((resolve, reject) => {
      const stream = createReadStream(resolved.abs);
      stream.on('error', reject);
      res.on('close', () => stream.destroy());
      stream.on('end', resolve);
      stream.pipe(res);
    });
  } catch (error) {
    const message = error?.message || 'Error interno';
    const status = error.status || (/auth|Unauthorized/i.test(message) ? 401 : 500);
    if (!res.headersSent) return res.status(status).json({ error: message });
  }
}
