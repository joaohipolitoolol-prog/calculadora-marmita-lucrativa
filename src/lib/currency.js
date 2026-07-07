const STORAGE_KEY = 'paletas_currency';

export const CURRENCIES = [
  { code: 'USD', label: 'Dólar (US)', symbol: 'US$', locale: 'en-US' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$', locale: 'es-MX' },
  { code: 'ARS', label: 'Peso argentino', symbol: '$', locale: 'es-AR' },
  { code: 'COP', label: 'Peso colombiano', symbol: '$', locale: 'es-CO' },
  { code: 'CLP', label: 'Peso chileno', symbol: '$', locale: 'es-CL' },
  { code: 'PEN', label: 'Sol peruano', symbol: 'S/', locale: 'es-PE' },
  { code: 'BRL', label: 'Real brasileño', symbol: 'R$', locale: 'pt-BR' },
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'es-ES' },
  { code: 'BOB', label: 'Boliviano', symbol: 'Bs', locale: 'es-BO' },
  { code: 'UYU', label: 'Peso uruguayo', symbol: '$', locale: 'es-UY' },
  { code: 'GTQ', label: 'Quetzal', symbol: 'Q', locale: 'es-GT' },
];

export function getCurrencyCode() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return CURRENCIES.some((c) => c.code === saved) ? saved : 'USD';
}

export function setCurrencyCode(code) {
  if (!CURRENCIES.some((c) => c.code === code)) return;
  localStorage.setItem(STORAGE_KEY, code);
}

export function getCurrency() {
  const code = getCurrencyCode();
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

export function getCurrencySymbol() {
  return getCurrency().symbol;
}
