import { useState, useEffect, useCallback } from 'react';
import { fetchRates, FALLBACK_RATES, RatesMap } from '../utils/rates';
import { loadCachedRates, saveCachedRates } from '../storage/rates';

const CACHE_DURATION = 5 * 60 * 1000;

// Module-level cache shared across mounts (e.g. re-entering the screen)
let memoryCache: { rates: RatesMap; timestamp: number } | null = null;

interface UseExchangeRatesReturn {
  rates: RatesMap;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useExchangeRates(): UseExchangeRatesReturn {
  const [rates, setRates] = useState<RatesMap>(memoryCache?.rates ?? {});
  const [isLoading, setIsLoading] = useState(!memoryCache);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (
      !force &&
      memoryCache &&
      Date.now() - memoryCache.timestamp < CACHE_DURATION
    ) {
      setRates(memoryCache.rates);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRates();
      memoryCache = { rates: data, timestamp: Date.now() };
      setRates(data);
      saveCachedRates(data);
    } catch {
      const cached = memoryCache ?? (await loadCachedRates());
      if (cached) {
        memoryCache = cached;
        setRates(cached.rates);
        setError('获取汇率失败，使用上次缓存汇率');
      } else {
        setRates(FALLBACK_RATES);
        setError('获取汇率失败，使用预设汇率');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { rates, isLoading, error, refresh };
}
