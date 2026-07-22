/**
 * Centralna konfiguracja AI.
 * Model można łatwo podmienić w jednym miejscu — wystarczy zmienić
 * MODEL / VISION_MODEL albo BASE_URL (np. na inny endpoint zgodny z OpenAI).
 */

export const AI_CONFIG = {
  /** Klucz API — ustaw w pliku .env jako EXPO_PUBLIC_OPENAI_API_KEY */
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "",

  /** Endpoint zgodny z OpenAI (można podmienić np. na proxy lub inny dostawca) */
  baseUrl: "https://api.openai.com/v1",

  /** Model do analizy tekstu rozmowy */
  model: "gpt-4o-mini",

  /** Model wizyjny do OCR (odczyt tekstu ze screenshota) */
  visionModel: "gpt-4o-mini",

  /** Maksymalna liczba tokenów odpowiedzi */
  maxTokens: 1200,

  /** Temperatura — wyższa daje bardziej kreatywne odpowiedzi */
  temperature: 0.7,
} as const;

/** Czy aplikacja działa w trybie DEMO (bez klucza API → dane testowe). */
export function isDemoMode(): boolean {
  return AI_CONFIG.apiKey.trim().length === 0;
}
