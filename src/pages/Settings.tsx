import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Plug,
} from "lucide-react";

type StatusResult = {
  configured?: boolean;
  ok?: boolean;
  model?: string;
  message?: string;
};

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<StatusResult | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const request = async (body: Record<string, string>): Promise<StatusResult> => {
    try {
      const { data, error } = await supabase.functions.invoke("anthropic-status", { body });
      if (error) return { ok: false, message: "Ustawienia klucza są chwilowo niedostępne. Spróbuj ponownie później." };
      return data as StatusResult;
    } catch {
      return { ok: false, message: "Nie udało się połączyć. Spróbuj ponownie później." };
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const loadStatus = async () => {
    setLoading(true);
    setStatus(await request({ action: "status" }));
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestResult(await request({ action: "test" }));
    setTesting(false);
  };

  const saveKey = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setTestResult(null);
    const result = await request({ action: "save", key: apiKey.trim() });
    setApiKey("");
    setNotice(result.message ?? null);
    if (result.configured !== undefined) setStatus(result);
    setSaving(false);
  };

  const deleteKey = async () => {
    if (!window.confirm("Usunąć osobisty klucz Anthropic?")) return;
    setSaving(true);
    const result = await request({ action: "delete" });
    setNotice(result.message ?? null);
    setTestResult(null);
    if (result.configured !== undefined) setStatus(result);
    setSaving(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Wróć
            </Link>
          </Button>
          <h1 className="font-display text-lg font-bold text-foreground">Ustawienia konta</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <section className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground mb-1">Konto</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </section>

        <section className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Twój klucz API Anthropic
              </h2>
              <p className="text-sm text-muted-foreground">
                 Osobisty klucz jest szyfrowany i przypisany wyłącznie do Twojego konta.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-background p-4 mb-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Sprawdzam status…
              </div>
            ) : status?.configured ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-foreground">Klucz zapisany</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-foreground">{status?.message || "Brak osobistego klucza"}</span>
              </div>
            )}
          </div>

          <form onSubmit={saveKey} className="space-y-3 mb-5">
            <Label htmlFor="anthropic-key">ANTHROPIC_API_KEY</Label>
            <Input id="anthropic-key" name="anthropic-key" type="password" autoComplete="off" spellCheck={false}
              value={apiKey} onChange={(event) => setApiKey(event.target.value)}
              placeholder={status?.configured ? "Wprowadź nowy klucz" : "Wprowadź klucz Anthropic"}
              required minLength={20} maxLength={4096} pattern="sk-ant-[A-Za-z0-9_-]+" disabled={saving || testing} />
            <Button type="submit" disabled={saving || testing || !apiKey.trim()} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {status?.configured ? "Zastąp klucz" : "Zapisz klucz"}
            </Button>
          </form>
          {notice && <p role="status" className="mb-4 text-sm text-foreground">{notice}</p>}
          <div className="flex flex-wrap gap-3">
            <Button onClick={runTest} disabled={testing || loading || saving || !status?.configured} className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              Testuj połączenie
            </Button>
            <Button variant="outline" onClick={loadStatus} disabled={loading || saving || testing} className="gap-2">
              Odśwież status
            </Button>
            {status?.configured && <Button variant="destructive" onClick={deleteKey} disabled={saving || testing || loading}>Usuń klucz</Button>}
          </div>

          {testResult && (
            <div
              className={`mt-4 rounded-lg border p-4 text-sm ${
                testResult.ok
                   ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {testResult.ok ? "Połączenie działa" : "Połączenie nieudane"}
                  </p>
                  <p className="opacity-90">{testResult.message}</p>
                  {testResult.model && (
                    <p className="font-mono text-xs opacity-80 mt-1">model: {testResult.model}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
               Zapisany klucz nie jest wyświetlany. Test połączenia wykonuje krótkie zapytanie rozliczane na Twoim koncie Anthropic.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
