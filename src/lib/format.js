import { getCurrency } from './currency.js';

export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return formatMoney(0);
  }
  return formatMoney(n);
}

function formatMoney(n) {
  const { code, locale } = getCurrency();
  return n.toLocaleString(locale, { style: 'currency', currency: code });
}

export function percent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0%';
  return `${n.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let s = String(value ?? '').trim();
  if (!s) return 0;

  s = s
    .replace(/US\$\s?/gi, '')
    .replace(/R\$\s?/gi, '')
    .replace(/S\/\s?/gi, '')
    .replace(/Bs\.?\s?/gi, '')
    .replace(/€\s?/gi, '')
    .replace(/Q\s?/gi, '')
    .replace(/\$\s?/g, '')
    .replace(/\s/g, '');
  if (!s) return 0;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    s = s.replace(',', '.');
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
