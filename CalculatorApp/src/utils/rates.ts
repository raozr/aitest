export interface RatesMap {
  [code: string]: number;
}

export const FALLBACK_RATES: RatesMap = {
  HKD: 7.8,
  USD: 1.0,
  CNY: 7.25,
  JPY: 151.5,
  EUR: 0.92,
  GBP: 0.79,
  KRW: 1350.0,
};

export const CURRENCY_NAMES: Record<string, string> = {
  HKD: '港币',
  USD: '美元',
  CNY: '人民币',
  JPY: '日元',
  EUR: '欧元',
  GBP: '英镑',
  KRW: '韩元',
};

export const CURRENCY_COLORS: Record<string, string> = {
  HKD: '#FF9500',
  USD: '#007AFF',
  CNY: '#FF3B30',
  JPY: '#AF52DE',
  EUR: '#007AFF',
  GBP: '#34C759',
  KRW: '#FF9500',
};

export const SUPPORTED_CURRENCIES = Object.keys(FALLBACK_RATES);

export async function fetchRates(): Promise<RatesMap> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.rates) throw new Error('无效的响应格式');
  return data.rates;
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: RatesMap
): number {
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  const result = (amount / fromRate) * toRate;
  return parseFloat(result.toFixed(4));
}
