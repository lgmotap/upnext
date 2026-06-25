"use client";

import { getGoogleMapsApiKey } from "@/lib/maps/google-maps-config";

type GoogleMapsWindow = {
  maps?: {
    importLibrary?: (name: string) => Promise<unknown>;
    places?: unknown;
  };
};

let loadPromise: Promise<void> | null = null;

function isMapsReady(): boolean {
  return Boolean(
    (window as unknown as { google?: GoogleMapsWindow }).google?.maps?.importLibrary,
  );
}

function importPlacesLibrary(): Promise<void> {
  const google = (window as unknown as { google?: GoogleMapsWindow }).google;
  if (!google?.maps?.importLibrary) {
    return Promise.reject(new Error("Google Maps importLibrary unavailable"));
  }
  return google.maps.importLibrary("places").then(() => undefined);
}

/** `loading=async` attaches `importLibrary` shortly after the script `load` event — poll until ready. */
function waitUntilMapsReady(timeoutMs = 15_000): Promise<void> {
  if (isMapsReady()) {
    return importPlacesLibrary();
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timeout);
      fn();
    };

    const poll = setInterval(() => {
      if (!isMapsReady()) return;
      importPlacesLibrary().then(() => finish(resolve)).catch((err) => finish(() => reject(err)));
    }, 50);

    const timeout = setTimeout(() => {
      finish(() => reject(new Error("Google Maps importLibrary unavailable")));
    }, timeoutMs);
  });
}

function injectMapsScript(apiKey: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.dataset.upnextGoogleMaps = "1";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve(script);
    };
    script.onerror = () => reject(new Error("Google Maps script failed"));
    document.head.appendChild(script);
  });
}

/** Load Maps JS with `loading=async`, then the Places library (PlaceAutocompleteElement). */
export function loadGoogleMapsPlaces(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return Promise.resolve();

  if (isMapsReady()) {
    return importPlacesLibrary();
  }

  const existing = document.querySelector<HTMLScriptElement>('script[data-upnext-google-maps="1"]');
  if (existing) {
    return waitUntilMapsReady();
  }

  if (loadPromise) return loadPromise;

  loadPromise = injectMapsScript(apiKey)
    .then(() => waitUntilMapsReady())
    .catch((err) => {
      loadPromise = null;
      throw err;
    });

  return loadPromise;
}
