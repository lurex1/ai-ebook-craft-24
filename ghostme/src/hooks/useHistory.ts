/**
 * Hook historii analiz — ładuje listę z AsyncStorage i odświeża ją
 * przy każdym powrocie na ekran (useFocusEffect).
 */

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { clearHistory, deleteRecord, getHistory } from "@/services/storage.service";
import type { AnalysisRecord } from "@/types/analysis";

export function useHistory() {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setHistory(await getHistory());
    setLoading(false);
  }, []);

  // Odświeżamy listę zawsze, gdy ekran wraca na pierwszy plan
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const removeRecord = useCallback(
    async (id: string) => {
      await deleteRecord(id);
      await refresh();
    },
    [refresh]
  );

  const removeAll = useCallback(async () => {
    await clearHistory();
    await refresh();
  }, [refresh]);

  return { history, loading, refresh, removeRecord, removeAll };
}
