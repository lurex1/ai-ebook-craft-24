import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, Rocket, Globe, ShieldCheck, Sparkles, TrendingUp, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: Rocket,
    title: "Publikuj jednym klikiem",
    desc: "Twój e-book gotowy do sprzedaży w kilka sekund. Bez skomplikowanych procesów.",
  },
  {
    icon: Globe,
    title: "Globalny zasięg",
    desc: "Dotarj do czytelników na całym świecie dzięki zoptymalizowanej dystrybucji.",
  },
  {
    icon: ShieldCheck,
    title: "Ochrona praw autorskich",
    desc: "Każdy e-book chroniony znakiem wodnym i zabezpieczeniami DRM.",
  },
  {
    icon: TrendingUp,
    title: "Analityka sprzedaży",
    desc: "Śledź pobrania, przychody i zachowania czytelników w czasie rzeczywistym.",
  },
  {
    icon: Users,
    title: "Buduj społeczność",
    desc: "Zbieraj e-maile, opinie i buduj bazę lojalnych czytelników.",
  },
  {
    icon: Sparkles,
    title: "AI Marketing",
    desc: "Generuj opisy, tagline'y i materiały promocyjne z pomocą AI.",
  },
];

const STEPS = [
  { num: "01", title: "Stwórz e-book", desc: "Użyj edytora Scripto z AI do napisania treści." },
  { num: "02", title: "Dostosuj wygląd", desc: "Wybierz szablon, dodaj okładkę i formatowanie." },
  { num: "03", title: "Opublikuj", desc: "Kliknij publikuj i udostępnij światu." },
];

const TESTIMONIALS = [
  { name: "Anna K.", role: "Autorka poradników", text: "Scripto zmienił sposób, w jaki tworzę e-booki. Publikacja zajmuje minuty, nie dni.", stars: 5 },
  { name: "Marek W.", role: "Coach biznesowy", text: "Wreszcie narzędzie, które łączy pisanie i publikację w jednym miejscu.", stars: 5 },
  { name: "Kasia L.", role: "Blogerka", text: "AI pomogło mi stworzyć profesjonalny e-book bez doświadczenia w pisaniu.", stars: 5 },
];

export default function Publish() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground gap-2">
            <ArrowLeft className="h-4 w-4" /> Powrót
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Scripto</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-40 right-1/4 w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
        <div className="absolute top-60 left-1/3 w-3 h-3 rounded-full bg-accent/30 animate-pulse delay-700" />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse delay-1000" />

        <div className="mx-auto max-w-5xl px-6 py-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Nowa funkcja</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Publikuj swoje<br />
            <span className="text-gradient-gold">e-booki</span> ze Scripto
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Od pomysłu do publikacji — wszystko w jednym miejscu. 
            Twórz, formatuj i udostępniaj profesjonalne e-booki bez wysiłku.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate("/new")}
              className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2 h-12 px-8 text-base shadow-gold"
            >
              <Rocket className="h-5 w-5" /> Zacznij publikować
            </Button>
            <Button
              onClick={() => navigate("/pricing")}
              variant="outline"
              className="h-12 px-8 text-base border-border/50"
            >
              Zobacz cennik
            </Button>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-4">
          Jak to <span className="text-gradient-gold">działa?</span>
        </h2>
        <p className="text-muted-foreground text-center max-w-lg mx-auto mb-16">
          Trzy proste kroki dzielą Cię od publikacji Twojego e-booka.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative group">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent -translate-x-8" />
              )}
              <div className="bg-card border border-border/50 rounded-2xl p-8 hover:border-primary/30 hover:shadow-gold transition-all">
                <span className="font-display text-5xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">{step.num}</span>
                <h3 className="font-display text-xl font-bold text-foreground mt-4 mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-card/50" />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-4">
            Wszystko, czego <span className="text-gradient-gold">potrzebujesz</span>
          </h2>
          <p className="text-muted-foreground text-center max-w-lg mx-auto mb-16">
            Kompletne narzędzie do tworzenia i dystrybucji e-booków.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 hover:shadow-gold transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-4">
          Zaufali <span className="text-gradient-gold">nam</span>
        </h2>
        <p className="text-muted-foreground text-center max-w-lg mx-auto mb-16">
          Sprawdź, co mówią nasi użytkownicy.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-card border border-border/50 rounded-2xl p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-primary fill-primary" />
                ))}
              </div>
              <p className="text-foreground text-sm mb-4 italic leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Gotowy na <span className="text-gradient-gold">publikację?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Dołącz do twórców, którzy już publikują swoje e-booki ze Scripto. Zacznij za darmo.
          </p>
          <Button
            onClick={() => navigate("/new")}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2 h-14 px-10 text-lg shadow-gold"
          >
            <Rocket className="h-5 w-5" /> Stwórz e-book za darmo
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Paveelo</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-primary transition-colors">Regulamin</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Polityka prywatności</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
