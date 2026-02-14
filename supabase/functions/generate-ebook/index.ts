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

    // ====== STRUCTURE ======
    if (action === "structure") {
      const { materials, chaptersCount, pointsPerChapter } = params;
      const structureTool = {
        type: "function",
        function: {
          name: "create_ebook_structure",
          description: "Create ebook structure",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
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
                        properties: { id: { type: "string" }, title: { type: "string" }, content: { type: "string" } },
                        required: ["id", "title", "content"], additionalProperties: false,
                      },
                    },
                  },
                  required: ["id", "title", "points"], additionalProperties: false,
                },
              },
            },
            required: ["title", "chapters"], additionalProperties: false,
          },
        },
      };

      const data = await callAI(
        [
          { role: "system", content: `Jesteś ekspertem od e-booków. Analizujesz materiały i tworzysz optymalną strukturę. Stwórz ${chaptersCount} rozdziałów z ${pointsPerChapter} punktami każdy. Prowadź od podstaw do zaawansowanych zagadnień. ID: "ch-1", "p-1-1". Content pustY. Po polsku.` },
          { role: "user", content: `Materiały:\n\n${materials}\n\nStwórz strukturę e-booka.` },
        ],
        [structureTool],
        { type: "function", function: { name: "create_ebook_structure" } }
      );

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("AI nie wygenerowało struktury");
      return json(JSON.parse(toolCall.function.arguments));
    }

    // ====== CONTENT ======
    if (action === "content") {
      const { bookTitle, chapterTitle, pointTitle, chapterIndex, totalChapters } = params;
      const data = await callAI([
        { role: "system", content: `Jesteś autorem e-booka "${bookTitle}". Rozdział ${chapterIndex + 1}/${totalChapters}: "${chapterTitle}". Pisz 300-500 słów po polsku, profesjonalnie, z akapitami i przykładami.` },
        { role: "user", content: `Napisz treść: "${pointTitle}" w rozdziale "${chapterTitle}".` },
      ]);
      return json({ content: data.choices?.[0]?.message?.content || "" });
    }

    // ====== FULL CONTENT ======
    if (action === "full-content") {
      const { structure } = params;
      const updated = { ...structure };
      for (let ci = 0; ci < updated.chapters.length; ci++) {
        const chapter = updated.chapters[ci];
        for (let pi = 0; pi < chapter.points.length; pi++) {
          if (chapter.points[pi].content?.trim()) continue;
          const data = await callAI([
            { role: "system", content: `Autor e-booka "${structure.title}". Rozdział ${ci + 1}/${structure.chapters.length}: "${chapter.title}". 300-500 słów po polsku.` },
            { role: "user", content: `Napisz: "${chapter.points[pi].title}"` },
          ]);
          updated.chapters[ci].points[pi].content = data.choices?.[0]?.message?.content || "";
        }
      }
      return json(updated);
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

      // Upload to storage
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

    throw new Error("Nieznana akcja: " + action);
  } catch (e) {
    console.error("Error:", e);
    return json({ error: e instanceof Error ? e.message : "Nieznany błąd" }, 500);
  }
});
