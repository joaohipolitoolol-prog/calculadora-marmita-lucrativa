/** Product entitlements, maps admin toggles to Firestore profile fields. */
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
    emoji: '🍨',
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
  const pending = profile.premiumPending && typeof profile.premiumPending === 'object'
    ? profile.premiumPending
    : {};
  normalized.premiumPending = {
    paletas: Boolean(pending.paletas),
    postres: Boolean(pending.postres),
  };
  // null = inherit line setting; true/false = per-user override
  if (profile.audioGuideEnabled === true || profile.audioGuideEnabled === false) {
    normalized.audioGuideEnabled = profile.audioGuideEnabled;
  } else {
    normalized.audioGuideEnabled = null;
  }
  if (profile.menuWebEnabled === true || profile.menuWebEnabled === false) {
    normalized.menuWebEnabled = profile.menuWebEnabled;
  } else {
    normalized.menuWebEnabled = null;
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

export function hasAnyEntitlement(profile) {
  if (!profile) return false;
  if (profile.isAdmin) return true;
  return PRODUCTS.some((p) => profile[p.field]);
}

/**
 * admin | orphan | pending_kit | pending_upsell | active
 * - pending_kit: no product yet (organic / waiting unlock)
 * - pending_upsell: has kit + premiumPending for a line, no premium yet
 */
export function profileStatus(profile) {
  if (profile?.isAdmin) return 'admin';
  if (profile?.missingProfile) return 'orphan';

  const hasKit = Boolean(profile?.hasKit || profile?.hasPostres);
  const hasPremium = Boolean(profile?.hasPremium || profile?.hasPostresPremium);
  const pendingUpsell =
    (profile?.premiumPending?.paletas && profile?.hasKit && !profile?.hasPremium) ||
    (profile?.premiumPending?.postres && profile?.hasPostres && !profile?.hasPostresPremium);

  if (!hasKit && !hasPremium) return 'pending_kit';
  if (pendingUpsell) return 'pending_upsell';
  return 'active';
}

export function isPendingStatus(status) {
  return status === 'pending_kit' || status === 'pending_upsell' || status === 'pending';
}
