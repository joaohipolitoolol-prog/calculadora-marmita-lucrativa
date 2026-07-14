/**
 * Kit Postres en vaso, conteúdo in-app.
 * Recetas, combos y mensajes vienen de JSON generados por scripts/build-postres-content.mjs.
 */

import recetasData from './recetas-postres.json';
import recetasPremiumData from './recetas-postres-premium.json';
import combosData from './combos-postres-premium.json';
import mensajesData from './mensajes-postres.json';
import mensajesPremiumData from './mensajes-postres-premium.json';
import fechasPremiumData from './fechas-postres-premium.json';
import guiaPremiumData from './guia-postres-premium.json';
import kitExtrasData from './kit-extras-postres.json';

/** 30 recetas del kit principal */
export const RECETAS_POSTRES = recetasData;

/** 20 recetas premium */
export const RECETAS_POSTRES_PREMIUM = recetasPremiumData;

/** 10 combos rentables, complemento premium */
export const COMBOS_POSTRES_PREMIUM = combosData;

/** Mensajes WhatsApp del kit base */
export const MENSAJES_POSTRES = mensajesData;

/** Mensajes premium (combos, fechas, valor) */
export const MENSAJES_POSTRES_PREMIUM = mensajesPremiumData;

/** Fechas especiales premium */
export const FECHAS_POSTRES_PREMIUM = fechasPremiumData;

/** Guía de presentación premium */
export const GUIA_POSTRES_PREMIUM = guiaPremiumData;

/** Técnicas, errores y tips de fotos */
export const KIT_EXTRAS_POSTRES = kitExtrasData;

export const PLAN_7_DIAS_POSTRES = [
  {
    dia: 1,
    titulo: 'Elige tus primeros sabores',
    duracion: '30-45 min',
    meta: 'Definir 3 a 5 postres para empezar',
    tareas: [
      'Revisa las recetas del kit',
      'Elige 3 sabores fáciles (ej. fresa, Oreo, maracuyá)',
      'Anota ingredientes en la lista de compras',
    ],
  },
  {
    dia: 2,
    titulo: 'Calcula tus costos',
    duracion: '20-30 min',
    meta: 'Saber cuánto cuesta cada vaso y a qué precio vender',
    tareas: [
      'Abre la Calculadora de Precios',
      'Ingresa el costo real de cada ingrediente en tu ciudad',
      'Define tu margen y anota el precio sugerido por vaso',
    ],
  },
  {
    dia: 3,
    titulo: 'Prepara una pequeña tanda',
    duracion: '1-2 horas + frío',
    meta: 'Probar que la receta sale bien antes de vender',
    tareas: [
      'Produce 6-8 vasos de prueba (1-2 sabores)',
      'Prueba textura, dulzor y presentación',
      'Ajusta antes de producir más',
    ],
  },
  {
    dia: 4,
    titulo: 'Toma fotos y arma tu menú',
    duracion: '45-60 min',
    meta: 'Tener menú y foto listos para publicar',
    tareas: [
      'Fotografía con luz natural y fondo limpio (vaso transparente)',
      'Completa el menú editable con sabores y precios',
      'Prepara imagen o texto para WhatsApp',
    ],
  },
  {
    dia: 5,
    titulo: 'Publica en WhatsApp',
    duracion: '20-30 min',
    meta: 'Que al menos 10 personas vean tu oferta',
    tareas: [
      'Publica tu menú en estado o historia',
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
      'Anota cada pedido en Kit → Pedidos (cliente, sabores, total)',
      'Confirma entrega o punto de recogida',
      'Prepara la tanda del día con margen de frío',
    ],
  },
  {
    dia: 7,
    titulo: 'Ajusta sabores y precios',
    duracion: '30 min',
    meta: 'Planificar la semana 2 con datos reales',
    tareas: [
      'Revisa qué sabores preguntaron más',
      'Ajusta precios si algún ingrediente subió',
      'Planifica la tanda de la próxima semana',
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
    'Vasos transparentes 180-220 ml',
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
  'Elegir 3 a 5 sabores para empezar',
  'Comprar ingredientes, vasos y cucharitas',
  'Calcular costos con la calculadora',
  'Definir precios con margen estimado',
  'Armar mi menú para WhatsApp',
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
  'Bases de galleta listas',
  'Capas montadas sin rebosar',
  'Tiempo de frío cumplido antes de entregar',
  'Fotos o menú actualizado en WhatsApp',
  'Mensajes de confirmación enviados',
  'Empaque listo para transporte',
  'Anotar qué sabores se agotaron',
];
