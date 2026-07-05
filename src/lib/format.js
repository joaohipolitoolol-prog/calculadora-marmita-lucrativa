export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function percent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0%';
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let s = String(value ?? '').trim();
  if (!s) return 0;

  s = s.replace(/R\$\s?/gi, '').replace(/\s/g, '');
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
