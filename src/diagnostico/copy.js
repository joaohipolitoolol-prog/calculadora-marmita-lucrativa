/**
 * Diagnóstico WhatsApp — copy, perguntas e diagnósticos.
 * Cada resposta altera o texto seguinte (personalização real).
 */

import { MAIN_PRICE_LABEL, GUARANTEE_DAYS, KIT_NAME } from './config.js';

/** Labels amigáveis das respostas (para microcopy) */
export const LABELS = {
  experience: {
    never: 'nunca has vendido',
    tried: 'ya intentaste vender',
    selling: 'ya vendes algo',
  },
  goal: {
    extra: 'conseguir un ingreso extra',
    replace: 'ganar más desde casa',
    test: 'probar si este negocio te funciona',
  },
  blocker: {
    precio: 'cobrar el precio correcto',
    ventas: 'conseguir las primeras ventas',
    recetas: 'saber qué paletas preparar',
    whatsapp: 'saber cómo publicar en WhatsApp',
    empezar: 'saber por dónde empezar',
  },
  cooking: {
    beginner: 'empezando en la cocina',
    mid: 'con algo de práctica',
    good: 'cómoda cocinando',
  },
  whatsapp: {
    daily: 'usas WhatsApp todos los días',
    sometimes: 'usas WhatsApp con frecuencia',
    low: 'aún no usas WhatsApp para vender',
  },
  speed: {
    today: 'quieres empezar hoy',
    week: 'quieres empezar esta semana',
    explore: 'estás explorando con calma',
  },
};

/**
 * 5 diagnósticos posibles — honestos, específicos, sin promesas absurdas.
 * El kit se presenta como la solución exacta a ese bloqueo.
 */
export const DIAGNOSES = {
  precio: {
    id: 'precio',
    badge: 'Bloqueo principal',
    title: 'No sabes cuánto cobrar sin perder dinero',
    body: 'No es falta de ganas. Es miedo a poner un precio bajo… o a poner uno tan alto que nadie compre.',
    need: 'Necesitas una forma simple de calcular el precio de cada paleta — con costo, ganancia y un número que te dé seguridad al publicarlo.',
    bridge:
      'No necesitas adivinar precios. Necesitas una calculadora clara y un menú listo para WhatsApp.',
    kitFocus: ['precios', 'menu'],
    focusLabel: 'Calculadora de precios + menú',
  },
  confianza: {
    id: 'confianza',
    badge: 'Bloqueo principal',
    title: 'Dudas de que alguien te compre',
    body: 'Es normal. Quien nunca vendió (o vendió poco) piensa que “nadie va a querer”. El problema casi nunca es el producto: es no saber cómo pedir el pedido.',
    need: 'Necesitas mensajes listos, un menú claro y un plan de primeros pedidos — para publicar sin sentir que estás “molestando”.',
    bridge:
      'No necesitas aparecer en videos. Necesitas un mensaje claro y un producto atractivo que se venda solo en el chat.',
    kitFocus: ['mensajes', 'pedidos'],
    focusLabel: 'Mensajes + primeros pedidos',
  },
  recetas: {
    id: 'recetas',
    badge: 'Bloqueo principal',
    title: 'No sabes qué preparar (ni si saldrá bien)',
    body: 'Si no tienes una receta confiable, cada intento se siente como un riesgo. Y el miedo a “desperdiciar ingredientes” te frena antes de empezar.',
    need: 'Necesitas pocas recetas claras y atractivas — no un libro interminable — para empezar con seguridad y repetir lo que funciona.',
    bridge:
      'No necesitas decenas de recetas. Necesitas un producto atractivo, fácil de repetir y listo para fotografiar.',
    kitFocus: ['recetas'],
    focusLabel: 'Recetas + presentación',
  },
  whatsapp: {
    id: 'whatsapp',
    badge: 'Bloqueo principal',
    title: 'No sabes cómo vender por WhatsApp',
    body: 'Usar el chat es fácil. Vender en el chat es otra cosa: menú, mensaje, precio, cómo responder y cómo pedir el pedido sin incomodarte.',
    need: 'Necesitas un sistema simple: menú editable, mensajes listos y un flujo de primeros pedidos pensado para WhatsApp.',
    bridge:
      'No necesitas una tienda online. Necesitas publicar bien en WhatsApp — con menú, precio y mensaje listos.',
    kitFocus: ['menu', 'mensajes'],
    focusLabel: 'Menú + mensajes WhatsApp',
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
  },
};

/** Calcula el diagnóstico a partir de las respuestas */
export function computeDiagnosis(answers) {
  const blocker = answers.blocker;

  // Señales secundarias refinan el camino “no sé por dónde empezar”
  if (blocker === 'empezar') {
    if (answers.cooking === 'beginner') return 'recetas';
    return 'inicio';
  }

  if (blocker === 'precio') return 'precio';
  if (blocker === 'ventas') {
    // Duda de venta + WhatsApp muy bajo → el freno operativo es el chat
    if (answers.whatsappLevel === 'low') return 'whatsapp';
    return 'confianza';
  }
  if (blocker === 'recetas') return 'recetas';
  if (blocker === 'whatsapp') return 'whatsapp';

  if (answers.cooking === 'beginner') return 'recetas';
  if (answers.whatsappLevel === 'low') return 'whatsapp';
  if (answers.experience === 'never') return 'confianza';
  return 'inicio';
}

function insightPoints(diagnosisId) {
  const map = {
    precio: [
      { icon: 'calc', text: 'Una calculadora simple de costo + ganancia' },
      { icon: 'menu', text: 'Un menú con precios listos para WhatsApp' },
      { icon: 'chat', text: 'Mensajes para publicar sin dudar del número' },
    ],
    confianza: [
      { icon: 'chat', text: 'Mensajes listos que no suenan a “molestia”' },
      { icon: 'check', text: 'Un plan corto de primeros pedidos' },
      { icon: 'menu', text: 'Un menú claro para que te respondan' },
    ],
    recetas: [
      { icon: 'recipe', text: 'Pocas recetas claras y repetibles' },
      { icon: 'spark', text: 'Presentación lista para foto de WhatsApp' },
      { icon: 'box', text: 'Guía de proveedores para no improvisar' },
    ],
    whatsapp: [
      { icon: 'menu', text: 'Menú editable pensado para el chat' },
      { icon: 'chat', text: 'Mensajes para publicar y responder' },
      { icon: 'check', text: 'Flujo de pedido sin incomodarte' },
    ],
    inicio: [
      { icon: 'book', text: 'Un orden claro: qué hacer primero' },
      { icon: 'recipe', text: 'Producto, precio y mensaje en un solo kit' },
      { icon: 'check', text: 'Primeros pedidos sin inventar el negocio' },
    ],
  };
  return map[diagnosisId] || map.inicio;
}

function experienceTone(exp) {
  if (exp === 'never') {
    return {
      affirmTitle: 'Perfecto. Empezar de cero no es un problema.',
      affirmBody:
        'La mayoría de quienes venden paletas por WhatsApp también empezaron sin experiencia. Lo que cambia el resultado es tener el sistema claro.',
      resultLead: 'Como nunca has vendido,',
    };
  }
  if (exp === 'tried') {
    return {
      affirmTitle: 'Bien. Ya diste el primer paso.',
      affirmBody:
        'Intentarlo una vez ya te pone por delante. Ahora falta corregir el punto exacto que te frenó — no empezar otra vez desde cero.',
      resultLead: 'Como ya intentaste vender,',
    };
  }
  return {
    affirmTitle: 'Genial. Ya sabes lo que es vender.',
    affirmBody:
      'Eso acelera todo. Ahora el foco es adaptar lo que ya sabes a un producto atractivo, con precio claro y un menú listo para WhatsApp.',
    resultLead: 'Como ya vendes algo,',
  };
}

/** Flujo de pantallas — orden de navegación */
export const SCREEN_FLOW = [
  'welcome',
  'q_experience',
  'q_goal',
  'affirm_1',
  'q_blocker',
  'q_name',
  'q_cooking',
  'q_whatsapp',
  'q_speed',
  'affirm_2',
  'loading',
  'diagnosis',
  'simulation',
  'insight',
  'kit_match',
  'trust',
  'offer',
];

/**
 * Definiciones de pantallas.
 * type: welcome | question | affirm | name | loading | diagnosis | simulation | insight | kit | trust | offer
 */
export function buildScreen(id, answers, diagnosisId, meta = {}) {
  const d = DIAGNOSES[diagnosisId] || DIAGNOSES.inicio;
  const tone = experienceTone(answers.experience);
  const expLabel = LABELS.experience[answers.experience] || '';
  const blockerLabel = LABELS.blocker[answers.blocker] || '';
  const speedLabel = LABELS.speed[answers.speed] || '';
  const goalLabel = LABELS.goal[answers.goal] || '';
  const waLabel = LABELS.whatsapp[answers.whatsappLevel] || '';
  const sim = meta.simulation || null;
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
        'Descubre cómo mujeres comunes están generando un ingreso extra vendiendo paletas desde casa por WhatsApp',
      body: 'Responde unas preguntas y ve qué te frena para empezar a ganar desde casa — sin aparecer en videos.',
      note: 'Sin aparecer en videos · Desde casa · Solo WhatsApp',
      cta: 'Quiero descubrir cómo',
      micro: 'Diagnóstico gratis · Sin compromiso',
    },

    q_experience: {
      id: 'q_experience',
      type: 'question',
      key: 'experience',
      icon: 'user',
      title: '¿Cuál es tu situación hoy?',
      body: 'Responde con honestidad. Así el diagnóstico sale más preciso.',
      options: [
        {
          value: 'never',
          icon: 'spark',
          label: 'Nunca he vendido nada',
          hint: 'Empiezo desde cero',
        },
        {
          value: 'tried',
          icon: 'rocket',
          label: 'Intenté vender alguna vez',
          hint: 'Pero no continué',
        },
        {
          value: 'selling',
          icon: 'star',
          label: 'Ya vendo algo',
          hint: 'Quiero sumar paletas',
        },
      ],
    },

    q_goal: {
      id: 'q_goal',
      type: 'question',
      key: 'goal',
      icon: 'heart',
      title: answers.experience === 'selling'
        ? '¿Para qué quieres sumar paletas?'
        : '¿Qué te gustaría lograr?',
      body:
        answers.experience === 'never'
          ? 'No hay respuesta incorrecta. Solo queremos entender tu prioridad.'
          : 'Esto nos ayuda a priorizar lo que más te sirve ahora.',
      options: [
        {
          value: 'extra',
          icon: 'dollar',
          label: 'Un ingreso extra',
          hint: 'Sin dejar lo que ya hago',
        },
        {
          value: 'replace',
          icon: 'home',
          label: 'Ganar más desde casa',
          hint: 'Con mi propio ritmo',
        },
        {
          value: 'test',
          icon: 'search',
          label: 'Probar si funciona',
          hint: 'Con poco riesgo',
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

    q_blocker: {
      id: 'q_blocker',
      type: 'question',
      key: 'blocker',
      icon: 'warning',
      title: '¿Qué te frena más ahora mismo?',
      body:
        answers.experience === 'never'
          ? 'Esto es lo más importante del diagnóstico. Elige lo que más te pesa.'
          : 'Sé específica. El diagnóstico se arma alrededor de esto.',
      options: [
        {
          value: 'precio',
          icon: 'calc',
          label: 'No sé cuánto cobrar',
          hint: 'Miedo a perder dinero',
        },
        {
          value: 'ventas',
          icon: 'chat',
          label: 'Dudo que me compren',
          hint: 'Miedo a que nadie responda',
        },
        {
          value: 'recetas',
          icon: 'recipe',
          label: 'No sé qué preparar',
          hint: 'Miedo a equivocarme',
        },
        {
          value: 'whatsapp',
          icon: 'wa',
          label: 'No sé cómo publicar',
          hint: 'WhatsApp me confunde para vender',
        },
        {
          value: 'empezar',
          icon: 'book',
          label: 'No sé por dónde empezar',
          hint: 'Hay demasiadas dudas',
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
      cta: 'Continuar',
      skip: 'Prefiero seguir sin nombre',
      micro: 'Opcional · Solo se usa en este diagnóstico',
    },

    q_cooking: {
      id: 'q_cooking',
      type: 'question',
      key: 'cooking',
      icon: 'recipe',
      title: name
        ? `${name}, ¿cómo te sientes en la cocina?`
        : '¿Cómo te sientes en la cocina?',
      body:
        answers.blocker === 'recetas'
          ? 'Como te frena la receta, esto nos ayuda a calibrar el nivel.'
          : 'No necesitas ser chef. Solo queremos ajustar la recomendación.',
      options: [
        {
          value: 'beginner',
          icon: 'spark',
          label: 'Principiante',
          hint: 'Necesito pasos claros',
        },
        {
          value: 'mid',
          icon: 'star',
          label: 'Me defiendo',
          hint: 'Con guía me va bien',
        },
        {
          value: 'good',
          icon: 'check',
          label: 'Me siento cómoda',
          hint: 'Solo quiero el sistema de venta',
        },
      ],
    },

    q_whatsapp: {
      id: 'q_whatsapp',
      type: 'question',
      key: 'whatsappLevel',
      icon: 'wa',
      title: '¿Cómo usas WhatsApp hoy?',
      body:
        answers.blocker === 'whatsapp'
          ? 'Perfecto — vamos a medir qué tan lejos estás de vender en el chat.'
          : 'El negocio entero vive en el celular. Esto importa.',
      options: [
        {
          value: 'daily',
          icon: 'phone',
          label: 'Todos los días',
          hint: 'Ya estoy en el chat',
        },
        {
          value: 'sometimes',
          icon: 'chat',
          label: 'Varias veces por semana',
          hint: 'Lo uso bastante',
        },
        {
          value: 'low',
          icon: 'lock',
          label: 'Casi no para vender',
          hint: 'Solo lo personal',
        },
      ],
    },

    q_speed: {
      id: 'q_speed',
      type: 'question',
      key: 'speed',
      icon: 'clock',
      title: '¿Qué tan pronto quieres empezar?',
      body: 'Sin presión. Solo para ordenar tu plan.',
      options: [
        {
          value: 'today',
          icon: 'rocket',
          label: 'Hoy mismo',
          hint: 'Quiero avanzar ya',
        },
        {
          value: 'week',
          icon: 'clock',
          label: 'Esta semana',
          hint: 'Con calma, pero pronto',
        },
        {
          value: 'explore',
          icon: 'search',
          label: 'Estoy explorando',
          hint: 'Quiero entender primero',
        },
      ],
    },

    affirm_2: {
      id: 'affirm_2',
      type: 'affirm',
      icon: 'spark',
      title: name ? `${name}, ya tenemos tu mapa` : 'Ya tenemos tu mapa',
      body: [
        blockerLabel &&
          `Tu freno más fuerte hoy es ${blockerLabel}.`,
        goalLabel && `Tu prioridad: ${goalLabel}.`,
        expLabel === 'nunca has vendido'
          ? 'Empezar de cero no te atrasa — te da claridad para no repetir errores ajenos.'
          : expLabel
            ? `Con lo que ya traes (${expLabel}), el siguiente paso es corregir ese punto exacto.`
            : '',
        waLabel && answers.whatsappLevel === 'low'
          ? 'Como aún no usas WhatsApp para vender, el plan empieza por el chat.'
          : '',
        speedLabel ? `Y como ${speedLabel}, vamos directo al diagnóstico.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      chip: '',
      cta: 'Ver mi diagnóstico',
      micro: 'Casi listo · Tu diagnóstico',
    },

    loading: {
      id: 'loading',
      type: 'loading',
      steps: [
        {
          icon: 'search',
          text: name ? `Revisando las respuestas de ${name}…` : 'Revisando tus respuestas…',
        },
        { icon: 'warning', text: 'Cruzando tu bloqueo con tu perfil…' },
        { icon: 'spark', text: 'Armando tu diagnóstico…' },
      ],
    },

    diagnosis: {
      id: 'diagnosis',
      type: 'diagnosis',
      icon: 'warning',
      badge: d.badge,
      title: d.title,
      body: diagBodyJoined,
      need: d.need,
      cta: '¿Qué necesito entonces?',
      micro: name
        ? `${name}, tu diagnóstico está listo`
        : 'Diagnóstico listo · Siguiente: tu plan',
    },

    simulation: {
      id: 'simulation',
      type: 'simulation',
      icon: 'dollar',
      eyebrow: 'Proyección de un buen día',
      amount: sim?.amountLabel || 'US$ 18,00',
      units: sim?.units || 10,
      title: name
        ? `${name}, así podría verse un día bien publicado`
        : 'Así podría verse un día bien publicado',
      body:
        diagnosisId === 'precio'
          ? 'Con precio claro y menú listo — sin adivinar si estás ganando o perdiendo.'
          : diagnosisId === 'confianza'
            ? 'Con mensajes y un plan de primeros pedidos — sin sentir que estás molestando.'
            : diagnosisId === 'recetas'
              ? 'Con pocas recetas claras — sin desperdiciar ingredientes a prueba y error.'
              : diagnosisId === 'whatsapp'
                ? 'Con menú y mensajes listos para el chat — sin improvisar cada publicación.'
                : 'Con producto, precio y mensaje en orden — el sistema que te faltaba para empezar.',
      note: goalLabel
        ? `Proyección orientativa para ${goalLabel} · ~US$ 1,65 de ganancia por paleta`
        : 'Proyección orientativa según tu perfil · ~US$ 1,65 de ganancia por paleta',
      cta: 'Ver cómo lograrlo',
      micro: 'No es una promesa — es una proyección para que veas el potencial',
    },

    insight: {
      id: 'insight',
      type: 'insight',
      icon: 'spark',
      title: 'Cómo salir de este bloqueo',
      body: [
        answers.cooking === 'beginner'
          ? 'Con pasos claros y pocas recetas bien hechas, el miedo a “fallar” baja rápido.'
          : answers.experience === 'never'
            ? 'No necesitas experiencia previa. Necesitas un sistema corto: producto, precio y mensaje.'
            : 'Con lo que ya traes, lo que falta es orden: producto, precio y publicación.',
        goalLabel
          ? `Eso es lo que te acerca a ${goalLabel} — sin inventar el negocio desde cero.`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
      points: insightPoints(diagnosisId),
      cta: 'Ver la solución para mi caso',
      micro: 'Hecho a medida según tu diagnóstico',
    },

    kit_match: {
      id: 'kit_match',
      type: 'kit',
      icon: 'gift',
      eyebrow: 'Solución para tu diagnóstico',
      title: `Por eso armamos el ${KIT_NAME}`,
      body: `Tu foco: ${d.focusLabel}. El resto del kit está incluido para que no te quedes a medias.`,
      focusIds: d.kitFocus,
      cta: 'Ver cómo funciona',
      micro: 'Todo digital · Acceso inmediato',
    },

    trust: {
      id: 'trust',
      type: 'trust',
      icon: 'shield',
      title: 'Otras mujeres ya empezaron',
      body: 'Pequeñas victorias reales por WhatsApp — sin aparecer en videos.',
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
      cta: 'Ver la oferta',
      micro: 'Capturas reales de WhatsApp',
    },

    offer: {
      id: 'offer',
      type: 'offer',
      icon: 'gift',
      eyebrow: name ? `Tu plan, ${name}` : 'Tu plan personalizado',
      title:
        answers.speed === 'today'
          ? 'Todo lo que necesitas para empezar hoy'
          : answers.speed === 'week'
            ? 'Todo lo que necesitas para empezar esta semana'
            : 'Todo lo que necesitas para empezar con claridad',
      body: goalLabel
        ? `Para ${goalLabel}, tu diagnóstico apuntó a esto: ${d.title}. El kit resuelve exactamente ese punto (${d.focusLabel}).`
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
          a: 'Las recetas son paso a paso. Empezamos simple — no necesitas ser chef.',
        },
        {
          q: '¿Y si me equivoco en el precio?',
          a: 'La calculadora te ayuda a poner un número con costo y ganancia antes de publicar.',
        },
        {
          q: '¿Tengo que aparecer en videos o “vender agresivo”?',
          a: 'No. El sistema está pensado para WhatsApp, desde casa, sin parecer desesperada.',
        },
        {
          q: '¿Y si esto se vuelve un trabajo pesado?',
          a: 'Empiezas chico: pocas recetas, precio claro, pedidos por chat. Escalas solo si tú quieres.',
        },
      ],
      cta: name ? `${name}, quiero mi kit ahora` : 'Quiero mi kit ahora',
      micro: `${MAIN_PRICE_LABEL} · Garantía ${GUARANTEE_DAYS} días · Acceso inmediato`,
      stickyNote: name
        ? `${name}, tu diagnóstico ya está listo. El kit es la solución para ese bloqueo.`
        : 'Tu diagnóstico ya está listo. El kit es la solución para ese bloqueo.',
    },
  };

  return screens[id];
}
