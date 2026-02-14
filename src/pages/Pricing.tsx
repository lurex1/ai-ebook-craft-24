import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Crown, Zap, ArrowLeft, Loader2 } from "lucide-react";

const FREE_FEATURES = [
  "5 stron e-booka",
  "1 wygenerowany obraz",
  "50 kredytów miesięcznie",
  "Eksport do PDF",
  "Podstawowe szablony",
];

const PRO_FEATURES = [
  "Nielimitowane strony",
  "Nielimitowane obrazy",
  "1000 kredytów miesięcznie",
  "Eksport do PDF i EPUB",
  "Wszystkie szablony",
  "Priorytetowe generowanie AI",
  "Wsparcie premium",
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, subscribed, startCheckout, openPortal, loading, remainingCredits, totalCredits } = useCredits();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground gap-2">
              <ArrowLeft className="h-4 w-4" /> Powrót
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Scripto</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">
            Wybierz swój <span className="text-gradient-gold">plan</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Zacznij za darmo. Ulepsz, gdy potrzebujesz więcej mocy.
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-card border border-border/50 rounded-lg px-4 py-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Pozostało kredytów:</span>
              <span className="font-bold text-foreground">{remainingCredits} / {totalCredits}</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free plan */}
          <div className={`relative bg-card border rounded-2xl p-8 transition-all ${plan === "free" && user ? "border-primary/50 shadow-gold" : "border-border/50"}`}>
            {plan === "free" && user && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                Twój plan
              </div>
            )}
            <h3 className="font-display text-2xl font-bold text-foreground mb-1">Free</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-4xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground text-sm">/miesiąc</span>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {!user ? (
              <Button onClick={() => navigate("/auth")} variant="outline" className="w-full">
                Zacznij za darmo
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                {plan === "free" ? "Aktualny plan" : "Plan darmowy"}
              </Button>
            )}
          </div>

          {/* Pro plan */}
          <div className={`relative bg-card border rounded-2xl p-8 transition-all ${plan === "pro" && user ? "border-primary/50 shadow-gold" : "border-border/50"} ring-2 ring-primary/20`}>
            {plan === "pro" && user ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Crown className="h-3 w-3" /> Twój plan
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Crown className="h-3 w-3" /> Popularne
              </div>
            )}
            <h3 className="font-display text-2xl font-bold text-foreground mb-1">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-4xl font-bold text-foreground">$7.99</span>
              <span className="text-muted-foreground text-sm">/miesiąc</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {!user ? (
              <Button onClick={() => navigate("/auth")} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                Zacznij Pro
              </Button>
            ) : subscribed ? (
              <Button onClick={openPortal} variant="outline" className="w-full">
                Zarządzaj subskrypcją
              </Button>
            ) : (
              <Button onClick={startCheckout} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                Ulepsz do Pro
              </Button>
            )}
          </div>
        </div>

        {/* Credits table */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-6">
            System <span className="text-gradient-gold">kredytów</span>
          </h2>
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Akcja</th>
                  <th className="text-right px-6 py-3 text-muted-foreground font-medium">Koszt</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/30">
                  <td className="px-6 py-3 text-foreground">Generowanie strony AI</td>
                  <td className="px-6 py-3 text-foreground text-right">10 kredytów</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="px-6 py-3 text-foreground">Generowanie obrazu</td>
                  <td className="px-6 py-3 text-foreground text-right">20 kredytów</td>
                </tr>
                <tr className="border-b border-border/30">
                  <td className="px-6 py-3 text-foreground">Eksport do PDF</td>
                  <td className="px-6 py-3 text-foreground text-right">50 kredytów</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-foreground">Korekta AI (przepisanie)</td>
                  <td className="px-6 py-3 text-foreground text-right">5 kredytów</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
