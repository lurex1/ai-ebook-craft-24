import { useLocation, Link } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";

const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Regulamin",
    content: `
## 1. Postanowienia ogólne
1.1. Niniejszy regulamin (dalej: „Regulamin") określa zasady korzystania z aplikacji internetowej Scripto (dalej: „Aplikacja"), dostępnej pod adresem internetowym Aplikacji.

1.2. Właścicielem Aplikacji jest Paveelo — działalność nierejestrowana w rozumieniu art. 5 ust. 1 ustawy z dnia 6 marca 2018 r. — Prawo przedsiębiorców (Dz.U. 2018 poz. 646 ze zm.), z siedzibą: ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola, Polska (dalej: „Usługodawca").

1.3. Kontakt z Usługodawcą: drogą elektroniczną poprzez formularz kontaktowy w Aplikacji.

## 2. Definicje
- **Aplikacja** — serwis internetowy Scripto umożliwiający tworzenie, edycję i eksport e-booków
- **Użytkownik** — osoba fizyczna, która utworzyła konto w Aplikacji
- **Konto** — indywidualne konto Użytkownika w Aplikacji, chronione hasłem
- **Treść** — wszelkie materiały, teksty i e-booki tworzone przez Użytkownika w Aplikacji
- **Usługa** — usługi świadczone drogą elektroniczną przez Usługodawcę

## 3. Rodzaj i zakres usług
3.1. Usługodawca świadczy usługi drogą elektroniczną polegające na: udostępnieniu narzędzi do tworzenia e-booków, generowaniu treści z wykorzystaniem sztucznej inteligencji, eksporcie e-booków do formatów PDF i TXT.

3.2. Korzystanie z Aplikacji wymaga: połączenia z internetem, nowoczesnej przeglądarki internetowej, aktywnego adresu e-mail.

## 4. Rejestracja i konto
4.1. Rejestracja wymaga podania adresu e-mail oraz hasła (min. 8 znaków).

4.2. Użytkownik zobowiązuje się do podania prawdziwych danych i zachowania poufności hasła.

4.3. Użytkownik może w każdej chwili usunąć swoje konto, co skutkuje trwałym usunięciem wszystkich danych.

## 5. Prawa autorskie i własność intelektualna
5.1. Treści wygenerowane przez Użytkownika przy pomocy Aplikacji (w tym z użyciem AI) stanowią własność Użytkownika.

5.2. Aplikacja Scripto, jej interfejs, kod źródłowy oraz znaki towarowe stanowią własność Usługodawcy.

5.3. Użytkownik ponosi pełną odpowiedzialność za treści tworzone w Aplikacji.

## 6. Odpowiedzialność
6.1. Usługodawca nie ponosi odpowiedzialności za: treści generowane przez AI, sposób wykorzystania treści przez Użytkownika, szkody wynikające z przerw technicznych.

6.2. Usługodawca dokłada starań, aby Aplikacja działała prawidłowo i bez przerw.

## 7. Reklamacje
7.1. Reklamacje należy składać drogą elektroniczną.

7.2. Reklamacja powinna zawierać: dane Użytkownika, opis problemu, oczekiwany sposób rozwiązania.

7.3. Usługodawca rozpatrzy reklamację w terminie 14 dni kalendarzowych.

## 8. Odstąpienie od umowy
8.1. Zgodnie z art. 27 ustawy o prawach konsumenta, Użytkownik będący konsumentem ma prawo odstąpienia od umowy w terminie 14 dni bez podania przyczyny.

8.2. Prawo odstąpienia nie przysługuje po pełnym wykonaniu usługi, jeśli Użytkownik wyraził na to zgodę.

## 9. Postanowienia końcowe
9.1. Regulamin wchodzi w życie z dniem publikacji.

9.2. Usługodawca zastrzega sobie prawo do zmian Regulaminu z 14-dniowym wyprzedzeniem. Użytkownicy zostaną powiadomieni o zmianach.

9.3. W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego.

9.4. Spory rozstrzygane będą przez sąd właściwy dla siedziby Usługodawcy.
    `,
  },
  privacy: {
    title: "Polityka prywatności",
    content: `
## 1. Administrator danych osobowych
Administratorem danych osobowych jest Paveelo — działalność nierejestrowana, ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola, Polska (dalej: „Administrator").

## 2. Podstawa prawna przetwarzania
Dane przetwarzane są na podstawie:
- art. 6 ust. 1 lit. a RODO — zgoda Użytkownika
- art. 6 ust. 1 lit. b RODO — wykonanie umowy (świadczenie usług Aplikacji)
- art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes Administratora (bezpieczeństwo, analityka)

## 3. Zakres zbieranych danych
Administrator zbiera następujące dane:
- adres e-mail (do rejestracji i logowania)
- hasło (przechowywane w formie zaszyfrowanej — Administrator nie ma dostępu do haseł)
- dane projektów e-booków (tytuły, treści, ustawienia)
- dane techniczne (adres IP, typ przeglądarki — zbierane automatycznie)

## 4. Cel przetwarzania danych
Dane przetwarzane są w celu:
- świadczenia usług Aplikacji i obsługi konta Użytkownika
- zapewnienia bezpieczeństwa i ochrony przed nadużyciami
- komunikacji z Użytkownikiem (reklamacje, powiadomienia)
- poprawy jakości usług

## 5. Prawa Użytkownika (art. 15-22 RODO)
Użytkownik ma prawo do:
- dostępu do swoich danych osobowych
- sprostowania (poprawiania) danych
- usunięcia danych („prawo do bycia zapomnianym")
- ograniczenia przetwarzania
- przenoszenia danych
- wniesienia sprzeciwu wobec przetwarzania
- cofnięcia zgody w dowolnym momencie
- wniesienia skargi do organu nadzorczego (Prezes UODO, ul. Stawki 2, 00-193 Warszawa)

## 6. Okres przechowywania danych
Dane przechowywane są przez okres korzystania z Aplikacji. Po usunięciu konta dane usuwane są w ciągu 30 dni, z wyjątkiem danych wymaganych przepisami prawa.

## 7. Udostępnianie danych
Dane nie są sprzedawane ani udostępniane podmiotom trzecim w celach marketingowych. Dane mogą być udostępnione wyłącznie:
- dostawcom infrastruktury technicznej (hosting, baza danych) — na podstawie umów powierzenia
- organom państwowym — na podstawie obowiązujących przepisów prawa

## 8. Transfer danych poza EOG
Dane mogą być przetwarzane na serwerach zlokalizowanych poza Europejskim Obszarem Gospodarczym, z zachowaniem odpowiednich zabezpieczeń (standardowe klauzule umowne).

## 9. Bezpieczeństwo danych
Administrator stosuje odpowiednie środki techniczne i organizacyjne w celu ochrony danych, w tym: szyfrowanie SSL/TLS, szyfrowanie haseł, kontrolę dostępu, regularne kopie bezpieczeństwa.

## 10. Zmiany polityki
Administrator zastrzega sobie prawo do zmian niniejszej Polityki. O zmianach Użytkownicy zostaną powiadomieni poprzez Aplikację.
    `,
  },
  cookies: {
    title: "Polityka cookies",
    content: `
## 1. Czym są pliki cookies
Pliki cookies (ciasteczka) to niewielkie pliki tekstowe zapisywane na urządzeniu Użytkownika przez przeglądarkę internetową podczas korzystania z Aplikacji.

## 2. Podstawa prawna
Stosowanie plików cookies odbywa się zgodnie z art. 173 ustawy z dnia 16 lipca 2004 r. — Prawo telekomunikacyjne oraz przepisami RODO.

## 3. Rodzaje stosowanych cookies
- **Niezbędne (sesyjne)** — wymagane do prawidłowego działania Aplikacji, w tym utrzymania sesji logowania. Nie wymagają zgody Użytkownika.
- **Funkcjonalne** — zapamiętują preferencje Użytkownika (np. wybrany szablon, tryb ciemny/jasny).
- **Analityczne** — pomagają zrozumieć sposób korzystania z Aplikacji w celu jej ulepszania. Stosowane wyłącznie za zgodą Użytkownika.

## 4. Okres przechowywania
- Cookies sesyjne — usuwane po zamknięciu przeglądarki
- Cookies trwałe — przechowywane do 365 dni

## 5. Zarządzanie cookies
Użytkownik może zarządzać plikami cookies poprzez ustawienia swojej przeglądarki internetowej:
- Chrome: Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie
- Firefox: Ustawienia → Prywatność i bezpieczeństwo
- Safari: Preferencje → Prywatność
- Edge: Ustawienia → Prywatność

Wyłączenie cookies niezbędnych może uniemożliwić prawidłowe korzystanie z Aplikacji.

## 6. Cookies podmiotów trzecich
Aplikacja może wykorzystywać usługi podmiotów trzecich, które stosują własne pliki cookies (np. dostawcy infrastruktury). Polityki cookies tych podmiotów dostępne są na ich stronach internetowych.

## 7. Kontakt
W sprawach dotyczących plików cookies prosimy o kontakt drogą elektroniczną z Administratorem: Paveelo, ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola, Polska.
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
          <p>© {new Date().getFullYear()} Paveelo · ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola</p>
        </div>
      </footer>
    </div>
  );
}
