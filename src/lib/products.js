/** Product entitlements — maps admin toggles to Firestore profile fields. */
export const PRODUCTS = [
  {
    id: 'paletas_kit',
    field: 'hasKit',
    label: 'Paletas Kit',
    short: 'Paletas',
    emoji: '🍓',
    group: 'paletas',
    tier: 'main',
  },
  {
    id: 'paletas_premium',
    field: 'hasPremium',
    label: 'Paletas Premium',
    short: 'Premium',
    emoji: '⭐',
    group: 'paletas',
    tier: 'upsell',
  },
  {
    id: 'postres_kit',
    field: 'hasPostres',
    label: 'Postres Kit',
    short: 'Postres',
    emoji: '🍮',
    group: 'postres',
    tier: 'main',
  },
  {
    id: 'postres_premium',
    field: 'hasPostresPremium',
    label: 'Postres Premium',
    short: 'Postres+',
    emoji: '✨',
    group: 'postres',
    tier: 'upsell',
  },
];

export const PRODUCT_BY_FIELD = Object.fromEntries(PRODUCTS.map((p) => [p.field, p]));
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export function normalizeProfile(profile = {}) {
  const normalized = { ...profile };
  for (const product of PRODUCTS) {
    normalized[product.field] = Boolean(profile[product.field]);
  }
  return normalized;
}

export function productUpdatesFromFlags(flags = {}) {
  const updates = {};
  for (const product of PRODUCTS) {
    if (flags[product.id] !== undefined) {
      updates[product.field] = Boolean(flags[product.id]);
    }
  }
  return updates;
}

export function activeProductCount(profile) {
  return PRODUCTS.filter((p) => profile?.[p.field]).length;
}

export function profileStatus(profile) {
  if (profile?.isAdmin) return 'admin';
  if (profile?.missingProfile) return 'orphan';
  const hasMain = PRODUCTS.some((p) => p.tier === 'main' && profile?.[p.field]);
  if (hasMain) return 'active';
  return 'pending';
}
