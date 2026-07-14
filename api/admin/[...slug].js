/**
 * Single Hobby-plan serverless function for all /api/admin/* routes.
 * Keeps the same public URLs used by src/lib/admin-api.js.
 */
import analytics from '../../server/admin-routes/analytics.js';
import deleteUser from '../../server/admin-routes/delete-user.js';
import diagnosticoLeads from '../../server/admin-routes/diagnostico-leads.js';
import emailActivity from '../../server/admin-routes/email-activity.js';
import settings from '../../server/admin-routes/settings.js';
import users from '../../server/admin-routes/users.js';

const ROUTES = {
  analytics,
  'delete-user': deleteUser,
  'diagnostico-leads': diagnosticoLeads,
  'email-activity': emailActivity,
  settings,
  users,
};

function routeKey(req) {
  const fromQuery = req.query?.slug;
  if (Array.isArray(fromQuery) && fromQuery.length) {
    return String(fromQuery[0] || '').toLowerCase();
  }
  if (typeof fromQuery === 'string' && fromQuery) {
    return fromQuery.split('/').filter(Boolean)[0].toLowerCase();
  }

  const path = String(req.url || '').split('?')[0];
  const match = path.match(/\/api\/admin\/([^/]+)/i);
  return match ? match[1].toLowerCase() : '';
}

export default async function handler(req, res) {
  const key = routeKey(req);
  const route = ROUTES[key];
  if (!route) {
    return res.status(404).json({ error: 'Not found' });
  }
  return route(req, res);
}
