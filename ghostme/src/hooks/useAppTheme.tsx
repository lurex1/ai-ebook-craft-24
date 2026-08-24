/**
 * Kontekst motywu aplikacji — tryb ciemny (domyślny) / jasny.
 * Ustawienie jest zapamiętywane w AsyncStorage i synchronizowane
 * z NativeWind (klasy dark:), dzięki czemu przełącznik w Ustawieniach
 * działa w całej aplikacji.
 */

import { colorScheme as nativewindScheme } from "nativewind";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getDarkMode, setDarkMode as persistDarkMode } from "@/services/storage.service";

interface AppThemeState {
  /** Czy aktywny jest tryb ciemny */
  darkMode: boolean;
  /** Przełącza tryb ciemny/jasny i zapisuje wybór */
  toggleDarkMode: () => void;
}

const AppThemeContext = createContext<AppThemeState | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(true);

  // Przy starcie wczytujemy zapisane ustawienie
  useEffect(() => {
    getDarkMode().then((saved) => {
      setDarkMode(saved);
      nativewindScheme.set(saved ? "dark" : "light");
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((current) => {
      const next = !current;
      nativewindScheme.set(next ? "dark" : "light");
      persistDarkMode(next).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ darkMode, toggleDarkMode }), [darkMode, toggleDarkMode]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

/** Hook dostępu do motywu — używaj wewnątrz AppThemeProvider. */
export function useAppTheme(): AppThemeState {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme musi być użyty wewnątrz AppThemeProvider.");
  }
  return context;
}
