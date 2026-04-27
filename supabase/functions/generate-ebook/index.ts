import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// ============================================================
// SKILL: ebook-styl — styl dla treści z zakresu rozwoju osobistego,
// duchowości, świadomości, mindset, Matrix, Twierdza itp.
// Aktywuje się automatycznie, gdy tytuł e-booka / sekcji zawiera
// słowa-klucze z domeny.
// ============================================================
const EBOOK_STYL_TRIGGERS = [
  "świadomoś", "swiadomos", "obserwator", "matrix", "twierdz",
  "przebudz", "duchowoś", "duchowos", "mindset", "pieniądz", "pieniadz",
  "rozwój osobist", "rozwoj osobist", "samoświadom", "samoswiadom",
  "medytac", "manifest", "energia", "uważnoś", "uwaznos",
  "podświadom", "podswiadom", "intuic", "wewnętrzn", "wewnetrzn",
];

function shouldUseEbookStyl(...texts: (string | undefined | null)[]): boolean {
  const blob = texts.filter(Boolean).join(" ").toLowerCase();
  return EBOOK_STYL_TRIGGERS.some((kw) => blob.includes(kw));
}

const EBOOK_STYL_PROMPT = `
=== SKILL: ebook-styl (AKTYWNY) ===
Piszesz jako redaktor i projektant nowoczesnych ebooków premium. Treść ma wyglądać jak produkt cyfrowy, NIE jak klasyczna książka.

STYL PISANIA:
- Krótkie, mocne zdania. Konkret zamiast ogólników.
- Otwierasz "sceną" — obrazem, sytuacją, mikro-historią (1-3 zdania).
- Po wstępie dawaj "moment lustra" — pytanie, które zatrzymuje czytelnika (w <blockquote>).
- Język bezpośredni, do czytelnika ("ty", "twoje").
- Unikaj akademickiego tonu. Pisz tak, jakbyś rozmawiał.
- Kończ sekcję mikro-zadaniem (konkretny krok do zrobienia teraz).

STRUKTURA SEKCJI (rytm: hero → kontrast → praktyka):
1. HERO — mocny wstęp + scena otwierająca + jeden mocny cytat (<blockquote>).
2. KONTRAST — tabela porównawcza (HTML <table>) typu "stare vs nowe", "system vs świadomość", "automat vs Obserwator".
3. PRAKTYKA — lista 3-5 konkretnych kroków (<ol><li>) + ramka z mikro-zadaniem (<blockquote> z prefixem "🎯 Zrób teraz:") + cytat zamykający.

OBOWIĄZKOWE ELEMENTY w każdej sekcji:
- co najmniej JEDNA tabela porównawcza (kontrast),
- co najmniej JEDEN <blockquote> z pytaniem do czytelnika ("moment lustra"),
- lista kroków praktycznych,
- cytat zamykający w <blockquote> na końcu,
- sugestia grafiki: <!-- IMAGE: opis grafiki w stylu minimalistycznym, paleta granat/krem/musztarda -->.

SŁOWNIK POJĘĆ (używaj konsekwentnie, nie zamieniaj na synonimy):
- Świadomość = stan zauważania siebie, myśli, emocji i wzorców bez automatycznej reakcji.
- Obserwator = część człowieka, która patrzy na myśli i emocje z dystansem.
- Matrix = system automatycznych schematów i przyzwyczajeń, w którym żyje się na autopilocie.
- Twierdza = obraz własnej niezależności: aktywa, kompetencje, marka, systemy pracujące na ciebie.

PALETA WIZUALNA (wspominaj w sugestiach grafik):
- Granat #1E2A4A (nagłówki, akcenty główne)
- Krem #F5F1EA (tła, oddech)
- Musztarda #E8B547 (ramki, callouty, mikro-zadania)

ZAKAZY:
- Żadnych długich bloków tekstu (max 2-4 zdania na akapit).
- Żadnych ogólników typu "warto pamiętać że...".
- Nie powtarzaj tytułu sekcji w treści.
- Żadnego Markdown — tylko czysty HTML.
=== KONIEC SKILL ===
`.trim();


function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callAI(messages: { role: string; content: string }[], tools?: any[], tool_choice?: any) {
  const body: any = { model: "google/gemini-3-flash-preview", messages };
  if (tools) { body.tools = tools; body.tool_choice = tool_choice; }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const t = await response.text();
    if (response.status === 429) throw new Error("Limit zapytań przekroczony. Spróbuj za chwilę.");
    if (response.status === 402) throw new Error("Brak środków na AI. Doładuj konto.");
    throw new Error("Błąd AI: " + t);
  }
  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, ...params } = await req.json();

    // ====== ANALYZE — returns structure proposal ======
    if (action === "analyze") {
      const { materials, structure } = params;
      const st = structure || { chapters: 6, hasSubchapters: false, hasPoints: true, hasSubpoints: false };

      let structureDesc = `${st.chapters} rozdziałów`;
      if (st.hasSubchapters) structureDesc += ", każdy z podrozdziałami";
      if (st.hasPoints) structureDesc += ", z punktami w każdym";
      if (st.hasSubpoints) structureDesc += " i podpunktami";

      const pointSchema: any = {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
        additionalProperties: false,
      };
      if (st.hasSubpoints) {
        pointSchema.properties.subpoints = {
          type: "array",
          items: { type: "object", properties: { title: { type: "string" } }, required: ["title"], additionalProperties: false },
        };
        pointSchema.required.push("subpoints");
      }

      const chapterItemSchema: any = {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
        additionalProperties: false,
      };

      if (st.hasSubchapters) {
        const subchapterSchema: any = {
          type: "object",
          properties: { title: { type: "string" } },
          required: ["title"],
          additionalProperties: false,
        };
        if (st.hasPoints) {
          subchapterSchema.properties.points = { type: "array", items: pointSchema };
          subchapterSchema.required.push("points");
        }
        chapterItemSchema.properties.subchapters = { type: "array", items: subchapterSchema };
        chapterItemSchema.required.push("subchapters");
      } else if (st.hasPoints) {
        chapterItemSchema.properties.points = { type: "array", items: pointSchema };
        chapterItemSchema.required.push("points");
      }

      const analyzeTool = {
        type: "function",
        function: {
          name: "analyze_materials",
          description: "Analyze materials and suggest ebook structure",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Tytuł e-booka" },
              subtitle: { type: "string", description: "Podtytuł uzupełniający" },
              author_name: { type: "string", description: "Sugerowane imię autora" },
              description: { type: "string", description: "Krótki opis 1-2 zdania" },
              chapters: { type: "array", items: chapterItemSchema },
            },
            required: ["title", "subtitle", "author_name", "description", "chapters"],
            additionalProperties: false,
          },
        },
      };

      const data = await callAI(
        [
          {
            role: "system",
            content: `Jesteś ekspertem od tworzenia profesjonalnych e-booków. Analizujesz materiały i tworzysz optymalną strukturę.

ZASADY:
1. Tytuł e-booka powinien być w formie pytania "Jak..." jeśli temat jest poradnikowy.
2. Struktura: ${structureDesc}. Prowadź czytelnika od podstaw do zaawansowanych zagadnień.
3. Jeśli materiały są niewystarczające — SAM zaproponuj brakujące elementy.
4. Każdy element struktury powinien mieć merytoryczny tytuł.
5. Struktura powinna logicznie prowadzić: wstęp → rozwinięcie → zaawansowane → podsumowanie.
6. Wszystko po polsku.`,
          },
          { role: "user", content: `Materiały do analizy:\n\n${materials}\n\nStwórz strukturę e-booka z ${structureDesc}.` },
        ],
        [analyzeTool],
        { type: "function", function: { name: "analyze_materials" } }
      );

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("AI nie przeanalizowało materiałów");
      return json(JSON.parse(toolCall.function.arguments));
    }

    // ====== GENERATE SECTION CONTENT — returns structured blocks ======
    if (action === "generate-section") {
      const { bookTitle, materials, sectionPath, sectionTitle, contextBefore, contextAfter, totalSections, currentIndex, sources } = params;

      const positionDesc = currentIndex <= 1
        ? "To jest początek e-booka — zacznij od podstaw, wprowadź czytelnika w temat."
        : currentIndex >= totalSections - 2
        ? "To jest końcowa część e-booka — podsumuj, daj zaawansowane wskazówki i wnioski."
        : "To jest środkowa część e-booka — rozwijaj temat z przykładami.";

      const sourcesInfo = sources && sources.length > 0
        ? `\n\nŹRÓDŁA DO CYTOWANIA:
Gdy korzystasz z informacji z materiałów źródłowych, dodawaj odnośniki w tekście w formie przypisów.
Format: po zdaniu/akapicie opartym na źródle dodaj <sup>[N]</sup> gdzie N to numer źródła.
Lista źródeł:
${sources.map((s: any, i: number) => `[${i + 1}] ${s.title} — ${s.url}`).join("\n")}
Nie dodawaj sekcji bibliografii na końcu — to zostanie zrobione automatycznie.`
        : "";

      const useEbookStyl = shouldUseEbookStyl(bookTitle, sectionTitle, sectionPath, contextBefore, contextAfter);
      const stylePrefix = useEbookStyl ? `${EBOOK_STYL_PROMPT}\n\n` : "";

      const data = await callAI([
        {
          role: "system",
          content: `${stylePrefix}Jesteś autorem profesjonalnego e-booka "${bookTitle}". Piszesz sekcję ${currentIndex + 1}/${totalSections}.

ZASADY PISANIA:
1. Pisz 400-800 słów po polsku.
2. ${positionDesc}
3. Pisz profesjonalnie ale przystępnie.
4. NIE powtarzaj tytułu sekcji w treści.
5. Jeśli materiały dotyczą tematu — bazuj na nich. Jeśli nie — sam napisz merytorycznie.

KLUCZOWE ZASADY FORMATOWANIA:
- Pisz czystym HTML, NIE Markdown! Nie używaj symboli *, #, _ itp.
- Używaj tagów HTML: <p> dla akapitów, <strong> dla pogrubień, <em> dla kursywy
- Używaj <ul><li> dla list punktowanych, <ol><li> dla numerowanych
- Używaj <blockquote> dla cytatów lub ważnych uwag
- Każdy akapit powinien mieć 2-4 zdania — nie pisz jednego ciągłego bloku tekstu
- Rozdzielaj treść na logiczne sekcje oddzielone akapitami
- Co 2-3 akapity wstaw podtytuł używając tagu: <h3>Podtytuł</h3>
- Dodaj listy wypunktowane gdzie to pasuje (korzyści, kroki, cechy)
- Na końcu sekcji dodaj <blockquote> z kluczowym wnioskiem lub poradą

DODATKOWE ELEMENTY (wstaw jeśli pasują do tematu):
- Jeśli temat dotyczy danych liczbowych, dodaj prostą tabelę HTML
- Zasugeruj miejsce na ilustrację wstawiając: <!-- IMAGE: opis grafiki -->
${sourcesInfo}

${contextBefore ? `Kontekst przed tą sekcją: "${contextBefore}"` : ""}
${contextAfter ? `Kontekst po tej sekcji: "${contextAfter}"` : ""}`,
        },
        {
          role: "user",
          content: `Napisz pełną treść sekcji: "${sectionTitle}" (ścieżka: ${sectionPath}).
${materials ? `\nMateriały źródłowe:\n${materials.slice(0, 8000)}` : "\nBrak materiałów — napisz samodzielnie na podstawie swojej wiedzy."}`,
        },
      ]);

      return json({ content: data.choices?.[0]?.message?.content || "" });
    }

    // ====== GENERATE ALL CONTENT (batch) ======
    if (action === "generate-all-content") {
      const { bookTitle, materials, sections, sources } = params;
      const results: Record<string, string> = {};
      const total = sections.length;

      const sourcesInfo = sources && sources.length > 0
        ? `\nŹRÓDŁA: Gdy korzystasz z materiałów źródłowych, dodawaj <sup>[N]</sup> po zdaniach opartych na źródłach.\n${sources.map((s: any, i: number) => `[${i + 1}] ${s.title} — ${s.url}`).join("\n")}`
        : "";

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const prevTitle = i > 0 ? sections[i - 1].title : "";
        const nextTitle = i < total - 1 ? sections[i + 1].title : "";

        const positionDesc = i <= 1
          ? "To jest początek e-booka — zacznij od podstaw."
          : i >= total - 2
          ? "To jest końcowa część — podsumuj i daj wnioski."
          : "To jest środkowa część — rozwijaj temat z przykładami.";

        const data = await callAI([
          {
            role: "system",
            content: `Autor e-booka "${bookTitle}". Sekcja ${i + 1}/${total}. ${positionDesc}
Pisz 400-800 słów po polsku, profesjonalnie z akapitami.

KLUCZOWE: Pisz czystym HTML (tagi <p>, <strong>, <em>, <ul>, <ol>, <li>, <h3>, <blockquote>, <table>).
NIE używaj Markdown (*, #, _, ~~). Dziel treść na krótkie akapity (2-4 zdania każdy).
Co 2-3 akapity wstaw <h3>podtytuł</h3>. Dodawaj listy i cytaty.${sourcesInfo}
${prevTitle ? `Poprzednia sekcja: "${prevTitle}"` : ""}
${nextTitle ? `Następna sekcja: "${nextTitle}"` : ""}`,
          },
          {
            role: "user",
            content: `Napisz treść: "${sec.title}"${materials ? `\n\nMateriały:\n${materials.slice(0, 6000)}` : ""}`,
          },
        ]);

        results[sec.id] = data.choices?.[0]?.message?.content || "";
      }

      return json({ contents: results });
    }

    // ====== IMPORT URL ======
    if (action === "import-url") {
      const { url } = params;
      const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await resp.text();
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 10000);
      return json({ text });
    }

    // ====== IMPORT YOUTUBE — extract transcript ======
    if (action === "import-youtube") {
      const { url } = params;
      
      // Extract video ID from various YouTube URL formats
      let videoId = "";
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      ];
      for (const p of patterns) {
        const m = url.match(p);
        if (m) { videoId = m[1]; break; }
      }
      if (!videoId) throw new Error("Nie rozpoznano ID filmu YouTube z podanego linku.");

      // Fetch video page to get captions info
      const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8" },
      });
      const pageHtml = await pageResp.text();

      // Extract video title
      const titleMatch = pageHtml.match(/<title>([^<]*)<\/title>/);
      const videoTitle = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "Film YouTube";

      // Try to extract captions from ytInitialPlayerResponse
      const playerMatch = pageHtml.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);
      if (!playerMatch) {
        // Fallback: use AI to summarize based on title and description
        const descMatch = pageHtml.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
        const description = descMatch ? descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').slice(0, 5000) : "";
        
        if (!description) throw new Error("Nie udało się pobrać informacji o filmie. Film może być prywatny lub niedostępny.");
        
        // Use AI to expand the description into material
        const aiData = await callAI([
          { role: "system", content: "Na podstawie tytułu i opisu filmu YouTube, rozwiń te informacje w szczegółowy materiał merytoryczny po polsku (1000-2000 słów). Pisz tak, jakbyś oglądał ten film i notował najważniejsze punkty." },
          { role: "user", content: `Tytuł filmu: "${videoTitle}"\n\nOpis filmu:\n${description}` },
        ]);
        const expandedText = aiData.choices?.[0]?.message?.content || description;
        return json({ text: `[Materiał z filmu YouTube: "${videoTitle}"]\n\n${expandedText}`, title: videoTitle });
      }

      let playerData: any;
      try { playerData = JSON.parse(playerMatch[1]); } catch { throw new Error("Nie udało się sparsować danych odtwarzacza YouTube."); }

      const captions = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!captions || captions.length === 0) {
        // No captions — use description + AI expansion
        const descMatch = pageHtml.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
        const description = descMatch ? descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').slice(0, 5000) : "";
        
        const aiData = await callAI([
          { role: "system", content: "Na podstawie tytułu i opisu filmu YouTube, rozwiń te informacje w szczegółowy materiał merytoryczny po polsku (1000-2000 słów). Pisz tak, jakbyś oglądał ten film i notował najważniejsze punkty. Dodaj strukturę z nagłówkami." },
          { role: "user", content: `Tytuł filmu: "${videoTitle}"\n\nOpis filmu:\n${description || "(brak opisu)"}` },
        ]);
        const expandedText = aiData.choices?.[0]?.message?.content || `Tytuł: ${videoTitle}\n${description}`;
        return json({ text: `[Materiał z filmu YouTube: "${videoTitle}" — brak napisów, treść oparta na opisie]\n\n${expandedText}`, title: videoTitle });
      }

      // Prefer Polish, then auto-generated Polish, then first available
      const plTrack = captions.find((c: any) => c.languageCode === "pl" && !c.kind) 
        || captions.find((c: any) => c.languageCode === "pl")
        || captions.find((c: any) => c.languageCode === "en" && !c.kind)
        || captions.find((c: any) => c.languageCode === "en")
        || captions[0];

      // Fetch the captions XML
      const captionUrl = plTrack.baseUrl + "&fmt=srv3";
      const captionResp = await fetch(captionUrl);
      const captionXml = await captionResp.text();

      // Parse XML to extract text
      const textParts: string[] = [];
      const regex = /<text[^>]*>([\s\S]*?)<\/text>/g;
      let match;
      while ((match = regex.exec(captionXml)) !== null) {
        const decoded = match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n/g, " ")
          .trim();
        if (decoded) textParts.push(decoded);
      }

      if (textParts.length === 0) throw new Error("Nie udało się wyodrębnić tekstu z napisów.");

      const rawTranscript = textParts.join(" ").slice(0, 30000);

      // Use AI to clean up and structure the transcript
      const aiData = await callAI([
        { role: "system", content: `Otrzymasz surowy transkrypt (napisy) z filmu YouTube "${videoTitle}". Twoje zadanie:
1. Oczyść tekst z powtórzeń, filler words, błędów transkrypcji
2. Podziel na logiczne sekcje z nagłówkami (## Nagłówek)
3. Zachowaj CAŁĄ merytoryczną treść — nic nie pomijaj
4. Pisz po polsku (przetłumacz jeśli oryginał jest w innym języku)
5. Wynik powinien być gotowym materiałem do stworzenia e-booka
6. Zachowaj cytaty, dane, przykłady, statystyki jeśli występują` },
        { role: "user", content: `Transkrypt filmu "${videoTitle}":\n\n${rawTranscript}` },
      ]);

      const cleanedText = aiData.choices?.[0]?.message?.content || rawTranscript;
      return json({ text: `[Transkrypt z filmu YouTube: "${videoTitle}"]\n\n${cleanedText}`, title: videoTitle });
    }

    // ====== COVER GENERATION ======
    if (action === "cover") {
      const { title, subtitle, style } = params;
      const prompt = `Create a professional vertical book cover image for an ebook titled "${title}"${subtitle ? `, subtitle: "${subtitle}"` : ""}. Style: ${style}. The cover should be eye-catching, high quality, with the title text "${title}" prominently displayed. Vertical portrait orientation like a real book cover. Ultra high resolution.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        if (response.status === 402) throw new Error("Brak środków na generowanie okładki. Spróbuj ponownie później lub doładuj konto.");
        if (response.status === 429) throw new Error("Zbyt wiele zapytań. Spróbuj za chwilę.");
        throw new Error("Cover generation failed: " + t);
      }

      const aiData = await response.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) throw new Error("Brak obrazu w odpowiedzi AI");

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `cover-${crypto.randomUUID()}.png`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("ebook-covers")
        .upload(fileName, bytes, { contentType: "image/png" });
      if (uploadError) throw new Error("Upload error: " + uploadError.message);

      const { data: urlData } = supabaseAdmin.storage.from("ebook-covers").getPublicUrl(fileName);
      return json({ coverUrl: urlData.publicUrl });
    }

    // ====== GENERATE ILLUSTRATION ======
    if (action === "generate-illustration") {
      const { contextText, bookTitle } = params;
      const prompt = `Create a simple, elegant illustration for an ebook chapter. The illustration should relate to this content: "${contextText.slice(0, 500)}". Book: "${bookTitle}". Style: pastel colors, minimalist, clean lines, soft gradients, no text on the image, simple shapes. The image should look professional and complement ebook content. Square format.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        if (response.status === 402) throw new Error("Brak środków na generowanie ilustracji. Spróbuj ponownie później lub doładuj konto.");
        if (response.status === 429) throw new Error("Zbyt wiele zapytań. Spróbuj za chwilę.");
        throw new Error("Illustration generation failed: " + t);
      }

      const aiData = await response.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) throw new Error("Brak obrazu w odpowiedzi AI");

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `illustration-${crypto.randomUUID()}.png`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("ebook-covers")
        .upload(fileName, bytes, { contentType: "image/png" });
      if (uploadError) throw new Error("Upload error: " + uploadError.message);

      const { data: urlData } = supabaseAdmin.storage.from("ebook-covers").getPublicUrl(fileName);
      return json({ imageUrl: urlData.publicUrl });
    }

    // ====== TRANSFORM TEXT — rewrite/convert selected text ======
    if (action === "transform-text") {
      const { selectedText, transformType } = params;
      
      const prompts: Record<string, string> = {
        "to-table": `Zamień poniższy tekst na tabelę HTML. Użyj tagów <table>, <tr>, <th>, <td>. Nie dodawaj nic poza tabelą. Zwróć TYLKO czysty HTML tabeli.\n\nTekst:\n${selectedText}`,
        "to-bullets": `Zamień poniższy tekst na listę wypunktowaną HTML. Użyj tagów <ul> i <li>. Nie dodawaj nic poza listą. Zwróć TYLKO czysty HTML listy.\n\nTekst:\n${selectedText}`,
        "simplify": `Przepisz poniższy tekst w sposób PROSTY — krótkie zdania, łatwy język, bez żargonu. Pisz po polsku. Zachowaj formatowanie HTML (tagi <p>, <strong>, <em>). Zwróć TYLKO przerobiony HTML.\n\nTekst:\n${selectedText}`,
        "medium": `Przepisz poniższy tekst na ŚREDNIM poziomie zaawansowania — profesjonalny ale przystępny. Pisz po polsku. Zachowaj formatowanie HTML. Zwróć TYLKO przerobiony HTML.\n\nTekst:\n${selectedText}`,
        "advanced": `Przepisz poniższy tekst na ZAAWANSOWANYM poziomie — ekspercki język, terminologia branżowa, głębia merytoryczna. Pisz po polsku. Zachowaj formatowanie HTML. Zwróć TYLKO przerobiony HTML.\n\nTekst:\n${selectedText}`,
      };

      const prompt = prompts[transformType];
      if (!prompt) throw new Error("Nieznany typ transformacji: " + transformType);

      const data = await callAI([
        { role: "system", content: "Jesteś redaktorem tekstu. Zwracasz TYLKO przerobiony HTML, bez dodatkowych komentarzy, wyjaśnień ani markdown." },
        { role: "user", content: prompt },
      ]);

      const result = data.choices?.[0]?.message?.content || "";
      // Strip markdown code fences if AI wrapped the response
      const cleaned = result.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
      return json({ transformedText: cleaned });
    }

    throw new Error("Nieznana akcja: " + action);
  } catch (e) {
    console.error("Error:", e);
    const msg = e instanceof Error ? e.message : "Nieznany błąd";
    // Return proper status codes for rate limit / payment errors
    if (msg.includes("Limit zapytań") || msg.includes("429")) return json({ error: msg }, 429);
    if (msg.includes("Brak środków") || msg.includes("402")) return json({ error: msg }, 402);
    return json({ error: msg }, 500);
  }
});
