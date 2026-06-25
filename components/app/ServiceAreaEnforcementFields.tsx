"use client";

import { useMemo } from "react";
import {
  parseZipCodesInput,
  SERVICE_AREA_ENFORCEMENT_LABELS,
  SERVICE_AREA_ENFORCEMENT_MODES,
  type ServiceAreaEnforcementMode,
} from "@/lib/business/service-area-enforcement";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

type Props = {
  mode: ServiceAreaEnforcementMode;
  zipCodesRaw: string;
  radiusMiles: string;
  hasOriginCoordinates: boolean;
  onModeChange: (mode: ServiceAreaEnforcementMode) => void;
  onZipCodesRawChange: (value: string) => void;
  onRadiusMilesChange: (value: string) => void;
  disabled?: boolean;
};

export function ServiceAreaEnforcementFields({
  mode,
  zipCodesRaw,
  radiusMiles,
  hasOriginCoordinates,
  onModeChange,
  onZipCodesRawChange,
  onRadiusMilesChange,
  disabled,
}: Props) {
  const zipPreview = useMemo(() => parseZipCodesInput(zipCodesRaw), [zipCodesRaw]);
  const enforcementActive = mode !== "off";

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
      <div>
        <p className="text-sm font-semibold text-ink-950">Booking restrictions (optional)</p>
        <p className="mt-1 text-xs text-ink-500">
          Block online bookings outside your coverage. Phone bookings can override in Manual Booking.
        </p>
      </div>

      <div>
        <label className={label} htmlFor="serviceAreaEnforcementMode">
          Enforcement
        </label>
        <select
          id="serviceAreaEnforcementMode"
          name="serviceAreaEnforcementMode"
          value={mode}
          onChange={(e) => onModeChange(e.target.value as ServiceAreaEnforcementMode)}
          disabled={disabled}
          className={input}
        >
          {SERVICE_AREA_ENFORCEMENT_MODES.map((m) => (
            <option key={m} value={m}>
              {SERVICE_AREA_ENFORCEMENT_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {mode === "zip_list" && (
        <div>
          <label className={label} htmlFor="serviceAreaZipCodesRaw">
            ZIP codes you serve
          </label>
          <textarea
            id="serviceAreaZipCodesRaw"
            name="serviceAreaZipCodesRaw"
            value={zipCodesRaw}
            onChange={(e) => onZipCodesRawChange(e.target.value)}
            disabled={disabled}
            rows={4}
            placeholder={"78701\n78702\n78703"}
            className={input}
          />
          <p className="mt-1.5 text-xs text-ink-500">
            {zipPreview.length > 0
              ? `${zipPreview.length} valid ZIP code${zipPreview.length === 1 ? "" : "s"}`
              : "Enter US 5-digit ZIP codes, one per line or comma-separated"}
          </p>
        </div>
      )}

      {mode === "radius" && (
        <div className="space-y-3">
          <div className="sm:w-1/2">
            <label className={label} htmlFor="serviceAreaRadiusMiles">
              Radius (miles)
            </label>
            <input
              id="serviceAreaRadiusMiles"
              name="serviceAreaRadiusMiles"
              type="number"
              min={1}
              max={100}
              value={radiusMiles}
              onChange={(e) => onRadiusMilesChange(e.target.value)}
              disabled={disabled}
              className={input}
              placeholder="25"
            />
          </div>
          {hasOriginCoordinates ? (
            <p className="text-xs text-brand-800">Business address coordinates saved.</p>
          ) : (
            <p className="text-xs text-amber-800">
              Re-save your business address using Google Places autocomplete to enable radius mode.
            </p>
          )}
        </div>
      )}

      {enforcementActive && (
        <p className="text-xs text-ink-500">
          Customers outside this area cannot complete public booking. Default is off for existing businesses.
        </p>
      )}
    </div>
  );
}
