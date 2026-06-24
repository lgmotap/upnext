import { prisma } from "@/lib/db/prisma";

export function listApiKeys(organizationId: string) {
  return prisma.apiKey.findMany({
    where: { organizationId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
}

export function authenticateApiKey(keyHash: string) {
  return prisma.apiKey
    .findFirst({
      where: { keyHash, revokedAt: null },
      select: { id: true, organizationId: true },
    })
    .then(async (row) => {
      if (!row) return null;
      await prisma.apiKey.update({
        where: { id: row.id },
        data: { lastUsedAt: new Date() },
      });
      return { organizationId: row.organizationId, apiKeyId: row.id };
    });
}

export function createApiKeyRecord(
  organizationId: string,
  data: { name: string; keyPrefix: string; keyHash: string },
) {
  return prisma.apiKey.create({
    data: {
      organizationId,
      name: data.name,
      keyPrefix: data.keyPrefix,
      keyHash: data.keyHash,
    },
  });
}

export function revokeApiKey(organizationId: string, apiKeyId: string) {
  return prisma.apiKey.updateMany({
    where: { id: apiKeyId, organizationId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
