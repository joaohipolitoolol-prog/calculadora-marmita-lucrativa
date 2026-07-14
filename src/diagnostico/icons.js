/** Inline SVG icons, zero network, crisp on retina */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

function svg(paths, viewBox = '0 0 24 24') {
  return `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false">${paths}</svg>`;
}

export const ICONS = {
  spark: svg(
    `<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" ${attrs(stroke)}/><circle cx="12" cy="12" r="3" ${attrs(stroke)}/>`,
  ),
  chat: svg(
    `<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.2A8 8 0 1 1 21 12Z" ${attrs(stroke)}/>`,
  ),
  heart: svg(`<path d="M12 21s-7-4.4-9.5-8.2A5.4 5.4 0 0 1 12 5.2a5.4 5.4 0 0 1 9.5 7.6C19 16.6 12 21 12 21Z" ${attrs(stroke)}/>`),
  home: svg(
    `<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" ${attrs(stroke)}/>`,
  ),
  clock: svg(
    `<circle cx="12" cy="12" r="8" ${attrs(stroke)}/><path d="M12 8v4l2.5 1.5" ${attrs(stroke)}/>`,
  ),
  shield: svg(
    `<path d="M12 3 5 6v5c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z" ${attrs(stroke)}/><path d="m9 12 2 2 4-4" ${attrs(stroke)}/>`,
  ),
  recipe: svg(
    `<path d="M8 4h8a2 2 0 0 1 2 2v14l-6-2-6 2V6a2 2 0 0 1 2-2Z" ${attrs(stroke)}/><path d="M10 9h4M10 13h4" ${attrs(stroke)}/>`,
  ),
  calc: svg(
    `<rect x="5" y="3" width="14" height="18" rx="2" ${attrs(stroke)}/><path d="M8 8h8M8 12h3M13 12h3M8 16h3M13 16h3" ${attrs(stroke)}/>`,
  ),
  menu: svg(
    `<rect x="5" y="4" width="14" height="16" rx="2" ${attrs(stroke)}/><path d="M8 9h8M8 13h8M8 17h5" ${attrs(stroke)}/>`,
  ),
  box: svg(
    `<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" ${attrs(stroke)}/><path d="M12 12 4 7M12 12l8-5M12 12v10" ${attrs(stroke)}/>`,
  ),
  check: svg(`<path d="M5 13l4 4L19 7" ${attrs(stroke)}/>`),
  book: svg(
    `<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z" ${attrs(stroke)}/><path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H19" ${attrs(stroke)}/>`,
  ),
  lock: svg(
    `<rect x="5" y="11" width="14" height="10" rx="2" ${attrs(stroke)}/><path d="M8 11V8a4 4 0 0 1 8 0v3" ${attrs(stroke)}/>`,
  ),
  star: svg(
    `<path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18l.9-5.4L4.2 8.7l5.4-.8L12 3Z" ${attrs(stroke)}/>`,
  ),
  rocket: svg(
    `<path d="M5 15c2 0 4-2 5-4 2-5 7-7 10-8-1 3-3 8-8 10-2 1-4 3-4 5l-3 1 1-3Z" ${attrs(stroke)}/><circle cx="14.5" cy="9.5" r="1.2" fill="currentColor"/>`,
  ),
  search: svg(
    `<circle cx="11" cy="11" r="6" ${attrs(stroke)}/><path d="m16 16 4 4" ${attrs(stroke)}/>`,
  ),
  user: svg(
    `<circle cx="12" cy="8" r="3.5" ${attrs(stroke)}/><path d="M5 20a7 7 0 0 1 14 0" ${attrs(stroke)}/>`,
  ),
  phone: svg(
    `<rect x="7" y="3" width="10" height="18" rx="2" ${attrs(stroke)}/><path d="M10 17h4" ${attrs(stroke)}/>`,
  ),
  dollar: svg(
    `<circle cx="12" cy="12" r="8" ${attrs(stroke)}/><path d="M12 7v10M9.5 9.5c.5-1 1.5-1.5 2.5-1.5s2 .6 2 1.8c0 2.2-4 1.4-4 3.6 0 1.2 1 1.8 2 1.8s2-.5 2.5-1.5" ${attrs(stroke)}/>`,
  ),
  warning: svg(
    `<path d="M12 4 3 19h18L12 4Z" ${attrs(stroke)}/><path d="M12 10v4M12 16.5v.5" ${attrs(stroke)}/>`,
  ),
  arrow: svg(`<path d="M5 12h14M13 6l6 6-6 6" ${attrs(stroke)}/>`),
  gift: svg(
    `<rect x="4" y="9" width="16" height="11" rx="1.5" ${attrs(stroke)}/><path d="M12 9v11M4 13h16M12 9c-2-3-5-3-5 0 0 1.5 2 2.5 5 3 3-.5 5-1.5 5-3 0-3-3-3-5 0Z" ${attrs(stroke)}/>`,
  ),
  wa: svg(
    `<path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L4 20.5l4.3-.7A8.5 8.5 0 1 0 12 3.5Z" ${attrs(stroke)}/><path d="M9.2 9.4c.2-.5.4-.5.6-.5h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .4-.1.6l-.3.4c-.1.2-.1.3 0 .5.4.7 1.1 1.3 1.8 1.7.2.1.4.1.5 0l.5-.4c.2-.1.4-.1.6 0l1.4.7c.3.1.4.3.4.5v.5c0 .2 0 .4-.2.6-.3.3-.7.5-1.2.5h-.1c-1.7-.1-3.4-.9-4.7-2.2-1.2-1.2-2-2.8-2.2-4.4 0-.5.2-.9.5-1.2Z" ${attrs(stroke)}/>`,
  ),
};

function attrs(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
}

export function icon(name, className = 'dx-icon') {
  const raw = ICONS[name] || ICONS.spark;
  return raw.replace('<svg', `<svg class="${className}"`);
}
