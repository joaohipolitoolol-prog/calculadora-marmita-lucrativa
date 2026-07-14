import recetasData from './recetas-paletas.json';
import recetasPremiumData from './recetas-premium.json';
import combosPremiumData from './combos-premium.json';
import mensajesData from './mensajes-paletas.json';
import mensajesPremiumData from './mensajes-paletas-premium.json';
import fechasPremiumData from './fechas-paletas-premium.json';
import guiaPremiumData from './guia-paletas-premium.json';
import kitExtrasData from './kit-extras-paletas.json';

/** 30 recetas completas — sincronizadas con content.py / PDF */
export const RECETAS_PALETAS = recetasData;

/** 20 recetas premium — complemento digital */
export const RECETAS_PREMIUM = recetasPremiumData;

/** 10 combos rentables — complemento premium */
export const COMBOS_PREMIUM = combosPremiumData;

/** 60 mensajes — sincronizados con content.py / PDF */
export const MENSAJES_WHATSAPP = mensajesData;

/** Premium — complemento digital */
export const MENSAJES_PREMIUM = mensajesPremiumData;
export const FECHAS_PREMIUM = fechasPremiumData;
export const GUIA_PREMIUM = guiaPremiumData;

/** Técnicas, errores y tips — del kit PDF principal */
export const KIT_EXTRAS = kitExtrasData;

/** Sincronizado con paletas-de-whatsapp/build/content.py (fuente del PDF) */
export const PLAN_7_DIAS = [
  {
    dia: 1,
    titulo: 'Elige tus primeras recetas',
    duracion: '30–45 min',
    meta: 'Tener 3 a 5 sabores definidos y lista de compras',
    tareas: [
      'Revisa las 30 recetas del kit',
      'Elige 3 a 5 sabores para empezar (1 frutal, 1 cremosa, 1 rellena)',
      'Anota los ingredientes en la lista de compras de la calculadora',
    ],
  },
  {
    dia: 2,
    titulo: 'Calcula tus costos',
    duracion: '20–30 min',
    meta: 'Saber cuánto te cuesta cada paleta y a qué precio vender',
    tareas: [
      'Abre la Calculadora de Precios',
      'Ingresa el costo real de cada ingrediente en tu ciudad',
      'Define tu margen y anota el precio sugerido por paleta',
    ],
  },
  {
    dia: 3,
    titulo: 'Prepara una pequeña tanda',
    duracion: '1–2 horas + congelación',
    meta: 'Probar que la receta sale bien antes de vender',
    tareas: [
      'Produce solo 6-10 paletas como prueba',
      'Prueba textura y dulzor',
      'Ajusta la receta si es necesario antes de producir más',
    ],
  },
  {
    dia: 4,
    titulo: 'Toma fotos y arma tu menú',
    duracion: '45–60 min',
    meta: 'Tener menú y foto listos para publicar',
    tareas: [
      'Fotografía con luz natural y fondo limpio',
      'Completa el menú editable con sabores y precios',
      'Prepara imagen o texto para publicar en WhatsApp',
    ],
  },
  {
    dia: 5,
    titulo: 'Publica en WhatsApp',
    duracion: '20–30 min',
    meta: 'Que al menos 10 personas vean tu oferta',
    tareas: [
      'Publica tu menú en estado o historia',
      'Usa uno de los mensajes listos del kit',
      'Comparte con amigos, familia y vecinos con educación',
    ],
  },
  {
    dia: 6,
    titulo: 'Organiza pedidos',
    duracion: 'Según demanda',
    meta: 'Responder con claridad y anotar cada pedido',
    tareas: [
      'Anota cada pedido en Kit → Pedidos (cliente, sabores, total)',
      'Confirma sabores, cantidad y forma de pago',
      'Organiza entrega o punto de recogida',
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

export const LISTA_COMPRAS = {
  ingredientes: [
    'Leche entera o evaporada',
    'Crema de leche o media crema',
    'Leche condensada',
    'Azúcar o miel',
    'Frutas frescas o congeladas (fresa, mango, limón, etc.)',
    'Cacao en polvo o chocolate para derretir',
    'Yogur natural',
    'Mermelada o dulce de leche (para rellenos)',
    'Extracto de vainilla',
    'Agua o jugo natural',
  ],
  materiales: [
    'Moldes para paletas (reutilizables o desechables)',
    'Palitos de paleta',
    'Bolsas o empaques individuales',
    'Etiquetas o stickers (opcional)',
    'Bandejas para transporte',
  ],
  utensilios: [
    'Licuadora o batidora',
    'Ollas y cucharones',
    'Embudos pequeños',
    'Congelador con espacio',
    'Termómetro (opcional, para baño de chocolate)',
  ],
};

/** Antes de vender — sincronizado con content.py / PDF */
export const CHECKLIST_VENTA = [
  'Elegir 3 a 5 sabores para empezar',
  'Comprar ingredientes y materiales',
  'Calcular costos con la calculadora',
  'Definir precios con margen estimado',
  'Armar mi menú para WhatsApp',
  'Tomar fotos con buena luz',
  'Publicar en estado o historia',
  'Tener mensajes listos para responder',
  'Anotar pedidos de forma organizada',
  'Organizar entrega o recogida',
  'Informar alérgenos cuando corresponde',
  'Pedir feedback a quien prueba',
];

export const CHECKLIST_PRODUCCION = [
  'Revisar pedidos del día y cantidades por sabor',
  'Sacar ingredientes del congelador/refrigerador con tiempo',
  'Preparar bases (cremosas y frutales) por separado',
  'Llenar moldes sin rebosar',
  'Insertar palitos cuando la mezcla esté semi-congelada',
  'Etiquetar o separar por cliente si hay pedidos',
  'Verificar empaques limpios y presentables',
  'Calcular hora de entrega según congelación',
  'Enviar mensaje al cliente cuando esté listo',
  'Anotar qué sabores se agotaron para el menú',
];
