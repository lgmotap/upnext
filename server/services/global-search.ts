import { prisma } from "@/lib/db/prisma";

export type GlobalSearchResult = {
  id: string;
  type: "customer" | "job" | "booking";
  label: string;
  sublabel: string;
  href: string;
};

const LIMIT = 5;

export async function globalSearch(organizationId: string, rawQuery: string): Promise<GlobalSearchResult[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];

  const contains = { contains: q, mode: "insensitive" as const };

  const [customers, jobs, bookings] = await Promise.all([
    prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { firstName: contains },
          { lastName: contains },
          { email: contains },
          { phone: contains },
        ],
      },
      take: LIMIT,
      orderBy: { updatedAt: "desc" },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.job.findMany({
      where: {
        organizationId,
        OR: [
          { title: contains },
          { customer: { firstName: contains } },
          { customer: { lastName: contains } },
          { customer: { email: contains } },
        ],
      },
      take: LIMIT,
      orderBy: { scheduledStartAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.bookingRequest.findMany({
      where: {
        organizationId,
        OR: [
          { customer: { firstName: contains } },
          { customer: { lastName: contains } },
          { customer: { email: contains } },
          { service: { name: contains } },
        ],
      },
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        customer: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  const results: GlobalSearchResult[] = [];

  for (const c of customers) {
    results.push({
      id: c.id,
      type: "customer",
      label: `${c.firstName} ${c.lastName}`.trim(),
      sublabel: c.email,
      href: `/app/customers/${c.id}`,
    });
  }
  for (const j of jobs) {
    results.push({
      id: j.id,
      type: "job",
      label: j.title,
      sublabel: `${j.customer.firstName} ${j.customer.lastName} · ${j.status}`,
      href: `/app/jobs/${j.id}`,
    });
  }
  for (const b of bookings) {
    results.push({
      id: b.id,
      type: "booking",
      label: `${b.customer.firstName} ${b.customer.lastName} — ${b.service.name}`,
      sublabel: b.status,
      href: `/app/bookings/${b.id}`,
    });
  }

  return results.slice(0, 15);
}
