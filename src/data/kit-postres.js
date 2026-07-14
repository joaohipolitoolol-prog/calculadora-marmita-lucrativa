/**
 * Kit Mini Postres Fríos Sin Horno — conteúdo in-app.
 * Big Idea: 3 bases → 12 sabores del menú (+ ampliación).
 * Recetas/combos/mensajes vienen de JSON generados por scripts/build-postres-content.mjs.
 */

import recetasData from './recetas-postres.json' with { type: 'json' };
import recetasPremiumData from './recetas-postres-premium.json' with { type: 'json' };
import combosData from './combos-postres-premium.json' with { type: 'json' };
import mensajesData from './mensajes-postres.json' with { type: 'json' };
import mensajesPremiumData from './mensajes-postres-premium.json' with { type: 'json' };
import fechasPremiumData from './fechas-postres-premium.json' with { type: 'json' };
import guiaPremiumData from './guia-postres-premium.json' with { type: 'json' };
import kitExtrasData from './kit-extras-postres.json' with { type: 'json' };

/** 12 sabores del menú principal (promesa de la oferta). */
export const MENU_12_NOMBRES = [
  'Fresa con crema',
  'Oreo cremoso',
  'Dulce de leche',
  'Coco rayado',
  'Chocolate intenso',
  'Café latte',
  'Nutella / avellana',
  'Cookie dough',
  'Maracuyá',
  'Limón cremoso',
  'Mango cremoso',
  'Piña colada',
];

const BASE_BY_NAME = {
  'Fresa con crema': 'crema',
  'Oreo cremoso': 'crema',
  'Dulce de leche': 'crema',
  'Coco rayado': 'crema',
  'Cheesecake en vaso': 'crema',
  'Banano con caramelo': 'crema',
  'Vainilla con chispas': 'crema',
  'Flan napolitano en vaso': 'crema',
  'Tiramisú en vaso': 'crema',
  'Pistacho cremoso': 'crema',
  'Churro con dulce de leche': 'crema',
  'Red velvet en vaso': 'crema',
  'Chocolate intenso': 'chocolate',
  'Café latte': 'chocolate',
  'Nutella / avellana': 'chocolate',
  'Cookie dough': 'chocolate',
  'Chocolate menta': 'chocolate',
  Maracuyá: 'frutal',
  'Limón cremoso': 'frutal',
  'Mango cremoso': 'frutal',
  'Piña colada': 'frutal',
  Guanábana: 'frutal',
  'Arándanos con yogur': 'frutal',
  'Guayaba con queso': 'frutal',
  'Mora silvestre': 'frutal',
  'Manzana y canela': 'frutal',
  'Durazno en almíbar': 'frutal',
  'Key lime / limón pay': 'frutal',
  'Sandía refrescante': 'frutal',
  'Frutos rojos mix': 'frutal',
};

function inferBase(recipe) {
  const byName = BASE_BY_NAME[recipe.nombre];
  if (byName) return byName;
  const tipo = String(recipe.tipo || '').toLowerCase();
  if (tipo.includes('frutal')) return 'frutal';
  if (/chocolate|café|cafe|nutella|cookie|menta/.test(String(recipe.nombre || '').toLowerCase())) {
    return 'chocolate';
  }
  return 'crema';
}

function enrichRecipe(recipe) {
  const base = inferBase(recipe);
  return {
    ...recipe,
    base,
    menuPrincipal: MENU_12_NOMBRES.includes(recipe.nombre),
    // Keep tipo for legacy UI; align labels with bases
    tipo:
      base === 'frutal' ? 'Frutal' : base === 'chocolate' ? 'Chocolate' : 'Crema',
  };
}

/** Método mostrado en app / PDFs */
export const METODO_3_BASES = {
  titulo: '3 bases → 12 mini postres',
  lead:
    'No necesitas 12 recetas distintas. Dominas 3 preparaciones base, cambias sabores y organizas una producción pequeña sin horno.',
  bases: [
    {
      id: 'crema',
      nombre: 'Base crema',
      sabores: ['Fresa', 'Oreo', 'Coco', 'Dulce de leche'],
    },
    {
      id: 'chocolate',
      nombre: 'Base chocolate',
      sabores: ['Chocolate', 'Café', 'Nutella', 'Galleta / cookie'],
    },
    {
      id: 'frutal',
      nombre: 'Base frutal',
      sabores: ['Maracuyá', 'Limón', 'Mango', 'Piña'],
    },
  ],
  pasos: [
    'Prepara 1 base (crema, chocolate o frutal).',
    'Agrega el sabor / topping del vaso.',
    'Calcula el costo de esa unidad antes de publicar.',
    'Empieza con 3 o 4 sabores; amplía con el resto del kit.',
  ],
};

/** Recetas del kit (30): las 12 del menú + ampliación */
export const RECETAS_POSTRES = recetasData.map(enrichRecipe);

/** 20 recetas premium */
export const RECETAS_POSTRES_PREMIUM = recetasPremiumData.map(enrichRecipe);

/** 10 combos rentables, complemento premium */
export const COMBOS_POSTRES_PREMIUM = combosData;

function brandMensaje(msg) {
  return {
    ...msg,
    texto: String(msg.texto || '')
      .replace(/postres en vaso/gi, 'mini postres fríos')
      .replace(/Postres en vaso/g, 'Mini postres fríos')
      .replace(/POSTRES EN VASO/g, 'MINI POSTRES FRÍOS'),
  };
}

/** Mensajes WhatsApp del kit base */
export const MENSAJES_POSTRES = mensajesData.map(brandMensaje);

/** Mensajes premium (combos, fechas, valor) */
export const MENSAJES_POSTRES_PREMIUM = mensajesPremiumData.map(brandMensaje);

/** Fechas especiales premium */
export const FECHAS_POSTRES_PREMIUM = fechasPremiumData;

/** Guía de presentación premium */
export const GUIA_POSTRES_PREMIUM = guiaPremiumData;

/** Técnicas, errores y tips de fotos + método */
export const KIT_EXTRAS_POSTRES = {
  ...kitExtrasData,
  tecnicas: [
    {
      titulo: 'Método: 3 bases sin horno',
      pasos: METODO_3_BASES.pasos,
    },
    ...(kitExtrasData.tecnicas || []),
  ],
};

export const PLAN_7_DIAS_POSTRES = [
  {
    dia: 1,
    titulo: 'Elige 1 base y 3 sabores',
    duracion: '30-45 min',
    meta: 'Empezar con el menú pequeño (no 12 a la vez)',
    tareas: [
      'Lee el método de 3 bases',
      'Elige 1 base (crema, chocolate o frutal)',
      'Marca 3 sabores del menú de 12 para la primera semana',
      'Anota ingredientes en la lista de compras',
    ],
  },
  {
    dia: 2,
    titulo: 'Calcula el costo de cada vaso',
    duracion: '20-30 min',
    meta: 'No producir a ciegas: saber margen antes de ofrecer',
    tareas: [
      'Abre la Calculadora de Precios',
      'Ingresa el costo real de cada ingrediente en tu ciudad',
      'Define tu margen y anota el precio sugerido por unidad',
    ],
  },
  {
    dia: 3,
    titulo: 'Prepara una tanda pequeña',
    duracion: '1-2 horas + frío',
    meta: 'Validar textura antes de vender',
    tareas: [
      'Produce 6-8 mini postres de prueba (1-2 sabores)',
      'Prueba textura, dulzor y presentación',
      'Ajusta antes de producir más',
    ],
  },
  {
    dia: 4,
    titulo: 'Fotos y catálogo',
    duracion: '45-60 min',
    meta: 'Menú claro para WhatsApp',
    tareas: [
      'Fotografía con luz natural (vaso limpio, capas visibles)',
      'Arma el catálogo con 3 o 4 sabores y precios',
      'Prepara imagen o texto para estado / historia',
    ],
  },
  {
    dia: 5,
    titulo: 'Publica en WhatsApp',
    duracion: '20-30 min',
    meta: 'Que al menos 10 personas vean tu oferta',
    tareas: [
      'Publica el catálogo en estado o historia',
      'Usa uno de los mensajes listos del kit',
      'Comparte con amigos, familia y vecinos',
    ],
  },
  {
    dia: 6,
    titulo: 'Organiza pedidos',
    duracion: 'Según demanda',
    meta: 'Responder con claridad y anotar cada pedido',
    tareas: [
      'Anota cada pedido en Kit → Pedidos',
      'Confirma entrega o punto de recogida',
      'Prepara la tanda con margen de refrigeración',
    ],
  },
  {
    dia: 7,
    titulo: 'Amplía el menú con datos',
    duracion: '30 min',
    meta: 'Semana 2 con lo que sí pidieron',
    tareas: [
      'Revisa qué sabores preguntaron más',
      'Agrega 1 o 2 sabores del menú de 12 (misma base)',
      'Ajusta precios si algún ingrediente subió',
    ],
  },
];

export const LISTA_COMPRAS_POSTRES = {
  ingredientes: [
    'Crema de leche (para batir)',
    'Queso crema',
    'Leche condensada',
    'Leche evaporada',
    'Azúcar glass',
    'Extracto de vainilla',
    'Fresas u otras frutas',
    'Maracuyá / pulpa',
    'Chocolate semiamargo',
    'Galletas María y Oreo',
    'Dulce de leche',
    'Mantequilla',
  ],
  materiales: [
    'Vasos transparentes 180-220 ml (mini porción)',
    'Cucharitas',
    'Tapas (si entregas)',
    'Etiquetas o stickers',
    'Bolsas o empaque para transporte',
  ],
  utensilios: [
    'Batidora o globo',
    'Espátula',
    'Balanza de cocina',
    'Refrigerador con espacio',
    'Piping bag (opcional, para crema)',
  ],
};

export const CHECKLIST_VENTA_POSTRES = [
  'Elegir 1 base y 3 o 4 sabores del menú de 12',
  'Comprar ingredientes, vasos y cucharitas',
  'Calcular costos con la calculadora (antes de producir)',
  'Definir precios con margen estimado',
  'Armar catálogo / menú para WhatsApp',
  'Tomar fotos con buena luz (vaso limpio)',
  'Publicar en estado o historia',
  'Tener mensajes listos para responder',
  'Anotar pedidos de forma organizada',
  'Organizar entrega o recogida',
  'Informar alérgenos (lácteos, gluten, nueces)',
  'Pedir feedback a quien prueba',
];

export const CHECKLIST_POSTRES = [
  'Revisar pedidos del día y cantidades por sabor',
  'Vasos y cucharitas limpios y listos',
  'Ingredientes fríos (crema) y medidos',
  'Base elegida lista (crema / chocolate / frutal)',
  'Capas montadas sin rebosar',
  'Tiempo de frío cumplido antes de entregar',
  'Fotos o menú actualizado en WhatsApp',
  'Mensajes de confirmación enviados',
  'Empaque listo para transporte',
  'Anotar qué sabores se agotaron',
];
