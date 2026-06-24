import { prisma } from "@/lib/db/prisma";
import { findCustomerByEmail } from "@/server/repositories/customers";
import type { CustomerImportRow } from "@/server/validators/customer-import";

export async function createCustomerRecord(
  organizationId: string,
  row: CustomerImportRow,
) {
  if (row.line1) {
    return prisma.customer.create({
      data: {
        organizationId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email.toLowerCase(),
        phone: row.phone ?? null,
        addresses: {
          create: {
            line1: row.line1,
            line2: row.line2 ?? null,
            city: row.city!,
            region: row.region!,
            postalCode: row.postalCode!,
            country: row.country ?? "US",
            isDefault: true,
          },
        },
      },
    });
  }

  return prisma.customer.create({
    data: {
      organizationId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email.toLowerCase(),
      phone: row.phone ?? null,
    },
  });
}

export async function updateCustomerFromImport(
  organizationId: string,
  customerId: string,
  row: CustomerImportRow,
) {
  await prisma.customer.updateMany({
    where: { id: customerId, organizationId },
    data: {
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone ?? null,
    },
  });

  if (!row.line1) return;

  const existing = await prisma.customerAddress.findFirst({
    where: { customerId, isDefault: true },
    select: { id: true },
  });

  if (existing) {
    await prisma.customerAddress.update({
      where: { id: existing.id },
      data: {
        line1: row.line1,
        line2: row.line2 ?? null,
        city: row.city!,
        region: row.region!,
        postalCode: row.postalCode!,
        country: row.country ?? "US",
      },
    });
    return;
  }

  await prisma.customerAddress.create({
    data: {
      customerId,
      line1: row.line1,
      line2: row.line2 ?? null,
      city: row.city!,
      region: row.region!,
      postalCode: row.postalCode!,
      country: row.country ?? "US",
      isDefault: true,
    },
  });
}

export async function importCustomerRow(organizationId: string, row: CustomerImportRow) {
  const existing = await findCustomerByEmail(organizationId, row.email);
  if (!existing) {
    await createCustomerRecord(organizationId, row);
    return "created" as const;
  }

  await updateCustomerFromImport(organizationId, existing.id, row);
  return "updated" as const;
}
