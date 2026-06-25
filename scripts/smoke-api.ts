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
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { GET: getBookings } = await import("../app/api/v1/bookings/route");
const { GET: getCustomers } = await import("../app/api/v1/customers/route");
const { GET: getServices } = await import("../app/api/v1/services/route");
const { GET: getExtras } = await import("../app/api/v1/extras/route");
const { GET: getAvailability } = await import("../app/api/v1/availability/route");
const { GET: getFrequencies } = await import("../app/api/v1/frequencies/route");
const { GET: getCategories } = await import("../app/api/v1/categories/route");
const { GET: getCompany } = await import("../app/api/v1/company/route");
const { GET: getSettings } = await import("../app/api/v1/settings/route");

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

  await saveWeeklyAvailability(organization.id, { rules: defaultWeeklyRules() });

  let booking = await prisma.bookingRequest.findFirst({
    where: { organizationId: organization.id },
  });
  const service = await prisma.service.findFirst({
    where: { organizationId: organization.id, isAddon: false },
  });
  if (!service) throw new Error("Expected primary service from catalog");

  if (!booking) {
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

  const extrasRes = await getExtras(
    new Request("http://localhost/api/v1/extras", { headers: authHeader }),
  );
  if (!extrasRes.ok) throw new Error(`extras HTTP ${extrasRes.status}`);
  const extrasBody = await extrasRes.json();
  if (!Array.isArray(extrasBody.data)) throw new Error("extras data must be array");
  console.log(`✓ GET /api/v1/extras → ${extrasBody.data.length} row(s)`);

  const categoriesRes = await getCategories(
    new Request("http://localhost/api/v1/categories", { headers: authHeader }),
  );
  if (!categoriesRes.ok) throw new Error(`categories HTTP ${categoriesRes.status}`);
  const categoriesBody = await categoriesRes.json();
  if (!Array.isArray(categoriesBody.data) || categoriesBody.data.length < 2) {
    throw new Error("Expected primary + addons categories");
  }
  console.log(`✓ GET /api/v1/categories → ${categoriesBody.data.length} group(s)`);

  const frequenciesRes = await getFrequencies(
    new Request("http://localhost/api/v1/frequencies", { headers: authHeader }),
  );
  if (!frequenciesRes.ok) throw new Error(`frequencies HTTP ${frequenciesRes.status}`);
  const frequenciesBody = await frequenciesRes.json();
  if (!Array.isArray(frequenciesBody.data) || frequenciesBody.data.length < 4) {
    throw new Error("Expected frequency options");
  }
  console.log(`✓ GET /api/v1/frequencies → ${frequenciesBody.data.length} option(s)`);

  const companyRes = await getCompany(
    new Request("http://localhost/api/v1/company", { headers: authHeader }),
  );
  if (!companyRes.ok) throw new Error(`company HTTP ${companyRes.status}`);
  const companyBody = await companyRes.json();
  if (!companyBody.data?.name) throw new Error("Expected company name");
  console.log(`✓ GET /api/v1/company → ${companyBody.data.name}`);

  const settingsRes = await getSettings(
    new Request("http://localhost/api/v1/settings", { headers: authHeader }),
  );
  if (!settingsRes.ok) throw new Error(`settings HTTP ${settingsRes.status}`);
  const settingsBody = await settingsRes.json();
  if (settingsBody.data?.minNoticeHours == null) throw new Error("Expected minNoticeHours");
  console.log(`✓ GET /api/v1/settings → minNoticeHours=${settingsBody.data.minNoticeHours}`);

  const { getOrgAvailableDays } = await import("../server/services/bookings");
  const days = (await getOrgAvailableDays(organization.id, service.id))?.days ?? [];
  if (days.length === 0) throw new Error("No bookable days for availability API");
  const availRes = await getAvailability(
    new Request(
      `http://localhost/api/v1/availability?serviceId=${service.id}&date=${days[0].date}`,
      { headers: authHeader },
    ),
  );
  if (!availRes.ok) throw new Error(`availability HTTP ${availRes.status}`);
  const availBody = await availRes.json();
  if (!Array.isArray(availBody.data)) throw new Error("availability data must be array");
  console.log(`✓ GET /api/v1/availability → ${availBody.data.length} slot(s)`);

  const badRes = await getBookings(new Request("http://localhost/api/v1/bookings"));
  if (badRes.status !== 401) throw new Error("Expected 401 without Bearer token");
  console.log("✓ Unauthorized without API key");

  const otherSuffix = randomUUID().slice(0, 8);
  const { organization: otherOrg } = await createWorkspaceForNewUser({
    userId: `api-smoke-other-${otherSuffix}`,
    email: `api-smoke-other+${otherSuffix}@upnext.local`,
    name: "Other Owner",
    businessName: `Other Org ${otherSuffix}`,
  });
  const otherKey = generateApiKey();
  await createApiKeyRecord(otherOrg.id, {
    name: "Other key",
    keyPrefix: otherKey.keyPrefix,
    keyHash: otherKey.keyHash,
  });
  const otherBookings = await getBookings(
    new Request("http://localhost/api/v1/bookings", {
      headers: { Authorization: `Bearer ${otherKey.rawKey}` },
    }),
  );
  const otherBody = await otherBookings.json();
  const leaked = otherBody.data?.some((b: { id: string }) => b.id === bookingsBody.data[0].id);
  if (leaked) throw new Error("Tenant isolation failed — key B saw org A booking");
  console.log("✓ Tenant isolation OK");

  await createWebhookEndpoint(organization.id, {
    url: "https://example.invalid/upnext-webhook-smoke",
    secret: "whsec_smoke_test_secret",
    events: ["booking_created", "booking_canceled"],
  });

  emitOrgWebhook(organization.id, "booking_created", {
    bookingRequestId: bookingsBody.data[0].id,
    test: true,
  });
  emitOrgWebhook(organization.id, "booking_canceled", {
    bookingRequestId: bookingsBody.data[0].id,
    test: true,
  });

  await sleep(500);

  const delivery = await prisma.webhookDelivery.findFirst({
    where: { webhookEndpoint: { organizationId: organization.id } },
    orderBy: { createdAt: "desc" },
  });
  if (!delivery) throw new Error("Expected webhook delivery log row");
  console.log(`✓ Webhook delivery logged (${delivery.status}, event=${delivery.event})`);

  console.log("\n✅ API smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
