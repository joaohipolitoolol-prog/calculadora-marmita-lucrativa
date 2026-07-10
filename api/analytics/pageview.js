/**
 * Legacy pageview endpoint — forwards to the unified event pipeline.
 * Kept so older clients / beacons keep working.
 */
import eventHandler from './event.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const page = req.body?.page;
  req.body = {
    event: 'page_view',
    page,
    line: req.body?.line || null,
  };
  return eventHandler(req, res);
}
