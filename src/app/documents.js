/** Catálogo de entregáveis do kit + premium (IDs estáveis para viewer nativo). */

/**
 * kind:
 *  - native  → abre conteúdo in-app; downloadHref opcional (PDF)
 *  - html    → iframe HTML; Imprimir/PDF ou download
 *  - pdf     → iframe PDF (legado); preferir native+download
 *  - xlsx    → download direto
 *  - app-link → navega na app
 *
 * native: checklist | plan | mensajes | lista | combos | recetas | recetas-premium | menu
 *          | menu-premium | mensajes-premium | fechas | guia | tecnicas
 */

export const KIT_DOWNLOADS = [
  {
    id: 'kit-principal',
    kind: 'native',
    native: 'recetas',
    href: '/paletas-de-whatsapp/produto/Kit_Paletas_de_WhatsApp.html',
    downloadHref: '/paletas-de-whatsapp/produto/Kit_Paletas_de_WhatsApp.pdf',
    title: 'Kit Principal',
    desc: '30 recetas',
    icon: '📘',
    accent: '#ff4f8b',
    featured: true,
  },
  {
    id: 'calculadora',
    kind: 'app-link',
    href: '#',
    downloadHref: '/paletas-de-whatsapp/produto/Calculadora_Precios_Paletas.xlsx',
    title: 'Calculadora de precios',
    desc: 'Costo y ganancia',
    icon: '📊',
    accent: '#ff7a1a',
    appView: 'calc',
  },
  {
    id: 'menu-editable',
    kind: 'native',
    native: 'menu',
    href: '/paletas-de-whatsapp/produto/Menu_Editable_Paletas.html',
    downloadHref: '/paletas-de-whatsapp/produto/Menu_Editable_Paletas.html',
    title: 'Menú editable',
    desc: 'Copia en WhatsApp',
    icon: '📋',
    accent: '#5ecf9a',
  },
  {
    id: 'mensajes',
    kind: 'native',
    native: 'mensajes',
    href: '/paletas-de-whatsapp/produto/Mensajes_para_Vender_Paletas.html',
    downloadHref: '/paletas-de-whatsapp/produto/Mensajes_para_Vender_Paletas.pdf',
    title: 'Mensajes WhatsApp',
    desc: 'Textos listos para copiar',
    icon: '💬',
    accent: '#a78bfa',
  },
  {
    id: 'plan-7-dias',
    kind: 'native',
    native: 'plan',
    href: '/paletas-de-whatsapp/produto/Plan_7_Dias_Paletas.html',
    downloadHref: '/paletas-de-whatsapp/produto/Plan_7_Dias_Paletas.pdf',
    title: 'Plan de 7 días',
    desc: 'Paso a paso',
    icon: '📅',
    accent: '#60a5fa',
  },
  {
    id: 'checklist',
    kind: 'native',
    native: 'checklist',
    href: '/paletas-de-whatsapp/produto/Checklist_Paletas.html',
    downloadHref: '/paletas-de-whatsapp/produto/Checklist_Paletas.pdf',
    title: 'Checklist',
    desc: 'Antes de vender',
    icon: '✅',
    accent: '#f472b6',
  },
  {
    id: 'lista-compras',
    kind: 'native',
    native: 'lista',
    href: '/paletas-de-whatsapp/produto/Lista_Compras_Paletas.html',
    downloadHref: '/paletas-de-whatsapp/produto/Lista_Compras_Paletas.html',
    title: 'Lista de compras',
    desc: 'Ingredientes y materiales',
    icon: '🛒',
    accent: '#ff7a1a',
  },
  {
    id: 'tecnicas',
    kind: 'native',
    native: 'tecnicas',
    href: '/paletas-de-whatsapp/produto/Kit_Paletas_de_WhatsApp.pdf',
    downloadHref: '/paletas-de-whatsapp/produto/Kit_Paletas_de_WhatsApp.pdf',
    title: 'Técnicas y tips',
    desc: 'Producción y errores comunes',
    icon: '💡',
    accent: '#60a5fa',
  },
];

export const PREMIUM_DOWNLOADS = [
  {
    id: 'kit-premium',
    kind: 'native',
    native: 'recetas-premium',
    href: '/paletas-premium/produto/Kit_Premium_Paletas.html',
    downloadHref: '/paletas-premium/produto/Kit_Premium_Paletas.html',
    title: 'Kit Premium',
    desc: '20 recetas premium',
    icon: '✨',
    accent: '#ffc94a',
  },
  {
    id: 'combos',
    kind: 'native',
    native: 'combos',
    href: '/paletas-premium/produto/Combos_Rentables.html',
    downloadHref: '/paletas-premium/produto/Combos_Rentables.html',
    title: 'Combos rentables',
    desc: '10 ideas con precio guía',
    icon: '📦',
    accent: '#ff7a1a',
  },
  {
    id: 'menu-premium',
    kind: 'native',
    native: 'menu-premium',
    href: '/paletas-premium/produto/Menu_Premium_Editable.html',
    downloadHref: '/paletas-premium/produto/Menu_Premium_Editable.html',
    title: 'Menú premium',
    desc: 'Copia y pega en WhatsApp',
    icon: '📋',
    accent: '#5ecf9a',
  },
  {
    id: 'mensajes-premium',
    kind: 'native',
    native: 'mensajes-premium',
    href: '/paletas-premium/produto/Mensajes_Premium.html',
    downloadHref: '/paletas-premium/produto/Mensajes_Premium.html',
    title: 'Mensajes premium',
    desc: 'Combos y fechas especiales',
    icon: '💬',
    accent: '#a78bfa',
  },
  {
    id: 'fechas',
    kind: 'native',
    native: 'fechas',
    href: '/paletas-premium/produto/Fechas_Especiales.html',
    downloadHref: '/paletas-premium/produto/Fechas_Especiales.html',
    title: 'Fechas especiales',
    desc: 'Día de la Madre, Navidad…',
    icon: '🎉',
    accent: '#60a5fa',
  },
  {
    id: 'guia',
    kind: 'native',
    native: 'guia',
    href: '/paletas-premium/produto/Guia_Presentacion.html',
    downloadHref: '/paletas-premium/produto/Guia_Presentacion.html',
    title: 'Guía de presentación',
    desc: 'Fotos y empaque',
    icon: '📸',
    accent: '#f472b6',
  },
];

/** Postres — nativo en app + PDF/imprimir opcional */
export const POSTRES_DOWNLOADS = [
  {
    id: 'postres-kit-principal',
    kind: 'native',
    native: 'recetas',
    href: '/postres/produto/Kit_Postres_en_Vaso.html',
    downloadHref: '/postres/produto/Kit_Postres_en_Vaso.html',
    title: 'Kit Principal',
    desc: '30 recetas',
    icon: '📘',
    accent: '#EC3F7A',
    featured: true,
  },
  {
    id: 'postres-calculadora',
    kind: 'app-link',
    href: '#',
    downloadHref: '#',
    title: 'Calculadora de precios',
    desc: 'Costo y ganancia',
    icon: '📊',
    accent: '#ff7a1a',
    appView: 'calc',
  },
  {
    id: 'postres-menu',
    kind: 'native',
    native: 'menu',
    href: '/postres/produto/Menu_Editable_Postres.html',
    downloadHref: '/postres/produto/Menu_Editable_Postres.html',
    title: 'Menú editable',
    desc: 'Copia en WhatsApp',
    icon: '📋',
    accent: '#5ecf9a',
  },
  {
    id: 'postres-mensajes',
    kind: 'native',
    native: 'mensajes',
    href: '/postres/produto/Mensajes_Postres.html',
    downloadHref: '/postres/produto/Mensajes_Postres.html',
    title: 'Mensajes WhatsApp',
    desc: 'Textos listos para copiar',
    icon: '💬',
    accent: '#a78bfa',
  },
  {
    id: 'postres-plan',
    kind: 'native',
    native: 'plan',
    href: '/postres/produto/Plan_7_Dias_Postres.html',
    downloadHref: '/postres/produto/Plan_7_Dias_Postres.html',
    title: 'Plan de 7 días',
    desc: 'Paso a paso',
    icon: '📅',
    accent: '#60a5fa',
  },
  {
    id: 'postres-checklist',
    kind: 'native',
    native: 'checklist',
    href: '/postres/produto/Checklist_Postres.html',
    downloadHref: '/postres/produto/Checklist_Postres.html',
    title: 'Checklist',
    desc: 'Antes de vender',
    icon: '✅',
    accent: '#f472b6',
  },
  {
    id: 'postres-lista',
    kind: 'native',
    native: 'lista',
    href: '/postres/produto/Lista_Compras_Postres.html',
    downloadHref: '/postres/produto/Lista_Compras_Postres.html',
    title: 'Lista de compras',
    desc: 'Ingredientes y materiales',
    icon: '🛒',
    accent: '#ff7a1a',
  },
];

export const POSTRES_PREMIUM_DOWNLOADS = [
  {
    id: 'postres-premium-kit',
    kind: 'native',
    native: 'recetas-premium',
    href: '/postres-premium/produto/Kit_Premium_Postres.html',
    downloadHref: '/postres-premium/produto/Kit_Premium_Postres.html',
    title: 'Kit Premium',
    desc: '20 recetas premium',
    icon: '✨',
    accent: '#ffc94a',
  },
  {
    id: 'postres-premium-combos',
    kind: 'native',
    native: 'combos',
    href: '/postres-premium/produto/Combos_Rentables_Postres.html',
    downloadHref: '/postres-premium/produto/Combos_Rentables_Postres.html',
    title: 'Combos rentables',
    desc: '10 combos con precio guía',
    icon: '📦',
    accent: '#ff7a1a',
  },
  {
    id: 'postres-premium-menu',
    kind: 'native',
    native: 'menu-premium',
    href: '/postres-premium/produto/Menu_Premium_Postres.html',
    downloadHref: '/postres-premium/produto/Menu_Premium_Postres.html',
    title: 'Menú premium',
    desc: 'Copia y pega en WhatsApp',
    icon: '📋',
    accent: '#5ecf9a',
  },
  {
    id: 'postres-premium-mensajes',
    kind: 'native',
    native: 'mensajes-premium',
    href: '/postres-premium/produto/Mensajes_Premium_Postres.html',
    downloadHref: '/postres-premium/produto/Mensajes_Premium_Postres.html',
    title: 'Mensajes premium',
    desc: 'Combos y fechas especiales',
    icon: '💬',
    accent: '#a78bfa',
  },
  {
    id: 'postres-premium-fechas',
    kind: 'native',
    native: 'fechas',
    href: '/postres-premium/produto/Fechas_Especiales_Postres.html',
    downloadHref: '/postres-premium/produto/Fechas_Especiales_Postres.html',
    title: 'Fechas especiales',
    desc: 'Día de la Madre, Navidad…',
    icon: '🎉',
    accent: '#60a5fa',
  },
  {
    id: 'postres-premium-guia',
    kind: 'native',
    native: 'guia',
    href: '/postres-premium/produto/Guia_Presentacion_Postres.html',
    downloadHref: '/postres-premium/produto/Guia_Presentacion_Postres.html',
    title: 'Guía de presentación',
    desc: 'Fotos y empaque',
    icon: '📸',
    accent: '#f472b6',
  },
];

const ALL_DOCS = [
  ...KIT_DOWNLOADS,
  ...PREMIUM_DOWNLOADS,
  ...POSTRES_DOWNLOADS,
  ...POSTRES_PREMIUM_DOWNLOADS,
];

export function getDocById(id) {
  if (!id) return null;
  return ALL_DOCS.find((doc) => doc.id === id) || null;
}

export function isViewableDoc(doc) {
  return Boolean(doc && (doc.kind === 'pdf' || doc.kind === 'html' || doc.kind === 'native'));
}

export function isNativeDoc(doc) {
  return Boolean(doc && doc.kind === 'native' && doc.native);
}

export function kindLabel(kind) {
  if (kind === 'native' || kind === 'app-link') return 'App';
  if (kind === 'html') return 'HTML';
  if (kind === 'pdf') return 'PDF';
  if (kind === 'xlsx') return 'Excel';
  return '';
}

export function hasPdfDownload(doc) {
  return Boolean(doc?.downloadHref && String(doc.downloadHref).toLowerCase().endsWith('.pdf'));
}
