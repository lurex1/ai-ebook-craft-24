import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

async function callAI(messages: { role: string; content: string }[], tools?: any[], tool_choice?: any) {
  const body: any = {
    model: "google/gemini-3-flash-preview",
    messages,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = tool_choice;
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("AI error:", response.status, t);
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

    if (action === "structure") {
      const { materials, chaptersCount, pointsPerChapter } = params;

      const structureTool = {
        type: "function",
        function: {
          name: "create_ebook_structure",
          description: "Create ebook structure with chapters and points",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Ebook title" },
              chapters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    points: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: "string" },
                          content: { type: "string" },
                        },
                        required: ["id", "title", "content"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["id", "title", "points"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "chapters"],
            additionalProperties: false,
          },
        },
      };

      const data = await callAI(
        [
          {
            role: "system",
            content: `Jesteś ekspertem od tworzenia e-booków. Analizujesz dostarczone materiały i tworzysz optymalną strukturę e-booka.
Struktura powinna prowadzić czytelnika od podstaw do zaawansowanych zagadnień, logicznie rozwijając temat.
Każdy rozdział musi mieć dokładnie ${pointsPerChapter} punktów.
Musisz stworzyć dokładnie ${chaptersCount} rozdziałów.
Zaproponuj chwytliwy tytuł e-booka oraz tytuły rozdziałów i punktów.
Identyfikatory (id) powinny być unikalne, np. "ch-1", "p-1-1".
Pole "content" w punktach zostaw puste (empty string).
Odpowiadaj po polsku.`,
          },
          {
            role: "user",
            content: `Oto materiały źródłowe do analizy:\n\n${materials}\n\nStwórz strukturę e-booka z ${chaptersCount} rozdziałami i ${pointsPerChapter} punktami na rozdział.`,
          },
        ],
        [structureTool],
        { type: "function", function: { name: "create_ebook_structure" } }
      );

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("AI nie wygenerowało struktury");

      const structure = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(structure), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "content") {
      const { bookTitle, chapterTitle, pointTitle, chapterIndex, totalChapters } = params;

      const data = await callAI([
        {
          role: "system",
          content: `Jesteś autorem e-booka "${bookTitle}". Piszesz treść sekcji w sposób profesjonalny, merytoryczny i angażujący.
Rozdział ${chapterIndex + 1} z ${totalChapters}: "${chapterTitle}".
Pisz po polsku. Treść powinna mieć 300-500 słów, być dobrze sformatowana z akapitami.
Używaj przykładów i praktycznych wskazówek. Prowadź czytelnika od podstaw do zaawansowanych konceptów.`,
        },
        {
          role: "user",
          content: `Napisz treść dla punktu: "${pointTitle}" w rozdziale "${chapterTitle}".`,
        },
      ]);

      const content = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "full-content") {
      const { structure } = params;
      const updatedStructure = { ...structure };

      for (let ci = 0; ci < updatedStructure.chapters.length; ci++) {
        const chapter = updatedStructure.chapters[ci];
        for (let pi = 0; pi < chapter.points.length; pi++) {
          const point = chapter.points[pi];
          if (point.content && point.content.trim()) continue; // skip if already has content

          const data = await callAI([
            {
              role: "system",
              content: `Jesteś autorem e-booka "${structure.title}". Piszesz treść sekcji profesjonalnie i angażująco.
Rozdział ${ci + 1} z ${structure.chapters.length}: "${chapter.title}".
Pisz po polsku, 300-500 słów, dobrze sformatowane z akapitami. Prowadź od podstaw do zaawansowanych konceptów.`,
            },
            {
              role: "user",
              content: `Napisz treść dla punktu: "${point.title}" w rozdziale "${chapter.title}".`,
            },
          ]);

          updatedStructure.chapters[ci].points[pi].content =
            data.choices?.[0]?.message?.content || "";
        }
      }

      return new Response(JSON.stringify(updatedStructure), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "export-html") {
      const { structure } = params;

      const chaptersHtml = structure.chapters.map((ch: any, ci: number) => {
        const pointsHtml = ch.points.map((p: any) => {
          const paragraphs = p.content
            ? p.content.split("\n").filter((l: string) => l.trim()).map((l: string) => `<p>${l}</p>`).join("")
            : "<p><em>Brak treści</em></p>";
          return `<div class="point"><h3>${p.title}</h3>${paragraphs}</div>`;
        }).join("");
        return `<div class="chapter"><h2>Rozdział ${ci + 1}: ${ch.title}</h2>${pointsHtml}</div>`;
      }).join("");

      const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>${structure.title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Source Sans 3', sans-serif; color: #1a1a2e; line-height: 1.8; background: #fff; }
.cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: #f0e6d3; text-align: center; padding: 4rem 2rem; page-break-after: always; }
.cover h1 { font-family: 'Playfair Display', serif; font-size: 3rem; margin-bottom: 1rem; color: #d4a437; }
.cover .author { font-size: 1.2rem; opacity: 0.8; margin-top: 2rem; }
.toc { padding: 3rem; page-break-after: always; }
.toc h2 { font-family: 'Playfair Display', serif; font-size: 2rem; color: #d4a437; margin-bottom: 2rem; }
.toc ul { list-style: none; }
.toc li { padding: 0.5rem 0; border-bottom: 1px solid #eee; font-size: 1.1rem; }
.chapter { padding: 3rem; page-break-before: always; }
.chapter h2 { font-family: 'Playfair Display', serif; font-size: 2rem; color: #1a1a2e; border-bottom: 3px solid #d4a437; padding-bottom: 0.5rem; margin-bottom: 2rem; }
.point { margin-bottom: 2rem; }
.point h3 { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: #16213e; margin-bottom: 0.8rem; }
.point p { margin-bottom: 0.8rem; text-align: justify; }
.footer-legal { padding: 3rem; border-top: 2px solid #d4a437; margin-top: 3rem; font-size: 0.85rem; color: #666; page-break-before: always; }
.footer-legal h2 { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #1a1a2e; margin-bottom: 1rem; }
.footer-legal h3 { font-size: 1.1rem; color: #333; margin: 1.5rem 0 0.5rem; }
.footer-legal p { margin-bottom: 0.5rem; line-height: 1.6; }
@media print { body { font-size: 11pt; } .cover h1 { font-size: 2.5rem; } }
</style>
</head>
<body>
<div class="cover">
  <h1>${structure.title}</h1>
  <p class="author">Wygenerowano w Scripto by Paveelo</p>
</div>
<div class="toc">
  <h2>Spis treści</h2>
  <ul>
    ${structure.chapters.map((ch: any, ci: number) => `<li><strong>Rozdział ${ci + 1}:</strong> ${ch.title}</li>`).join("")}
  </ul>
</div>
${chaptersHtml}
<div class="footer-legal">
  <h2>Informacje prawne</h2>
  <h3>Wydawca</h3>
  <p>Paveelo — Paweł Eberle, firma nierejestrowana wg prawa polskiego<br>
  ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola, Polska</p>
  <h3>Regulamin</h3>
  <p>Niniejszy e-book jest utworem chronionym prawem autorskim. Rozpowszechnianie, kopiowanie lub publiczne udostępnianie bez zgody wydawcy jest zabronione. Zakup e-booka uprawnia do użytku osobistego.</p>
  <h3>Polityka prywatności</h3>
  <p>Aplikacja Scripto przetwarza dane osobowe zgodnie z RODO. Dane są wykorzystywane wyłącznie w celu świadczenia usług i nie są udostępniane osobom trzecim bez zgody użytkownika.</p>
  <h3>Polityka cookies</h3>
  <p>Aplikacja wykorzystuje pliki cookies niezbędne do prawidłowego działania serwisu. Korzystając z aplikacji, użytkownik wyraża zgodę na ich stosowanie.</p>
  <h3>RODO</h3>
  <p>Administrator danych: Paweł Eberle, ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola. Użytkownik ma prawo do wglądu, poprawiania i usunięcia swoich danych osobowych. Kontakt: za pośrednictwem aplikacji Scripto.</p>
</div>
</body>
</html>`;

      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Nieznana akcja: " + action);
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Nieznany błąd" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
