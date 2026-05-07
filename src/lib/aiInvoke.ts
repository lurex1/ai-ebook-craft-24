import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Wrapper around supabase.functions.invoke("generate-ebook", ...) that:
 *  1. Pre-checks the user's plan and short-circuits Free users with a friendly
 *     "Upgrade to Pro" toast + redirect (so we never trigger a 403 / unhandled
 *     error / blank screen).
 *  2. Surfaces clean PRO_REQUIRED / AUTH_REQUIRED messages if the backend
 *     still returns them (defensive fallback).
 *
 * Returns `{ data: null, error: Error }` instead of throwing, so callers'
 * existing `if (error) throw error` paths show a toast rather than crashing.
 */

let cachedPlan: { plan: string; ts: number } | null = null;
const PLAN_TTL_MS = 30_000;

async function getPlan(): Promise<string> {
  if (cachedPlan && Date.now() - cachedPlan.ts < PLAN_TTL_MS) return cachedPlan.plan;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "anonymous";
  const { data } = await supabase
    .from("user_credits")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();
  const plan = (data?.plan as string) || "free";
  cachedPlan = { plan, ts: Date.now() };
  return plan;
}

export function invalidatePlanCache() {
  cachedPlan = null;
}

function showProUpsell(message?: string) {
  toast({
    title: "🔒 Funkcja dostępna w planie Pro",
    description:
      (message || "Generowanie AI jest dostępne tylko w planie Pro.") +
      " Za chwilę przekierujemy Cię do planów…",
    variant: "destructive",
  });
  setTimeout(() => {
    if (window.location.pathname !== "/pricing") {
      window.location.href = "/pricing";
    }
  }, 1800);
}

export async function invokeGenerateEbook<T = any>(body: Record<string, any>) {
  // Pre-flight plan check — avoid the 403 entirely for Free users.
  const plan = await getPlan();
  if (plan === "anonymous") {
    toast({
      title: "Wymagane logowanie",
      description: "Zaloguj się, aby korzystać z generowania AI.",
      variant: "destructive",
    });
    return { data: null, error: new Error("AUTH_REQUIRED") } as any;
  }
  if (plan !== "pro") {
    showProUpsell();
    return { data: null, error: new Error("PRO_REQUIRED") } as any;
  }

  const result = await supabase.functions.invoke("generate-ebook", { body });

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
      invalidatePlanCache();
      showProUpsell(payload.message);
      return { data: null, error: new Error(payload.message || "PRO_REQUIRED") } as any;
    }
    if (payload?.error === "AUTH_REQUIRED") {
      toast({
        title: "Wymagane logowanie",
        description: payload.message || "Zaloguj się, aby kontynuować.",
        variant: "destructive",
      });
      return { data: null, error: new Error(payload.message || "AUTH_REQUIRED") } as any;
    }
  }

  return result as { data: T | null; error: any };
}
