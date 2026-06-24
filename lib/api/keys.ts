import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "unx_live_";

export function generateApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const secret = randomBytes(24).toString("base64url");
  const rawKey = `${KEY_PREFIX}${secret}`;
  const keyPrefix = rawKey.slice(0, 16);
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyPrefix, keyHash };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}
