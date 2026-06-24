-- Sprint 15: bed/bath pricing parameters

CREATE TYPE "PricingParameterType" AS ENUM ('bedrooms', 'bathrooms');

CREATE TABLE "ServicePricingParameter" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "parameterType" "PricingParameterType" NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "includedUnits" INTEGER NOT NULL DEFAULT 0,
    "maxUnits" INTEGER NOT NULL DEFAULT 10,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePricingParameter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServicePricingParameter_serviceId_parameterType_key" ON "ServicePricingParameter"("serviceId", "parameterType");
CREATE INDEX "ServicePricingParameter_serviceId_idx" ON "ServicePricingParameter"("serviceId");

ALTER TABLE "ServicePricingParameter" ADD CONSTRAINT "ServicePricingParameter_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BookingRequestParameter" (
    "id" TEXT NOT NULL,
    "bookingRequestId" TEXT NOT NULL,
    "parameterType" "PricingParameterType" NOT NULL,
    "units" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRequestParameter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingRequestParameter_bookingRequestId_parameterType_key" ON "BookingRequestParameter"("bookingRequestId", "parameterType");
CREATE INDEX "BookingRequestParameter_bookingRequestId_idx" ON "BookingRequestParameter"("bookingRequestId");

ALTER TABLE "BookingRequestParameter" ADD CONSTRAINT "BookingRequestParameter_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
