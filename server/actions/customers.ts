"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { addCustomerAddress, updateCustomerNotes } from "@/server/repositories/customers";
import { customerAddressSchema, customerNotesSchema } from "@/server/validators/customer";
import { sendCustomerPortalLinkFromOwner } from "@/server/services/customer-portal";

function customerRedirect(customerId: string, params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(qs ? `/app/customers/${customerId}?${qs}` : `/app/customers/${customerId}`);
}

export async function updateCustomerNotesAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/customers?error=denied");

  const parsed = customerNotesSchema.safeParse({
    customerId: formData.get("customerId"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    const id = String(formData.get("customerId") ?? "");
    customerRedirect(id, { error: "Invalid notes." });
  }

  await updateCustomerNotes(session.organizationId, parsed.data.customerId, parsed.data.notes);
  revalidatePath(`/app/customers/${parsed.data.customerId}`);
  customerRedirect(parsed.data.customerId, { saved: "notes" });
}

export async function addCustomerAddressAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/customers?error=denied");

  const parsed = customerAddressSchema.safeParse({
    customerId: formData.get("customerId"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") ?? "US",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    const id = String(formData.get("customerId") ?? "");
    customerRedirect(id, { error: "Please check the address fields." });
  }

  const created = await addCustomerAddress(session.organizationId, parsed.data.customerId, parsed.data);
  if (!created) customerRedirect(parsed.data.customerId, { error: "Customer not found." });

  revalidatePath(`/app/customers/${parsed.data.customerId}`);
  customerRedirect(parsed.data.customerId, { saved: "address" });
}

export async function sendCustomerPortalLinkAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) redirect("/app/customers?error=denied");

  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) redirect("/app/customers?error=denied");

  const result = await sendCustomerPortalLinkFromOwner(session.organizationId, customerId);
  if (!result.ok) {
    customerRedirect(customerId, { error: result.error });
  }

  customerRedirect(customerId, { saved: "portal" });
}
