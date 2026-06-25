"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Card } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { BookingListActions } from "@/components/app/BookingListActions";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { bulkDeclineBookingsAction } from "@/server/actions/bookings";

export type PendingBookingCardData = {
  id: string;
  status: string;
  whenLabel: string;
  submittedLabel: string;
  customerNotes: string | null;
  customer: {
    firstName: string;
    lastName: string;
    addresses: Array<{
      line1: string;
      city: string;
      region: string;
      postalCode: string;
    }>;
  };
  service: { name: string };
};

const PENDING_CAP = 20;

export function PendingBookingsSection({
  bookings,
  totalPending,
  showAllPending,
  pendingShowAllHref,
  canRespond,
}: {
  bookings: PendingBookingCardData[];
  totalPending: number;
  showAllPending: boolean;
  pendingShowAllHref: string;
  canRespond: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const allIds = useMemo(() => bookings.map((b) => b.id), [bookings]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  const selectedIds = [...selected];

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">
          Needs response ({totalPending})
        </h2>
        {canRespond && bookings.length > 1 && (
          <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="size-4 rounded border-ink-300"
            />
            Select all on page
          </label>
        )}
      </div>

      {canRespond && selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 ring-1 ring-ink-100">
          <span className="text-sm font-medium text-ink-700">
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Decline selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold text-ink-500 hover:text-ink-800"
          >
            Clear
          </button>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map((b) => (
          <PendingBookingCard
            key={b.id}
            booking={b}
            canRespond={canRespond}
            selected={selected.has(b.id)}
            onToggleSelect={() => toggleOne(b.id)}
          />
        ))}
      </div>

      {!showAllPending && totalPending > PENDING_CAP && (
        <p className="mt-3 text-center">
          <Link
            href={pendingShowAllHref}
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Show all {totalPending} pending requests
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={`Decline ${selectedIds.length} booking request${selectedIds.length === 1 ? "" : "s"}?`}
        description="Customers will not be scheduled. You can still view these requests in your bookings history."
        confirmLabel={`Decline ${selectedIds.length}`}
        tone="danger"
        formAction={bulkDeclineBookingsAction}
      >
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name="bookingRequestId" value={id} />
        ))}
      </ConfirmDialog>
    </section>
  );
}

function PendingBookingCard({
  booking: b,
  canRespond,
  selected,
  onToggleSelect,
}: {
  booking: PendingBookingCardData;
  canRespond: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const address = b.customer.addresses?.[0];
  const addressLine = address
    ? `${address.line1}, ${address.city}, ${address.region} ${address.postalCode}`
    : "—";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-1 gap-3">
          {canRespond && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="mt-1 size-4 shrink-0 rounded border-ink-300"
              aria-label={`Select booking for ${b.customer.firstName} ${b.customer.lastName}`}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/app/bookings/${b.id}`}
                className="text-base font-bold text-ink-950 hover:text-brand-700"
              >
                {b.customer.firstName} {b.customer.lastName}
              </Link>
              <StatusBadge status={b.status} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-600">
              <span className="font-medium text-ink-800">{b.service.name}</span>
              <span className="inline-flex items-center gap-1 text-ink-500">
                <Clock className="size-3.5 shrink-0" /> {b.whenLabel}
              </span>
            </p>
            <p className="mt-1 text-xs text-ink-400">{addressLine}</p>
            {b.customerNotes && (
              <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">
                &ldquo;{b.customerNotes}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div
          className={`flex shrink-0 flex-col gap-3 sm:items-end sm:pt-0.5 ${
            canRespond ? "pl-7 sm:pl-0" : ""
          }`}
        >
          <p className="text-xs leading-snug text-ink-400 sm:text-right">
            <span className="font-medium text-ink-500">Submitted</span>
            <span className="mt-0.5 block text-ink-400 sm:mt-0 sm:inline">
              <span className="hidden sm:inline"> · </span>
              {b.submittedLabel}
            </span>
          </p>
          {canRespond && <BookingListActions bookingRequestId={b.id} />}
        </div>
      </div>
    </Card>
  );
}
