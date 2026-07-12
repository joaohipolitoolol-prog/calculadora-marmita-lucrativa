/**
 * Prova social: histórias concretas, não copy genérica.
 * Usa os mesmos nomes dos depoimentos e dos toasts WhatsApp.
 */

export function socialLineFor(phase, answers = {}) {
  const fallback =
    'Norma publicó su menú un martes. El miércoles le escribieron 3 vecinas';

  if (phase === 'welcome') {
    return fallback;
  }

  if (phase === 'result') {
    if (answers.blocker === 'precio') {
      return 'Luciana ya no adivina precios. Calcula y publica el mismo día';
    }
    if (answers.blocker === 'ventas') {
      return 'Alejandra dudaba si alguien compraría. Hoy le piden cada semana';
    }
    if (answers.blocker === 'recetas') {
      return 'Yadira arrancó con 2 sabores y repitió lo que salió bien';
    }
    if (answers.blocker === 'whatsapp') {
      return 'Mary publicó un estado y le respondieron el mismo día';
    }
    if (answers.blocker === 'empezar') {
      return 'Norma probó primero con lo que tenía en casa, sin arriesgar de más';
    }
    return 'Mujeres como tú ya dieron este paso. Ahora te toca a ti';
  }

  if (phase === 'deep') {
    if (answers.blocker === 'precio') {
      return 'Norma tampoco sabía cuánto cobrar, hasta que calculó cada paleta';
    }
    if (answers.blocker === 'ventas') {
      return 'Alejandra pensaba que nadie le iba a comprar. Su vecina pidió 6 el primer finde';
    }
    if (answers.blocker === 'recetas') {
      return 'Yadira tenía miedo de equivocarse. Empezó con pocas recetas claras';
    }
    if (answers.blocker === 'whatsapp') {
      return 'Mary no sabía qué escribir en el estado. Usó un mensaje listo y le contestaron en horas';
    }
    if (answers.blocker === 'empezar') {
      return 'Luciana también tenía miedo de gastar. Arrancó con lo mínimo en casa';
    }
    return 'Estamos armando tu plan según lo que nos contaste';
  }

  if (phase === 'mid') {
    if (answers.experience === 'never') {
      return 'Yadira nunca había vendido. Su primer pedido fue de una vecina del edificio';
    }
    if (answers.experience === 'family') {
      return 'Alejandra hacía paletas para su familia. La primera venta fue a una compañera';
    }
    if (answers.experience === 'tried') {
      return 'Mary probó vender, se frenó, y retomó con un plan más claro';
    }
    if (answers.experience === 'selling') {
      return 'Luciana ya vendía, pero le faltaba orden en precios y menú';
    }
    return fallback;
  }

  return fallback;
}

export function phaseFromScreen(screenId) {
  if (screenId === 'welcome') return 'welcome';
  if (
    screenId === 'diagnosis' ||
    screenId === 'plan' ||
    screenId === 'trust' ||
    screenId === 'offer'
  ) {
    return 'result';
  }
  if (
    screenId === 'q_channel' ||
    screenId === 'q_start' ||
    screenId === 'q_victory' ||
    screenId === 'q_name' ||
    screenId === 'loading'
  ) {
    return 'deep';
  }
  return 'mid';
}
