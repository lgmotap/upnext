/**
 * Smoke: read API v1 + outbound webhooks.
 * Run: npm run smoke:api
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { createWorkspaceForNewUser } = await import("../server/services/onboarding");
const { generateApiKey } = await import("../lib/api/keys");
const { createApiKeyRecord } = await import("../server/repositories/api-keys");
const { createWebhookEndpoint } = await import("../server/repositories/webhooks");
const { emitOrgWebhook } = await import("../server/services/webhooks");
const { GET: getBookings } = await import("../app/api/v1/bookings/route");
const { GET: getCustomers } = await import("../app/api/v1/customers/route");
const { GET: getServices } = await import("../app/api/v1/services/route");

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("▶ API v1 + webhooks smoke\n");

  const suffix = randomUUID().slice(0, 8);
  const { organization } = await createWorkspaceForNewUser({
    userId: `api-smoke-${suffix}`,
    email: `api-smoke+${suffix}@upnext.local`,
    name: "API Smoke Owner",
    businessName: `API Smoke ${suffix}`,
  });

  let booking = await prisma.bookingRequest.findFirst({
    where: { organizationId: organization.id },
  });
  if (!booking) {
    const service = await prisma.service.findFirst({
      where: { organizationId: organization.id, isAddon: false },
    });
    if (!service) throw new Error("Expected primary service from catalog");
    let customer = await prisma.customer.findFirst({ where: { organizationId: organization.id } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          organizationId: organization.id,
          firstName: "API",
          lastName: "Smoke",
          email: `api-customer+${suffix}@upnext.local`,
          addresses: {
            create: {
              line1: "1 Test St",
              city: "Austin",
              region: "TX",
              postalCode: "78701",
              isDefault: true,
            },
          },
        },
      });
    }
    booking = await prisma.bookingRequest.create({
      data: {
        organizationId: organization.id,
        customerId: customer.id,
        serviceId: service.id,
        requestedStartAt: new Date(Date.now() + 86_400_000),
        requestedEndAt: new Date(Date.now() + 90_000_000),
        status: "pending",
      },
    });
  }

  const { rawKey, keyPrefix, keyHash } = generateApiKey();
  await createApiKeyRecord(organization.id, { name: "Smoke key", keyPrefix, keyHash });
  console.log("✓ API key created");

  const authHeader = { Authorization: `Bearer ${rawKey}` };

  const bookingsRes = await getBookings(
    new Request("http://localhost/api/v1/bookings?limit=10", { headers: authHeader }),
  );
  if (!bookingsRes.ok) throw new Error(`bookings HTTP ${bookingsRes.status}`);
  const bookingsBody = await bookingsRes.json();
  if (!Array.isArray(bookingsBody.data) || bookingsBody.data.length === 0) {
    throw new Error("Expected bookings in API response");
  }
  console.log(`✓ GET /api/v1/bookings → ${bookingsBody.data.length} row(s)`);

  const customersRes = await getCustomers(
    new Request("http://localhost/api/v1/customers", { headers: authHeader }),
  );
  if (!customersRes.ok) throw new Error(`customers HTTP ${customersRes.status}`);
  const customersBody = await customersRes.json();
  if (!Array.isArray(customersBody.data) || customersBody.data.length === 0) {
    throw new Error("Expected customers in API response");
  }
  console.log(`✓ GET /api/v1/customers → ${customersBody.data.length} row(s)`);

  const servicesRes = await getServices(
    new Request("http://localhost/api/v1/services", { headers: authHeader }),
  );
  if (!servicesRes.ok) throw new Error(`services HTTP ${servicesRes.status}`);
  const servicesBody = await servicesRes.json();
  if (!Array.isArray(servicesBody.data) || servicesBody.data.length === 0) {
    throw new Error("Expected services in API response");
  }
  console.log(`✓ GET /api/v1/services → ${servicesBody.data.length} row(s)`);

  const badRes = await getBookings(new Request("http://localhost/api/v1/bookings"));
  if (badRes.status !== 401) throw new Error("Expected 401 without Bearer token");
  console.log("✓ Unauthorized without API key");

  await createWebhookEndpoint(organization.id, {
    url: "https://example.invalid/upnext-webhook-smoke",
    secret: "whsec_smoke_test_secret",
    events: ["booking_created"],
  });

  emitOrgWebhook(organization.id, "booking_created", {
    bookingRequestId: bookingsBody.data[0].id,
    test: true,
  });

  await sleep(500);

  const delivery = await prisma.webhookDelivery.findFirst({
    where: { webhookEndpoint: { organizationId: organization.id } },
    orderBy: { createdAt: "desc" },
  });
  if (!delivery) throw new Error("Expected webhook delivery log row");
  console.log(`✓ Webhook delivery logged (${delivery.status}, attempts=${delivery.attemptCount})`);

  console.log("\n✅ API smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
