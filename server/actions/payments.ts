"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBilling, canManageBookings } from "@/server/permissions/can";
import {
  createJobCheckoutSession,
  createStripeConnectOnboardingLink,
  markPaymentStatusManual,
  syncStripeConnectStatus,
} from "@/server/services/payments";

export async function startStripeConnectAction(): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBilling(session)) redirect("/app/settings/billing?error=denied");

  const result = await createStripeConnectOnboardingLink(session.organizationId, session.email);
  if (!result.ok) redirect(`/app/settings/billing?error=${encodeURIComponent(result.error)}`);

  redirect(result.url);
}

export async function syncStripeConnectAction(): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBilling(session)) redirect("/app/settings/billing?error=denied");

  await syncStripeConnectStatus(session.organizationId);
  revalidatePath("/app/settings/billing");
  redirect("/app/settings/billing");
}

export async function requestJobPaymentLinkAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/jobs?error=denied");

  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) redirect("/app/jobs");

  const result = await createJobCheckoutSession(session.organizationId, jobId);
  if (!result.ok) redirect(`/app/jobs/${jobId}?error=${encodeURIComponent(result.error)}`);

  revalidatePath(`/app/jobs/${jobId}`);
  revalidatePath("/app/payments");

  if (result.url) redirect(result.url);
  redirect(`/app/jobs/${jobId}?payment=link_created`);
}

export async function markJobPaymentPaidAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/jobs?error=denied");

  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) redirect("/app/jobs");

  const result = await markPaymentStatusManual(session.organizationId, jobId, "paid");
  if (!result.ok) redirect(`/app/jobs/${jobId}?error=${encodeURIComponent(result.error)}`);

  revalidatePath(`/app/jobs/${jobId}`);
  revalidatePath("/app/payments");
  redirect(`/app/jobs/${jobId}?payment=paid`);
}

export async function markJobPaymentOverdueAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/jobs?error=denied");

  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) redirect("/app/jobs");

  const result = await markPaymentStatusManual(session.organizationId, jobId, "overdue");
  if (!result.ok) redirect(`/app/jobs/${jobId}?error=${encodeURIComponent(result.error)}`);

  revalidatePath(`/app/jobs/${jobId}`);
  revalidatePath("/app/payments");
  redirect(`/app/jobs/${jobId}`);
}
