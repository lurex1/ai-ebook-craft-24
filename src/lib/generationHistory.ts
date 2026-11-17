import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type GenerationRecord = {
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string | null;
  action: string;
  material: string;
  status: "running" | "success" | "error";
  error: string | null;
};

type HistoryDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      generation_history: {
        Row: GenerationRecord;
        Insert: Pick<GenerationRecord, "user_id" | "action" | "material"> & Partial<GenerationRecord>;
        Update: Partial<GenerationRecord>;
        Relationships: [];
      };
    };
  };
};
// The additional schema stays explicit until Cloud regenerates managed types.
const historyClient = supabase as unknown as SupabaseClient<HistoryDatabase>;

export function describeMaterial(body: Record<string, unknown>): string {
  const parts = [body.bookTitle, body.title, body.sectionTitle, body.url];
  if (Array.isArray(body.sources)) {
    for (const source of body.sources) {
      if (source && typeof source === "object") parts.push(source.title || source.url);
    }
  }
  const labels = parts.filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  // Do not persist whole prompts, source text, signed URLs or provider credentials.
  return labels.map((text) => text.replace(/sk-ant-[A-Za-z0-9_-]+/g, "[ukryto]").replace(/https?:\/\/\S+/g, (url) => {
    try { const parsed = new URL(url); return `${parsed.origin}${parsed.pathname}`; } catch { return "URL"; }
  }).replace(/<[^>]*>/g, "").slice(0, 240)).join(" · ").slice(0, 1000) ||
    (body.materials ? "Dodane materiały / tekst" : body.selectedText ? "Zaznaczony tekst" : "Treść e-booka");
}

export function safeGenerationError(error: unknown): string {
  const code = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (code.includes("PRO_REQUIRED")) return "Darmowe generowanie wykorzystane. Wymagany plan Pro.";
  if (code.includes("AUTH_REQUIRED")) return "Sesja wygasła. Zaloguj się ponownie.";
  if (/429|rate.limit/i.test(code)) return "Limit zapytań AI. Spróbuj ponownie później.";
  if (/timeout|timed out/i.test(code)) return "Przekroczono czas oczekiwania na AI.";
  return "Generowanie nie powiodło się. Spróbuj ponownie później.";
}

export async function startGenerationHistory(body: Record<string, unknown>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const { data, error } = await historyClient.from("generation_history").insert({
      user_id: session.user.id,
      action: typeof body.action === "string" ? body.action.slice(0, 80) : "generate",
      material: describeMaterial(body), status: "running",
    }).select("id").single();
    return error ? null : data?.id ?? null;
  } catch { return null; }
}

export async function finishGenerationHistory(id: string | null, error: unknown) {
  if (!id) return;
  try {
    await historyClient.from("generation_history").update({
      status: error ? "error" : "success", error: error ? safeGenerationError(error) : null,
      completed_at: new Date().toISOString(),
    }).eq("id", id);
  } catch { /* History availability must not interrupt ebook creation. */ }
}

export async function loadGenerationHistory(userId: string, page: number) {
  return historyClient.from("generation_history").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(page * 20, page * 20 + 19);
}