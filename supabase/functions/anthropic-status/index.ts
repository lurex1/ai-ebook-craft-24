import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "AUTH_REQUIRED" }, 401);
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !userData.user) return json({ error: "AUTH_REQUIRED" }, 401);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    const configured = !!key && key.length > 10;

    let action = "status";
    try {
      const body = await req.json();
      if (body?.action) action = String(body.action);
    } catch {
      /* no body = status */
    }

    if (action !== "test") {
      return json({ configured, masked: configured ? `sk-ant-…${key!.slice(-4)}` : null });
    }

    if (!configured) {
      return json({ configured: false, ok: false, message: "Klucz ANTHROPIC_API_KEY nie jest zapisany." });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 16,
        messages: [{ role: "user", content: "ping" }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return json({
        configured: true,
        ok: true,
        model: data?.model ?? "claude-sonnet-4-5",
        message: "Połączenie z Anthropic działa poprawnie.",
      });
    }

    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err?.error?.message ?? detail;
    } catch { /* ignore */ }

    return json({
      configured: true,
      ok: false,
      status: res.status,
      message:
        res.status === 401
          ? "Klucz został odrzucony przez Anthropic (401). Sprawdź poprawność klucza."
          : res.status === 429
          ? "Limit zapytań Anthropic przekroczony (429). Spróbuj ponownie później."
          : detail,
    });
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : "Nieznany błąd" }, 500);
  }
});
