/**
 * Server re-exports, single source lives in src/lib/transactional-emails.js
 */
export {
  buildTransactionalEmail,
  buildWelcomeEmailHtml,
  buildWelcomeEmailPlain,
  welcomeEmailSubject,
  listEmailTemplates,
  normalizeEmailProduct,
  EMAIL_PRODUCTS,
} from '../../src/lib/transactional-emails.js';
