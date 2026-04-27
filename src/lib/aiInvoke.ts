import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Wrapper around supabase.functions.invoke("generate-ebook", ...) that surfaces
 * a friendly toast (with "Upgrade to Pro" CTA) when the backend returns
 * PRO_REQUIRED / AUTH_REQUIRED errors.
 */
export async function invokeGenerateEbook<T = any>(body: Record<string, any>) {
  const result = await supabase.functions.invoke("generate-ebook", { body });

  // FunctionsHttpError carries the response; Supabase exposes context.
  const err: any = result.error;
  if (err) {
    let payload: any = null;
    try {
      const ctx = err.context;
      if (ctx && typeof ctx.json === "function") payload = await ctx.json();
      else if (ctx && typeof ctx.text === "function") {
        const t = await ctx.text();
        try { payload = JSON.parse(t); } catch { payload = { message: t }; }
      }
    } catch { /* ignore */ }

    if (payload?.error === "PRO_REQUIRED") {
      toast({
        title: "Funkcja dostępna w planie Pro",
        description: payload.message || "Przejdź na plan Pro, aby odblokować generowanie AI.",
        variant: "destructive",
        action: undefined,
      });
      // Soft redirect cue
      setTimeout(() => {
        if (confirm("Otworzyć stronę z planami?")) {
          window.location.href = "/pricing";
        }
      }, 50);
      throw new Error("PRO_REQUIRED");
    }
    if (payload?.error === "AUTH_REQUIRED") {
      toast({
        title: "Wymagane logowanie",
        description: payload.message || "Zaloguj się, aby kontynuować.",
        variant: "destructive",
      });
      throw new Error("AUTH_REQUIRED");
    }
  }

  return result as { data: T | null; error: any };
}
