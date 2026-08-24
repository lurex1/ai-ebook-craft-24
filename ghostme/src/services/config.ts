/**
 * Centralna konfiguracja AI (Anthropic Claude).
 * Model można łatwo podmienić w jednym miejscu — np. na "claude-haiku-4-5"
 * (najtańszy) albo "claude-sonnet-5", jeśli chcesz obniżyć koszty.
 */

export const AI_CONFIG = {
  /** Klucz API — ustaw w pliku .env jako EXPO_PUBLIC_ANTHROPIC_API_KEY */
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? "",

  /** Model do analizy rozmowy */
  model: "claude-sonnet-5",

  /** Model wizyjny do OCR (odczyt tekstu ze screenshota) */
  visionModel: "claude-sonnet-5",

  /** Maksymalna liczba tokenów odpowiedzi */
  maxTokens: 4096,
} as const;

/** Czy aplikacja działa w trybie DEMO (bez klucza API → dane testowe). */
export function isDemoMode(): boolean {
  return AI_CONFIG.apiKey.trim().length === 0;
}
