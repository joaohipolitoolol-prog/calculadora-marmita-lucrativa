/**
 * Diagnóstico WhatsApp, copy, perguntas e diagnósticos.
 * Cada resposta altera o texto seguinte (personalização real).
 */

import { MAIN_PRICE_LABEL, GUARANTEE_DAYS, KIT_NAME } from './config.js';

/** Perguntas reais, progresso “X de 5” */
export const QUESTION_IDS = [
  'q_experience',
  'q_blocker',
  'q_channel',
  'q_start',
  'q_victory',
];

/** Labels amigáveis das respostas (para microcopy) */
export const LABELS = {
  experience: {
    never: 'nunca has preparado paletas',
    family: 'ya preparaste para tu familia',
    tried: 'ya intentaste vender',
    selling: 'ya vendes y quieres mejorar',
  },
  blocker: {
    precio: 'cobrar el precio correcto',
    ventas: 'conseguir las primeras ventas',
    recetas: 'saber qué paletas preparar',
    whatsapp: 'saber cómo publicar en WhatsApp',
    empezar: 'saber por dónde empezar',
  },
  channel: {
    estados: 'tus estados de WhatsApp',
    vecinos: 'familiares y vecinos',
    trabajo: 'trabajo o escuela',
    unsure: 'aún no sabes por dónde ofrecer',
  },
  start: {
    home: 'empezar con lo que ya tienes',
    minimo: 'invertir lo mínimo posible',
    mayor: 'preparar una cantidad mayor',
    unsure: 'aún estás decidiendo cómo empezar',
  },
  victory: {
    recover: 'recuperar lo invertido',
    orders: 'conseguir tus primeros pedidos',
    weekly: 'un ingreso extra cada semana',
    business: 'montar un pequeño negocio',
  },
};

/**
 * 5 diagnósticos posibles, honestos, específicos, sin promesas absurdas.
 * El kit se presenta como la solución exacta a ese bloqueo.
 */
export const DIAGNOSES = {
  precio: {
    id: 'precio',
    badge: 'Bloqueo principal',
    title: 'No sabes cuánto cobrar sin perder dinero',
    body: 'No es falta de ganas. Es miedo a poner un precio bajo… o a poner uno tan alto que nadie compre.',
    need: 'Necesitas una forma simple de calcular el precio de cada paleta: con costo, ganancia y un número que te dé seguridad al publicarlo.',
    bridge:
      'No necesitas adivinar precios. Necesitas una calculadora clara y un menú listo para WhatsApp.',
    kitFocus: ['precios', 'menu'],
    focusLabel: 'Calculadora de precios + menú',
    path: [
      'Empezar con pocos sabores',
      'Calcular correctamente cada precio',
      'Armar un menú sencillo',
      'Publicarlo primero en WhatsApp',
    ],
  },
  confianza: {
    id: 'confianza',
    badge: 'Bloqueo principal',
    title: 'Dudas de que alguien te compre',
    body: 'Es normal. Quien nunca vendió (o vendió poco) piensa que “nadie va a querer”. El problema casi nunca es el producto: es no saber cómo pedir el pedido.',
    need: 'Necesitas mensajes listos, un menú claro y un plan de primeros pedidos, para publicar sin sentir que estás “molestando”.',
    bridge:
      'No necesitas aparecer en videos. Necesitas un mensaje claro y un producto atractivo que se venda solo en el chat.',
    kitFocus: ['mensajes', 'pedidos'],
    focusLabel: 'Mensajes + primeros pedidos',
    path: [
      'Elegir 2-3 sabores fáciles',
      'Usar mensajes listos (sin improvisar)',
      'Publicar una oferta clara',
      'Pedir el pedido con naturalidad',
    ],
  },
  recetas: {
    id: 'recetas',
    badge: 'Bloqueo principal',
    title: 'No sabes qué preparar (ni si saldrá bien)',
    body: 'Si no tienes una receta confiable, cada intento se siente como un riesgo. Y el miedo a “desperdiciar ingredientes” te frena antes de empezar.',
    need: 'Necesitas pocas recetas claras y atractivas, no un libro interminable, para empezar con seguridad y repetir lo que funciona.',
    bridge:
      'No necesitas decenas de recetas. Necesitas un producto atractivo, fácil de repetir y listo para fotografiar.',
    kitFocus: ['recetas'],
    focusLabel: 'Recetas + presentación',
    path: [
      'Empezar con pocas recetas claras',
      'Repetir lo que sale bien',
      'Presentarlas listas para foto',
      'Publicar con precio y mensaje',
    ],
  },
  whatsapp: {
    id: 'whatsapp',
    badge: 'Bloqueo principal',
    title: 'No sabes cómo vender por WhatsApp',
    body: 'Usar el chat es fácil. Vender en el chat es otra cosa: menú, mensaje, precio, cómo responder y cómo pedir el pedido sin incomodarte.',
    need: 'Necesitas un sistema simple: menú editable, mensajes listos y un flujo de primeros pedidos pensado para WhatsApp.',
    bridge:
      'No necesitas una tienda online. Necesitas publicar bien en WhatsApp, con menú, precio y mensaje listos.',
    kitFocus: ['menu', 'mensajes'],
    focusLabel: 'Menú + mensajes WhatsApp',
    path: [
      'Armar un menú editable',
      'Usar mensajes listos para estados',
      'Responder sin improvisar',
      'Cerrar el pedido en el chat',
    ],
  },
  inicio: {
    id: 'inicio',
    badge: 'Bloqueo principal',
    title: 'No sabes por dónde empezar',
    body: 'Tienes la idea… pero te falta el orden. Sin un paso a paso, todo se siente grande: receta, precio, menú, proveedores, primeros pedidos.',
    need: 'Necesitas un manual de inicio corto: qué hacer primero, qué dejar para después, y todo lo demás ya armado.',
    bridge:
      'No necesitas inventar el negocio desde cero. Necesitas un kit con el orden correcto para empezar esta semana.',
    kitFocus: ['manual', 'pedidos'],
    focusLabel: 'Manual de inicio + kit completo',
    path: [
      'Empezar con pocos sabores',
      'Calcular el precio sin adivinar',
      'Crear una oferta sencilla',
      'Publicarla primero en WhatsApp',
    ],
  },
};

/** Calcula el diagnóstico a partir de las respuestas */
export function computeDiagnosis(answers) {
  const blocker = answers.blocker;

  if (blocker === 'empezar') {
    if (answers.channel === 'unsure' || answers.channel === 'estados') {
      if (answers.experience === 'never' || answers.experience === 'family') {
        return 'confianza';
      }
    }
    if (answers.start === 'home' || answers.start === 'minimo') {
      if (answers.victory === 'orders' || answers.victory === 'recover') {
        return 'inicio';
      }
    }
    return 'inicio';
  }

  if (blocker === 'precio') return 'precio';
  if (blocker === 'ventas') {
    if (answers.channel === 'unsure') return 'whatsapp';
    return 'confianza';
  }
  if (blocker === 'recetas') return 'recetas';
  if (blocker === 'whatsapp') return 'whatsapp';

  if (answers.channel === 'unsure') return 'whatsapp';
  if (answers.experience === 'never' || answers.experience === 'family') {
    return 'confianza';
  }
  return 'inicio';
}

/** Tags “Para ti” = diagnóstico + prioridad (victory) */
export function focusIdsFor(diagnosisId, victory) {
  const d = DIAGNOSES[diagnosisId] || DIAGNOSES.inicio;
  const ids = [...(d.kitFocus || [])];
  const add = (id) => {
    if (!ids.includes(id)) ids.push(id);
  };
  if (victory === 'recover' || victory === 'orders') {
    add('pedidos');
    add('precios');
  } else if (victory === 'business') {
    add('manual');
  } else if (victory === 'weekly') {
    add('pedidos');
  }
  return ids;
}

function experienceTone(exp) {
  if (exp === 'never') {
    return {
      affirmTitle: 'Perfecto. Empezar de cero no es un problema.',
      affirmBody:
        'La mayoría de quienes venden paletas por WhatsApp también empezaron sin experiencia. Lo que cambia el resultado es tener el sistema claro.',
      resultLead: 'Como nunca has preparado paletas,',
      profile: 'Emprendedora lista para empezar, pero sin un camino claro',
    };
  }
  if (exp === 'family') {
    return {
      affirmTitle: 'Bien. Ya sabes que te salen.',
      affirmBody:
        'Preparar para la familia ya es un avance. Ahora falta el sistema para ofrecerlas sin miedo: precio, mensaje y primeros pedidos.',
      resultLead: 'Como ya preparaste para tu familia,',
      profile: 'Emprendedora con base en casa, lista para vender',
    };
  }
  if (exp === 'tried') {
    return {
      affirmTitle: 'Bien. Ya diste el primer paso.',
      affirmBody:
        'Intentarlo una vez ya te pone por delante. Ahora falta corregir el punto exacto que te frenó, no empezar otra vez desde cero.',
      resultLead: 'Como ya intentaste vender,',
      profile: 'Emprendedora que ya probó y ahora necesita el punto exacto',
    };
  }
  return {
    affirmTitle: 'Genial. Ya sabes lo que es vender.',
    affirmBody:
      'Eso acelera todo. Ahora el foco es adaptar lo que ya sabes a un producto atractivo, con precio claro y un menú listo para WhatsApp.',
    resultLead: 'Como ya vendes y quieres mejorar,',
    profile: 'Vendedora activa que quiere un sistema más claro',
  };
}

/** Flujo de pantallas, orden de navegación (~12 pantallas, 5 preguntas) */
export const SCREEN_FLOW = [
  'welcome',
  'q_experience',
  'q_blocker',
  'affirm_1',
  'q_channel',
  'q_start',
  'q_victory',
  'q_name',
  'loading',
  'diagnosis',
  'plan',
  'trust',
  'offer',
];

/**
 * Definiciones de pantallas.
 * type: welcome | question | affirm | name | loading | diagnosis | plan | trust | offer
 */
export function buildScreen(id, answers, diagnosisId, meta = {}) {
  const d = DIAGNOSES[diagnosisId] || DIAGNOSES.inicio;
  const tone = experienceTone(answers.experience);
  const expLabel = LABELS.experience[answers.experience] || '';
  const blockerLabel = LABELS.blocker[answers.blocker] || '';
  const channelLabel = LABELS.channel[answers.channel] || '';
  const startLabel = LABELS.start[answers.start] || '';
  const victoryLabel = LABELS.victory[answers.victory] || '';
  const name = String(answers.name || '').trim();

  const diagBodyJoined = (() => {
    const lead = tone.resultLead;
    const body = d.body.charAt(0).toLowerCase() + d.body.slice(1);
    if (name) {
      return `${name}, ${lead.charAt(0).toLowerCase()}${lead.slice(1)} ${body}`;
    }
    return `${lead} ${body}`;
  })();

  const screens = {
    welcome: {
      id: 'welcome',
      type: 'welcome',
      icon: 'search',
      image: '/paletas/authority-mujer-paletas.webp?v=3',
      imageAlt:
        'Mujer latina en su cocina con paletas listas para vender por WhatsApp',
      title:
        'Descubre qué te falta para empezar a vender paletas por WhatsApp',
      body: 'Responde 5 preguntas rápidas y recibe un plan sencillo según tu experiencia, presupuesto y forma de vender.',
      note: 'Toma menos de 2 minutos · Sin compromiso',
      cta: 'Empezar mi diagnóstico',
      micro: 'Diagnóstico gratis · Sin aparecer en videos',
    },

    q_experience: {
      id: 'q_experience',
      type: 'question',
      key: 'experience',
      icon: 'user',
      title: '¿En qué momento estás ahora?',
      body: 'Responde con honestidad. Así el plan sale más preciso.',
      options: [
        {
          value: 'never',
          icon: 'spark',
          label: 'Nunca preparé paletas',
          hint: 'Empiezo desde cero',
        },
        {
          value: 'family',
          icon: 'home',
          label: 'Ya preparé para mi familia',
          hint: 'Pero no las vendí',
        },
        {
          value: 'tried',
          icon: 'rocket',
          label: 'Intenté vender algunas veces',
          hint: 'No continué',
        },
        {
          value: 'selling',
          icon: 'star',
          label: 'Ya vendo, pero quiero mejorar',
          hint: 'Busco un sistema más claro',
        },
      ],
    },

    q_blocker: {
      id: 'q_blocker',
      type: 'question',
      key: 'blocker',
      icon: 'warning',
      title: '¿Qué es lo que más te impide empezar?',
      body:
        answers.experience === 'never' || answers.experience === 'family'
          ? 'Esto es lo más importante del diagnóstico. Elige lo que más te pesa.'
          : 'Sé específica. El diagnóstico se arma alrededor de esto.',
      options: [
        {
          value: 'recetas',
          icon: 'recipe',
          label: 'No sé qué recetas hacer',
          hint: 'Miedo a equivocarme',
        },
        {
          value: 'precio',
          icon: 'calc',
          label: 'No sé cuánto cobrar',
          hint: 'Miedo a perder dinero',
        },
        {
          value: 'ventas',
          icon: 'chat',
          label: 'No sé cómo conseguir pedidos',
          hint: 'Miedo a que nadie responda',
        },
        {
          value: 'whatsapp',
          icon: 'wa',
          label: 'No sé cómo publicar en WhatsApp',
          hint: 'El chat me confunde para vender',
        },
        {
          value: 'empezar',
          icon: 'book',
          label: 'Tengo miedo de gastar y no vender',
          hint: 'No sé por dónde empezar',
        },
      ],
    },

    affirm_1: {
      id: 'affirm_1',
      type: 'affirm',
      icon: 'check',
      title: tone.affirmTitle,
      body: tone.affirmBody,
      chip: '',
      reviewKey: 'experience',
      cta: 'Continuar',
      micro: 'Vas bien · Siguiente pregunta',
    },

    q_channel: {
      id: 'q_channel',
      type: 'question',
      key: 'channel',
      icon: 'wa',
      title: '¿Dónde te resultaría más fácil ofrecer tus primeras paletas?',
      body:
        answers.blocker === 'whatsapp' || answers.blocker === 'ventas'
          ? 'Perfecto. Vamos a anclar el plan al canal donde te sientes más cómoda.'
          : 'Sin presión. Elige lo que se sienta más natural para ti.',
      options: [
        {
          value: 'estados',
          icon: 'phone',
          label: 'Estados de WhatsApp',
          hint: 'Lo ve quien ya me tiene',
        },
        {
          value: 'vecinos',
          icon: 'home',
          label: 'Familiares y vecinos',
          hint: 'Círculo cercano',
        },
        {
          value: 'trabajo',
          icon: 'star',
          label: 'Trabajo o escuela',
          hint: 'Personas que veo seguido',
        },
        {
          value: 'unsure',
          icon: 'search',
          label: 'Todavía no sé por dónde empezar',
          hint: 'Necesito una guía clara',
        },
      ],
    },

    q_start: {
      id: 'q_start',
      type: 'question',
      key: 'start',
      icon: 'box',
      title: '¿Cómo te gustaría empezar?',
      body:
        answers.blocker === 'empezar' || answers.blocker === 'precio'
          ? 'Esto nos ayuda a recomendar un comienzo sin arriesgar de más.'
          : 'No preguntamos cuánto dinero tienes, solo cómo quieres arrancar.',
      options: [
        {
          value: 'home',
          icon: 'home',
          label: 'Con lo que ya tengo en casa',
          hint: 'Sin comprar casi nada',
        },
        {
          value: 'minimo',
          icon: 'spark',
          label: 'Invirtiendo lo mínimo posible',
          hint: 'Probar con poco riesgo',
        },
        {
          value: 'mayor',
          icon: 'rocket',
          label: 'Preparando una cantidad mayor',
          hint: 'Quiero volumen desde el inicio',
        },
        {
          value: 'unsure',
          icon: 'search',
          label: 'Todavía no lo sé',
          hint: 'Necesito que me ordenen el plan',
        },
      ],
    },

    q_victory: {
      id: 'q_victory',
      type: 'question',
      key: 'victory',
      icon: 'heart',
      title: '¿Qué sería una buena primera victoria para ti?',
      body: 'Una meta cercana, no una promesa grande.',
      options: [
        {
          value: 'recover',
          icon: 'dollar',
          label: 'Recuperar lo que invertí',
          hint: 'Sin perder dinero',
        },
        {
          value: 'orders',
          icon: 'check',
          label: 'Conseguir mis primeros 5 pedidos',
          hint: 'Probar que funciona',
        },
        {
          value: 'weekly',
          icon: 'clock',
          label: 'Generar un ingreso extra cada semana',
          hint: 'Constancia, no presión',
        },
        {
          value: 'business',
          icon: 'star',
          label: 'Transformarlo en un pequeño negocio',
          hint: 'Con sistema y orden',
        },
      ],
    },

    q_name: {
      id: 'q_name',
      type: 'name',
      icon: 'user',
      title: '¿Cómo te gusta que te digamos?',
      body: 'Solo tu primer nombre. Así el diagnóstico se siente hecho para ti.',
      placeholder: 'Tu nombre',
      cta: 'Ver mi diagnóstico',
      skip: 'Prefiero seguir sin nombre',
      micro: 'Opcional · Nos ayuda a personalizar tu diagnóstico',
    },

    loading: {
      id: 'loading',
      type: 'loading',
      steps: [
        {
          icon: 'search',
          text: name
            ? `Organizando las respuestas de ${name}…`
            : 'Organizando tus respuestas…',
        },
        { icon: 'warning', text: 'Identificando tu principal dificultad…' },
        {
          icon: 'spark',
          text: 'Preparando una recomendación para tu momento…',
        },
      ],
    },

    diagnosis: {
      id: 'diagnosis',
      type: 'diagnosis',
      icon: 'warning',
      badge: d.badge,
      profile: tone.profile,
      title: d.title,
      body: diagBodyJoined,
      need: d.need,
      path: d.path || [],
      pathNote:
        answers.start === 'home' || answers.start === 'minimo'
          ? 'No necesitas montar un gran negocio ahora. Necesitas un comienzo simple y organizado.'
          : 'No necesitas inventarlo todo. Necesitas el orden correcto para tu primera victoria.',
      cta: 'Ver mi plan recomendado',
      micro: name
        ? `${name}, tu diagnóstico está listo`
        : 'Diagnóstico listo · Siguiente: tu plan',
    },

    plan: {
      id: 'plan',
      type: 'plan',
      icon: 'gift',
      eyebrow: 'Solución para tu diagnóstico',
      title: name
        ? `${name}, preparamos el ${KIT_NAME} para este comienzo`
        : `Preparamos el ${KIT_NAME} para este comienzo`,
      body: [
        d.bridge,
        victoryLabel && channelLabel
          ? `Como tu primera victoria es ${victoryLabel} y te resulta más fácil ofrecer en ${channelLabel}, marcamos lo que más te acerca a eso.`
          : victoryLabel
            ? `Como tu primera victoria es ${victoryLabel}, marcamos lo que más te acerca a eso.`
            : '',
        startLabel ? `Y como ${startLabel}, el plan empieza chico y claro.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      focusIds: focusIdsFor(diagnosisId, answers.victory),
      points: (d.path || []).map((text, i) => ({
        icon: i === 0 ? 'spark' : i === 1 ? 'calc' : i === 2 ? 'menu' : 'wa',
        text,
      })),
      cta: 'Ver prueba y oferta',
      micro: 'Todo digital · Acceso inmediato',
    },

    trust: {
      id: 'trust',
      type: 'trust',
      icon: 'shield',
      title: 'Mujeres como tú ya empezaron',
      body: 'Pequeñas victorias reales por WhatsApp, sin aparecer en videos.',
      points: [
        {
          icon: 'home',
          title: 'Desde casa',
          text: 'Sin local. Sin mostrarte si no quieres.',
        },
        {
          icon: 'shield',
          title: `Garantía ${GUARANTEE_DAYS} días`,
          text: 'Si no es para ti, puedes pedir la devolución.',
        },
        {
          icon: 'phone',
          title: 'Acceso inmediato',
          text: 'Entras desde el celular cuando quieras.',
        },
      ],
      cta: 'Ver mi oferta',
      micro: 'Capturas reales de WhatsApp',
    },

    offer: {
      id: 'offer',
      type: 'offer',
      icon: 'gift',
      eyebrow: name ? `Tu plan, ${name}` : 'Tu plan personalizado',
      title: 'Todo lo que necesitas para tu primer paso',
      body: victoryLabel
        ? `Para ${victoryLabel}, tu diagnóstico apuntó a esto: ${d.title}. El kit resuelve exactamente ese punto (${d.focusLabel}).`
        : `Tu diagnóstico apuntó a esto: ${d.title}. El kit resuelve exactamente ese punto (${d.focusLabel}).`,
      price: MAIN_PRICE_LABEL,
      priceNote: 'Pago único · Acceso inmediato',
      guarantee: `Garantía de ${GUARANTEE_DAYS} días`,
      objections: [
        {
          q: '¿Y si preparo y nadie me compra?',
          a: 'Es el miedo más común. Por eso el kit incluye menú, mensajes y guía de primeros pedidos: para publicar con claridad antes de producir de más.',
        },
        {
          q: '¿Y si no sé cocinar bien?',
          a: 'Las recetas son paso a paso. Empezamos simple, no necesitas ser chef.',
        },
        {
          q: '¿Y si me equivoco en el precio?',
          a: 'La calculadora te ayuda a poner un número con costo y ganancia antes de publicar.',
        },
        {
          q: '¿Tengo que aparecer en videos?',
          a: 'No. El sistema está pensado para WhatsApp, desde casa, sin parecer desesperada.',
        },
      ],
      cta: name ? `${name}, quiero empezar con mi plan` : 'Quiero empezar con mi plan',
      micro: `${MAIN_PRICE_LABEL} · Garantía ${GUARANTEE_DAYS} días · Acceso inmediato`,
      stickyNote: name
        ? `${name}, tu diagnóstico ya está listo. El kit es la solución para ese bloqueo.`
        : 'Tu diagnóstico ya está listo. El kit es la solución para ese bloqueo.',
    },
  };

  return screens[id];
}
