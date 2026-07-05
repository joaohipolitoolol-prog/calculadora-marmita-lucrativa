import { ingredientCostPerUnit } from './calculator.js';
import { parseNumber } from './format.js';

export const SIMPLE_DEFAULTS = {
  sellingPrice: 18,
  foodCostPerUnit: 10.2,
  packaging: 1.2,
  gasPerUnit: 0.9,
  delivery: 2,
  wastePerUnit: 0.8,
  marmitasPerDay: 20,
  targetMarginPercent: 30,
};

export function fullToSimple(inputs) {
  const marmitasPerDay = Math.max(parseNumber(inputs.marmitasPerDay), 1);
  const workDaysPerMonth = Math.max(parseNumber(inputs.workDaysPerMonth), 1);
  const monthly = marmitasPerDay * workDaysPerMonth;

  const foodCostPerUnit = (inputs.ingredients || []).reduce(
    (sum, item) => sum + ingredientCostPerUnit(item),
    0
  );
  const wasteCost = foodCostPerUnit * (parseNumber(inputs.wastePercent) / 100);

  return {
    sellingPrice: parseNumber(inputs.sellingPrice),
    foodCostPerUnit,
    packaging: parseNumber(inputs.packagingPerUnit),
    gasPerUnit:
      monthly > 0
        ? (parseNumber(inputs.gasMonthly) + parseNumber(inputs.spicesMonthly)) / monthly
        : 0,
    delivery: parseNumber(inputs.deliveryPerUnit),
    wastePerUnit: wasteCost > 0 ? wasteCost : SIMPLE_DEFAULTS.wastePerUnit,
    marmitasPerDay,
    targetMarginPercent: parseNumber(inputs.targetMarginPercent) || 30,
  };
}

export function simpleToFull(simple) {
  const marmitasPerDay = Math.max(parseNumber(simple.marmitasPerDay), 1);
  const workDaysPerMonth = 22;
  const monthly = marmitasPerDay * workDaysPerMonth;

  return {
    marmitasPerDay,
    workDaysPerMonth,
    targetMarginPercent: parseNumber(simple.targetMarginPercent) || 30,
    sellingPrice: parseNumber(simple.sellingPrice),
    packagingPerUnit: parseNumber(simple.packaging),
    gasMonthly: parseNumber(simple.gasPerUnit) * monthly,
    spicesMonthly: 0,
    deliveryPerUnit: parseNumber(simple.delivery),
    platformFeePercent: 0,
    wastePercent: 0,
    hoursPerDay: 0,
    hourlyRate: 0,
    ingredients: [
      {
        name: 'Ingredientes',
        batchCost: parseNumber(simple.foodCostPerUnit),
        portions: 1,
      },
      {
        name: 'Desperdício',
        batchCost: parseNumber(simple.wastePerUnit),
        portions: 1,
      },
    ],
  };
}

export function readSimpleFromForm(form) {
  const get = (name) => form.querySelector(`[name="${name}"]`)?.value;
  return {
    sellingPrice: get('simple_sellingPrice'),
    foodCostPerUnit: get('simple_foodCostPerUnit'),
    packaging: get('simple_packaging'),
    gasPerUnit: get('simple_gasPerUnit'),
    delivery: get('simple_delivery'),
    wastePerUnit: get('simple_wastePerUnit'),
    marmitasPerDay: get('simple_marmitasPerDay'),
    targetMarginPercent: get('simple_targetMarginPercent'),
  };
}
