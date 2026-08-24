/**
 * Kontekst przepływu analizy: Upload → OCR → Analiza → Odpowiedzi.
 * Przechowuje stan bieżącej sesji (zdjęcie, tekst, wynik) pomiędzy ekranami
 * i udostępnia akcje uruchamiające OCR oraz analizę AI.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { analyzeConversation } from "@/services/ai.service";
import { extractTextFromImage } from "@/services/ocr.service";
import { saveRecord } from "@/services/storage.service";
import type { AnalysisRecord } from "@/types/analysis";
import { generateId } from "@/utils/format";

interface AnalysisFlowState {
  /** URI wybranego screenshota */
  imageUri: string | null;
  /** Tekst rozmowy (wynik OCR, edytowalny przez użytkownika) */
  ocrText: string;
  /** Bieżący rekord analizy (po zakończonej analizie AI) */
  record: AnalysisRecord | null;

  /** Ustawia wybrany screenshot i czyści poprzednie wyniki */
  setImage: (uri: string) => void;
  /** Ręczna edycja tekstu rozmowy */
  setOcrText: (text: string) => void;
  /** Uruchamia OCR na wybranym zdjęciu i zapisuje wynik do stanu */
  runOcr: () => Promise<string>;
  /** Uruchamia analizę AI, zapisuje rekord w historii i zwraca go */
  runAnalysis: () => Promise<AnalysisRecord>;
  /** Wczytuje rekord z historii (pełny raport bez ponownej analizy) */
  loadRecord: (record: AnalysisRecord) => void;
  /** Czyści cały stan przepływu (powrót do Home) */
  reset: () => void;
}

const AnalysisFlowContext = createContext<AnalysisFlowState | null>(null);

export function AnalysisFlowProvider({ children }: { children: React.ReactNode }) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [record, setRecord] = useState<AnalysisRecord | null>(null);

  const setImage = useCallback((uri: string) => {
    setImageUri(uri);
    // Nowe zdjęcie = nowa sesja, czyścimy poprzednie wyniki
    setOcrText("");
    setRecord(null);
  }, []);

  const runOcr = useCallback(async () => {
    if (!imageUri) {
      throw new Error("Najpierw wybierz screenshot rozmowy.");
    }
    const text = await extractTextFromImage(imageUri);
    setOcrText(text);
    return text;
  }, [imageUri]);

  const runAnalysis = useCallback(async () => {
    const text = ocrText.trim();
    if (!text) {
      throw new Error("Tekst rozmowy jest pusty. Wróć i dodaj rozmowę.");
    }
    const { analysis, replies } = await analyzeConversation(text);

    const newRecord: AnalysisRecord = {
      id: generateId(),
      createdAt: Date.now(),
      imageUri: imageUri ?? undefined,
      conversationText: text,
      analysis,
      replies,
    };

    // Zapis do historii nie może blokować pokazania wyniku
    saveRecord(newRecord).catch(() => undefined);
    setRecord(newRecord);
    return newRecord;
  }, [imageUri, ocrText]);

  const loadRecord = useCallback((loaded: AnalysisRecord) => {
    setRecord(loaded);
    setOcrText(loaded.conversationText);
    setImageUri(loaded.imageUri ?? null);
  }, []);

  const reset = useCallback(() => {
    setImageUri(null);
    setOcrText("");
    setRecord(null);
  }, []);

  const value = useMemo(
    () => ({ imageUri, ocrText, record, setImage, setOcrText, runOcr, runAnalysis, loadRecord, reset }),
    [imageUri, ocrText, record, setImage, runOcr, runAnalysis, loadRecord, reset]
  );

  return <AnalysisFlowContext.Provider value={value}>{children}</AnalysisFlowContext.Provider>;
}

/** Hook dostępu do przepływu analizy — używaj wewnątrz AnalysisFlowProvider. */
export function useAnalysisFlow(): AnalysisFlowState {
  const context = useContext(AnalysisFlowContext);
  if (!context) {
    throw new Error("useAnalysisFlow musi być użyty wewnątrz AnalysisFlowProvider.");
  }
  return context;
}
