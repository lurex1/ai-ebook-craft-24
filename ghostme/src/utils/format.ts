/**
 * Pomocnicze funkcje formatowania — daty, identyfikatory, skracanie tekstu.
 */

/** Generuje unikalny identyfikator rekordu historii. */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Formatuje timestamp na czytelną polską datę, np. "22 lip 2026, 14:30". */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Skraca tekst do podanej długości, dodając wielokropek. */
export function truncate(text: string, maxLength = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}…` : clean;
}
