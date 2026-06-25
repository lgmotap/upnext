import { prisma } from "@/lib/db/prisma";
import type { BookingFormFieldType, Prisma } from "@/generated/prisma/client";

const MAX_FIELDS = 10;

export function listActiveBookingFormFields(organizationId: string) {
  return prisma.bookingFormField.findMany({
    where: { organizationId, active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export function listBookingFormFields(organizationId: string) {
  return prisma.bookingFormField.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function countBookingFormFields(organizationId: string) {
  return prisma.bookingFormField.count({ where: { organizationId } });
}

export function createBookingFormField(
  organizationId: string,
  data: {
    key: string;
    label: string;
    fieldType: BookingFormFieldType;
    optionsJson?: Prisma.InputJsonValue;
    required: boolean;
    sortOrder: number;
  },
) {
  return prisma.bookingFormField.create({
    data: {
      organizationId,
      key: data.key,
      label: data.label,
      fieldType: data.fieldType,
      optionsJson: data.optionsJson ?? undefined,
      required: data.required,
      sortOrder: data.sortOrder,
    },
  });
}

export function updateBookingFormField(
  organizationId: string,
  id: string,
  data: Partial<{
    label: string;
    fieldType: BookingFormFieldType;
    optionsJson: Prisma.InputJsonValue;
    required: boolean;
    sortOrder: number;
    active: boolean;
  }>,
) {
  return prisma.bookingFormField.updateMany({
    where: { id, organizationId },
    data,
  });
}

export function deleteBookingFormField(organizationId: string, id: string) {
  return prisma.bookingFormField.deleteMany({ where: { id, organizationId } });
}

export { MAX_FIELDS };
