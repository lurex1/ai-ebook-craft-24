const encoder = new TextEncoder();
async function encryptionKey(secret: string) {
  if (!secret) throw new Error("Encryption is not configured");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptUserKey(value: string, userId: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(secret);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(userId) }, key, encoder.encode(value));
  return JSON.stringify({ version: 1, iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) });
}
export async function decryptUserKey(payload: string, userId: string, secret: string) {
  const data = JSON.parse(payload);
  if (data.version !== 1 || !Array.isArray(data.iv) || !Array.isArray(data.ciphertext)) throw new Error("Invalid encrypted credential");
  const key = await encryptionKey(secret);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(data.iv), additionalData: encoder.encode(userId) }, key, new Uint8Array(data.ciphertext));
  return new TextDecoder().decode(plaintext);
}
