import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
  masked?: string | null;
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

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const loadStatus = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("anthropic-status", {
      body: { action: "status" },
    });
    setStatus(error ? { configured: false, message: error.message } : (data as StatusResult));
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const { data, error } = await supabase.functions.invoke("anthropic-status", {
      body: { action: "test" },
    });
    setTestResult(
      error ? { ok: false, message: error.message } : (data as StatusResult)
    );
    setTesting(false);
  };

  if (authLoading) {
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
                Klucz API Anthropic
              </h2>
              <p className="text-sm text-muted-foreground">
                Klucz jest przechowywany wyłącznie po stronie backendu jako zaszyfrowany sekret —
                nigdy nie trafia do przeglądarki ani do kodu aplikacji.
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
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-foreground">Klucz zapisany</span>
                <span className="font-mono text-xs text-muted-foreground">{status.masked}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-foreground">Brak zapisanego klucza</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={runTest} disabled={testing || loading} className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              Testuj połączenie
            </Button>
            <Button variant="outline" onClick={loadStatus} disabled={loading} className="gap-2">
              Odśwież status
            </Button>
          </div>

          {testResult && (
            <div
              className={`mt-4 rounded-lg border p-4 text-sm ${
                testResult.ok
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
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
              Aby dodać lub zmienić klucz, poproś o to w czacie — otworzy się bezpieczny formularz,
              w którym wpiszesz wartość klucza. Klucz nigdy nie jest wyświetlany po zapisaniu.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
