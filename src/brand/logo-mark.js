/** Marca única — marmita com comida (fonte da verdade para favicon + app) */
export const LOGO_VIEWBOX = '0 0 32 32';

export const LOGO_MARK_PATHS = `
  <defs>
    <linearGradient id="marmita-lid" x1="16" y1="4" x2="16" y2="11" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F07830"/>
      <stop offset="1" stop-color="#D45612"/>
    </linearGradient>
    <linearGradient id="marmita-body" x1="16" y1="11" x2="16" y2="30" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3D2E24"/>
      <stop offset="1" stop-color="#1F1612"/>
    </linearGradient>
  </defs>
  <path d="M9 3.5c0-1 1.2-1.8 2.6-1.8h8.8c1.4 0 2.6.8 2.6 1.8" stroke="#E8651A" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.55"/>
  <path d="M11 2.2c.4-.8 1.4-.8 1.8 0" stroke="#E8651A" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.45"/>
  <path d="M16 1.5c.5-.9 1.5-.9 2 0" stroke="#E8651A" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.45"/>
  <path d="M21 2.4c.4-.8 1.4-.8 1.8 0" stroke="#E8651A" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.45"/>
  <ellipse cx="16" cy="9.5" rx="13.5" ry="4.2" fill="url(#marmita-lid)"/>
  <rect x="3.5" y="8.5" width="25" height="2.8" rx="1.2" fill="#C24E10"/>
  <path d="M4.5 11.2h23c1.8 0 3.2 1.5 3.2 3.3v12.2c0 2.2-1.9 4-4.2 4H5.5c-2.3 0-4.2-1.8-4.2-4V14.5c0-1.8 1.4-3.3 3.2-3.3z" fill="url(#marmita-body)"/>
  <ellipse cx="16" cy="13.5" rx="10.5" ry="2.8" fill="#120E0C"/>
  <circle cx="11.5" cy="18.5" r="3.6" fill="#F3EDE3"/>
  <circle cx="10.2" cy="17.4" r="0.55" fill="#E0D8CC"/>
  <circle cx="12.8" cy="19.2" r="0.45" fill="#E0D8CC"/>
  <circle cx="20" cy="18.2" r="3.8" fill="#E07A5F"/>
  <path d="M18.2 17.2h3.6v1.4a1.8 1.8 0 0 1-1.8 1.8h0a1.8 1.8 0 0 1-1.8-1.8V17.2z" fill="#C9624A" opacity="0.7"/>
  <circle cx="15.8" cy="23.8" r="3.5" fill="#5FA34E"/>
  <path d="M14.2 22.2v3.2M15.8 21.5v4.6M17.4 22.5v3" stroke="#4A8A3C" stroke-width="1" stroke-linecap="round"/>
  <ellipse cx="16" cy="11" rx="11" ry="1.2" fill="#fff" opacity="0.06"/>
`;

export function logoMarkSvg({ width = 32, height = 32, ariaHidden = true, className = '' } = {}) {
  const a11y = ariaHidden
    ? 'aria-hidden="true"'
    : 'role="img" aria-label="Marmita Lucrativa"';
  const cls = className ? ` class="${className}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" width="${width}" height="${height}" ${a11y}${cls}>${LOGO_MARK_PATHS}</svg>`;
}

export function logoMarkFaviconDoc() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" role="img" aria-label="Marmita Lucrativa">${LOGO_MARK_PATHS}\n</svg>\n`;
}
