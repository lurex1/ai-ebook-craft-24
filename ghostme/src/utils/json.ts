/**
 * Pomocnicze funkcje do parsowania JSON zwracanego przez modele AI.
 * Modele potrafią owinąć JSON w blok ```json ... ``` lub dodać komentarz,
 * dlatego wycinamy pierwszy poprawny obiekt z tekstu.
 */

/** Wyciąga i parsuje pierwszy obiekt JSON z tekstu odpowiedzi AI. */
export function extractJson<T>(raw: string): T {
  // Usuwamy ewentualne ogrodzenie markdown (```json ... ```)
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  // Najpierw próbujemy sparsować całość
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Jeśli się nie uda — wycinamy fragment od pierwszego "{" do ostatniego "}"
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Odpowiedź AI nie zawiera poprawnego JSON.");
    }
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  }
}

/** Bezpiecznie ogranicza liczbę do zakresu 0-100 (szansa na odpowiedź). */
export function clampPercent(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return 50;
  return Math.min(100, Math.max(0, Math.round(num)));
}
