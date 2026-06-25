/**
 * Smoke: Google Places address parser + manual fallback config.
 * Run: npm run smoke:address-autocomplete
 */
import { isGoogleMapsConfigured } from "../lib/maps/google-maps-config";
import { parseGoogleAddressComponents } from "../lib/maps/parse-place-address";

function main() {
  console.log("▶ Address autocomplete smoke\n");

  const sample = parseGoogleAddressComponents([
    { long_name: "1600", short_name: "1600", types: ["street_number"] },
    { long_name: "Amphitheatre Parkway", short_name: "Amphitheatre Pkwy", types: ["route"] },
    { long_name: "Mountain View", short_name: "Mountain View", types: ["locality", "political"] },
    { long_name: "California", short_name: "CA", types: ["administrative_area_level_1", "political"] },
    { long_name: "94043", short_name: "94043", types: ["postal_code"] },
    { long_name: "United States", short_name: "US", types: ["country", "political"] },
  ]);

  if (!sample) throw new Error("Parser returned null for sample address");
  if (sample.line1 !== "1600 Amphitheatre Parkway") {
    throw new Error(`Unexpected line1: ${sample.line1}`);
  }
  if (sample.city !== "Mountain View" || sample.region !== "CA" || sample.postalCode !== "94043") {
    throw new Error(`Unexpected parsed fields: ${JSON.stringify(sample)}`);
  }
  console.log(`✓ Parsed sample: ${sample.line1}, ${sample.city}, ${sample.region} ${sample.postalCode}`);

  const newApiSample = parseGoogleAddressComponents([
    { longText: "1600", shortText: "1600", types: ["street_number"] },
    { longText: "Amphitheatre Parkway", shortText: "Amphitheatre Pkwy", types: ["route"] },
    { longText: "Mountain View", shortText: "Mountain View", types: ["locality", "political"] },
    { longText: "California", shortText: "CA", types: ["administrative_area_level_1", "political"] },
    { longText: "94043", shortText: "94043", types: ["postal_code"] },
  ]);
  if (!newApiSample || newApiSample.line1 !== "1600 Amphitheatre Parkway") {
    throw new Error("Parser failed for Places API (New) addressComponents shape");
  }
  console.log("✓ Parsed Places API (New) addressComponents shape");

  const incomplete = parseGoogleAddressComponents([
    { long_name: "California", short_name: "CA", types: ["administrative_area_level_1", "political"] },
  ]);
  if (incomplete !== null) {
    throw new Error("Expected null for incomplete address components");
  }
  console.log("✓ Incomplete components return null (manual fallback path)");

  if (isGoogleMapsConfigured()) {
    console.log("✓ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set — Places UI enabled in browser");
  } else {
    console.log("✓ No Google Maps API key — manual address fields only (expected locally)");
  }

  console.log("\n✓ Address autocomplete smoke passed");
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
