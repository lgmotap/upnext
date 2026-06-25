import { randomBytes } from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientEnv, serverEnv } from "@/lib/env";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import type { PortalSession } from "@/lib/portal/session";
import {
  findCustomerByEmailForOrg,
  updateCustomerPortalLastLogin,
} from "@/server/repositories/customer-portal";
import { loadPortalContext } from "@/server/services/customer-portal";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type PortalAuthUserMetadata = {
  role: "portal_customer";
  organizationId: string;
  customerId: string;
  businessSlug: string;
};

/** Lazily provision a Supabase auth user for portal password login (no Membership). */
export async function ensurePortalSupabaseUser(params: {
  organizationId: string;
  customerId: string;
  email: string;
  businessSlug: string;
  sendPasswordSetup?: boolean;
}): Promise<{ ok: true; portalUserId: string } | { ok: false; error: string }> {
  const customer = await prisma.customer.findFirst({
    where: { id: params.customerId, organizationId: params.organizationId },
    select: { id: true, email: true, portalUserId: true },
  });
  if (!customer) return { ok: false, error: "Customer not found." };
  if (customer.portalUserId) {
    return { ok: true, portalUserId: customer.portalUserId };
  }

  const admin = createAdminClient();
  const metadata: PortalAuthUserMetadata = {
    role: "portal_customer",
    organizationId: params.organizationId,
    customerId: params.customerId,
    businessSlug: params.businessSlug,
  };

  const tempPassword = randomBytes(32).toString("hex");
  const { data, error } = await admin.auth.admin.createUser({
    email: normalizeEmail(params.email),
    password: tempPassword,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error || !data.user) {
    const msg = error?.message ?? "Could not create portal login.";
    if (msg.toLowerCase().includes("already")) {
      return { ok: false, error: "This email is already used for another account type." };
    }
    return { ok: false, error: msg };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { portalUserId: data.user.id },
  });

  if (params.sendPasswordSetup) {
    await sendPortalPasswordSetupEmail(normalizeEmail(params.email), params.businessSlug);
  }

  return { ok: true, portalUserId: data.user.id };
}

function createPortalPasswordClient() {
  const env = serverEnv();
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function sendPortalPasswordSetupEmail(email: string, businessSlug: string) {
  const supabase = createPortalPasswordClient();
  const env = clientEnv();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/my/${businessSlug}/auth/recovery`,
  });
}

export async function signInPortalWithPassword(
  businessSlug: string,
  email: string,
  password: string,
  rateLimitKey: string,
): Promise<
  | { ok: true; session: Omit<PortalSession, "exp"> }
  | { ok: false; error: string }
> {
  if (!checkRateLimit(`portal:pwd:ip:${rateLimitKey}`, 10, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many sign-in attempts. Try again in an hour." };
  }

  const normalized = normalizeEmail(email);
  if (!normalized || !password) {
    return { ok: false, error: "Enter your email and password." };
  }

  if (!checkRateLimit(`portal:pwd:email:${businessSlug}:${normalized}`, 5, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many sign-in attempts for this email. Try again later." };
  }

  const profile = await loadPortalContext(businessSlug);
  if (!profile?.portalPasswordLoginEnabled) {
    return { ok: false, error: "Password sign-in is not enabled for this portal." };
  }

  const customer = await findCustomerByEmailForOrg(profile.organizationId, normalized);
  if (!customer?.portalUserId) {
    return { ok: false, error: "Invalid email or password." };
  }

  const supabase = createPortalPasswordClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (data.user.id !== customer.portalUserId) {
    await supabase.auth.signOut();
    return { ok: false, error: "Invalid email or password." };
  }

  const meta = data.user.user_metadata as Partial<PortalAuthUserMetadata>;
  if (meta.role !== "portal_customer" || meta.customerId !== customer.id) {
    await supabase.auth.signOut();
    return { ok: false, error: "Invalid email or password." };
  }

  await supabase.auth.signOut();
  await updateCustomerPortalLastLogin(customer.id, profile.organizationId);

  return {
    ok: true,
    session: {
      customerId: customer.id,
      organizationId: profile.organizationId,
      businessSlug,
    },
  };
}

export async function requestPortalPasswordReset(
  businessSlug: string,
  email: string,
  rateLimitKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!checkRateLimit(`portal:reset:ip:${rateLimitKey}`, 10, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many requests. Try again in an hour." };
  }

  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, error: "Enter your email address." };

  const profile = await loadPortalContext(businessSlug);
  if (!profile?.portalPasswordLoginEnabled) {
    return { ok: true };
  }

  const customer = await findCustomerByEmailForOrg(profile.organizationId, normalized);
  if (!customer?.portalUserId) {
    return { ok: true };
  }

  await sendPortalPasswordSetupEmail(normalized, businessSlug);
  return { ok: true };
}
