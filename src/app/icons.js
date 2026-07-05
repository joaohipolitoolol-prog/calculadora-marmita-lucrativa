/** Ícones SVG inline — stroke, 24×24 */
const svg = (paths, viewBox = '0 0 24 24') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  menu: svg('<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>'),
  close: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  calc: svg(
    '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>'
  ),
  chart: svg(
    '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'
  ),
  book: svg(
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'
  ),
  help: svg('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
  zap: svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  list: svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  chevronLeft: svg('<polyline points="15 18 9 12 15 6"/>'),
  chevronRight: svg('<polyline points="9 18 15 12 9 6"/>'),
  home: svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  logo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
    <rect x="3" y="5" width="26" height="23" rx="2.5" fill="#2B2B2B"/>
    <rect x="4.5" y="6.5" width="23" height="20" rx="1.5" fill="#141414"/>
    <rect x="4.5" y="15" width="23" height="1.2" fill="#252525"/>
    <rect x="16" y="6.5" width="1.2" height="8.5" fill="#252525"/>
    <rect x="5.5" y="7.5" width="9.5" height="6.5" rx="1" fill="#E07A5F"/>
    <rect x="17.5" y="7.5" width="9.5" height="6.5" rx="1" fill="#F3F0E8"/>
    <rect x="5.5" y="16.5" width="10.5" height="9" rx="1" fill="#5FA34E"/>
    <rect x="17.5" y="16.5" width="9.5" height="9" rx="1" fill="#5C4636"/>
    <ellipse cx="22.2" cy="20.5" rx="3.2" ry="2.6" fill="#F2D56B"/>
  </svg>`,
  plus: svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  trash: svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
};

export const VIEW_META = {
  calc: { label: 'Calcular', icon: 'calc' },
  results: { label: 'Resultados', icon: 'chart' },
  bonus: { label: 'Cardápio', icon: 'book' },
  account: { label: 'Ajuda', icon: 'help' },
};
