/**
 * Niskopoziomowy klient OpenAI Chat Completions.
 * Jedno miejsce, w którym wykonujemy zapytania HTTP — dzięki temu
 * podmiana dostawcy/modelu nie wymaga zmian w pozostałych serwisach.
 */

import { AI_CONFIG } from "./config";

/** Treść wiadomości: czysty tekst lub tekst + obraz (dla OCR). */
export type ChatContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: ChatContent;
}

/** Błąd domenowy z czytelnym komunikatem dla użytkownika. */
export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

/**
 * Wysyła rozmowę do modelu i zwraca tekst odpowiedzi.
 * Rzuca AiError z komunikatem po polsku przy problemach z siecią/API.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  model: string = AI_CONFIG.model
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      }),
    });
  } catch {
    throw new AiError("Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AiError("Nieprawidłowy klucz API. Sprawdź konfigurację w pliku .env.");
    }
    if (response.status === 429) {
      throw new AiError("Przekroczono limit zapytań do AI. Odczekaj chwilę i spróbuj ponownie.");
    }
    throw new AiError(`Błąd serwera AI (kod ${response.status}). Spróbuj ponownie.`);
  }

  const data = await response.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new AiError("AI zwróciło pustą odpowiedź. Spróbuj ponownie.");
  }
  return text;
}
