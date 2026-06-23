import { z } from "zod";

/** Optional integration key — must not throw on malformed values (auth critical path). */
const optionalKey = () => z.string().optional();

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
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

/** True when DB + Supabase server keys are configured (local dev / Vercel). */
export function isBackendConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.DATABASE_URL &&
      process.env.DIRECT_URL,
  );
}
