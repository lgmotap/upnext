import { config } from "dotenv";
config({ path: ".env.local", override: false });

const { prisma } = await import("../lib/db/prisma");

const org = await prisma.organization.findFirst({
  where: { businessProfile: { publicSlug: "smoke-test-co" } },
});
if (!org) {
  console.log("No smoke-test-co org");
  process.exit(0);
}

const existing = await prisma.service.findFirst({
  where: { organizationId: org.id, isAddon: true },
});
if (!existing) {
  await prisma.service.create({
    data: {
      organizationId: org.id,
      name: "Inside Fridge",
      description: "Deep clean inside refrigerator",
      durationMinutes: 30,
      basePriceCents: 3500,
      isAddon: true,
      isPublic: true,
      isActive: true,
    },
  });
  console.log("Created addon: Inside Fridge");
} else {
  console.log("Addon exists:", existing.name);
}

await prisma.$disconnect();
