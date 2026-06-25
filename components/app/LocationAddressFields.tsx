"use client";

import { AddressAutocompleteFields } from "@/components/maps/AddressAutocompleteFields";

type Props = {
  /** Unique per form on the page (location id or "new"). */
  formKey: string;
  defaults: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    postalCode: string;
  };
};

export function LocationAddressFields({ formKey, defaults }: Props) {
  return (
    <AddressAutocompleteFields
      idPrefix={`location-${formKey}`}
      defaults={{
        line1: defaults.addressLine1,
        line2: defaults.addressLine2 ?? "",
        city: defaults.city,
        region: defaults.region,
        postalCode: defaults.postalCode,
      }}
      line1Name="addressLine1"
      line2Name="addressLine2"
      cityName="city"
      regionName="region"
      postalCodeName="postalCode"
      countryName="country"
      compact
      fieldsRequired={false}
      className="sm:col-span-2 grid gap-3 sm:grid-cols-2"
    />
  );
}
