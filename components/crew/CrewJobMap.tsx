import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import {
  formatAddressForMaps,
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
} from "@/lib/maps/address";

export function CrewJobMap({
  address,
  addressLabel,
}: {
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    postalCode: string;
    country?: string | null;
  } | null;
  addressLabel: string;
}) {
  const query = formatAddressForMaps(address);
  if (!query) return null;

  const directionsUrl = googleMapsDirectionsUrl(query);
  const embedUrl = googleMapsEmbedUrl(query);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-ink-100">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
          <MapPin className="size-4 text-ink-400" /> Location
        </span>
        <Link
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
        >
          Open in Maps <ExternalLink className="size-3.5" />
        </Link>
      </div>
      <p className="px-4 pb-3 text-sm text-ink-600">{addressLabel}</p>
      <iframe
        title={`Map for ${addressLabel}`}
        src={embedUrl}
        className="h-48 w-full border-0 bg-ink-50"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
