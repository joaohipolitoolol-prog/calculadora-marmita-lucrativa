/**
 * Simulación estilo Gui — valor del día anclado a ~US$ 1,65/paleta.
 * Varía por sesión + respuestas (no es promesa de resultado).
 */

const PROFIT_PER = 1.65;

function sessionNoise() {
  try {
    const key = 'dx_sim_noise';
    let n = sessionStorage.getItem(key);
    if (n == null) {
      n = String(Math.random() * 5.4);
      sessionStorage.setItem(key, n);
    }
    return Number(n) || 2.1;
  } catch {
    return 2.1;
  }
}

export function computeDaySimulation(answers = {}) {
  let units = 16;
  if (answers.experience === 'never') units = 14;
  if (answers.experience === 'tried') units = 17;
  if (answers.experience === 'selling') units = 21;
  if (answers.speed === 'today') units += 4;
  if (answers.speed === 'week') units += 2;
  if (answers.blocker === 'precio') units += 2;
  if (answers.blocker === 'whatsapp') units += 2;
  if (answers.blocker === 'ventas') units += 1;

  const raw = units * PROFIT_PER + sessionNoise();
  const rounded = Math.round(raw * 100) / 100;
  const [intPart, dec = '00'] = rounded.toFixed(2).split('.');

  return {
    units: Math.round(units),
    amountLabel: `US$ ${intPart},${dec}`,
    amountNum: rounded,
  };
}
