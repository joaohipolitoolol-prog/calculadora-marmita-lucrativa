import { parseNumber } from './format.js';

export const DEFAULT_INPUTS = {
  marmitasPerDay: 20,
  workDaysPerMonth: 22,
  targetMarginPercent: 30,
  sellingPrice: 18,
  packagingPerUnit: 1.2,
  gasMonthly: 396,
  spicesMonthly: 0,
  deliveryPerUnit: 2,
  platformFeePercent: 0,
  wastePercent: 8,
  hoursPerDay: 0,
  hourlyRate: 0,
  ingredients: [
    { name: 'Arroz', batchCost: 8, portions: 20 },
    { name: 'Feijão', batchCost: 12, portions: 20 },
    { name: 'Carne/Frango', batchCost: 160, portions: 20 },
    { name: 'Acompanhamentos', batchCost: 24, portions: 20 },
  ],
};

export function ingredientCostPerUnit(ingredient) {
  const cost = parseNumber(ingredient.batchCost);
  const portions = parseNumber(ingredient.portions);
  if (portions <= 0) return 0;
  return cost / portions;
}

export function calculate(inputs) {
  const marmitasPerDay = Math.max(parseNumber(inputs.marmitasPerDay), 1);
  const workDaysPerMonth = Math.max(parseNumber(inputs.workDaysPerMonth), 1);
  const targetMarginPercent = Math.max(parseNumber(inputs.targetMarginPercent), 0);
  const sellingPrice = Math.max(parseNumber(inputs.sellingPrice), 0);
  const packagingPerUnit = Math.max(parseNumber(inputs.packagingPerUnit), 0);
  const gasMonthly = Math.max(parseNumber(inputs.gasMonthly), 0);
  const spicesMonthly = Math.max(parseNumber(inputs.spicesMonthly), 0);
  const deliveryPerUnit = Math.max(parseNumber(inputs.deliveryPerUnit), 0);
  const platformFeePercent = Math.min(Math.max(parseNumber(inputs.platformFeePercent), 0), 99);
  const wastePercent = Math.max(parseNumber(inputs.wastePercent), 0);
  const hoursPerDay = Math.max(parseNumber(inputs.hoursPerDay), 0);
  const hourlyRate = Math.max(parseNumber(inputs.hourlyRate), 0);

  const marmitasMonthly = marmitasPerDay * workDaysPerMonth;

  const ingredients = Array.isArray(inputs.ingredients) ? inputs.ingredients : [];
  const foodCost = ingredients.reduce((sum, item) => sum + ingredientCostPerUnit(item), 0);
  const wasteCost = foodCost * (wastePercent / 100);
  const gasPerUnit = gasMonthly / marmitasMonthly;
  const spicesPerUnit = spicesMonthly / marmitasMonthly;
  const timePerUnit = (hoursPerDay * hourlyRate) / marmitasPerDay;

  const baseCost =
    foodCost +
    wasteCost +
    packagingPerUnit +
    gasPerUnit +
    spicesPerUnit +
    deliveryPerUnit +
    timePerUnit;

  const feeRate = platformFeePercent / 100;
  const platformFee = sellingPrice * feeRate;
  const totalCost = baseCost + platformFee;
  const profitPerUnit = sellingPrice - totalCost;
  const margin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;

  const minPrice = feeRate < 1 ? baseCost / (1 - feeRate) : baseCost;
  const targetMargin = Math.min(Math.max(targetMarginPercent, 0), 80) / 100;
  const idealDenominator = 1 - feeRate - targetMargin;
  const idealPrice = idealDenominator > 0 ? baseCost / idealDenominator : minPrice;

  const dailyProfit = profitPerUnit * marmitasPerDay;
  const monthlyProfit = dailyProfit * workDaysPerMonth;
  const isProfitable = profitPerUnit > 0;

  const breakdown = {
    foodCost,
    wasteCost,
    packagingPerUnit,
    gasPerUnit,
    spicesPerUnit,
    deliveryPerUnit,
    timePerUnit,
    platformFee,
    baseCost,
  };

  return {
    marmitasPerDay,
    workDaysPerMonth,
    marmitasMonthly,
    sellingPrice,
    realCostPerUnit: baseCost,
    profitPerUnit,
    margin,
    minPrice,
    idealPrice,
    dailyProfit,
    monthlyProfit,
    isProfitable,
    breakdown,
    status:
      profitPerUnit < 0
        ? 'prejuizo'
        : margin < targetMarginPercent
          ? 'alerta'
          : 'lucro',
  };
}

export function cloneInputs(inputs) {
  return JSON.parse(JSON.stringify(inputs));
}

export function readInputsFromForm(form) {
  const data = new FormData(form);
  const ingredients = [];
  const names = form.querySelectorAll('[data-ingredient-name]');

  names.forEach((nameInput, index) => {
    ingredients.push({
      name: nameInput.value.trim() || `Ingrediente ${index + 1}`,
      batchCost: parseNumber(form.querySelector(`[data-ingredient-cost="${index}"]`)?.value),
      portions: parseNumber(form.querySelector(`[data-ingredient-portions="${index}"]`)?.value),
    });
  });

  return {
    marmitasPerDay: parseNumber(data.get('marmitasPerDay')),
    workDaysPerMonth: parseNumber(data.get('workDaysPerMonth')),
    targetMarginPercent: parseNumber(data.get('targetMarginPercent')),
    sellingPrice: parseNumber(data.get('sellingPrice')),
    packagingPerUnit: parseNumber(data.get('packagingPerUnit')),
    gasMonthly: parseNumber(data.get('gasMonthly')),
    spicesMonthly: parseNumber(data.get('spicesMonthly')),
    deliveryPerUnit: parseNumber(data.get('deliveryPerUnit')),
    platformFeePercent: parseNumber(data.get('platformFeePercent')),
    wastePercent: parseNumber(data.get('wastePercent')),
    hoursPerDay: parseNumber(data.get('hoursPerDay')),
    hourlyRate: parseNumber(data.get('hourlyRate')),
    ingredients,
  };
}
