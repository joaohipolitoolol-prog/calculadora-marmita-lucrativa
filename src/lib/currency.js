const STORAGE_KEY = 'paletas_currency';

export const CURRENCIES = [
  { code: 'USD', label: 'Dólar (US)', symbol: 'US$', icon: '🇺🇸', locale: 'en-US' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$', icon: '🇲🇽', locale: 'es-MX' },
  { code: 'ARS', label: 'Peso argentino', symbol: '$', icon: '🇦🇷', locale: 'es-AR' },
  { code: 'COP', label: 'Peso colombiano', symbol: '$', icon: '🇨🇴', locale: 'es-CO' },
  { code: 'CLP', label: 'Peso chileno', symbol: '$', icon: '🇨🇱', locale: 'es-CL' },
  { code: 'PEN', label: 'Sol peruano', symbol: 'S/', icon: '🇵🇪', locale: 'es-PE' },
  { code: 'BRL', label: 'Real brasileño', symbol: 'R$', icon: '🇧🇷', locale: 'pt-BR' },
  { code: 'EUR', label: 'Euro', symbol: '€', icon: '🇪🇺', locale: 'es-ES' },
  { code: 'BOB', label: 'Boliviano', symbol: 'Bs', icon: '🇧🇴', locale: 'es-BO' },
  { code: 'UYU', label: 'Peso uruguayo', symbol: '$', icon: '🇺🇾', locale: 'es-UY' },
  { code: 'GTQ', label: 'Quetzal', symbol: 'Q', icon: '🇬🇹', locale: 'es-GT' },
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
