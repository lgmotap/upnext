"use client";

import { useId, useState } from "react";
import { isGoogleMapsConfigured } from "@/lib/maps/google-maps-config";
import { PlaceAutocompleteLine1 } from "@/components/maps/PlaceAutocompleteLine1";
import type { ParsedPlaceAddress } from "@/lib/maps/parse-place-address";
import { US_REGIONS } from "@/server/validators/onboarding";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

type AddressDefaults = {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
};

type Props = {
  defaults: AddressDefaults;
  disabled?: boolean;
  line1Name?: string;
  line2Name?: string;
  cityName?: string;
  regionName?: string;
  postalCodeName?: string;
  countryName?: string;
  countryValue?: string;
  regionAsSelect?: boolean;
  idPrefix?: string;
  onCityChange?: (city: string) => void;
  onRegionChange?: (region: string) => void;
  onCoordinatesChange?: (coords: { latitude: number; longitude: number } | null) => void;
  line1Label?: string;
  line2Label?: string;
  compact?: boolean;
  className?: string;
};

export function AddressAutocompleteFields({
  defaults,
  disabled = false,
  line1Name = "addressLine1",
  line2Name = "addressLine2",
  cityName = "city",
  regionName = "region",
  postalCodeName = "postalCode",
  countryName = "country",
  countryValue = "US",
  regionAsSelect = true,
  idPrefix = "",
  onCityChange,
  onRegionChange,
  onCoordinatesChange,
  line1Label = "Street address",
  line2Label = "Suite / unit (optional)",
  compact = false,
  className,
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const prefix = idPrefix || reactId;

  const [line2, setLine2] = useState(defaults.line2 ?? "");
  const [city, setCity] = useState(defaults.city);
  const [region, setRegion] = useState(defaults.region);
  const [postalCode, setPostalCode] = useState(defaults.postalCode);
  const [placesHint, setPlacesHint] = useState(isGoogleMapsConfigured());

  const handleCityChange = (value: string) => {
    setCity(value);
    onCityChange?.(value);
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
    onRegionChange?.(value);
  };

  const handleAddressSelect = (parsed: ParsedPlaceAddress) => {
    setPlacesHint(true);
    setLine2(parsed.line2 ?? "");
    setCity(parsed.city);
    setRegion(parsed.region);
    setPostalCode(parsed.postalCode);
    onCityChange?.(parsed.city);
    onRegionChange?.(parsed.region);
    if (parsed.latitude != null && parsed.longitude != null) {
      onCoordinatesChange?.({ latitude: parsed.latitude, longitude: parsed.longitude });
    }
  };

  const regionField = regionAsSelect ? (
    <select
      id={`${prefix}-region`}
      name={regionName}
      value={region}
      onChange={(e) => handleRegionChange(e.target.value)}
      disabled={disabled}
      className={input}
      required
      autoComplete="address-level1"
    >
      <option value="">{compact ? "State / region" : "Select…"}</option>
      {US_REGIONS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  ) : (
    <input
      id={`${prefix}-region`}
      name={regionName}
      value={region}
      onChange={(e) => handleRegionChange(e.target.value)}
      disabled={disabled}
      className={input}
      required
      placeholder="State / region"
      autoComplete="address-level1"
    />
  );

  const line1Field = (
    <PlaceAutocompleteLine1
      id={`${prefix}-line1`}
      name={line1Name}
      defaultValue={defaults.line1}
      placeholder={compact ? "Street address" : "123 Main St"}
      disabled={disabled}
      className={compact ? "sm:col-span-2" : undefined}
      inputClassName={compact ? `sm:col-span-2 ${input}` : input}
      onAddressSelect={handleAddressSelect}
    />
  );

  if (compact) {
    return (
      <div className={className ?? "sm:col-span-2 grid gap-3 sm:grid-cols-2"}>
        {placesHint && (
          <p className="sm:col-span-2 text-xs text-ink-500">
            Start typing your address — we&apos;ll fill city, state, and ZIP.
          </p>
        )}
        {line1Field}
        <input
          id={`${prefix}-line2`}
          name={line2Name}
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Apt / suite (optional)"
          disabled={disabled}
          className={`sm:col-span-2 ${input}`}
          autoComplete="address-line2"
        />
        <input
          id={`${prefix}-city`}
          name={cityName}
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          placeholder="City"
          disabled={disabled}
          className={input}
          required
          autoComplete="address-level2"
        />
        {regionField}
        <input
          id={`${prefix}-postal`}
          name={postalCodeName}
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="ZIP / postal code"
          disabled={disabled}
          className={input}
          required
          autoComplete="postal-code"
        />
        <input type="hidden" name={countryName} value={countryValue} />
      </div>
    );
  }

  return (
    <div className={className ?? "space-y-4"}>
      {placesHint && (
        <p className="text-xs text-ink-500">Start typing your address — we&apos;ll fill city, state, and ZIP.</p>
      )}

      <div>
        <label className={label} htmlFor={`${prefix}-line1`}>
          {line1Label}
        </label>
        {line1Field}
      </div>

      <div>
        <label className={label} htmlFor={`${prefix}-line2`}>
          {line2Label}
        </label>
        <input
          id={`${prefix}-line2`}
          name={line2Name}
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Suite 4B"
          disabled={disabled}
          className={input}
          autoComplete="address-line2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor={`${prefix}-city`}>
            City
          </label>
          <input
            id={`${prefix}-city`}
            name={cityName}
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={disabled}
            className={input}
            required
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label className={label} htmlFor={`${prefix}-region`}>
            {regionAsSelect ? "State" : "State / region"}
          </label>
          {regionField}
        </div>
      </div>

      <div className={regionAsSelect ? "sm:w-1/2" : undefined}>
        <label className={label} htmlFor={`${prefix}-postal`}>
          ZIP code
        </label>
        <input
          id={`${prefix}-postal`}
          name={postalCodeName}
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          disabled={disabled}
          className={input}
          required
          autoComplete="postal-code"
        />
      </div>

      <input type="hidden" name={countryName} value={countryValue} />
    </div>
  );
}
