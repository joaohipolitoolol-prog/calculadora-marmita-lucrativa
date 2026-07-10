/**
 * Stable WhatsApp number registry — analytics + multi-X support.
 * Swap e164 without hunting string literals across the codebase.
 */

export const WHATSAPP_NUMBERS = [
  {
    id: 'paletas_support',
    e164: '447402867442',
    display: '+44 7402 867442',
    label: 'Paletas soporte',
    line: 'paletas',
    purpose: 'support',
  },
  {
    id: 'paletas_sales',
    e164: '447402867442',
    display: '+44 7402 867442',
    label: 'Paletas ventas',
    line: 'paletas',
    purpose: 'sales',
  },
  {
    id: 'postres_support',
    e164: '447402867442',
    display: '+44 7402 867442',
    label: 'Postres soporte',
    line: 'postres',
    purpose: 'support',
  },
  {
    id: 'postres_sales',
    e164: '447402867442',
    display: '+44 7402 867442',
    label: 'Postres ventas',
    line: 'postres',
    purpose: 'sales',
  },
];

export const WHATSAPP_BY_ID = Object.fromEntries(WHATSAPP_NUMBERS.map((n) => [n.id, n]));

export function getWhatsAppNumber(id) {
  return WHATSAPP_BY_ID[id] || WHATSAPP_BY_ID.paletas_support;
}

export function getWhatsAppUrl(id, message = '') {
  const entry = getWhatsAppNumber(id);
  const base = `https://wa.me/${entry.e164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppDisplay(id) {
  return getWhatsAppNumber(id).display;
}

export function numbersForLine(lineId) {
  return WHATSAPP_NUMBERS.filter((n) => n.line === lineId);
}

export function defaultNumberIdForLine(lineId, purpose = 'support') {
  const match = WHATSAPP_NUMBERS.find((n) => n.line === lineId && n.purpose === purpose);
  if (match) return match.id;
  return lineId === 'postres' ? 'postres_support' : 'paletas_support';
}
