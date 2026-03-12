import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "pl" | "en";

const translations = {
  // ─── Common ───
  "common.back": { pl: "Powrót", en: "Back" },
  "common.save": { pl: "Zapisz", en: "Save" },
  "common.cancel": { pl: "Anuluj", en: "Cancel" },
  "common.delete": { pl: "Usuń", en: "Delete" },
  "common.loading": { pl: "Ładowanie...", en: "Loading..." },
  "common.error": { pl: "Błąd", en: "Error" },
  "common.success": { pl: "Sukces", en: "Success" },
  "common.month": { pl: "/miesiąc", en: "/month" },
  "common.yourPlan": { pl: "Twój plan", en: "Your plan" },

  // ─── Auth ───
  "auth.login": { pl: "Logowanie", en: "Login" },
  "auth.register": { pl: "Rejestracja", en: "Register" },
  "auth.forgotPassword": { pl: "Resetuj hasło", en: "Reset password" },
  "auth.newPassword": { pl: "Nowe hasło", en: "New password" },
  "auth.email": { pl: "Email", en: "Email" },
  "auth.password": { pl: "Hasło (min. 8 znaków)", en: "Password (min. 8 chars)" },
  "auth.newPasswordPlaceholder": { pl: "Nowe hasło (min. 8 znaków)", en: "New password (min. 8 chars)" },
  "auth.confirmPassword": { pl: "Potwierdź hasło", en: "Confirm password" },
  "auth.loginBtn": { pl: "Zaloguj się", en: "Log in" },
  "auth.registerBtn": { pl: "Zarejestruj się", en: "Sign up" },
  "auth.sendLink": { pl: "Wyślij link", en: "Send link" },
  "auth.setNewPassword": { pl: "Ustaw nowe hasło", en: "Set new password" },
  "auth.forgotBtn": { pl: "Zapomniałeś hasła?", en: "Forgot password?" },
  "auth.backToLogin": { pl: "Wróć do logowania", en: "Back to login" },
  "auth.forgotDesc": { pl: "Podaj email — wyślemy Ci link do resetowania hasła.", en: "Enter your email — we'll send you a reset link." },
  "auth.resetDesc": { pl: "Ustaw nowe hasło dla swojego konta.", en: "Set a new password for your account." },
  "auth.checkEmail": { pl: "Sprawdź email", en: "Check your email" },
  "auth.verifyLink": { pl: "Wysłaliśmy link weryfikacyjny na Twój adres email.", en: "We sent a verification link to your email." },
  "auth.resetLink": { pl: "Wysłaliśmy link do resetowania hasła.", en: "We sent a password reset link." },
  "auth.passwordChanged": { pl: "Hasło zostało zmienione. Możesz się zalogować.", en: "Password changed. You can now log in." },
  "auth.passwordMinError": { pl: "Hasło musi mieć minimum 8 znaków.", en: "Password must be at least 8 characters." },
  "auth.passwordMismatch": { pl: "Hasła nie są identyczne.", en: "Passwords don't match." },
  "auth.subtitle": { pl: "Profesjonalny kreator e-booków", en: "Professional ebook creator" },

  // ─── Dashboard ───
  "dash.createPro": { pl: "Twórz profesjonalne e-booki", en: "Create professional ebooks" },
  "dash.heroDesc": { pl: "Wgraj materiały, wybierz strukturę i pozwól AI wygenerować treść. Edytuj, formatuj i eksportuj w kilka minut.", en: "Upload materials, choose a structure, and let AI generate the content. Edit, format and export in minutes." },
  "dash.createNew": { pl: "Utwórz nowy e-book", en: "Create new ebook" },
  "dash.yourProjects": { pl: "Twoje projekty", en: "Your projects" },
  "dash.ebooks": { pl: "e-booków", en: "ebooks" },
  "dash.newProject": { pl: "Nowy projekt", en: "New project" },
  "dash.noProjects": { pl: "Brak projektów", en: "No projects" },
  "dash.createFirst": { pl: "Utwórz swój pierwszy e-book", en: "Create your first ebook" },
  "dash.duplicated": { pl: "Zduplikowano projekt", en: "Project duplicated" },
  "dash.confirmDelete": { pl: "Czy na pewno chcesz usunąć ten projekt?", en: "Are you sure you want to delete this project?" },
  "dash.logout": { pl: "Wyloguj", en: "Log out" },
  "dash.pricing": { pl: "Cennik", en: "Pricing" },
  "dash.selectEdit": { pl: "Zaznacz i edytuj", en: "Select & edit" },
  "dash.selectEditDesc": { pl: "Intuicyjna edycja — wystarczy zaznaczyć tekst", en: "Intuitive editing — just select text" },
  "dash.selectEditLong": { pl: "Zaznacz dowolny fragment tekstu w edytorze, a natychmiast pojawi się pływający toolbar z zestawem narzędzi. Bez menu, bez szukania opcji — wszystko pod kursorem.", en: "Select any text in the editor and a floating toolbar with tools appears instantly. No menus, no searching — everything right at your cursor." },
  "dash.aiTransforms": { pl: "AI transformacje", en: "AI transforms" },
  "dash.aiTransformsDesc": { pl: "Zamień w tabelę, listę, uprość lub rozwiń treść", en: "Convert to table, list, simplify or expand" },
  "dash.extractBlock": { pl: "Wyciągnij do bloku", en: "Extract to block" },
  "dash.extractBlockDesc": { pl: "Utwórz osobny blok z zaznaczonego fragmentu", en: "Create a separate block from selection" },
  "dash.colorsHighlight": { pl: "Kolory i podświetlenie", en: "Colors & highlight" },
  "dash.colorsHighlightDesc": { pl: "Zmień kolor tekstu lub dodaj podświetlenie", en: "Change text color or add highlighting" },
  "dash.generateGraphic": { pl: "Generuj grafikę", en: "Generate graphic" },
  "dash.generateGraphicDesc": { pl: "AI wygeneruje obraz na podstawie zaznaczenia", en: "AI generates an image based on selection" },
  "dash.terms": { pl: "Regulamin", en: "Terms" },
  "dash.privacy": { pl: "Polityka prywatności", en: "Privacy policy" },
  "dash.cookies": { pl: "Cookies", en: "Cookies" },
  "dash.copy": { pl: "(kopia)", en: "(copy)" },

  // ─── Editor ───
  "editor.saving": { pl: "Zapisuję...", en: "Saving..." },
  "editor.saved": { pl: "Zapisano", en: "Saved" },
  "editor.unsaved": { pl: "Niezapisane", en: "Unsaved" },
  "editor.new": { pl: "Nowy", en: "New" },
  "editor.generateAI": { pl: "Generuj treści AI", en: "Generate AI content" },
  "editor.generating": { pl: "Generuję", en: "Generating" },
  "editor.import": { pl: "Import", en: "Import" },
  "editor.cover": { pl: "Okładka", en: "Cover" },
  "editor.flipbook": { pl: "Flipbook", en: "Flipbook" },
  "editor.export": { pl: "Eksport", en: "Export" },
  "editor.chapter": { pl: "Rozdział", en: "Chapter" },
  "editor.insert": { pl: "Wstaw", en: "Insert" },
  "editor.afterBlock": { pl: " po bloku", en: " after block" },
  "editor.heading": { pl: "Nagłówek", en: "Heading" },
  "editor.text": { pl: "Tekst", en: "Text" },
  "editor.image": { pl: "Obraz", en: "Image" },
  "editor.spacer": { pl: "Odstęp", en: "Spacer" },
  "editor.pageBreak": { pl: "Podział strony", en: "Page break" },
  "editor.page": { pl: "strona", en: "page" },
  "editor.pages2to4": { pl: "strony", en: "pages" },
  "editor.pages5plus": { pl: "stron", en: "pages" },
  "editor.cost": { pl: "Koszt", en: "Cost" },
  "editor.emptyPage": { pl: "Pusta strona — użyj paska powyżej lub kliknij + między blokami", en: "Empty page — use toolbar above or click + between blocks" },
  "editor.onlyHeadings": { pl: "Ten rozdział ma tylko nagłówki", en: "This chapter only has headings" },
  "editor.generateContentAI": { pl: "Generuj treść AI", en: "Generate AI content" },
  "editor.selectChapter": { pl: "Wybierz rozdział z listy po lewej", en: "Select a chapter from the left panel" },
  "editor.resetPosition": { pl: "Resetuj pozycję", en: "Reset position" },

  // ─── Toolbar ───
  "toolbar.textColor": { pl: "Kolor tekstu", en: "Text color" },
  "toolbar.highlight": { pl: "Podświetlenie", en: "Highlight" },
  "toolbar.replaceText": { pl: "Zastąp tekst", en: "Replace text" },
  "toolbar.aiTransforms": { pl: "Transformacje AI", en: "AI transforms" },
  "toolbar.extractBlock": { pl: "Wyciągnij do osobnego bloku", en: "Extract to separate block" },
  "toolbar.block": { pl: "Blok", en: "Block" },
  "toolbar.graphic": { pl: "Grafika", en: "Graphic" },
  "toolbar.generateGraphic": { pl: "Generuj grafikę AI", en: "Generate AI graphic" },
  "toolbar.replaceSelected": { pl: "Zastąp zaznaczony tekst:", en: "Replace selected text:" },
  "toolbar.typePlaceholder": { pl: "Wpisz nowy tekst...", en: "Type new text..." },
  "toolbar.replace": { pl: "Zastąp", en: "Replace" },
  "toolbar.processingAI": { pl: "Przetwarzam AI...", en: "Processing AI..." },
  "toolbar.convert": { pl: "Konwertuj", en: "Convert" },
  "toolbar.toTable": { pl: "Zamień na tabelę", en: "Convert to table" },
  "toolbar.toBullets": { pl: "Zamień na wypunktowanie", en: "Convert to bullet list" },
  "toolbar.difficulty": { pl: "Poziom trudności", en: "Difficulty level" },
  "toolbar.simple": { pl: "Wersja prosta", en: "Simple version" },
  "toolbar.medium": { pl: "Wersja średnia", en: "Medium version" },
  "toolbar.advanced": { pl: "Wersja zaawansowana", en: "Advanced version" },
  "toolbar.aiError": { pl: "Błąd AI", en: "AI error" },
  "toolbar.aiErrorDesc": { pl: "Nie udało się przetworzyć tekstu. Sprawdź kredyty AI w Settings → Workspace → Usage.", en: "Failed to process text. Check AI credits in Settings → Workspace → Usage." },
  "toolbar.unexpectedError": { pl: "Wystąpił nieoczekiwany błąd.", en: "An unexpected error occurred." },

  // ─── Pricing ───
  "pricing.choosePlan": { pl: "Wybierz swój plan", en: "Choose your plan" },
  "pricing.startFreeUpgrade": { pl: "Zacznij za darmo. Ulepsz do Pro, aby odblokować AI i eksport.", en: "Start for free. Upgrade to Pro to unlock AI and export." },
  "pricing.freeCreate": { pl: "Tworzenie projektu e-booka", en: "Ebook project creation" },
  "pricing.freeEditor": { pl: "Edytor z podglądem na żywo", en: "Editor with live preview" },
  "pricing.freeTemplates": { pl: "Podstawowe szablony", en: "Basic templates" },
  "pricing.noAI": { pl: "Brak generowania AI", en: "No AI generation" },
  "pricing.noExport": { pl: "Brak eksportu do PDF/EPUB", en: "No PDF/EPUB export" },
  "pricing.noIllustrations": { pl: "Brak ilustracji AI", en: "No AI illustrations" },
  "pricing.unlimitedAI": { pl: "Nielimitowane generowanie AI", en: "Unlimited AI generation" },
  "pricing.unlimitedIllustrations": { pl: "Nielimitowane ilustracje AI", en: "Unlimited AI illustrations" },
  "pricing.unlimitedExport": { pl: "Eksport do PDF i EPUB — bez limitu", en: "Unlimited PDF and EPUB export" },
  "pricing.premiumTemplates": { pl: "Wszystkie szablony premium", en: "All premium templates" },
  "pricing.priorityGen": { pl: "Priorytetowe generowanie", en: "Priority generation" },
  "pricing.premiumSupport": { pl: "Wsparcie premium", en: "Premium support" },
  "pricing.startFree": { pl: "Zacznij za darmo", en: "Start for free" },
  "pricing.currentPlan": { pl: "Aktualny plan", en: "Current plan" },
  "pricing.freePlan": { pl: "Plan darmowy", en: "Free plan" },
  "pricing.startPro": { pl: "Zacznij Pro", en: "Start Pro" },
  "pricing.manageSub": { pl: "Zarządzaj subskrypcją", en: "Manage subscription" },
  "pricing.upgradePro": { pl: "Ulepsz do Pro", en: "Upgrade to Pro" },
  "pricing.popular": { pl: "Popularne", en: "Popular" },
  "pricing.fullAccess": { pl: "pełen dostęp", en: "full access" },
  "pricing.fullAccessDesc": { pl: "Jedna subskrypcja odblokowuje wszystkie funkcje: generowanie treści AI, ilustracje, eksport do PDF/EPUB — bez żadnych dodatkowych opłat ani limitów.", en: "One subscription unlocks all features: AI content generation, illustrations, PDF/EPUB export — no extra fees or limits." },

  // ─── New Project ───
  "newProject.title": { pl: "Nowy e-book", en: "New ebook" },
  "newProject.back": { pl: "Wstecz", en: "Back" },
  "newProject.uploadMaterials": { pl: "Wrzuć materiały", en: "Upload materials" },
  "newProject.uploadDesc": { pl: "Dodaj pliki, wklej tekst, podaj linki — AI przeanalizuje i zaproponuje strukturę e-booka.", en: "Add files, paste text, provide links — AI will analyze and suggest an ebook structure." },
  "newProject.uploadFiles": { pl: "Wgraj pliki", en: "Upload files" },
  "newProject.pasteText": { pl: "Wklej tekst", en: "Paste text" },
  "newProject.addLink": { pl: "Dodaj link", en: "Add link" },
  "newProject.addMaterials": { pl: "Dodaj materiały", en: "Add materials" },
  "newProject.addMaterialsDesc": { pl: "Wrzuć pliki, wklej tekst lub wpisz prompt.", en: "Upload files, paste text, or enter a prompt." },
  "newProject.analyzeAI": { pl: "Analizuj z AI", en: "Analyze with AI" },
  "newProject.analyzing": { pl: "Analizuję...", en: "Analyzing..." },
  "newProject.projectCreated": { pl: "Projekt utworzony!", en: "Project created!" },
  "newProject.allSectionsHaveContent": { pl: "Wszystkie sekcje mają już treść", en: "All sections already have content" },
  "newProject.generatedAll": { pl: "Wygenerowano treść dla wszystkich sekcji!", en: "Generated content for all sections!" },
  "newProject.generateError": { pl: "Błąd generowania", en: "Generation error" },
  "newProject.analysisError": { pl: "Błąd analizy", en: "Analysis error" },

  // ─── Cookies Banner ───
  "cookies.message": { pl: "Używamy plików cookies, aby zapewnić Ci najlepsze doświadczenia. Niezbędne cookies są wymagane do działania aplikacji.", en: "We use cookies to provide you with the best experience. Essential cookies are required for the app to work." },
  "cookies.accept": { pl: "Akceptuję", en: "Accept" },
  "cookies.settings": { pl: "Ustawienia", en: "Settings" },
  "cookies.privacy": { pl: "Polityka prywatności", en: "Privacy policy" },
  "cookies.necessary": { pl: "Niezbędne", en: "Necessary" },
  "cookies.analytics": { pl: "Analityczne", en: "Analytics" },
  "cookies.functional": { pl: "Funkcjonalne", en: "Functional" },
  "cookies.necessaryDesc": { pl: "Wymagane do działania aplikacji — nie można wyłączyć", en: "Required for the app to function — cannot be disabled" },
  "cookies.analyticsDesc": { pl: "Pomagają nam zrozumieć, jak użytkownicy korzystają z aplikacji", en: "Help us understand how users interact with the app" },
  "cookies.functionalDesc": { pl: "Zapamiętują Twoje preferencje (np. język, motyw)", en: "Remember your preferences (e.g. language, theme)" },
  "cookies.save": { pl: "Zapisz preferencje", en: "Save preferences" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "pl",
  setLang: () => {},
  t: (key) => translations[key]?.pl || key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("app-lang");
    return (saved === "en" || saved === "pl") ? saved : "pl";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("app-lang", l);
  };

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry.pl || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "pl" ? "en" : "pl")}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      title={lang === "pl" ? "Switch to English" : "Przełącz na polski"}
    >
      <span className="text-sm">{lang === "pl" ? "🇬🇧" : "🇵🇱"}</span>
      <span>{lang === "pl" ? "EN" : "PL"}</span>
    </button>
  );
}
