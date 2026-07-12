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
    body: 'Es normal. Quien nunca vendió (o vendió poco) piensa que “nadie va a querer”. El problema casi nunca es el producto: es no saber cómo pedirlo.',
    need: 'Necesitas mensajes listos, un menú claro y un plan de primeros pedidos — para publicar sin sentir que estás “molestando”.',
    bridge:
      'No necesitas aparecer en videos. Necesitas un mensaje claro y un producto bonito que se venda solo en el chat.',
    kitFocus: ['mensajes', 'pedidos'],
    focusLabel: 'Mensajes + primeros pedidos',
  },
  recetas: {
    id: 'recetas',
    badge: 'Bloqueo principal',
    title: 'No sabes qué preparar (ni si saldrá bien)',
    body: 'Si no tienes una receta confiable, cada intento se siente como un riesgo. Y el miedo a “desperdiciar ingredientes” te frena antes de empezar.',
    need: 'Necesitas pocas recetas bonitas y claras — no un libro interminable — para empezar con seguridad y repetir lo que funciona.',
    bridge:
      'No necesitas decenas de recetas. Necesitas un producto bonito, fácil de repetir y listo para fotografiar.',
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
  if (blocker === 'precio') return 'precio';
  if (blocker === 'ventas') return 'confianza';
  if (blocker === 'recetas') return 'recetas';
  if (blocker === 'whatsapp') return 'whatsapp';
  if (blocker === 'empezar') return 'inicio';

  // Fallbacks por señales secundarias
  if (answers.cooking === 'beginner') return 'recetas';
  if (answers.whatsappLevel === 'low') return 'whatsapp';
  if (answers.experience === 'never') return 'confianza';
  return 'inicio';
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
      'Eso acelera todo. Ahora el foco es adaptar lo que ya sabes a un producto bonito, con precio claro y un menú listo para WhatsApp.',
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
  const sim = meta.simulation || null;
  const name = String(answers.name || '').trim();
  const hi = name ? `${name}, ` : '';

  const screens = {
    welcome: {
      id: 'welcome',
      type: 'welcome',
      progress: 0,
      icon: 'search',
      image: '/paletas/authority-mujer-paletas.webp?v=3',
      imageAlt:
        'Mujer latina en su cocina con paletas listas para vender por WhatsApp',
      title:
        'Descubre cómo mujeres comunes están generando un ingreso extra vendiendo paletas desde casa por WhatsApp',
      body: 'Responde unas preguntas y ve qué te frena para empezar a ganar desde casa — sin aparecer en videos.',
      note: 'Sin aparecer en videos · Desde casa · Solo WhatsApp',
      cta: 'Quiero descubrir cómo',
      micro: 'Diagnóstico gratis · 2 minutos · Sin compromiso',
    },

    q_experience: {
      id: 'q_experience',
      type: 'question',
      progress: 8,
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
      progress: 16,
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
      progress: 24,
      icon: 'check',
      title: tone.affirmTitle,
      body: tone.affirmBody,
      chip: '',
      review: {
        src: '/paletas/reviews/crops/wa-alejandra.webp?v=2',
        alt: 'Alejandra: primer pedido de vecinas por WhatsApp',
        caption: 'Mujeres como tú ya están recibiendo pedidos',
      },
      cta: 'Continuar',
      micro: 'Vas bien · Siguiente pregunta',
    },

    q_blocker: {
      id: 'q_blocker',
      type: 'question',
      progress: 36,
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
      progress: 40,
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
      progress: 48,
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
      progress: 60,
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
      progress: 72,
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
      progress: 80,
      icon: 'spark',
      title: name ? `${name}, ya tenemos tu mapa` : 'Ya tenemos tu mapa',
      body: [
        blockerLabel &&
          `Tu freno más fuerte hoy es ${blockerLabel}.`,
        expLabel === 'nunca has vendido'
          ? 'Empezar de cero no te atrasa — te da claridad para no repetir errores ajenos.'
          : expLabel
            ? `Con lo que ya traes (${expLabel}), el siguiente paso es corregir ese punto exacto.`
            : '',
        speedLabel ? `Y como ${speedLabel}, vamos a ir directo al plan.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      chip: '',
      cta: 'Ver mi diagnóstico',
      micro: 'Último paso · Análisis personalizado',
    },

    loading: {
      id: 'loading',
      type: 'loading',
      progress: 88,
      steps: [
        {
          icon: 'search',
          text: name ? `Analizando las respuestas de ${name}…` : 'Analizando tus respuestas…',
        },
        { icon: 'user', text: 'Comparando con perfiles de vendedoras…' },
        { icon: 'warning', text: 'Identificando tu bloqueo principal…' },
        { icon: 'spark', text: 'Preparando tu diagnóstico…' },
      ],
    },

    diagnosis: {
      id: 'diagnosis',
      type: 'diagnosis',
      progress: 90,
      icon: 'warning',
      badge: d.badge,
      title: d.title,
      body: `${hi}${tone.resultLead} ${d.body}`,
      need: d.need,
      cta: '¿Qué necesito entonces?',
      micro: name
        ? `${name}, tu diagnóstico está listo`
        : 'Diagnóstico listo · Siguiente: tu plan',
    },

    simulation: {
      id: 'simulation',
      type: 'simulation',
      progress: 93,
      icon: 'dollar',
      eyebrow: 'Simulación de hoy',
      amount: sim?.amountLabel || 'US$ 32,00',
      units: sim?.units || 18,
      title: name
        ? `${name}, esto es lo que podrías haber generado hoy`
        : 'Esto es lo que podrías haber generado hoy',
      body: 'Con paletas publicadas bien en WhatsApp — precio claro, menú listo y mensajes que no dan vergüenza enviar.',
      note: 'Simulación orientativa según tu perfil · ~US$ 1,65 de ganancia por paleta',
      cta: 'Ver cómo lograrlo',
      micro: 'No es una promesa — es una proyección para que veas el potencial',
    },

    insight: {
      id: 'insight',
      type: 'insight',
      progress: 95,
      icon: 'spark',
      title: d.bridge,
      body:
        answers.cooking === 'beginner'
          ? 'Con pasos claros y pocas recetas bien hechas, el miedo a “fallar” baja rápido.'
          : answers.experience === 'never'
            ? 'No necesitas experiencia previa. Necesitas un sistema corto: producto, precio y mensaje.'
            : 'Con lo que ya traes, lo que falta es orden: producto, precio y publicación.',
      points: [
        { icon: 'recipe', text: 'Un producto bonito y repetible' },
        { icon: 'calc', text: 'Un precio que no te haga perder' },
        { icon: 'wa', text: 'Una forma clara de publicar en WhatsApp' },
      ],
      cta: 'Ver la solución para mi caso',
      micro: 'Hecho a medida según tu diagnóstico',
    },

    kit_match: {
      id: 'kit_match',
      type: 'kit',
      progress: 97,
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
      progress: 99,
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
      progress: 100,
      icon: 'gift',
      eyebrow: name ? `Tu plan, ${name}` : 'Tu plan personalizado',
      title:
        answers.speed === 'today'
          ? 'Todo lo que necesitas para empezar hoy'
          : answers.speed === 'week'
            ? 'Todo lo que necesitas para empezar esta semana'
            : 'Todo lo que necesitas para empezar con claridad',
      body: d.bridge,
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
