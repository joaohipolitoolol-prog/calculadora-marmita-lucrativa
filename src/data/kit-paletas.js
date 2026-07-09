import recetasData from './recetas-paletas.json';
import recetasPremiumData from './recetas-premium.json';

import combosPremiumData from './combos-premium.json';

/** 30 recetas completas — sincronizadas con el kit PDF */
export const RECETAS_PALETAS = recetasData;

/** 20 recetas premium — complemento digital */
export const RECETAS_PREMIUM = recetasPremiumData;

/** 10 combos rentables — complemento premium */
export const COMBOS_PREMIUM = combosPremiumData;

export const MENSAJES_WHATSAPP = [
  { categoria: 'Estado / Story', texto: '🍓 Paletas caseras disponibles hoy. Escríbeme para ver sabores y precios.' },
  { categoria: 'Estado / Story', texto: '¿Antojo de algo fresco? Tengo paletas cremosas y frutales listas para entregar.' },
  { categoria: 'Estado / Story', texto: 'Nuevos sabores esta semana 🍦 Pregunta por el menú completo.' },
  { categoria: 'Estado / Story', texto: 'Hoy preparé paletas frescas. Quedan pocas unidades — escríbeme antes de que se acaben.' },
  { categoria: 'Estado / Story', texto: 'Paletas hechas en casa, con ingredientes frescos. ¿Cuál te gustaría probar?' },
  { categoria: 'Promoción', texto: 'Promo de fin de semana: 3 paletas por [PRECIO]. Válido hasta el domingo.' },
  { categoria: 'Promoción', texto: 'Combo familiar: 6 paletas surtidas por [PRECIO]. Ideal para compartir.' },
  { categoria: 'Promoción', texto: 'Primera compra: lleva 2 paletas y te regalo 1 de limón. Solo hoy.' },
  { categoria: 'Promoción', texto: 'Pack para niños: 4 paletas frutales por [PRECIO]. Sabores suaves y coloridos.' },
  { categoria: 'Promoción', texto: 'Últimas unidades del día. Si quieres, aparto las tuyas ahora mismo.' },
  { categoria: 'Cliente nuevo', texto: 'Hola, gracias por escribir. Te comparto el menú con sabores y precios 👇' },
  { categoria: 'Cliente nuevo', texto: 'Tenemos paletas cremosas, frutales y rellenas. ¿Qué tipo te gusta más?' },
  { categoria: 'Cliente nuevo', texto: 'Entrego en [ZONA] o puedes recoger. ¿Cuántas paletas necesitas?' },
  { categoria: 'Pedido', texto: 'Perfecto, tu pedido: [SABORES] — Total: [PRECIO]. ¿Confirmo?' },
  { categoria: 'Pedido', texto: 'Listo, aparté tus paletas. Te aviso cuando estén en camino.' },
  { categoria: 'Pedido', texto: 'Tu pedido está listo para recoger. Estoy en [DIRECCIÓN/LUGAR].' },
  { categoria: 'Cliente antiguo', texto: 'Hola de nuevo 😊 Esta semana tengo sabores nuevos. ¿Te mando el menú?' },
  { categoria: 'Cliente antiguo', texto: 'Hace tiempo que no pides. Tengo tus sabores favoritos disponibles hoy.' },
  { categoria: 'Cliente antiguo', texto: 'Gracias por confiar en mis paletas. Esta semana hay promo especial para clientes frecuentes.' },
  { categoria: 'Encomienda', texto: 'Acepto pedidos con 24h de anticipación. ¿Para qué día y cuántas paletas necesitas?' },
];

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
      'Anota cada pedido en la pestaña Pedidos de la calculadora',
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
