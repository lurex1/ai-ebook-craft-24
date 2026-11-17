import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { encryptUserKey, decryptUserKey } from "../_shared/userKeyEncryption.ts";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }).strict(),
  z.object({ action: z.literal("test") }).strict(),
  z.object({ action: z.literal("delete") }).strict(),
  z.object({ action: z.literal("save"), key: z.string().trim().min(20).max(4096).regex(/^sk-ant-[A-Za-z0-9_-]+$/) }).strict(),
]);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ message: "Niedozwolona metoda." }, 405);
  try {
    const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "AUTH_REQUIRED" }, 401);
    const { data, error } = await client.auth.getUser(auth.slice(7));
    if (error || !data.user) return json({ error: "AUTH_REQUIRED" }, 401);
    const userId = data.user.id;
    const body = schema.safeParse(await req.json().catch(() => null));
    if (!body.success) return json({ message: "Nieprawidłowe dane formularza." }, 400);
    const secret = Deno.env.get("USER_API_KEY_ENCRYPTION_SECRET");
    if (!secret) return json({ message: "Bezpieczny zapis jest chwilowo niedostępny." }, 503);
    if (body.data.action === "save") {
      const encrypted = await encryptUserKey(body.data.key, userId, secret);
      const { error } = await client.from("user_anthropic_credentials").upsert({ user_id: userId, encrypted_key: encrypted, updated_at: new Date().toISOString() });
      if (error) return json({ message: "Nie udało się zapisać klucza. Spróbuj ponownie później." }, 503);
      return json({ configured: true, message: "Osobisty klucz zapisany." });
    }
    if (body.data.action === "delete") {
      const { error } = await client.from("user_anthropic_credentials").delete().eq("user_id", userId);
      if (error) return json({ message: "Nie udało się usunąć klucza." }, 503);
      return json({ configured: false, message: "Klucz usunięty." });
    }
    const { data: credential, error: readError } = await client.from("user_anthropic_credentials").select("encrypted_key").eq("user_id", userId).maybeSingle();
    if (readError) return json({ message: "Ustawienia klucza są chwilowo niedostępne." }, 503);
    if (body.data.action === "status") return json({ configured: Boolean(credential) });
    if (!credential) return json({ configured: false, ok: false, message: "Najpierw zapisz swój klucz Anthropic." });
    const key = await decryptUserKey(credential.encrypted_key, userId, secret);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: AbortSignal.timeout(20000),
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 16, messages: [{ role: "user", content: "ping" }] }),
    });
    // Provider responses can contain sensitive request data; never forward them.
    await res.body?.cancel();
    return json({ configured: true, ok: res.ok, message: res.ok ? "Połączenie z Anthropic działa poprawnie." : res.status === 401 ? "Anthropic odrzucił klucz. Wprowadź nowy klucz." : res.status === 429 ? "Limit Anthropic został przekroczony. Spróbuj później." : "Nie udało się wykonać testu. Sprawdź dostęp i środki na koncie Anthropic." });
  } catch {
    return json({ ok: false, message: "Nie udało się wykonać operacji. Spróbuj ponownie później." }, 503);
  }
});
