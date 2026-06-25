"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isGoogleMapsConfigured } from "@/lib/maps/google-maps-config";
import { parseGoogleAddressComponents, type ParsedPlaceAddress } from "@/lib/maps/parse-place-address";
import { loadGoogleMapsPlaces } from "@/components/maps/load-google-maps";
import {
  applyPlaceAutocompleteSurfaceStyles,
  bindPlaceAutocompleteFocusRing,
} from "@/lib/maps/place-autocomplete-styles";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

type PlaceAutocompleteElementInstance = HTMLElement & {
  id: string;
  name: string;
  placeholder: string;
  value: string;
  disabled: boolean;
  noInputIcon: boolean;
  addEventListener: (type: string, listener: (event: PlacePredictionSelectEvent) => void) => void;
  removeEventListener: (type: string, listener: (event: PlacePredictionSelectEvent) => void) => void;
};

type PlacePredictionSelectEvent = Event & {
  placePrediction?: {
    toPlace: () => PlaceInstance;
  };
};

type PlaceInstance = {
  fetchFields: (opts: { fields: string[] }) => Promise<void>;
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    long_name?: string;
    short_name?: string;
    types: string[];
  }>;
};

type PlacesLibrary = {
  PlaceAutocompleteElement?: new (opts?: {
    includedRegionCodes?: string[];
    noInputIcon?: boolean;
  }) => PlaceAutocompleteElementInstance;
};

type Props = {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  onAddressSelect: (parsed: ParsedPlaceAddress) => void;
};

async function ensurePlacesLibrary(): Promise<PlacesLibrary> {
  const google = (window as unknown as { google?: { maps?: { importLibrary?: (n: string) => Promise<unknown> } } })
    .google;

  if (google?.maps?.importLibrary) {
    return (await google.maps.importLibrary("places")) as PlacesLibrary;
  }

  await loadGoogleMapsPlaces();

  const importLibrary = (
    window as unknown as { google?: { maps?: { importLibrary?: (n: string) => Promise<unknown> } } }
  ).google?.maps?.importLibrary;

  if (!importLibrary) {
    throw new Error("Google Maps importLibrary unavailable");
  }

  return (await importLibrary("places")) as PlacesLibrary;
}

export function PlaceAutocompleteLine1({
  id,
  name,
  defaultValue = "",
  placeholder = "123 Main St",
  disabled = false,
  className,
  inputClassName,
  onAddressSelect,
}: Props) {
  const placesConfigured = isGoogleMapsConfigured();
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<PlaceAutocompleteElementInstance | null>(null);
  const unbindFocusRef = useRef<(() => void) | null>(null);
  const onAddressSelectRef = useRef(onAddressSelect);
  const initialValueRef = useRef(defaultValue);
  const mountGenerationRef = useRef(0);
  const [widgetFailed, setWidgetFailed] = useState(false);
  const [manualValue, setManualValue] = useState(defaultValue);

  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect;
  }, [onAddressSelect]);

  useLayoutEffect(() => {
    if (!placesConfigured || disabled) return;

    const host = hostRef.current;
    if (!host) return;

    const generation = ++mountGenerationRef.current;
    let cancelled = false;
    setWidgetFailed(false);

    const onSelect = async (event: PlacePredictionSelectEvent) => {
      const prediction = event.placePrediction;
      if (!prediction?.toPlace) return;

      try {
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ["addressComponents"] });
        const parsed = parseGoogleAddressComponents(place.addressComponents ?? []);
        if (!parsed) return;
        if (widgetRef.current) widgetRef.current.value = parsed.line1;
        onAddressSelectRef.current(parsed);
      } catch {
        // Keep manual fields editable.
      }
    };

    const mountWidget = async () => {
      const lib = await ensurePlacesLibrary();
      if (cancelled || generation !== mountGenerationRef.current) return;

      if (!lib.PlaceAutocompleteElement) {
        throw new Error("PlaceAutocompleteElement unavailable");
      }

      const widget = new lib.PlaceAutocompleteElement({
        includedRegionCodes: ["us"],
        noInputIcon: true,
      });
      if (id) widget.id = id;
      widget.name = name;
      widget.placeholder = placeholder;
      widget.value = initialValueRef.current;
      widget.disabled = disabled;
      widget.addEventListener("gmp-select", onSelect);

      if (cancelled || generation !== mountGenerationRef.current) return;

      host.replaceChildren(widget);
      widgetRef.current = widget;
      applyPlaceAutocompleteSurfaceStyles(widget);
      unbindFocusRef.current?.();
      unbindFocusRef.current = bindPlaceAutocompleteFocusRing(widget);
    };

    mountWidget().catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[PlaceAutocompleteLine1] widget mount failed", err);
      }
      if (!cancelled && generation === mountGenerationRef.current) {
        setWidgetFailed(true);
      }
    });

    return () => {
      cancelled = true;
      unbindFocusRef.current?.();
      unbindFocusRef.current = null;
      widgetRef.current?.removeEventListener("gmp-select", onSelect);
      widgetRef.current = null;
      host.replaceChildren();
    };
  }, [placesConfigured, disabled, id, name, placeholder]);

  useEffect(() => {
    if (widgetRef.current) widgetRef.current.disabled = disabled;
  }, [disabled]);

  if (!placesConfigured) {
    return (
      <input
        id={id}
        name={name}
        value={manualValue}
        onChange={(e) => setManualValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName ?? input}
        required
        autoComplete="address-line1"
      />
    );
  }

  return (
    <>
      <div
        ref={hostRef}
        className={`upnext-place-autocomplete-host ${widgetFailed ? "hidden" : ""} ${className ?? ""}`}
      />
      {widgetFailed ? (
        <input
          id={id}
          name={name}
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName ?? input}
          required
          autoComplete="address-line1"
        />
      ) : null}
    </>
  );
}
