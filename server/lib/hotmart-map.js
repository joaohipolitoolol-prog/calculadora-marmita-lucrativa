/**
 * Map Hotmart product/offer IDs → internal product codes.
 *
 * Checkout URLs in the app use these Hotmart codes:
 *   Paletas kit     → L106739688G (legacy A106645076Y)
 *   Paletas premium → O106646563E
 *   Postres kit     → I106646611G
 *   Postres premium → Y106683338S
 *   Mini Postres kit (legacy Hotmart) → D106734353A → grants postres_kit
 *
 * Override via env HOTMART_PRODUCT_MAP (JSON) if Hotmart dashboard IDs differ.
 */
import { mapPurchaseProduct } from './grant-entitlements.js';

const DEFAULT_MAP = {
  // numeric product ids (common in webhook data.product.id)
  '106739688': 'paletas_kit',
  '106645076': 'paletas_kit', // legacy
  '106646563': 'paletas_premium',
  '106646611': 'postres_kit',
  '106683338': 'postres_premium',
  // Legacy Mini checkout: same offer as Postres en Vaso Sin Horno
  '106734353': 'postres_kit',
  // checkout codes as they appear in pay.hotmart.com URLs
  L106739688G: 'paletas_kit',
  A106645076Y: 'paletas_kit', // legacy
  O106646563E: 'paletas_premium',
  I106646611G: 'postres_kit',
  Y106683338S: 'postres_premium',
  D106734353A: 'postres_kit',
};

function loadEnvMap() {
  const raw = process.env.HOTMART_PRODUCT_MAP;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function nameHint(name) {
  const n = String(name || '').toLowerCase();
  if (!n) return null;
  const isPremium = /premium|upsell|completo|plus/.test(n);
  // Legacy Mini Hotmart names → Postres kit (unified offer)
  if (/mini\s*postre/.test(n)) return isPremium ? 'postres_premium' : 'postres_kit';
  const isPostres = /postre/.test(n);
  if (isPostres && isPremium) return 'postres_premium';
  if (isPostres) return 'postres_kit';
  if (/paleta/.test(n) && isPremium) return 'paletas_premium';
  if (/paleta/.test(n)) return 'paletas_kit';
  return null;
}

/**
 * @param {{ productId?: string|number, ucode?: string, offer?: string, name?: string }} input
 * @returns {{ product: string, line: string, tier: string } | null}
 */
export function resolveHotmartProduct(input = {}) {
  const map = { ...DEFAULT_MAP, ...loadEnvMap() };
  const candidates = [
    input.productId,
    input.ucode,
    input.offer,
    String(input.productId || '').replace(/^[A-Z]/, '').replace(/[A-Z]$/, ''),
  ]
    .filter((v) => v != null && String(v).trim() !== '')
    .map((v) => String(v).trim());

  for (const key of candidates) {
    const code = map[key] || map[key.toUpperCase()] || map[key.toLowerCase()];
    if (code) {
      const mapped = mapPurchaseProduct(code);
      if (mapped) return { product: code, ...mapped };
    }
  }

  const hinted = nameHint(input.name);
  if (hinted) {
    const mapped = mapPurchaseProduct(hinted);
    if (mapped) return { product: hinted, ...mapped };
  }

  return null;
}

export const APPROVED_EVENTS = new Set([
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
  'PURCHASE_FINISHED',
]);
