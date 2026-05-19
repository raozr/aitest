export interface RatesMap {
  [code: string]: number;
}

const FALLBACK_RATES: RatesMap = {
  USD: 1.0,
  CNY: 7.25,
  JPY: 151.5,
  EUR: 0.92,
  GBP: 0.79,
  KRW: 1350.0,
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: '美元',
  CNY: '人民币',
  JPY: '日元',
  EUR: '欧元',
  GBP: '英镑',
  KRW: '韩元',
};

export const CURRENCY_COLORS: Record<string, string> = {
  USD: '#007AFF',
  CNY: '#FF3B30',
  JPY: '#AF52DE',
  EUR: '#007AFF',
  GBP: '#34C759',
  KRW: '#FF9500',
};

export async function fetchRates(): Promise<RatesMap> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data?.rates) {
      return data.rates;
    }
    return FALLBACK_RATES;
  } catch {
    return FALLBACK_RATES;
  }
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: RatesMap
): number {
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return (amount / fromRate) * toRate;
}
