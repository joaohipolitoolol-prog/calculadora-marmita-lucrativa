/** Skeleton Postres — mesmo shape do kit Paletas; conteúdo real entra depois. */

export const RECETAS_POSTRES = [
  {
    id: 'postre-fresa',
    nombre: 'Fresa cremosa',
    tipo: 'Cremoso',
    dificultad: 'Fácil',
    tiempo: '25 min',
    porciones: '8 vasos',
    descripcion: 'Postre en vaso de fresa. Receta completa en el PDF del kit.',
    ingredientes: ['Fresas', 'Crema', 'Azúcar', 'Galleta'],
    pasos: ['Contenido completo disponible cuando se liberen los archivos del kit.'],
    tip: 'Usa vasos transparentes para mostrar las capas.',
  },
  {
    id: 'postre-oreo',
    nombre: 'Oreo en vaso',
    tipo: 'Cremoso',
    dificultad: 'Fácil',
    tiempo: '20 min',
    porciones: '8 vasos',
    descripcion: 'Capas de galleta y crema. Detalle en el kit PDF.',
    ingredientes: ['Galletas Oreo', 'Crema', 'Leche condensada'],
    pasos: ['Contenido completo disponible cuando se liberen los archivos del kit.'],
    tip: 'Reserva trozos de galleta para decorar arriba.',
  },
  {
    id: 'postre-chocolate',
    nombre: 'Chocolate',
    tipo: 'Cremoso',
    dificultad: 'Media',
    tiempo: '30 min',
    porciones: '8 vasos',
    descripcion: 'Postre de chocolate en vaso. Receta completa en el kit.',
    ingredientes: ['Chocolate', 'Crema', 'Azúcar'],
    pasos: ['Contenido completo disponible cuando se liberen los archivos del kit.'],
    tip: 'Sirve frío para mejor textura.',
  },
];

export const RECETAS_POSTRES_PREMIUM = [];

export const COMBOS_POSTRES_PREMIUM = [];

export const MENSAJES_POSTRES = [
  {
    categoria: 'Estado / Story',
    texto: '🍮 Postres en vaso disponibles hoy. Escríbeme para ver sabores y precios.',
  },
  {
    categoria: 'Estado / Story',
    texto: '¿Antojo dulce? Tengo postres en vaso listos para entregar.',
  },
  {
    categoria: 'Promoción',
    texto: 'Promo: 3 postres en vaso por [PRECIO]. Válido hasta el domingo.',
  },
  {
    categoria: 'Cliente nuevo',
    texto: 'Hola, gracias por escribir. Te comparto el menú de postres en vaso 👇',
  },
  {
    categoria: 'Pedido',
    texto: 'Perfecto, tu pedido: [SABORES] — Total: [PRECIO]. ¿Confirmo?',
  },
];

export const PLAN_7_DIAS_POSTRES = [
  {
    dia: 1,
    titulo: 'Elige tus primeros sabores',
    duracion: '30–45 min',
    meta: 'Definir 3 a 5 postres para empezar',
    tareas: [
      'Revisa las recetas del kit',
      'Elige 3 a 5 sabores fáciles',
      'Anota ingredientes en la lista de compras',
    ],
  },
  {
    dia: 2,
    titulo: 'Calcula tus costos',
    duracion: '20–30 min',
    meta: 'Saber cuánto cuesta cada vaso y a qué precio vender',
    tareas: [
      'Abre la Calculadora de Precios',
      'Ingresa el costo real de cada ingrediente',
      'Define tu margen y precio sugerido por vaso',
    ],
  },
  {
    dia: 3,
    titulo: 'Prepara una pequeña tanda',
    duracion: '1–2 horas',
    meta: 'Probar que la receta sale bien antes de vender',
    tareas: [
      'Produce 6-8 vasos de prueba',
      'Prueba textura y dulzor',
      'Ajusta antes de producir más',
    ],
  },
];

export const LISTA_COMPRAS_POSTRES = {
  ingredientes: ['Crema de leche', 'Leche condensada', 'Fresas', 'Galletas', 'Chocolate'],
  materiales: ['Vasos transparentes', 'Cucharitas', 'Tapas', 'Etiquetas'],
  utensilios: ['Batidora', 'Espátula', 'Balanza', 'Refrigerador'],
};

export const CHECKLIST_POSTRES = [
  'Vasos y cucharitas listos',
  'Ingredientes medidos',
  'Capas montadas y frías',
  'Fotos listas para WhatsApp',
  'Menú y precios actualizados',
  'Mensajes de venta preparados',
];
