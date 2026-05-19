import { fetchRates, convertCurrency, SUPPORTED_CURRENCIES, CURRENCY_NAMES, FALLBACK_RATES } from '../src/utils/rates';

const MOCK_RATES = { USD: 1, CNY: 7.25, EUR: 0.92 };

// --- fetchRates ---
describe('fetchRates', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns rates on successful API response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: MOCK_RATES }),
    });
    const rates = await fetchRates();
    expect(rates).toEqual(MOCK_RATES);
  });

  it('throws on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });
    await expect(fetchRates()).rejects.toThrow('HTTP 429');
  });

  it('throws on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    await expect(fetchRates()).rejects.toThrow('Network error');
  });

  it('throws on missing rates field in response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notRates: true }),
    });
    await expect(fetchRates()).rejects.toThrow('无效的响应格式');
  });
});

// --- convertCurrency ---
describe('convertCurrency', () => {
  it('converts USD to CNY', () => {
    expect(convertCurrency(100, 'USD', 'CNY', FALLBACK_RATES)).toBe(725);
  });

  it('converts CNY to USD', () => {
    expect(convertCurrency(725, 'CNY', 'USD', FALLBACK_RATES)).toBe(100);
  });

  it('returns 0 when amount is 0', () => {
    expect(convertCurrency(0, 'USD', 'CNY', FALLBACK_RATES)).toBe(0);
  });

  it('handles unknown currency as rate 1', () => {
    const result = convertCurrency(100, 'USD', 'XXX', FALLBACK_RATES);
    expect(result).toBe(100);
  });
});

// --- SUPPORTED_CURRENCIES as single source of truth ---
describe('SUPPORTED_CURRENCIES', () => {
  it('includes all expected currencies', () => {
    expect(SUPPORTED_CURRENCIES).toEqual(['HKD', 'USD', 'CNY', 'JPY', 'EUR', 'GBP', 'KRW']);
  });

  it('every currency has a name and color', () => {
    for (const code of SUPPORTED_CURRENCIES) {
      expect(CURRENCY_NAMES[code]).toBeDefined();
    }
  });

  it('every currency has a fallback rate', () => {
    for (const code of SUPPORTED_CURRENCIES) {
      expect(FALLBACK_RATES[code]).toBeDefined();
      expect(FALLBACK_RATES[code]).toBeGreaterThan(0);
    }
  });
});
