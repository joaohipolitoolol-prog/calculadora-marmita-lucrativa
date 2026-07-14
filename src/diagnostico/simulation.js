/**
 * Simulación estilo Gui, valor del día anclado a ~US$ 1,65/paleta.
 * Conservadora, varía por respuestas (no es promesa de resultado).
 */

const PROFIT_PER = 1.65;

function sessionNoise() {
  try {
    const key = 'dx_sim_noise';
    let n = sessionStorage.getItem(key);
    if (n == null) {
      n = String(Math.random() * 3.2);
      sessionStorage.setItem(key, n);
    }
    return Number(n) || 1.4;
  } catch {
    return 1.4;
  }
}

/**
 * Unidades realistas para un primer día bien publicado (no un día récord).
 * No sube el número por tener un bloqueo, eso era ilógico.
 */
export function computeDaySimulation(answers = {}) {
  let units = 10;

  if (answers.experience === 'never') units = 7;
  else if (answers.experience === 'tried') units = 10;
  else if (answers.experience === 'selling') units = 14;

  if (answers.speed === 'today') units += 2;
  else if (answers.speed === 'week') units += 1;

  // Objetivo: “probar” = proyección más chica; “desde casa” = un poco más ambiciosa
  if (answers.goal === 'test') units = Math.max(5, units - 1);
  else if (answers.goal === 'replace') units += 1;

  // Nivel WhatsApp (si se preguntó): low = día más realista al empezar
  if (answers.whatsappLevel === 'low') units = Math.max(5, units - 2);
  else if (answers.whatsappLevel === 'daily') units += 1;

  // Cocina principiante: menos unidades el primer día (más cuidado)
  if (answers.cooking === 'beginner') units = Math.max(5, units - 1);

  const raw = units * PROFIT_PER + sessionNoise();
  const rounded = Math.round(raw * 100) / 100;
  const [intPart, dec = '00'] = rounded.toFixed(2).split('.');

  return {
    units: Math.round(units),
    amountLabel: `US$ ${intPart},${dec}`,
    amountNum: rounded,
  };
}
