/**
 * Mini Postres Fríos Sin Horno: central landing config.
 * Edit prices, checkout, VSL, and feature flags here (or via env).
 *
 * Env (Vite exposes VITE_* and NEXT_PUBLIC_*; see vite.config.js envPrefix):
 *   NEXT_PUBLIC_MINIPOSTRES_PRICE / VITE_MINIPOSTRES_PRICE
 *   NEXT_PUBLIC_MINIPOSTRES_CHECKOUT_URL / VITE_MINIPOSTRES_CHECKOUT_URL
 *   NEXT_PUBLIC_MINIPOSTRES_VSL_URL / VITE_MINIPOSTRES_VSL_URL
 *   NEXT_PUBLIC_MINIPOSTRES_BUMP_MESSAGES_PRICE / VITE_MINIPOSTRES_BUMP_MESSAGES_PRICE
 *   NEXT_PUBLIC_MINIPOSTRES_BUMP_CATALOG_PRICE / VITE_MINIPOSTRES_BUMP_CATALOG_PRICE
 *   NEXT_PUBLIC_MINIPOSTRES_ACCESS_URL / VITE_MINIPOSTRES_ACCESS_URL
 */

function env(key, fallback = '') {
  const meta = typeof import.meta !== 'undefined' ? import.meta.env : {};
  const primary = meta?.[key];
  if (primary != null && String(primary).trim() !== '') return String(primary).trim();

  // Accept either NEXT_PUBLIC_ or VITE_ prefix
  const altKey = key.startsWith('NEXT_PUBLIC_')
    ? key.replace(/^NEXT_PUBLIC_/, 'VITE_')
    : key.startsWith('VITE_')
      ? key.replace(/^VITE_/, 'NEXT_PUBLIC_')
      : null;
  if (altKey) {
    const alt = meta?.[altKey];
    if (alt != null && String(alt).trim() !== '') return String(alt).trim();
  }
  return fallback;
}

function parsePrice(raw, fallback) {
  const n = Number(String(raw).replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function formatUsd(value) {
  const fixed = Number(value).toFixed(2);
  const [intPart, dec] = fixed.split('.');
  return `US$ ${intPart},${dec}`;
}

export const productName = 'Mini Postres Fríos Sin Horno';
export const productSlug = 'minipostres';
export const productShort = 'Mini Postres Fríos';
export const analyticsPrefix = 'MiniPostres';
export const metaPixelId = '1369803401885896';
export const contentIds = ['minipostres_kit'];
export const line = 'minipostres';
export const pageKey = 'minipostres';

export const MAIN_PRICE = parsePrice(
  env('NEXT_PUBLIC_MINIPOSTRES_PRICE', env('VITE_MINIPOSTRES_PRICE', '7.49')),
  7.49
);
export const MAIN_PRICE_LABEL = formatUsd(MAIN_PRICE);
export const PRICE_ACCESS_LABEL = `Pago único de ${MAIN_PRICE_LABEL}`;

export const CHECKOUT_URL = env(
  'NEXT_PUBLIC_MINIPOSTRES_CHECKOUT_URL',
  env('VITE_MINIPOSTRES_CHECKOUT_URL', 'https://pay.hotmart.com/I106646611G?checkoutMode=10')
);

export const VSL_URL = env(
  'NEXT_PUBLIC_MINIPOSTRES_VSL_URL',
  env('VITE_MINIPOSTRES_VSL_URL', '')
);

export const ACCESS_URL = env(
  'NEXT_PUBLIC_MINIPOSTRES_ACCESS_URL',
  env('VITE_MINIPOSTRES_ACCESS_URL', '/app?line=postres')
);

export const BUMP_MESSAGES_PRICE = parsePrice(
  env('NEXT_PUBLIC_MINIPOSTRES_BUMP_MESSAGES_PRICE', env('VITE_MINIPOSTRES_BUMP_MESSAGES_PRICE', '2.90')),
  2.9
);
export const BUMP_MESSAGES_PRICE_LABEL = formatUsd(BUMP_MESSAGES_PRICE);

export const BUMP_CATALOG_PRICE = parsePrice(
  env('NEXT_PUBLIC_MINIPOSTRES_BUMP_CATALOG_PRICE', env('VITE_MINIPOSTRES_BUMP_CATALOG_PRICE', '2.90')),
  2.9
);
export const BUMP_CATALOG_PRICE_LABEL = formatUsd(BUMP_CATALOG_PRICE);

export const guaranteeDays = 30;
export const supportUrl = env(
  'NEXT_PUBLIC_MINIPOSTRES_SUPPORT_URL',
  env('VITE_MINIPOSTRES_SUPPORT_URL', '')
);

/** Feature flags */
export const showTestimonials = false;
export const showExpertSection = false;
/** Mention bumps on LP only when checkout actually offers them */
export const showOrderBumps = false;
export const orderBumpsConfiguredOnCheckout = false;

export const HERO_CTA_LABEL = 'Quiero armar mi menú';
export const OFFER_CTA_LABEL = 'Quiero armar mi menú';
export const FINAL_CTA_LABEL = 'Quiero armar mi menú';
export const STICKY_CTA_LABEL = 'Quiero armar mi menú';

export const SITE_ORIGIN = 'https://paletasparawhatsapp.vercel.app';
export const CANONICAL_URL = `${SITE_ORIGIN}/postres`;
export const OG_IMAGE = `${SITE_ORIGIN}/postres/og-postres-whatsapp.webp?v=8`;

/**
 * Deliverable modules. status: available | comingSoon | hidden
 */
export const modules = [
  {
    id: 'bases',
    status: 'available',
    title: 'Método de las 3 Bases',
    description: 'Aprende las preparaciones principales y cómo utilizarlas.',
  },
  {
    id: 'recetario',
    status: 'available',
    title: 'Recetario con 12 sabores',
    description: 'Ingredientes, cantidades, preparación y montaje.',
  },
  {
    id: 'calculadora',
    status: 'available',
    title: 'Calculadora de costos',
    description: 'Organiza costos y adapta tus precios.',
  },
  {
    id: 'lista',
    status: 'available',
    title: 'Lista de compras',
    description: 'Ingredientes separados por categorías.',
  },
  {
    id: 'catalogo',
    status: 'available',
    title: 'Catálogo para WhatsApp',
    description: 'Modelo listo para personalizar con sabores y precios.',
  },
  {
    id: 'fotos',
    status: 'available',
    title: 'Guía de fotos',
    description: 'Cómo fotografiar tus postres usando el celular.',
  },
  {
    id: 'mensajes',
    status: 'available',
    title: 'Mensajes para clientes',
    description: 'Respuestas para pedidos, precios, entregas y disponibilidad.',
  },
  {
    id: 'conservacion',
    status: 'available',
    title: 'Guía de conservación',
    description: 'Orientaciones generales para almacenar y entregar.',
  },
  {
    id: 'plan',
    status: 'available',
    title: 'Plan de inicio',
    description: 'Una secuencia simple para preparar, fotografiar y ofrecer.',
  },
  {
    id: 'mobile',
    status: 'available',
    title: 'Acceso por celular',
    description: 'Consulta el material desde donde estés.',
  },
];

export const flavors = [
  {
    id: 'fresa',
    name: 'Fresa cremosa',
    description: 'Base suave con fresa y cobertura frutal.',
    tag: 'frutal',
    highlight: true,
    image: '/minipostres/flavors/fresa.webp?v=1',
  },
  {
    id: 'limon',
    name: 'Limón',
    description: 'Crema de limón con raspadura fresca.',
    tag: 'frutal',
    image: '/minipostres/flavors/limon.webp?v=1',
  },
  {
    id: 'oreo',
    name: 'Oreo',
    description: 'Crema, chocolate y galleta en porción individual.',
    tag: 'chocolate',
    highlight: true,
    image: '/minipostres/flavors/oreo.webp?v=1',
  },
  {
    id: 'chocolate',
    name: 'Chocolate',
    description: 'Intenso, con cobertura de chocolate.',
    tag: 'chocolate',
    image: '/minipostres/flavors/chocolate.webp?v=1',
  },
  {
    id: 'maracuya',
    name: 'Maracuyá',
    description: 'Crema fría con cobertura ácida de maracuyá.',
    tag: 'frutal',
    image: '/minipostres/flavors/maracuya.webp?v=1',
  },
  {
    id: 'dulce-leche',
    name: 'Dulce de leche',
    description: 'Capas de caramelo y crema.',
    tag: 'cremoso',
    image: '/minipostres/flavors/dulce-leche.webp?v=1',
  },
  {
    id: 'cheesecake',
    name: 'Cheesecake frío',
    description: 'Estilo cheesecake sin horno, porción individual.',
    tag: 'cremoso',
    image: '/minipostres/flavors/cheesecake.webp?v=1',
  },
  {
    id: 'tarta-alemana',
    name: 'Chocolate y uva',
    description: 'Crema, chocolate brillante y toque de uva.',
    tag: 'chocolate',
    highlight: true,
    image: '/minipostres/flavors/tarta-alemana.webp?v=1',
  },
];

export const faq = [
  {
    q: '¿Necesito horno?',
    a: 'No. Las recetas principales fueron seleccionadas para prepararse sin horno.',
  },
  {
    q: '¿Necesito saber repostería?',
    a: 'No. El contenido explica las preparaciones paso a paso. Aun así, necesitarás practicar y seguir las cantidades.',
  },
  {
    q: '¿Puedo comenzar con pocos sabores?',
    a: 'Sí. Puedes iniciar con tres o cuatro sabores y ampliar el menú gradualmente.',
  },
  {
    q: '¿Los ingredientes existen en mi país?',
    a: 'Las recetas utilizan ingredientes comunes, pero algunas marcas y nombres pueden variar. El material incluye orientaciones para sustituciones cuando sea posible.',
  },
  {
    q: '¿Cuánto dinero necesito para comenzar?',
    a: 'El valor depende de los ingredientes, empaques y precios de tu ciudad. Recomendamos comenzar con una producción pequeña y calcular antes de comprar.',
  },
  {
    q: '¿Cuánto puedo ganar?',
    a: 'No existe una cifra garantizada. Los resultados dependen de costos, precios, cantidad de pedidos, presentación y ejecución.',
  },
  {
    q: '¿Voy a recibir clientes?',
    a: 'No. Recibirás materiales para presentar tus productos y ofrecerlos, pero la búsqueda y atención de clientes depende de ti.',
  },
  {
    q: '¿Cómo recibo el material?',
    a: 'Después de la confirmación del pago, recibirás las instrucciones de acceso.',
  },
  {
    q: '¿Puedo ver el contenido desde el celular?',
    a: 'Sí. El material fue pensado para ser consultado principalmente desde el celular.',
  },
  {
    q: '¿Las recetas sirven para eventos?',
    a: 'Pueden adaptarse para pedidos mayores, pero recomendamos primero dominar la producción en pequeñas cantidades.',
  },
  {
    q: '¿Incluye soporte?',
    a: 'El acceso es al material digital. Orientación general está dentro del contenido. No incluye asesoría personalizada ilimitada ni acompañamiento diario uno a uno.',
  },
];

export const orderBumps = [
  {
    id: 'messages',
    name: '50 Mensajes para Vender por WhatsApp',
    description:
      'Mensajes listos para mostrar sabores, responder precios, recuperar clientes y organizar pedidos.',
    price: BUMP_MESSAGES_PRICE,
    priceLabel: BUMP_MESSAGES_PRICE_LABEL,
  },
  {
    id: 'catalog',
    name: 'Catálogo Premium de Sabores',
    description: 'Plantillas visuales para presentar tus postres de forma más profesional.',
    price: BUMP_CATALOG_PRICE,
    priceLabel: BUMP_CATALOG_PRICE_LABEL,
  },
];

/** @deprecated prefer named exports above; aliases for landing-checkout style */
export const PRODUCT_NAME = productName;
export const CHECKOUT_URL_EXPORT = CHECKOUT_URL;
