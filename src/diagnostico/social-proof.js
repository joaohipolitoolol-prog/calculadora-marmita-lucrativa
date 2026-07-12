/**
 * Prova social — mulheres + número (sem país).
 * A linha evolui com o funil; o número ancora pertencimento.
 */

const SOCIAL_N = 'Más de 300';

export function socialLineFor(phase, answers = {}) {
  if (phase === 'result') {
    return `${SOCIAL_N} mujeres ya dieron este paso · ahora es tu turno`;
  }

  if (phase === 'deep') {
    if (answers.blocker === 'precio') {
      return `${SOCIAL_N} mujeres también trababan en el precio`;
    }
    if (answers.blocker === 'ventas') {
      return `${SOCIAL_N} mujeres también dudaban antes de la primera venta`;
    }
    if (answers.blocker === 'recetas') {
      return `${SOCIAL_N} mujeres también querían recetas claras`;
    }
    if (answers.blocker === 'whatsapp') {
      return `${SOCIAL_N} mujeres también querían vender bien por WhatsApp`;
    }
    return `${SOCIAL_N} mujeres ya están armando su diagnóstico`;
  }

  if (phase === 'mid') {
    if (answers.experience === 'never') {
      return `${SOCIAL_N} mujeres también empezaron desde cero`;
    }
    if (answers.experience === 'tried') {
      return `${SOCIAL_N} mujeres también intentaron y se frenaron — y siguieron`;
    }
    if (answers.experience === 'selling') {
      return `${SOCIAL_N} mujeres también sumaron paletas a lo que ya vendían`;
    }
    return `${SOCIAL_N} mujeres ya empezaron a vender paletas desde casa`;
  }

  return `${SOCIAL_N} mujeres ya empezaron a vender paletas desde casa`;
}

export function phaseFromScreen(screenId) {
  if (screenId === 'welcome') return 'welcome';
  if (
    screenId === 'diagnosis' ||
    screenId === 'simulation' ||
    screenId === 'insight' ||
    screenId === 'kit_match' ||
    screenId === 'trust' ||
    screenId === 'offer'
  ) {
    return 'result';
  }
  if (
    screenId === 'q_blocker' ||
    screenId === 'q_cooking' ||
    screenId === 'q_whatsapp' ||
    screenId === 'q_speed' ||
    screenId === 'affirm_2' ||
    screenId === 'loading'
  ) {
    return 'deep';
  }
  return 'mid';
}
