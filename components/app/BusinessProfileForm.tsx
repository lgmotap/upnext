"use client";

import { useState } from "react";
import { Briefcase, MapPin, Building2 } from "lucide-react";
import { serviceTypes, teamSizes } from "@/lib/config";
import { ServiceAreaFields } from "@/components/app/ServiceAreaFields";
import { ServiceAreaEnforcementFields } from "@/components/app/ServiceAreaEnforcementFields";
import { AddressAutocompleteFields } from "@/components/maps/AddressAutocompleteFields";
import type { ServiceAreaScope } from "@/lib/business/service-area";
import type { ServiceAreaEnforcementMode } from "@/lib/business/service-area-enforcement";
import { CURRENCIES, TIMEZONES } from "@/server/validators/onboarding";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";
const sectionTitle = "flex items-center gap-2 text-sm font-bold text-ink-950";

export type BusinessProfileFormDefaults = {
  businessType: string;
  teamSize: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  displayName: string;
  email: string;
  phone: string;
  timezone: string;
  currency: string;
  description: string;
  websiteUrl: string;
  serviceAreaScope: ServiceAreaScope;
  serviceAreaCustom: string;
  serviceAreaEnforcementMode: ServiceAreaEnforcementMode;
  serviceAreaZipCodesRaw: string;
  serviceAreaRadiusMiles: string;
  addressLatitude: string;
  addressLongitude: string;
};

type Props = {
  defaults: BusinessProfileFormDefaults;
  publicSlug: string;
  canEdit: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export function BusinessProfileForm({ defaults, publicSlug, canEdit, action }: Props) {
  const [city, setCity] = useState(defaults.city);
  const [region, setRegion] = useState(defaults.region);
  const [scope, setScope] = useState<ServiceAreaScope>(defaults.serviceAreaScope);
  const [customLabel, setCustomLabel] = useState(defaults.serviceAreaCustom);
  const [enforcementMode, setEnforcementMode] = useState<ServiceAreaEnforcementMode>(
    defaults.serviceAreaEnforcementMode,
  );
  const [zipCodesRaw, setZipCodesRaw] = useState(defaults.serviceAreaZipCodesRaw);
  const [radiusMiles, setRadiusMiles] = useState(defaults.serviceAreaRadiusMiles);
  const [addressLat, setAddressLat] = useState(defaults.addressLatitude);
  const [addressLng, setAddressLng] = useState(defaults.addressLongitude);

  const hasOriginCoordinates = Boolean(addressLat && addressLng);

  return (
    <form action={action} className="space-y-4">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-100 shadow-soft">
        <h3 className={sectionTitle}>
          <Briefcase className="size-4 text-brand-600" />
          Industry &amp; team
        </h3>
        <p className="mt-1 text-sm text-ink-500">Sets your starter service catalog and how we tailor defaults.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="businessType">
              Primary service type
            </label>
            <select
              id="businessType"
              name="businessType"
              defaultValue={defaults.businessType}
              disabled={!canEdit}
              className={input}
              required
            >
              <option value="">Select…</option>
              {serviceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="teamSize">
              Team size
            </label>
            <select
              id="teamSize"
              name="teamSize"
              defaultValue={defaults.teamSize}
              disabled={!canEdit}
              className={input}
              required
            >
              <option value="">Select…</option>
              {teamSizes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-100 shadow-soft">
        <h3 className={sectionTitle}>
          <MapPin className="size-4 text-brand-600" />
          Business address
        </h3>
        <p className="mt-1 text-sm text-ink-500">Your business location — used on invoices and internal records.</p>
        <div className="mt-4">
          <AddressAutocompleteFields
            defaults={{
              line1: defaults.addressLine1,
              line2: defaults.addressLine2,
              city: defaults.city,
              region: defaults.region,
              postalCode: defaults.postalCode,
            }}
            line1Name="addressLine1"
            line2Name="addressLine2"
            countryValue={defaults.country || "US"}
            disabled={!canEdit}
            onCityChange={setCity}
            onRegionChange={setRegion}
            onCoordinatesChange={(coords) => {
              if (coords) {
                setAddressLat(String(coords.latitude));
                setAddressLng(String(coords.longitude));
              }
            }}
            idPrefix="biz-addr"
          />
          <input type="hidden" name="addressLatitude" value={addressLat} />
          <input type="hidden" name="addressLongitude" value={addressLng} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-100 shadow-soft">
        <h3 className={sectionTitle}>
          <MapPin className="size-4 text-brand-600" />
          Service area
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Shown on your booking page and in the sidebar — pick how you describe where you work.
        </p>
        <div className="mt-4">
          <ServiceAreaFields
            city={city}
            region={region}
            scope={scope}
            customLabel={customLabel}
            onScopeChange={setScope}
            onCustomLabelChange={setCustomLabel}
            disabled={!canEdit}
          />
          <ServiceAreaEnforcementFields
            mode={enforcementMode}
            zipCodesRaw={zipCodesRaw}
            radiusMiles={radiusMiles}
            hasOriginCoordinates={hasOriginCoordinates}
            onModeChange={setEnforcementMode}
            onZipCodesRawChange={setZipCodesRaw}
            onRadiusMilesChange={setRadiusMiles}
            disabled={!canEdit}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-100 shadow-soft">
        <h3 className={sectionTitle}>
          <Building2 className="size-4 text-brand-600" />
          Public profile
        </h3>
        <p className="mt-1 text-sm text-ink-500">Name, contact, and regional settings for your booking page.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="displayName">
              Business name
            </label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={defaults.displayName}
              disabled={!canEdit}
              className={input}
              required
            />
          </div>
          <div>
            <label className={label}>Public booking slug</label>
            <div className="flex items-center rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600 ring-1 ring-ink-200">
              /book/{publicSlug}
            </div>
          </div>
          <div>
            <label className={label} htmlFor="email">
              Contact email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={defaults.email}
              disabled={!canEdit}
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={defaults.phone}
              placeholder="(512) 555-0142"
              disabled={!canEdit}
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="timezone">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              defaultValue={defaults.timezone}
              disabled={!canEdit}
              className={input}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="currency">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={defaults.currency}
              disabled={!canEdit}
              className={input}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="websiteUrl">
              Website
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={defaults.websiteUrl}
              placeholder="https://yourbusiness.com"
              disabled={!canEdit}
              className={input}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={defaults.description}
              disabled={!canEdit}
              className={input}
              placeholder="What you do, in one or two sentences."
            />
          </div>
        </div>
      </section>

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
          >
            Save changes
          </button>
        </div>
      )}
    </form>
  );
}
