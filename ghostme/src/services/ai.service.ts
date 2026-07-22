/**
 * Serwis analizy AI — wysyła tekst rozmowy do Claude i zwraca
 * ustrukturyzowaną analizę oraz trzy propozycje odpowiedzi.
 * Structured outputs wymuszają na modelu poprawny JSON zgodny ze schematem.
 * W trybie DEMO (brak klucza API) zwraca dane testowe.
 */

import { AI_CONFIG, isDemoMode } from "./config";
import { AiError, askClaude } from "./anthropicClient";
import type { AiResponse } from "@/types/analysis";
import { clampPercent, extractJson } from "@/utils/json";
import { MOCK_AI_RESPONSE, mockDelay } from "@/utils/mockData";

/** Instrukcja dla AI — analiza rozmowy i trzy propozycje odpowiedzi. */
const ANALYSIS_PROMPT = `Jesteś ekspertem od komunikacji i relacji. Analizujesz rozmowy z komunikatorów (Messenger, Instagram, WhatsApp, SMS) i pomagasz użytkownikowi ("Ja") zrozumieć drugą osobę oraz dobrze odpowiedzieć.

Przeanalizuj poniższą rozmowę.

Określ:
- ton rozmowy
- poziom zainteresowania
- red flagi
- green flagi
- czy warto kontynuować rozmowę
- szansę odpowiedzi w procentach
- krótkie podsumowanie

Następnie wygeneruj trzy odpowiedzi:
1. zabawną
2. pewną siebie
3. miłą

Wszystkie teksty pisz po polsku. Odpowiedzi (replies) mają brzmieć naturalnie, jak wiadomość napisana przez człowieka.`;

/** Schemat JSON wymuszany na modelu (structured outputs). */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    analysis: {
      type: "object",
      properties: {
        tone: { type: "string", description: "Opis tonu rozmowy" },
        interestLevel: { type: "string", description: "Opis poziomu zainteresowania" },
        replyChance: { type: "integer", description: "Szansa na odpowiedź 0-100" },
        redFlags: { type: "array", items: { type: "string" } },
        greenFlags: { type: "array", items: { type: "string" } },
        behaviorInsight: {
          type: "string",
          description: "Co oznacza zachowanie drugiej osoby",
        },
        worthContinuing: { type: "boolean" },
        summary: { type: "string", description: "Krótkie podsumowanie" },
      },
      required: [
        "tone",
        "interestLevel",
        "replyChance",
        "redFlags",
        "greenFlags",
        "behaviorInsight",
        "worthContinuing",
        "summary",
      ],
      additionalProperties: false,
    },
    replies: {
      type: "object",
      properties: {
        funny: { type: "string", description: "Zabawna odpowiedź" },
        confident: { type: "string", description: "Pewna siebie odpowiedź" },
        kind: { type: "string", description: "Miła odpowiedź" },
      },
      required: ["funny", "confident", "kind"],
      additionalProperties: false,
    },
  },
  required: ["analysis", "replies"],
  additionalProperties: false,
} as const;

/**
 * Analizuje tekst rozmowy i zwraca pełny wynik (analiza + odpowiedzi).
 * Waliduje strukturę JSON zwróconą przez model.
 */
export async function analyzeConversation(conversationText: string): Promise<AiResponse> {
  // Tryb demo — dane testowe bez wywołania API
  if (isDemoMode()) {
    await mockDelay(2000);
    return MOCK_AI_RESPONSE;
  }

  const raw = await askClaude(
    [{ type: "text", text: `${ANALYSIS_PROMPT}\n\nRozmowa do analizy:\n\n${conversationText}` }],
    AI_CONFIG.model,
    RESPONSE_SCHEMA as unknown as Record<string, unknown>
  );

  let parsed: AiResponse;
  try {
    parsed = extractJson<AiResponse>(raw);
  } catch {
    throw new AiError("AI zwróciło niepoprawny format danych. Spróbuj ponownie.");
  }

  return normalizeResponse(parsed);
}

/** Uzupełnia braki i porządkuje dane z modelu, aby UI zawsze dostał pełną strukturę. */
function normalizeResponse(response: AiResponse): AiResponse {
  const analysis = response.analysis ?? ({} as AiResponse["analysis"]);
  const replies = response.replies ?? ({} as AiResponse["replies"]);

  return {
    analysis: {
      tone: analysis.tone || "Nie udało się określić tonu.",
      interestLevel: analysis.interestLevel || "Nie udało się określić.",
      replyChance: clampPercent(analysis.replyChance),
      redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags : [],
      greenFlags: Array.isArray(analysis.greenFlags) ? analysis.greenFlags : [],
      behaviorInsight: analysis.behaviorInsight || "Brak dodatkowych wniosków.",
      worthContinuing: Boolean(analysis.worthContinuing),
      summary: analysis.summary || "Brak podsumowania.",
    },
    replies: {
      funny: replies.funny || "Brak propozycji.",
      confident: replies.confident || "Brak propozycji.",
      kind: replies.kind || "Brak propozycji.",
    },
  };
}
