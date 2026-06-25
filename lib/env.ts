import { z } from "zod";

/** Optional integration key — must not throw on malformed values (auth critical path). */
const optionalKey = () => z.string().optional();

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

const serverSchema = clientSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  RESEND_API_KEY: optionalKey(),
  EMAIL_FROM: z.string().optional(),
  STRIPE_SECRET_KEY: optionalKey(),
  STRIPE_WEBHOOK_SECRET: optionalKey(),
  CRON_SECRET: z.string().min(16).optional(),
});

let _client: z.infer<typeof clientSchema> | undefined;
let _server: z.infer<typeof serverSchema> | undefined;

export function clientEnv() {
  if (!_client) _client = clientSchema.parse(process.env);
  return _client;
}

export function serverEnv() {
  if (!_server) _server = serverSchema.parse(process.env);
  return _server;
}

const PLACEHOLDER = /^(placeholder|changeme|your_|xxx|todo|replace_me)/i;

function isRealSecret(value: string | undefined): boolean {
  const v = value?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (v.length < 12) return false;
  if (PLACEHOLDER.test(v)) return false;
  return true;
}

function isRealDatabaseUrl(value: string | undefined): boolean {
  const v = value?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!isRealSecret(v)) return false;
  try {
    const url = new URL(v);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}

/** True when DB + Supabase server keys are configured with real (non-placeholder) values. */
export function isBackendConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      isRealSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      isRealSecret(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
      isRealDatabaseUrl(process.env.DATABASE_URL) &&
      isRealDatabaseUrl(process.env.DIRECT_URL),
  );
}

/** Human-readable env status for local setup checks (no secret values). */
export function getBackendConfigStatus(): Record<string, "ok" | "missing" | "placeholder"> {
  const check = (value: string | undefined, db = false): "ok" | "missing" | "placeholder" => {
    if (!value?.trim()) return "missing";
    if (db ? !isRealDatabaseUrl(value) : !isRealSecret(value)) return "placeholder";
    return "ok";
  };

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "missing",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: check(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: check(process.env.SUPABASE_SERVICE_ROLE_KEY),
    DATABASE_URL: check(process.env.DATABASE_URL, true),
    DIRECT_URL: check(process.env.DIRECT_URL, true),
  };
}
