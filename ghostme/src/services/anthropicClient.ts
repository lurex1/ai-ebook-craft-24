/**
 * Klient Anthropic (Claude) — jedno miejsce, w którym wykonujemy zapytania
 * do API. Dzięki temu podmiana modelu nie wymaga zmian w pozostałych serwisach.
 */

import Anthropic from "@anthropic-ai/sdk";

import { AI_CONFIG } from "./config";

/** Błąd domenowy z czytelnym komunikatem dla użytkownika. */
export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

let client: Anthropic | null = null;

/** Leniwie tworzy klienta SDK (klucz trafia do aplikacji z pliku .env). */
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: AI_CONFIG.apiKey,
      // Aplikacja działa na urządzeniu użytkownika (RN / web preview),
      // więc klucz jest używany bezpośrednio z klienta.
      dangerouslyAllowBrowser: true,
    });
  }
  return client;
}

/**
 * Wysyła wiadomość do Claude i zwraca tekst odpowiedzi.
 * `outputSchema` (opcjonalny) wymusza odpowiedź jako poprawny JSON
 * zgodny ze schematem (structured outputs).
 */
export async function askClaude(
  content: Anthropic.ContentBlockParam[],
  model: string,
  outputSchema?: Record<string, unknown>
): Promise<string> {
  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create({
      model,
      max_tokens: AI_CONFIG.maxTokens,
      thinking: { type: "adaptive" },
      ...(outputSchema
        ? { output_config: { format: { type: "json_schema" as const, schema: outputSchema } } }
        : {}),
      messages: [{ role: "user", content }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiError("Nieprawidłowy klucz API. Sprawdź konfigurację w pliku .env.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiError("Przekroczono limit zapytań do AI. Odczekaj chwilę i spróbuj ponownie.");
    }
    if (error instanceof Anthropic.APIConnectionError) {
      throw new AiError("Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiError(`Błąd serwera AI (kod ${error.status}). Spróbuj ponownie.`);
    }
    throw new AiError("Nieznany błąd podczas komunikacji z AI. Spróbuj ponownie.");
  }

  // Claude może odmówić odpowiedzi (filtry bezpieczeństwa) — sprawdzamy przed odczytem
  if (response.stop_reason === "refusal") {
    throw new AiError("AI odmówiło analizy tej treści. Spróbuj z inną rozmową.");
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!text.trim()) {
    throw new AiError("AI zwróciło pustą odpowiedź. Spróbuj ponownie.");
  }
  return text;
}
