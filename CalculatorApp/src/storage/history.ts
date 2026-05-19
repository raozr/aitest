import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryEntry } from '../types';

const STORAGE_KEY = '@calculator/history';

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json);
    }
  } catch {
    // ignore read errors
  }
  return [];
}

export async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  try {
    const json = JSON.stringify(entries);
    await AsyncStorage.setItem(STORAGE_KEY, json);
  } catch {
    // ignore write errors
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
