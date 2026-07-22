/**
 * Typy domenowe GhostMe — wynik analizy AI, propozycje odpowiedzi
 * oraz rekord zapisywany w historii (AsyncStorage).
 */

/** Wynik analizy rozmowy zwracany przez AI. */
export interface AnalysisResult {
  /** 😊 Ton rozmowy, np. "flirciarski", "neutralny", "chłodny" */
  tone: string;
  /** ❤️ Poziom zainteresowania drugiej osoby, np. "wysoki" */
  interestLevel: string;
  /** 📈 Szansa na odpowiedź w procentach (0-100) */
  replyChance: number;
  /** 🚩 Sygnały ostrzegawcze zauważone w rozmowie */
  redFlags: string[];
  /** ✅ Pozytywne sygnały zauważone w rozmowie */
  greenFlags: string[];
  /** 🧠 Co oznacza zachowanie drugiej osoby */
  behaviorInsight: string;
  /** Czy warto kontynuować rozmowę */
  worthContinuing: boolean;
  /** 📋 Krótkie podsumowanie całej analizy */
  summary: string;
}

/** Trzy propozycje odpowiedzi wygenerowane przez AI. */
export interface SuggestedReplies {
  /** 😂 Zabawna odpowiedź */
  funny: string;
  /** 😎 Pewna siebie odpowiedź */
  confident: string;
  /** ❤️ Miła odpowiedź */
  kind: string;
}

/** Pełna odpowiedź AI: analiza + propozycje odpowiedzi. */
export interface AiResponse {
  analysis: AnalysisResult;
  replies: SuggestedReplies;
}

/** Rekord pojedynczej analizy zapisywany w historii. */
export interface AnalysisRecord {
  /** Unikalny identyfikator rekordu */
  id: string;
  /** Data utworzenia (timestamp w ms) */
  createdAt: number;
  /** URI screenshota (lokalny plik na urządzeniu) */
  imageUri?: string;
  /** Tekst rozmowy (po OCR i ewentualnej edycji użytkownika) */
  conversationText: string;
  /** Wynik analizy AI */
  analysis: AnalysisResult;
  /** Propozycje odpowiedzi */
  replies: SuggestedReplies;
}
