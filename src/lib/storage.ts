import { supabase } from "@/integrations/supabase/client";

const BUCKET = "ebook-materials";
const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 rok

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Zwraca podpisany URL do prywatnego pliku w bibliotece mediów. */
export async function signedMaterialUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
  if (error) throw error;
  return data.signedUrl;
}

/** Wgrywa plik do folderu bieżącego użytkownika i zwraca podpisany URL. */
export async function uploadMaterial(file: File): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Zaloguj się, aby wgrywać pliki.");
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return signedMaterialUrl(path);
}

/** Lista obrazów należących do bieżącego użytkownika (z podpisanymi URL-ami). */
export async function listMaterialImages(limit = 200): Promise<{ name: string; url: string }[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(userId, { limit, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;
  const files = (data || []).filter((f) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name));
  if (files.length === 0) return [];
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(files.map((f) => `${userId}/${f.name}`), SIGNED_TTL);
  if (signErr) throw signErr;
  return files.map((f, i) => ({ name: f.name, url: signed?.[i]?.signedUrl || "" }));
}
