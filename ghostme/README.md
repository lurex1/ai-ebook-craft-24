# 👻 GhostMe

Aplikacja mobilna (Expo + React Native + TypeScript), która analizuje screenshoty rozmów
z Messengera, Instagrama, WhatsAppa i SMS. Odczytuje tekst (OCR przez model wizyjny),
wysyła go do AI i pokazuje pełną analizę oraz trzy gotowe propozycje odpowiedzi.

## ✨ Funkcje

- **Splash** — animowane logo, automatyczne przejście do Home
- **Home** — start analizy, podgląd ostatnich analiz, ustawienia
- **Upload** — zdjęcie z galerii lub aparatu + podgląd
- **OCR** — odczyt tekstu ze screenshota z możliwością ręcznej edycji
- **Analiza AI** — 😊 ton, ❤️ zainteresowanie, 📈 szansa na odpowiedź (0–100%),
  🚩 red flagi, ✅ green flagi, 🧠 interpretacja zachowania, 📋 podsumowanie
- **Propozycje odpowiedzi** — 😂 zabawna, 😎 pewna siebie, ❤️ miła (każda z przyciskiem Kopiuj)
- **Historia** — zapisane analizy (AsyncStorage), pełny raport po kliknięciu
- **Ustawienia** — tryb ciemny, czyszczenie historii, informacje o aplikacji

## 🛠️ Technologie

Expo SDK 53 · React Native · TypeScript (strict) · Expo Router · NativeWind (Tailwind) ·
AsyncStorage · OpenAI API (model konfigurowalny w jednym miejscu)

## 🚀 Uruchomienie

```sh
cd ghostme
npm install
cp .env.example .env   # opcjonalnie: wpisz swój klucz OpenAI
npm start              # potem: a (Android) / i (iOS) / w (web) lub skan QR w Expo Go
```

> **Tryb demo:** bez klucza API aplikacja działa na danych testowych —
> cały przepływ (OCR → analiza → odpowiedzi) można przeklikać bez kosztów.

## 🔑 Konfiguracja AI

Cała konfiguracja znajduje się w `src/services/config.ts`:

- `model` — model do analizy rozmowy (domyślnie `gpt-4o-mini`)
- `visionModel` — model wizyjny do OCR
- `baseUrl` — endpoint zgodny z OpenAI (łatwa podmiana dostawcy)
- klucz API: zmienna `EXPO_PUBLIC_OPENAI_API_KEY` w pliku `.env`

## 📁 Struktura

```
ghostme/
├── app/                # trasy Expo Router (cienkie pliki tras)
│   ├── _layout.tsx     # stack + providery (motyw, przepływ analizy)
│   ├── index.tsx       # Splash
│   ├── home.tsx        # Home
│   ├── upload.tsx      # wybór screenshota
│   ├── ocr.tsx         # odczyt i edycja tekstu
│   ├── analysis.tsx    # raport analizy AI
│   ├── replies.tsx     # propozycje odpowiedzi
│   ├── history/        # lista + szczegóły ([id])
│   └── settings.tsx    # ustawienia
├── src/
│   ├── components/     # karty, przyciski, loading, raport, itd.
│   ├── screens/        # logika i UI ekranów
│   ├── services/       # ai.service, ocr.service, storage.service, config
│   ├── hooks/          # useAnalysisFlow, useHistory, useAppTheme
│   ├── types/          # typy domenowe (AnalysisResult, AnalysisRecord…)
│   └── utils/          # parsowanie JSON, formatowanie, dane testowe
└── assets/images/      # ikona / splash
```

## ⚠️ Uwaga

Analiza AI ma charakter pomocniczy i rozrywkowy — ostateczna decyzja, co odpisać,
zawsze należy do użytkownika. 💜
