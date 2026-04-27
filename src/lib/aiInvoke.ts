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
        title: "🔒 Funkcja dostępna w planie Pro",
        description:
          (payload.message || "Generowanie AI jest dostępne tylko w planie Pro.") +
          " Kliknij, aby zobaczyć plany.",
        variant: "destructive",
      });
      // Auto-redirect after a short delay so user can read the message
      setTimeout(() => {
        if (window.location.pathname !== "/pricing") {
          window.location.href = "/pricing";
        }
      }, 1800);
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
