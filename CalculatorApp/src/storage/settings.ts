import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@calculator/voiceEnabled';

export async function loadVoiceEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === null ? true : value === 'true';
  } catch {
    // ignore read errors
    return true;
  }
}

export async function saveVoiceEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // ignore write errors
  }
}
