import AsyncStorage from '@react-native-async-storage/async-storage';
import { RatesMap } from '../utils/rates';

const STORAGE_KEY = '@calculator/rates';

interface CachedRates {
  rates: RatesMap;
  timestamp: number;
}

export async function loadCachedRates(): Promise<CachedRates | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const parsed = JSON.parse(json);
      if (parsed?.rates && typeof parsed.timestamp === 'number') {
        return parsed as CachedRates;
      }
    }
  } catch {
    // ignore read errors
  }
  return null;
}

export async function saveCachedRates(rates: RatesMap): Promise<void> {
  try {
    const payload: CachedRates = { rates, timestamp: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore write errors
  }
}
