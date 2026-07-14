/**
 * Playbooks Semana 2-4, qué hacer cuando el círculo cercano ya escuchó
 * y WhatsApp se queda en silencio. Compartido Paletas / Postres (copy adapta unidad).
 */

export const PLAYBOOKS_CRECIMIENTO = [
  {
    id: 's2',
    semana: 2,
    titulo: 'Romper el silencio',
    meta: 'Cuando nadie responde a tu primer menú',
    duracion: '4-5 días',
    porQue:
      'La mayoría deja de publicar tras 1-2 estados. El silencio no significa que el producto esté mal: significa que pocas personas lo vieron en el momento correcto.',
    tareas: [
      'Publica estado 1 vez al día (misma foto, copy distinto) durante 5 días',
      'Escribe a 10 personas de tu lista (amigos/vecinos) con mensaje personal, no broadcast',
      'Pide a 2 clientes o familiares que reenvíen tu menú a un grupo',
      'Cambia la foto: producto mordido / vaso de lado / combo en mano',
      'Ofrece “prueba” de 1 unidad a precio costo a quien no te ha comprado (máx. 5)',
    ],
    mensajes: [
      {
        id: 's2-personal',
        label: 'Mensaje personal (no estado)',
        texto:
          'Hola [nombre], ¿cómo estás? Empecé a hacer [producto] caseros esta semana (sabores: [sabores]). Si te provoca, te aparto uno, sin compromiso 😊',
      },
      {
        id: 's2-reenvio',
        label: 'Pedir reenvío',
        texto:
          'Si te gustó lo que pediste, ¿me ayudas compartiendo el menú con 1 amiga? Me ayuda un montón al inicio. Gracias 🙏',
      },
      {
        id: 's2-prueba',
        label: 'Oferta prueba',
        texto:
          'Estoy validando sabores: te dejo 1 [unidad] de [sabores] a precio especial ([precio]) si me dices cómo te quedó. ¿Te late?',
      },
    ],
    checklistTips: [
      'No publiques 10 fotos de golpe. Una buena, todos los días.',
      'El mensaje personal convierte más que el estado.',
      'Si alguien deja en visto: un solo follow-up a las 48h, luego suelta.',
    ],
  },
  {
    id: 's3',
    semana: 3,
    titulo: 'Clientes fuera del círculo',
    meta: 'Llegar a gente que no te conoce',
    duracion: '1 semana',
    porQue:
      'Familia y amigos se agotan. El crecimiento real empieza cuando alguien te pide por recomendación o te ve en el barrio.',
    tareas: [
      'Define 1 zona de entrega clara (barrio / manzana) y publícala en el menú',
      'Deja 5 menús impresos o notas en places permitidos (edificio, oficina amiga, peluquería)',
      'Crea un apellido de marca corto (“Dulces de [tu nombre]”) y úsalo siempre',
      'Pide reseña en 1 frase a quien ya compró y guárdala como captura',
      'Arma 1 combo antojo (3 unidades) con precio redondo fácil de decir',
    ],
    mensajes: [
      {
        id: 's3-zona',
        label: 'Anuncio con zona',
        texto:
          '🚛 Entrego [producto] en [zona] hoy/mañana. Sabores: [sabores]. Desde [precio]. Escribe “MENÚ” y te lo mando.',
      },
      {
        id: 's3-reseña',
        label: 'Pedir reseña',
        texto:
          '¿Me regalas una frase de cómo te pareció? Con eso mejoro y ayudo a otras personas a animarse. ¡Mil gracias!',
      },
      {
        id: 's3-combo',
        label: 'Combo barrio',
        texto:
          'Combo antojo x3 surtido por [precio], ideal para probar sin decidir un solo sabor. Entrega en [zona].',
      },
    ],
    checklistTips: [
      'Precio redondo (ej. 3 por X) se entiende más rápido en chat.',
      'Una captura de reseña real > “100% artesanal” vacío.',
      'No prometas entrega en toda la ciudad si no puedes.',
    ],
  },
  {
    id: 's4',
    semana: 4,
    titulo: 'Rutina que paga',
    meta: 'De antojo suelto a pedidos que se repiten',
    duracion: '1 semana + hábito',
    porQue:
      'Vender una vez cansa. El negocio empieza cuando la misma gente vuelve y tú produces en días fijos.',
    tareas: [
      'Elige 2 días fijos de producción (ej. mar y vie) y publícalos',
      'Arma lista de “clientes frecuentes” (mín. 8 chats) y avísales el día anterior',
      'Sube ticket: ofrece combo familiar o “llena la nevera” 1 vez esta semana',
      'Revisa costos reales vs precio (calculadora) y ajusta 1 sabor flojo',
      'Planifica Semana 5: 1 sabor nuevo O 1 promo de fecha (fin de mes / quincena)',
    ],
    mensajes: [
      {
        id: 's4-rutina',
        label: 'Aviso de tanda fija',
        texto:
          '🗓️ Esta semana produzco martes y viernes. Si quieres [sabores], aparta el día anterior. Entrega en [zona].',
      },
      {
        id: 's4-frecuente',
        label: 'Cliente frecuente',
        texto:
          'Hola, mañana armo tanda. ¿Te dejo tu usual o quieres probar [sabores]? Prioridad a quienes confirman hoy.',
      },
      {
        id: 's4-ticket',
        label: 'Subir ticket',
        texto:
          'Pack nevera: 6 [producto] surtidos por [precio] (sale menos por unidad). Ideal para la semana. ¿Te anoto?',
      },
    ],
    checklistTips: [
      'Días fijos reducen ansiedad y spoil de producto.',
      'Avisar el día anterior a frecuentes ≈ pedidos predecibles.',
      'Si un sabor no piden: sácalo 2 semanas; no es fracaso.',
    ],
  },
];

export function playbookProductLabel(lineId) {
  if (lineId === 'postres') {
    return { producto: 'postres en vaso', unidad: 'vaso', productoPlural: 'postres en vaso' };
  }
  return { producto: 'paletas', unidad: 'paleta', productoPlural: 'paletas' };
}

export function adaptPlaybookText(text, lineId) {
  const { producto, unidad, productoPlural } = playbookProductLabel(lineId);
  return String(text || '')
    .replace(/\[producto\]/g, producto)
    .replace(/\[unidad\]/g, unidad)
    .replace(/\[productos\]/g, productoPlural);
}
