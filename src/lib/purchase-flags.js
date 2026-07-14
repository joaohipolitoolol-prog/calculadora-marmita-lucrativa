/**
 * Flags de produto a partir da URL de cadastro / pós-compra.
 *
 * IMPORTANTE (segurança):
 *   URL NÃO libera kit. Só webhook Hotmart, código de acesso ou admin.
 *   ?compra=1&src=hotmart era explorável → unlock gratis.
 *
 * Esta URL só serve para:
 *   - UI (“acabas de comprar, usa el correo de Hotmart”)
 *   - Meta Purchase (ainda exige pending_purchase_* do clique no checkout)
 */

export function isPostPurchaseUiIntent(
  search = typeof window !== 'undefined' ? window.location.search : ''
) {
  const params = new URLSearchParams(search);
  return (
    params.get('compra') === '1' ||
    params.get('premium') === '1' ||
    params.get('postres') === '1' ||
    params.get('postres_premium') === '1' ||
    params.get('paletas') === '1'
  );
}

/**
 * Intent flags for UI / Meta only. Never write these into Firestore entitlements.
 * Returns null if the URL has no post-purchase markers.
 */
export function purchaseIntentFromSearch(
  search = typeof window !== 'undefined' ? window.location.search : ''
) {
  const params = new URLSearchParams(search);
  const compra = params.get('compra') === '1';
  const premium = params.get('premium') === '1';
  const postres = params.get('postres') === '1';
  const postresPremium = params.get('postres_premium') === '1';
  const paletas = params.get('paletas') === '1';
  const line = params.get('line');

  const hasExplicit = compra || premium || postres || postresPremium || paletas;
  if (!hasExplicit) return null;

  const hasPostres = postres || postresPremium || (compra && line === 'postres');
  const hasPostresPremium = postresPremium;
  const hasPremium = premium;
  const hasKit = paletas || hasPremium || (compra && line !== 'postres' && !hasPostres);

  return {
    hasKit: Boolean(hasKit),
    hasPremium: Boolean(hasPremium),
    hasPostres: Boolean(hasPostres),
    hasPostresPremium: Boolean(hasPostresPremium),
  };
}

/**
 * @deprecated Do not grant products from URL.
 * Always returns null so register/login never unlock via query string.
 */
export function purchaseFlagsFromSearch(_search) {
  return null;
}

/** @deprecated Always false — URL is not a trusted grant source. */
export function isTrustedPurchaseSource(_search) {
  return false;
}

/** Organic signup (no purchase query / code), no product until buy or admin grant. */
export const DEFAULT_PRODUCT_FLAGS = {
  hasKit: false,
  hasPremium: false,
  hasPostres: false,
  hasPostresPremium: false,
};

/**
 * Entitlement flags for createUserProfile.
 * URL intent is ignored — only explicit options (tests/admin) or defaults.
 */
export function resolveProductFlags(options = {}, _search) {
  return {
    hasKit: options.hasKit !== undefined ? Boolean(options.hasKit) : DEFAULT_PRODUCT_FLAGS.hasKit,
    hasPremium:
      options.hasPremium !== undefined
        ? Boolean(options.hasPremium)
        : DEFAULT_PRODUCT_FLAGS.hasPremium,
    hasPostres:
      options.hasPostres !== undefined
        ? Boolean(options.hasPostres)
        : DEFAULT_PRODUCT_FLAGS.hasPostres,
    hasPostresPremium:
      options.hasPostresPremium !== undefined
        ? Boolean(options.hasPostresPremium)
        : DEFAULT_PRODUCT_FLAGS.hasPostresPremium,
  };
}

export function appendPurchaseQuery(path, flags = {}) {
  const url = new URL(path, 'https://example.local');
  if (flags.compra) url.searchParams.set('compra', '1');
  if (flags.hasPremium || flags.premium) url.searchParams.set('premium', '1');
  if (flags.hasPostres || flags.postres) url.searchParams.set('postres', '1');
  if (flags.hasPostresPremium || flags.postresPremium) url.searchParams.set('postres_premium', '1');
  if (flags.hasKit || flags.paletas) url.searchParams.set('paletas', '1');
  if (
    flags.compra ||
    flags.hasPremium ||
    flags.premium ||
    flags.hasPostres ||
    flags.postres ||
    flags.hasKit ||
    flags.paletas
  ) {
    url.searchParams.set('src', flags.src || 'hotmart');
  }
  return `${url.pathname}${url.search}`;
}
