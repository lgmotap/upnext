"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import {
  countBookingFormFields,
  createBookingFormField,
  deleteBookingFormField,
  listBookingFormFields,
  MAX_FIELDS,
  updateBookingFormField,
} from "@/server/repositories/booking-form-fields";
import {
  bookingFormFieldSchema,
  slugifyFieldKey,
} from "@/server/validators/booking-form-fields";

export async function createBookingFormFieldAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/booking-form?error=denied");
  }

  const parsed = bookingFormFieldSchema.safeParse({
    label: formData.get("label"),
    fieldType: formData.get("fieldType"),
    options: String(formData.get("options") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    required: formData.get("required") === "on",
  });
  if (!parsed.success) redirect("/app/settings/booking-form?error=invalid");

  const count = await countBookingFormFields(session.organizationId);
  if (count >= MAX_FIELDS) redirect("/app/settings/booking-form?error=limit");

  const keyBase = slugifyFieldKey(parsed.data.label);
  const key = `${keyBase}_${Date.now().toString(36).slice(-4)}`;

  await createBookingFormField(session.organizationId, {
    key,
    label: parsed.data.label,
    fieldType: parsed.data.fieldType,
    optionsJson:
      parsed.data.fieldType === "select" ? parsed.data.options ?? [] : undefined,
    required: parsed.data.required,
    sortOrder: count,
  });

  revalidatePath("/app/settings/booking-form");
  redirect("/app/settings/booking-form?saved=1");
}

export async function deleteBookingFormFieldAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) {
    redirect("/app/settings/booking-form?error=denied");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/app/settings/booking-form?error=invalid");
  await deleteBookingFormField(session.organizationId, id);
  revalidatePath("/app/settings/booking-form");
  redirect("/app/settings/booking-form?saved=1");
}

export async function moveBookingFormFieldAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBusiness(session)) redirect("/app/settings/booking-form?error=denied");
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    redirect("/app/settings/booking-form?error=invalid");
  }

  const fields = await listBookingFormFields(session.organizationId);
  const index = fields.findIndex((f) => f.id === id);
  if (index < 0) redirect("/app/settings/booking-form?error=invalid");
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= fields.length) redirect("/app/settings/booking-form");

  const current = fields[index];
  const other = fields[swapIndex];
  await updateBookingFormField(session.organizationId, current.id, { sortOrder: other.sortOrder });
  await updateBookingFormField(session.organizationId, other.id, { sortOrder: current.sortOrder });

  revalidatePath("/app/settings/booking-form");
  redirect("/app/settings/booking-form?saved=1");
}
