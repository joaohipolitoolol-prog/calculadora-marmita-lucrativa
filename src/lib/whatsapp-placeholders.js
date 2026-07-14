/** Fill WhatsApp template slots like [sabores], [PRECIO], [zona] before copy/share. */

export const PLACEHOLDER_RE = /\[([^\]]+)\]/g;

export function emptyMessageVars() {
  return { sabores: '', precio: '', zona: '', direccion: '' };
}

export function normalizePlaceholderKey(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[/\s]+/g, '_');
}

function lookupVar(key, vars) {
  const k = normalizePlaceholderKey(key);
  const aliases = {
    sabores: 'sabores',
    sabor: 'sabores',
    precio: 'precio',
    price: 'precio',
    zona: 'zona',
    direccion: 'direccion',
    direccion_lugar: 'direccion',
    lugar: 'direccion',
  };
  const field = aliases[k] || k;
  const val = vars?.[field];
  return val != null && String(val).trim() ? String(val).trim() : null;
}

export function applyPlaceholders(text, vars = {}) {
  return String(text || '').replace(PLACEHOLDER_RE, (full, key) => lookupVar(key, vars) ?? full);
}

export function findUnresolvedPlaceholders(text) {
  const found = [];
  String(text || '').replace(PLACEHOLDER_RE, (full) => {
    found.push(full);
    return full;
  });
  return [...new Set(found)];
}

export function messageVarsStorageKey(lineId, uid) {
  return `kit_msg_vars_${lineId || 'paletas'}_${uid || 'local'}_v1`;
}

export function loadMessageVars(lineId, uid) {
  try {
    const raw = localStorage.getItem(messageVarsStorageKey(lineId, uid));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return emptyMessageVars();
    return {
      sabores: String(parsed.sabores || ''),
      precio: String(parsed.precio || ''),
      zona: String(parsed.zona || ''),
      direccion: String(parsed.direccion || ''),
    };
  } catch {
    return emptyMessageVars();
  }
}

export function saveMessageVars(lineId, uid, vars) {
  try {
    localStorage.setItem(
      messageVarsStorageKey(lineId, uid),
      JSON.stringify({
        sabores: String(vars?.sabores || '').trim(),
        precio: String(vars?.precio || '').trim(),
        zona: String(vars?.zona || '').trim(),
        direccion: String(vars?.direccion || '').trim(),
      })
    );
  } catch {
    /* ignore */
  }
}
