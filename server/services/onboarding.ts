import { prisma } from "@/lib/db/prisma";
import { slugify, withRandomSuffix } from "@/lib/utils/slug";

type CreateWorkspaceInput = {
  userId: string;
  email: string;
  name: string;
  businessName: string;
};

async function uniqueSlug(base: string): Promise<string> {
  let candidate = slugify(base) || "business";
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = withRandomSuffix(slugify(base) || "business");
  }
  return withRandomSuffix("business");
}

/** Provision User + Organization + owner Membership + BusinessProfile after Supabase sign-up. */
export async function createWorkspaceForNewUser(input: CreateWorkspaceInput) {
  const slug = await uniqueSlug(input.businessName);

  return prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: input.userId },
      create: {
        id: input.userId,
        email: input.email,
        name: input.name,
      },
      update: {
        email: input.email,
        name: input.name,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: input.businessName,
        slug,
        ownerId: input.userId,
      },
    });

    await tx.membership.create({
      data: {
        organizationId: organization.id,
        userId: input.userId,
        role: "owner",
        status: "active",
      },
    });

    const businessProfile = await tx.businessProfile.create({
      data: {
        organizationId: organization.id,
        displayName: input.businessName,
        publicSlug: slug,
        email: input.email,
        bookingEnabled: true,
      },
    });

    return { organization, businessProfile };
  });
}
