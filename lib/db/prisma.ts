import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Dev HMR can keep a singleton from before `prisma generate` added new models. */
function isStalePrismaClient(client: PrismaClient): boolean {
  const delegate = (client as PrismaClient & { bookingFormField?: { findMany?: unknown } }).bookingFormField;
  return delegate?.findMany == null;
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && !isStalePrismaClient(cached)) {
    return cached;
  }
  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
