import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Crown, ArrowLeft, Loader2 } from "lucide-react";

const FREE_FEATURES = [
  "Tworzenie projektu e-booka",
  "Edytor z podglądem na żywo",
  "Podstawowe szablony",
];

const FREE_LIMITATIONS = [
  "Brak generowania AI",
  "Brak eksportu do PDF/EPUB",
  "Brak ilustracji AI",
];

const PRO_FEATURES = [
  "Nielimitowane generowanie AI",
  "Nielimitowane ilustracje AI",
  "Eksport do PDF i EPUB — bez limitu",
  "Wszystkie szablony premium",
  "Priorytetowe generowanie",
  "Wsparcie premium",
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, subscribed, startCheckout, openPortal, loading } = useCredits();

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
            Zacznij za darmo. Ulepsz do Pro, aby odblokować AI i eksport.
          </p>
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
            <ul className="space-y-3 mb-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <ul className="space-y-3 mb-8">
              {FREE_LIMITATIONS.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground/60 line-through">
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

        {/* Pro benefits summary */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Pro = <span className="text-gradient-gold">pełen dostęp</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Jedna subskrypcja odblokowuje wszystkie funkcje: generowanie treści AI, ilustracje, eksport do PDF/EPUB — bez żadnych dodatkowych opłat ani limitów.
          </p>
        </div>
      </main>
    </div>
  );
}
