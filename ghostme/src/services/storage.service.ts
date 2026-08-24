/**
 * Serwis pamięci lokalnej (AsyncStorage) — historia analiz i ustawienia.
 * Wszystkie operacje są bezpieczne: błędy odczytu zwracają wartości domyślne.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AnalysisRecord } from "@/types/analysis";

const HISTORY_KEY = "ghostme:history";
const THEME_KEY = "ghostme:darkMode";

/** Maksymalna liczba rekordów w historii (najstarsze są usuwane). */
const HISTORY_LIMIT = 50;

/** Zwraca całą historię analiz (najnowsze na początku). */
export async function getHistory(): Promise<AnalysisRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AnalysisRecord[]) : [];
  } catch {
    return [];
  }
}

/** Zwraca pojedynczy rekord historii po identyfikatorze. */
export async function getRecord(id: string): Promise<AnalysisRecord | null> {
  const history = await getHistory();
  return history.find((record) => record.id === id) ?? null;
}

/** Zapisuje nową analizę na początku historii. */
export async function saveRecord(record: AnalysisRecord): Promise<void> {
  const history = await getHistory();
  const updated = [record, ...history].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

/** Usuwa pojedynczy rekord z historii. */
export async function deleteRecord(id: string): Promise<void> {
  const history = await getHistory();
  const updated = history.filter((record) => record.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

/** Czyści całą historię analiz. */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

/** Odczytuje ustawienie trybu ciemnego (domyślnie włączony). */
export async function getDarkMode(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

/** Zapisuje ustawienie trybu ciemnego. */
export async function setDarkMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, String(enabled));
}
