/**
 * Flags de produto a partir da URL de cadastro / pós-compra.
 *
 * Exemplos:
 *   ?compra=1                         → Paletas kit
 *   ?compra=1&premium=1               → Paletas kit + premium
 *   ?compra=1&postres=1               → Postres kit
 *   ?compra=1&postres=1&postres_premium=1 → Postres kit + premium
 *   ?compra=1&postres=1&paletas=1     → ambos os kits (cross-sell)
 */

export function purchaseFlagsFromSearch(search = typeof window !== 'undefined' ? window.location.search : '') {
  const params = new URLSearchParams(search);
  const compra = params.get('compra') === '1';
  const premium = params.get('premium') === '1';
  const postres = params.get('postres') === '1';
  const postresPremium = params.get('postres_premium') === '1';
  const paletas = params.get('paletas') === '1';

  const hasExplicit = compra || premium || postres || postresPremium || paletas;
  if (!hasExplicit) return null;

  const hasPostres = postres || postresPremium;
  const hasPostresPremium = postresPremium;
  const hasPremium = premium;
  // Postres-only purchase does not grant Paletas unless paletas=1 (or premium) is set.
  const hasKit = paletas || hasPremium || (compra && !hasPostres);

  return {
    hasKit: Boolean(hasKit),
    hasPremium: Boolean(hasPremium),
    hasPostres: Boolean(hasPostres),
    hasPostresPremium: Boolean(hasPostresPremium),
  };
}

/** Defaults for organic signup (no purchase query). Paletas is the main product. */
export const DEFAULT_PRODUCT_FLAGS = {
  hasKit: true,
  hasPremium: false,
  hasPostres: false,
  hasPostresPremium: false,
};

export function resolveProductFlags(options = {}, search) {
  const fromUrl = purchaseFlagsFromSearch(search);
  if (fromUrl) {
    return {
      hasKit: Boolean(options.hasKit ?? fromUrl.hasKit),
      hasPremium: Boolean(options.hasPremium ?? fromUrl.hasPremium),
      hasPostres: Boolean(options.hasPostres ?? fromUrl.hasPostres),
      hasPostresPremium: Boolean(options.hasPostresPremium ?? fromUrl.hasPostresPremium),
    };
  }

  return {
    hasKit: options.hasKit !== undefined ? Boolean(options.hasKit) : DEFAULT_PRODUCT_FLAGS.hasKit,
    hasPremium: Boolean(options.hasPremium) || DEFAULT_PRODUCT_FLAGS.hasPremium,
    hasPostres: options.hasPostres !== undefined ? Boolean(options.hasPostres) : DEFAULT_PRODUCT_FLAGS.hasPostres,
    hasPostresPremium: Boolean(options.hasPostresPremium) || DEFAULT_PRODUCT_FLAGS.hasPostresPremium,
  };
}

export function appendPurchaseQuery(path, flags = {}) {
  const url = new URL(path, 'https://example.local');
  if (flags.compra) url.searchParams.set('compra', '1');
  if (flags.hasPremium || flags.premium) url.searchParams.set('premium', '1');
  if (flags.hasPostres || flags.postres) url.searchParams.set('postres', '1');
  if (flags.hasPostresPremium || flags.postresPremium) url.searchParams.set('postres_premium', '1');
  if (flags.hasKit || flags.paletas) url.searchParams.set('paletas', '1');
  return `${url.pathname}${url.search}`;
}
