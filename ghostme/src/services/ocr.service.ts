/**
 * Serwis OCR — odczytuje tekst rozmowy ze screenshota.
 * Wykorzystuje wizję modelu Claude (obraz przesyłany jako base64).
 * W trybie DEMO (brak klucza API) zwraca przykładową rozmowę.
 */

import * as FileSystem from "expo-file-system";

import { AI_CONFIG, isDemoMode } from "./config";
import { AiError, askClaude } from "./anthropicClient";
import { MOCK_OCR_TEXT, mockDelay } from "@/utils/mockData";

const OCR_PROMPT = `Odczytaj tekst rozmowy z załączonego screenshota (Messenger, Instagram, WhatsApp lub SMS).

Zasady:
- Zwróć wyłącznie treść rozmowy, wiadomość po wiadomości, każda w nowej linii.
- Oznacz nadawców: wiadomości właściciela telefonu (zwykle po prawej) jako "Ja:", a drugiej osoby jako "Ona:" lub "On:" (jeśli nie da się określić płci, użyj "Druga osoba:").
- Zachowaj emotki i oryginalną pisownię.
- Pomiń elementy interfejsu (godziny, statusy, nazwy przycisków).
- Jeśli na obrazie nie ma rozmowy, zwróć dokładnie: BRAK_ROZMOWY`;

/** Typ MIME obrazu na podstawie rozszerzenia pliku (screenshoty to zwykle PNG). */
function mediaTypeFromUri(uri: string): "image/png" | "image/jpeg" | "image/webp" {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/**
 * Odczytuje tekst rozmowy ze screenshota pod wskazanym URI.
 * Rzuca AiError z czytelnym komunikatem, gdy odczyt się nie powiedzie.
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  // Tryb demo — zwracamy przykładową rozmowę bez wywołania API
  if (isDemoMode()) {
    await mockDelay(1500);
    return MOCK_OCR_TEXT;
  }

  // Konwertujemy lokalny plik na base64, aby przesłać go do modelu
  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    throw new AiError("Nie udało się odczytać pliku ze zdjęciem. Wybierz je ponownie.");
  }

  const text = await askClaude(
    [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaTypeFromUri(imageUri),
          data: base64,
        },
      },
      { type: "text", text: OCR_PROMPT },
    ],
    AI_CONFIG.visionModel
  );

  const trimmed = text.trim();
  if (!trimmed || trimmed.includes("BRAK_ROZMOWY")) {
    throw new AiError(
      "Nie znaleziono rozmowy na tym zdjęciu. Dodaj screenshot z widoczną konwersacją."
    );
  }
  return trimmed;
}
