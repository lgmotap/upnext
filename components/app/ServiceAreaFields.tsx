"use client";

import { useMemo } from "react";
import {
  formatServiceAreaDisplay,
  SERVICE_AREA_SCOPE_LABELS,
  SERVICE_AREA_SCOPES,
  type ServiceAreaScope,
} from "@/lib/business/service-area";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

type Props = {
  city: string;
  region: string;
  scope: ServiceAreaScope;
  customLabel: string;
  onScopeChange: (scope: ServiceAreaScope) => void;
  onCustomLabelChange: (value: string) => void;
  disabled?: boolean;
  idPrefix?: string;
};

export function ServiceAreaFields({
  city,
  region,
  scope,
  customLabel,
  onScopeChange,
  onCustomLabelChange,
  disabled,
  idPrefix = "",
}: Props) {
  const preview = useMemo(
    () => formatServiceAreaDisplay(city, region, scope, customLabel),
    [city, region, scope, customLabel],
  );

  const scopeId = `${idPrefix}serviceAreaScope`;
  const customId = `${idPrefix}serviceAreaCustom`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={label} htmlFor={scopeId}>
          Coverage
        </label>
        <select
          id={scopeId}
          name="serviceAreaScope"
          value={scope}
          onChange={(e) => onScopeChange(e.target.value as ServiceAreaScope)}
          disabled={disabled}
          className={input}
        >
          {SERVICE_AREA_SCOPES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_AREA_SCOPE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      {scope === "custom" && (
        <div className="sm:col-span-2">
          <label className={label} htmlFor={customId}>
            Custom service area label
          </label>
          <input
            id={customId}
            name="serviceAreaCustom"
            value={customLabel}
            onChange={(e) => onCustomLabelChange(e.target.value)}
            placeholder="e.g. North Austin and Round Rock"
            disabled={disabled}
            className={input}
            maxLength={160}
          />
        </div>
      )}
      <div className="sm:col-span-2 rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Customers will see</p>
        <p className="mt-1 text-sm font-medium text-brand-950">
          {preview || "Add city and state in your address"}
        </p>
      </div>
    </div>
  );
}
