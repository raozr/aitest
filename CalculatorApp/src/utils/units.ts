export type UnitCategory = 'length' | 'weight' | 'temperature';

export const CATEGORY_NAMES: Record<UnitCategory, string> = {
  length: '长度',
  weight: '重量',
  temperature: '温度',
};

export const CATEGORIES: UnitCategory[] = ['length', 'weight', 'temperature'];

interface LinearUnit {
  name: string;
  factor: number; // relative to the base unit of the category
}

// base units: length = meter, weight = gram
const LINEAR_UNITS: Record<Exclude<UnitCategory, 'temperature'>, Record<string, LinearUnit>> = {
  length: {
    m: { name: '米', factor: 1 },
    km: { name: '千米', factor: 1000 },
    cm: { name: '厘米', factor: 0.01 },
    mm: { name: '毫米', factor: 0.001 },
    mi: { name: '英里', factor: 1609.344 },
    ft: { name: '英尺', factor: 0.3048 },
    in: { name: '英寸', factor: 0.0254 },
  },
  weight: {
    kg: { name: '千克', factor: 1000 },
    g: { name: '克', factor: 1 },
    mg: { name: '毫克', factor: 0.001 },
    lb: { name: '磅', factor: 453.59237 },
    oz: { name: '盎司', factor: 28.349523125 },
  },
};

const TEMPERATURE_UNITS: Record<string, { name: string }> = {
  C: { name: '摄氏度' },
  F: { name: '华氏度' },
  K: { name: '开尔文' },
};

export function getUnits(category: UnitCategory): { code: string; name: string }[] {
  if (category === 'temperature') {
    return Object.entries(TEMPERATURE_UNITS).map(([code, u]) => ({ code, name: u.name }));
  }
  return Object.entries(LINEAR_UNITS[category]).map(([code, u]) => ({ code, name: u.name }));
}

export function getUnitName(category: UnitCategory, code: string): string {
  if (category === 'temperature') return TEMPERATURE_UNITS[code]?.name ?? code;
  return LINEAR_UNITS[category][code]?.name ?? code;
}

function round(value: number): number {
  return parseFloat(value.toFixed(6));
}

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15;

  let out: number;
  if (to === 'C') out = celsius;
  else if (to === 'F') out = (celsius * 9) / 5 + 32;
  else out = celsius + 273.15;
  return round(out);
}

export function convertUnit(
  category: UnitCategory,
  value: number,
  from: string,
  to: string
): number {
  if (category === 'temperature') {
    return convertTemperature(value, from, to);
  }
  const units = LINEAR_UNITS[category];
  const fromFactor = units[from]?.factor ?? 1;
  const toFactor = units[to]?.factor ?? 1;
  return round((value * fromFactor) / toFactor);
}
