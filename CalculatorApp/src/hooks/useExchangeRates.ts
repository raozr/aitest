import { useState, useEffect, useRef } from 'react';
import { fetchRates, FALLBACK_RATES, RatesMap } from '../utils/rates';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface UseExchangeRatesReturn {
  rates: RatesMap;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useExchangeRates(): UseExchangeRatesReturn {
  const [rates, setRates] = useState<RatesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetch = useRef(0);

  const load = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetch.current < CACHE_DURATION && Object.keys(rates).length > 0) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRates();
      setRates(data);
      lastFetch.current = now;
    } catch {
      setRates(FALLBACK_RATES);
      setError('获取汇率失败，使用预设汇率');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => load(true);

  return { rates, isLoading, error, refresh };
}
