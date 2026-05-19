export function formatWithPrecision(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(10).replace(/\.?0+$/, '');
}

export function toExponential(value: number): string {
  return value.toExponential(6);
}
