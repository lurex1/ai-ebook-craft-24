import { useLocation, Link } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";

const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Regulamin",
    content: `
## 1. Postanowienia ogólne
Niniejszy regulamin określa zasady korzystania z aplikacji Scripto, należącej do firmy Paveelo, prowadzonej przez Pawła Eberle w ramach działalności nierejestrowanej zgodnie z prawem polskim.

## 2. Definicje
- **Aplikacja** — serwis internetowy Scripto dostępny pod adresem aplikacji
- **Użytkownik** — osoba korzystająca z Aplikacji
- **Usługodawca** — Paweł Eberle, ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola

## 3. Warunki korzystania
Korzystanie z Aplikacji jest możliwe po utworzeniu konta. Użytkownik zobowiązuje się do podania prawdziwych danych. Zabronione jest korzystanie z Aplikacji w sposób niezgodny z prawem.

## 4. Prawa autorskie
Treści wygenerowane przez Użytkownika przy pomocy AI stanowią własność Użytkownika. Aplikacja Scripto oraz jej kod źródłowy stanowią własność Usługodawcy.

## 5. Odpowiedzialność
Usługodawca nie ponosi odpowiedzialności za treści generowane przez AI ani za szkody wynikające z korzystania z Aplikacji. Usługodawca dokłada starań, aby Aplikacja działała prawidłowo.

## 6. Reklamacje
Reklamacje należy zgłaszać drogą elektroniczną. Usługodawca rozpatrzy reklamację w ciągu 14 dni roboczych.

## 7. Postanowienia końcowe
Regulamin wchodzi w życie z dniem publikacji. Usługodawca zastrzega sobie prawo do zmian regulaminu z 14-dniowym wyprzedzeniem.
    `,
  },
  privacy: {
    title: "Polityka prywatności",
    content: `
## 1. Administrator danych
Administratorem danych osobowych jest Paweł Eberle, prowadzący firmę nierejestrowaną Paveelo, ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola, Polska.

## 2. Zakres zbieranych danych
Zbieramy: adres e-mail, hasło (zaszyfrowane), dane projektów e-booków tworzone przez Użytkownika.

## 3. Cel przetwarzania
Dane przetwarzamy w celu: świadczenia usług Aplikacji, komunikacji z Użytkownikiem, poprawy jakości usług.

## 4. Podstawa prawna
Przetwarzanie odbywa się na podstawie: zgody Użytkownika (art. 6 ust. 1 lit. a RODO), wykonania umowy (art. 6 ust. 1 lit. b RODO).

## 5. Prawa użytkownika
Użytkownik ma prawo do: wglądu w swoje dane, ich poprawiania, usunięcia, przenoszenia, ograniczenia przetwarzania, wniesienia sprzeciwu.

## 6. Okres przechowywania
Dane przechowywane są przez okres korzystania z Aplikacji oraz 30 dni po usunięciu konta.

## 7. Udostępnianie danych
Dane nie są udostępniane osobom trzecim z wyjątkiem sytuacji wymaganych prawem.
    `,
  },
  cookies: {
    title: "Polityka cookies",
    content: `
## 1. Czym są cookies
Cookies to niewielkie pliki tekstowe zapisywane na urządzeniu Użytkownika podczas korzystania z Aplikacji.

## 2. Rodzaje cookies
- **Niezbędne** — wymagane do prawidłowego działania Aplikacji (sesja logowania)
- **Funkcjonalne** — zapamiętują preferencje Użytkownika
- **Analityczne** — pomagają zrozumieć sposób korzystania z Aplikacji

## 3. Zarządzanie cookies
Użytkownik może zarządzać cookies poprzez ustawienia przeglądarki. Wyłączenie cookies niezbędnych może uniemożliwić korzystanie z Aplikacji.

## 4. Cookies podmiotów trzecich
Aplikacja może korzystać z cookies dostawców usług analitycznych w celu poprawy jakości usług.

## 5. Kontakt
W sprawach cookies prosimy o kontakt z administratorem: Paweł Eberle, ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola.
    `,
  },
};

export default function Legal() {
  const location = useLocation();
  const type = location.pathname.replace("/", "") || "terms";
  const page = LEGAL_CONTENT[type] || LEGAL_CONTENT.terms;

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Scripto</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Powrót
        </Link>
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">{page.title}</h1>
        <div className="prose prose-invert prose-sm max-w-none text-secondary-foreground [&_h2]:font-display [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-3 [&_li]:mb-1">
          {page.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) return <h2 key={i}>{line.replace("## ", "")}</h2>;
            if (line.startsWith("- ")) return <p key={i} className="pl-4">{line}</p>;
            if (line.trim()) return <p key={i}>{line}</p>;
            return null;
          })}
        </div>
      </main>
      <footer className="border-t border-border/30 px-6 py-6 mt-10">
        <div className="mx-auto max-w-3xl text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Paveelo · Paweł Eberle · ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola</p>
        </div>
      </footer>
    </div>
  );
}
