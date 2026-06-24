"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBilling } from "@/server/permissions/can";
import { generateApiKey, generateWebhookSecret } from "@/lib/api/keys";
import { createApiKeyRecord, revokeApiKey } from "@/server/repositories/api-keys";
import {
  createWebhookEndpoint,
  deactivateWebhookEndpoint,
} from "@/server/repositories/webhooks";
import { createApiKeySchema, createWebhookSchema } from "@/server/validators/api";

function settingsRedirect(params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/app/settings/api?${qs}` : "/app/settings/api");
}

export async function createApiKeyAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBilling(session)) {
    settingsRedirect({ error: "Permission denied" });
  }

  const parsed = createApiKeySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    settingsRedirect({ error: "Enter a key name" });
  }

  const { rawKey, keyPrefix, keyHash } = generateApiKey();
  await createApiKeyRecord(session.organizationId, {
    name: parsed.data.name,
    keyPrefix,
    keyHash,
  });

  revalidatePath("/app/settings/api");
  settingsRedirect({ created_key: rawKey });
}

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBilling(session)) {
    settingsRedirect({ error: "Permission denied" });
  }

  const apiKeyId = String(formData.get("apiKeyId") ?? "");
  if (!apiKeyId) settingsRedirect({ error: "Missing key" });

  await revokeApiKey(session.organizationId, apiKeyId);
  revalidatePath("/app/settings/api");
  settingsRedirect({ revoked: "1" });
}

export async function createWebhookAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBilling(session)) {
    settingsRedirect({ error: "Permission denied" });
  }

  const events = formData.getAll("events").map(String);
  const parsed = createWebhookSchema.safeParse({
    url: formData.get("url"),
    events,
  });
  if (!parsed.success) {
    settingsRedirect({ error: "Invalid webhook URL or events" });
  }

  const secret = generateWebhookSecret();
  await createWebhookEndpoint(session.organizationId, {
    url: parsed.data.url,
    secret,
    events: parsed.data.events,
  });

  revalidatePath("/app/settings/api");
  settingsRedirect({ webhook_secret: secret });
}

export async function deactivateWebhookAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBilling(session)) {
    settingsRedirect({ error: "Permission denied" });
  }

  const endpointId = String(formData.get("endpointId") ?? "");
  if (!endpointId) settingsRedirect({ error: "Missing endpoint" });

  await deactivateWebhookEndpoint(session.organizationId, endpointId);
  revalidatePath("/app/settings/api");
  settingsRedirect({ webhook_removed: "1" });
}
