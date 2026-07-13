import { SITE_URL } from '../site/config.js';
import {
  EMAIL_PRODUCTS,
  buildTransactionalEmail,
  listEmailTemplates,
} from '../lib/transactional-emails.js';

export const HOTMART_WEBHOOK_URL = `${SITE_URL}/api/webhooks/hotmart`;

export { EMAIL_PRODUCTS, buildTransactionalEmail, listEmailTemplates };

/** Build one template for admin (exact Resend HTML). */
export function getAdminEmailTemplate(product = 'paletas_kit', name = 'María') {
  return buildTransactionalEmail(name, SITE_URL, { product });
}
