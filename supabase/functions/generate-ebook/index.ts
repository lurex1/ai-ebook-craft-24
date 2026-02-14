import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    // ====== ANALYZE — returns structure proposal with configurable depth ======
    if (action === "analyze") {
      const { materials, structure } = params;
      // structure: { chapters: number, hasSubchapters: bool, hasPoints: bool, hasSubpoints: bool }
      const st = structure || { chapters: 6, hasSubchapters: false, hasPoints: true, hasSubpoints: false };

      let structureDesc = `${st.chapters} rozdziałów`;
      if (st.hasSubchapters) structureDesc += ", każdy z podrozdziałami";
      if (st.hasPoints) structureDesc += ", z punktami w każdym";
      if (st.hasSubpoints) structureDesc += " i podpunktami";

      // Build nested schema based on structure config
      const pointSchema: any = {
        type: "object",
        properties: {
          title: { type: "string" },
        },
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
        properties: {
          title: { type: "string" },
        },
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
              title: { type: "string", description: "Tytuł e-booka w formie pytania 'Jak...' jeśli to poradnik, np. 'Jak naprawić samochód bez narzędzi'" },
              subtitle: { type: "string", description: "Podtytuł uzupełniający" },
              author_name: { type: "string", description: "Sugerowane imię autora jeśli znalezione w materiałach, pusty string jeśli nie" },
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
1. Tytuł e-booka powinien być w formie pytania "Jak..." jeśli temat jest poradnikowy (np. "Jak naprawić samochód bez narzędzi", "Jak zostać mistrzem gotowania").
2. Struktura: ${structureDesc}. Prowadź czytelnika od podstaw/wprowadzenia przez rozwinięcie do zaawansowanych zagadnień i rozwiązania problemu.
3. Jeśli materiały są niewystarczające — SAM zaproponuj brakujące elementy, rozdziały i punkty które usprawniłyby e-booka.
4. Każdy element struktury powinien mieć merytoryczny tytuł (nie "Rozdział 1" ale konkretny temat).
5. Struktura powinna logicznie prowadzić: wstęp/podstawy → rozwinięcie → zaawansowane → podsumowanie/wnioski.
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

    // ====== GENERATE SECTION CONTENT ======
    if (action === "generate-section") {
      const { bookTitle, materials, sectionPath, sectionTitle, contextBefore, contextAfter, totalSections, currentIndex } = params;

      const positionDesc = currentIndex <= 1 
        ? "To jest początek e-booka — zacznij od podstaw, wprowadź czytelnika w temat."
        : currentIndex >= totalSections - 2
        ? "To jest końcowa część e-booka — podsumuj, daj zaawansowane wskazówki i wnioski."
        : "To jest środkowa część e-booka — rozwijaj temat, podawaj praktyczne informacje i przykłady.";

      const data = await callAI([
        {
          role: "system",
          content: `Jesteś autorem profesjonalnego e-booka "${bookTitle}". Piszesz sekcję ${currentIndex + 1}/${totalSections}.

ZASADY PISANIA:
1. Pisz 400-800 słów po polsku.
2. ${positionDesc}
3. Pisz profesjonalnie ale przystępnie, z akapitami, przykładami, praktycznymi wskazówkami.
4. Nie powtarzaj tytułu sekcji w treści.
5. Jeśli materiały użytkownika dotyczą tego tematu — bazuj na nich. Jeśli nie — sam napisz merytorycznie.
6. Prowadź logicznie od wyjaśnienia zagadnienia do praktycznych wniosków.
7. Używaj formatowania markdown: **pogrubienia**, listy, cytaty jeśli pasują.

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
      const { bookTitle, materials, sections } = params;
      // sections: Array<{ id: string, path: string, title: string, index: number }>
      const results: Record<string, string> = {};
      const total = sections.length;

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
Pisz 400-800 słów po polsku, profesjonalnie z akapitami i przykładami. Markdown OK.
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

    throw new Error("Nieznana akcja: " + action);
  } catch (e) {
    console.error("Error:", e);
    return json({ error: e instanceof Error ? e.message : "Nieznany błąd" }, 500);
  }
});
