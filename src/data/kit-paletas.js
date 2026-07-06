import recetasData from './recetas-paletas.json';

/** 30 recetas completas — sincronizadas con el kit PDF */
export const RECETAS_PALETAS = recetasData;

export const MENSAJES_WHATSAPP = [
  { categoria: 'Estado / Story', texto: '🍭 Paletas caseras disponibles hoy. Escríbeme para ver sabores y precios.' },
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

export const PLAN_7_DIAS = [
  { dia: 1, titulo: 'Elige tus recetas', tareas: ['Revisa las 30 recetas del kit', 'Marca 5 sabores fáciles para empezar', 'Elige 2 cremosas y 3 frutales'] },
  { dia: 2, titulo: 'Calcula tus precios', tareas: ['Abre la calculadora de precios', 'Anota costo de ingredientes por paleta', 'Define tu precio sugerido con margen'] },
  { dia: 3, titulo: 'Arma tu menú', tareas: ['Selecciona 6–8 sabores para el menú inicial', 'Anota precio de cada uno', 'Prepara foto o diseño simple para WhatsApp'] },
  { dia: 4, titulo: 'Publica en WhatsApp', tareas: ['Publica tu menú en estado/story', 'Usa uno de los mensajes listos del kit', 'Avisa a amigos y familia'] },
  { dia: 5, titulo: 'Toma pedidos', tareas: ['Responde con los mensajes de pedido', 'Confirma sabores y cantidad', 'Organiza entrega o recogida'] },
  { dia: 6, titulo: 'Organiza producción', tareas: ['Usa el checklist de producción', 'Prepara ingredientes con anticipación', 'Separa pedidos por cliente'] },
  { dia: 7, titulo: 'Ajusta sabores y precios', tareas: ['Revisa qué sabores pidieron más', 'Ajusta precios en la calculadora si cambió algo', 'Planifica la semana siguiente'] },
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
