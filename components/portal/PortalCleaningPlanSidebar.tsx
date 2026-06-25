type CleaningPlan = {
  serviceName: string;
  addonNames: string[];
  frequency: string;
  addressLine: string;
  nextVisitAt: Date | string | null;
};

function formatWhen(iso: Date | string) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PortalCleaningPlanSidebar({ plan }: { plan: CleaningPlan | null }) {
  if (!plan) return null;

  return (
    <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
      <h3 className="text-sm font-bold text-brand-950">Your cleaning plan</h3>
      <p className="mt-1 text-xs text-brand-800/80">Summary from your recent bookings</p>
      <dl className="mt-4 space-y-3 text-sm text-brand-950">
        <div>
          <dt className="text-xs font-semibold uppercase text-brand-700/80">Service</dt>
          <dd className="font-medium">{plan.serviceName}</dd>
          {plan.addonNames.length > 0 && (
            <dd className="mt-0.5 text-xs text-brand-800/90">+ {plan.addonNames.join(", ")}</dd>
          )}
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-brand-700/80">Frequency</dt>
          <dd>{plan.frequency}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-brand-700/80">Address</dt>
          <dd>{plan.addressLine}</dd>
        </div>
        {plan.nextVisitAt && (
          <div>
            <dt className="text-xs font-semibold uppercase text-brand-700/80">Next visit</dt>
            <dd>{formatWhen(plan.nextVisitAt)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
