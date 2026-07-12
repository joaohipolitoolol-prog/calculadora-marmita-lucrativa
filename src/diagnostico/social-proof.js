/**
 * Prova social — sem número frágil.
 * A linha evolui com o funil; depoimentos reais carregam a prova.
 */

export function socialLineFor(phase, answers = {}) {
  if (phase === 'result') {
    return 'Mujeres como tú ya están dando este paso · ahora es tu turno';
  }

  if (phase === 'deep') {
    if (answers.blocker === 'precio') {
      return 'Otras también tenían trabas con el precio — y empezaron igual';
    }
    if (answers.blocker === 'ventas') {
      return 'Otras también dudaban antes de la primera venta';
    }
    if (answers.blocker === 'recetas') {
      return 'Otras también querían recetas claras antes de empezar';
    }
    if (answers.blocker === 'whatsapp') {
      return 'Otras también querían vender bien por WhatsApp';
    }
    if (answers.blocker === 'empezar') {
      return 'Otras también tenían miedo de gastar y no vender';
    }
    return 'Estamos armando un plan según tu momento';
  }

  if (phase === 'mid') {
    if (answers.experience === 'never') {
      return 'Mujeres de distintos países también empezaron desde cero';
    }
    if (answers.experience === 'family') {
      return 'Otras también empezaron vendiendo lo que ya preparaban en casa';
    }
    if (answers.experience === 'tried') {
      return 'Otras también intentaron, se frenaron — y siguieron';
    }
    if (answers.experience === 'selling') {
      return 'Otras también sumaron un sistema más claro a lo que ya vendían';
    }
    return 'Mujeres de distintos países ya usan el Kit Paletas para empezar desde casa';
  }

  return 'Mujeres de distintos países ya usan el Kit Paletas para empezar desde casa';
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
