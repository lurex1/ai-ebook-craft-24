/**
 * Serwis analizy AI — wysyła tekst rozmowy do modelu i zwraca
 * ustrukturyzowaną analizę oraz trzy propozycje odpowiedzi.
 * W trybie DEMO (brak klucza API) zwraca dane testowe.
 */

import { isDemoMode } from "./config";
import { AiError, chatCompletion } from "./openaiClient";
import type { AiResponse } from "@/types/analysis";
import { clampPercent, extractJson } from "@/utils/json";
import { MOCK_AI_RESPONSE, mockDelay } from "@/utils/mockData";

/** Instrukcja systemowa definiująca zadanie i format odpowiedzi AI. */
const SYSTEM_PROMPT = `Jesteś ekspertem od komunikacji i relacji. Analizujesz rozmowy z komunikatorów (Messenger, Instagram, WhatsApp, SMS) i pomagasz użytkownikowi ("Ja") zrozumieć drugą osobę oraz dobrze odpowiedzieć.

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

Zwracaj odpowiedź wyłącznie jako poprawny JSON o dokładnie takiej strukturze (bez markdown, bez komentarzy):
{
  "analysis": {
    "tone": "opis tonu rozmowy",
    "interestLevel": "opis poziomu zainteresowania",
    "replyChance": 75,
    "redFlags": ["..."],
    "greenFlags": ["..."],
    "behaviorInsight": "co oznacza zachowanie drugiej osoby",
    "worthContinuing": true,
    "summary": "krótkie podsumowanie"
  },
  "replies": {
    "funny": "zabawna odpowiedź",
    "confident": "pewna siebie odpowiedź",
    "kind": "miła odpowiedź"
  }
}

Wszystkie teksty pisz po polsku. Odpowiedzi (replies) mają brzmieć naturalnie, jak wiadomość napisana przez człowieka.`;

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

  const raw = await chatCompletion([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Rozmowa do analizy:\n\n${conversationText}` },
  ]);

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
