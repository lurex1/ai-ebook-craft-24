/**
 * Dane testowe (tryb DEMO).
 * Używane, gdy nie skonfigurowano klucza OpenAI API — dzięki temu
 * całą aplikację można przeklikać bez ponoszenia kosztów API.
 */

import type { AiResponse } from "@/types/analysis";

/** Przykładowy tekst rozmowy zwracany przez "OCR" w trybie demo. */
export const MOCK_OCR_TEXT = `Ona: Hej, widziałam że byłeś wczoraj na koncercie 🙈
Ja: No hej! Tak, było mega. Szkoda że Cię nie było
Ona: Następnym razem musisz mnie zabrać 😄
Ja: Umowa stoi. To co, w piątek?
Ona: Haha zobaczymy, napisz mi w czwartek to pogadamy`;

/** Przykładowa pełna odpowiedź AI w trybie demo. */
export const MOCK_AI_RESPONSE: AiResponse = {
  analysis: {
    tone: "Lekki i flirciarski — rozmowa jest swobodna, z emotkami i żartami.",
    interestLevel: "Wysoki — sama inicjuje wątki i proponuje wspólne wyjście.",
    replyChance: 87,
    redFlags: [
      "Lekko wymijające „zobaczymy” przy propozycji konkretnej daty.",
    ],
    greenFlags: [
      "Sama zaczęła rozmowę i nawiązała do Twojego dnia.",
      "Zaproponowała wspólne wyjście na koncert.",
      "Poprosiła, żebyś napisał w czwartek — zostawia otwarte drzwi.",
    ],
    behaviorInsight:
      "Druga osoba jest wyraźnie zainteresowana, ale nie chce wyjść na zbyt dostępną. „Zobaczymy” to test — sprawdza, czy faktycznie napiszesz w czwartek. Trzymaj lekki ton i dotrzymaj słowa.",
    worthContinuing: true,
    summary:
      "Bardzo dobra dynamika rozmowy. Ona inicjuje, żartuje i zostawia jasny sygnał do kontaktu. Napisz w czwartek z konkretnym planem na piątek.",
  },
  replies: {
    funny:
      "Czwartek? Już ustawiłem 3 budziki i przypomnienie w lodówce. Nie ma opcji, że zapomnę 😄",
    confident:
      "Nie ma „zobaczymy” — piątek 19:00, wybieram miejsce, Ty wybierasz playlistę na drogę.",
    kind: "Jasne, napiszę w czwartek 😊 Miło się z Tobą rozmawia, już nie mogę się doczekać piątku.",
  },
};

/** Sztuczne opóźnienie, aby tryb demo przypominał prawdziwe zapytanie do API. */
export function mockDelay(ms = 1200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
