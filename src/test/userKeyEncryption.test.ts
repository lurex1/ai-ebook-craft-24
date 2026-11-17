import { describe, it, expect } from "vitest";
import { webcrypto } from "node:crypto";
import { encryptUserKey, decryptUserKey } from "../../supabase/functions/_shared/userKeyEncryption";
Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
const fixture = "not-a-real-api-credential";
const secret = "test-only-encryption-fixture";
describe("Personal Anthropic credential encryption", () => {
  it("stores ciphertext recoverable only with the server key", async () => {
    const encrypted = await encryptUserKey(fixture, "user-a", secret);
    expect(encrypted).not.toContain(fixture);
    expect(await decryptUserKey(encrypted, "user-a", secret)).toBe(fixture);
    await expect(decryptUserKey(encrypted, "user-a", "wrong-test-secret")).rejects.toThrow();
  });
  it("binds a personal credential to its owner", async () => {
    const encrypted = await encryptUserKey(fixture, "user-a", secret);
    await expect(decryptUserKey(encrypted, "user-b", secret)).rejects.toThrow();
  });
});
