import { useCallback, useEffect, useState } from "react";
import { History, Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadGenerationHistory, type GenerationRecord } from "@/lib/generationHistory";
import { useI18n } from "@/lib/i18n";

const actions: Record<string, string> = {
  analyze: "Analiza materiału", structure: "Struktura e-booka", "generate-section": "Treść rozdziału",
  "import-url": "Import strony", "import-youtube": "Import YouTube", cover: "Okładka",
  "generate-illustration": "Ilustracja", "transform-text": "Przekształcenie tekstu",
};

export function GenerationHistory({ userId }: { userId: string }) {
  const { lang } = useI18n();
  const [rows, setRows] = useState<GenerationRecord[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await loadGenerationHistory(userId, page);
      setFailed(Boolean(error));
      setRows(error ? [] : data ?? []);
    } catch { setFailed(true); setRows([]); }
    finally { setLoading(false); }
  }, [userId, page]);
  useEffect(() => { void load(); }, [load]);

  return <section className="mt-10 border-t border-border pt-8" aria-labelledby="generation-history-title">
    <div className="flex items-center justify-between gap-4 mb-5">
      <h2 id="generation-history-title" className="font-display text-xl font-bold flex items-center gap-2">
        <History className="h-5 w-5 text-primary shrink-0" /> Historia generowań
      </h2>
      <Button variant="outline" size="icon" aria-label="Odśwież historię" title="Odśwież historię" onClick={load} disabled={loading}>
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
    {loading ? <div role="status" className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ładowanie historii…</div>
      : failed ? <p role="alert" className="py-8 text-destructive">Historia jest chwilowo niedostępna. Spróbuj odświeżyć później.</p>
      : rows.length === 0 ? <p className="py-8 text-muted-foreground">Brak generowań w historii.</p>
      : <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[580px]">
          <thead className="text-muted-foreground border-b border-border"><tr>
            <th className="py-3 pr-4 font-medium">Data</th><th className="py-3 pr-4 font-medium">Materiał / etap</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 font-medium">Błąd</th>
          </tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-border/50 align-top">
            <td className="py-4 pr-4 whitespace-nowrap"><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString(lang === "en" ? "en-GB" : "pl-PL", { dateStyle: "short", timeStyle: "short" })}</time></td>
            <td className="py-4 pr-4 max-w-sm break-words"><p className="font-medium">{actions[row.action] || "Generowanie AI"}</p><p className="text-muted-foreground mt-1">{row.material}</p></td>
            <td className="py-4 pr-4"><span className={`flex items-center gap-2 whitespace-nowrap ${row.status === "error" ? "text-destructive" : "text-primary"}`}>
              {row.status === "success" ? <CheckCircle2 className="h-4 w-4" /> : row.status === "error" ? <AlertCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
              {row.status === "success" ? "Gotowe" : row.status === "error" ? "Błąd" : "W toku"}
            </span></td><td className="py-4 max-w-xs break-words text-destructive">{row.error || "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    <div className="flex items-center justify-end gap-3 mt-4">
      <Button variant="outline" size="sm" disabled={loading || page === 0} onClick={() => setPage((value) => value - 1)}>Poprzednie</Button>
      <span className="text-sm text-muted-foreground">{page + 1}</span>
      <Button variant="outline" size="sm" disabled={loading || failed || rows.length < 20} onClick={() => setPage((value) => value + 1)}>Następne</Button>
    </div>
  </section>;
}