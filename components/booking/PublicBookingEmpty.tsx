import { site } from "@/lib/config";

export function PublicBookingEmpty({
  businessName,
  embedded = false,
}: {
  businessName: string;
  embedded?: boolean;
}) {
  return (
    <div
      className={
        embedded
          ? "rounded-2xl bg-white p-8 text-center ring-1 ring-ink-100"
          : "flex min-h-screen items-center justify-center bg-background px-5 py-12"
      }
    >
      <div className={embedded ? "" : "max-w-md text-center"}>
        <h1 className="text-xl font-bold text-ink-950">Online booking isn&apos;t ready yet</h1>
        <p className="mt-2 text-sm text-ink-600">
          {businessName} hasn&apos;t published any bookable services. Please contact them directly or
          check back soon.
        </p>
        {!embedded && (
          <p className="mt-4 text-xs text-ink-400">
            Business owner? Add services under <strong>Services</strong> in your {site.name} dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
