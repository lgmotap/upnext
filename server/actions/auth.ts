"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientEnv, isBackendConfigured } from "@/lib/env";
import { createWorkspaceForNewUser } from "@/server/services/onboarding";
import { forgotPasswordSchema, signInSchema, signUpSchema } from "@/server/validators/auth";

function authRedirect(path: string, params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `${path}?${qs}` : path);
}

function requireBackend(path: string) {
  if (!isBackendConfigured()) {
    authRedirect(path, {
      error: "Server is not configured. Copy .env.example to .env.local and add your Supabase + database URLs.",
    });
  }
}

export async function signInAction(formData: FormData): Promise<void> {
  requireBackend("/sign-in");
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed";
    authRedirect("/sign-in", { error: msg });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    authRedirect("/sign-in", { error: error.message });
  }

  const next = String(formData.get("next") ?? "/app/dashboard");
  redirect(next.startsWith("/app") ? next : "/app/dashboard");
}

export async function signUpAction(formData: FormData): Promise<void> {
  requireBackend("/sign-up");
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed";
    authRedirect("/sign-up", { error: msg });
  }

  const { name, businessName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, business_name: businessName } },
  });

  if (signUpError) {
    authRedirect("/sign-up", { error: signUpError.message });
  }

  if (!authData.user) {
    authRedirect("/sign-up", { error: "Failed to create account" });
  }

  if (authData.user.identities?.length === 0) {
    authRedirect("/sign-in", { message: "An account with this email already exists. Please sign in." });
  }

  const admin = createAdminClient();

  try {
    await createWorkspaceForNewUser({
      userId: authData.user.id,
      email,
      name,
      businessName,
    });
  } catch (err) {
    console.error("[signUpAction] workspace provisioning failed:", err);
    await admin.auth.admin.deleteUser(authData.user.id);
    authRedirect("/sign-up", { error: "Failed to set up your workspace. Please try again." });
  }

  if (!authData.session) {
    authRedirect("/sign-in", {
      message: "Check your email to confirm your account, then sign in.",
    });
  }

  redirect("/app/dashboard");
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  requireBackend("/forgot-password");
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed";
    authRedirect("/forgot-password", { error: msg });
  }

  const supabase = await createClient();
  const env = clientEnv();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  });

  if (error) {
    authRedirect("/forgot-password", { error: error.message });
  }

  authRedirect("/forgot-password", {
    message: "If an account exists for that email, we sent a reset link.",
  });
}

export async function signOutAction(): Promise<void> {
  if (!isBackendConfigured()) redirect("/sign-in");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
