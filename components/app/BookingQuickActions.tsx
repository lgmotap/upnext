"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { acceptBookingAction, declineBookingAction } from "@/server/actions/bookings";

export function BookingQuickActions({ bookingRequestId }: { bookingRequestId: string }) {
  const [declineOpen, setDeclineOpen] = useState(false);

  return (
    <>
      <form action={acceptBookingAction}>
        <input type="hidden" name="bookingRequestId" value={bookingRequestId} />
        <button
          type="submit"
          aria-label="Accept"
          className="flex size-7 items-center justify-center rounded-lg bg-brand-400 text-brand-950 hover:bg-brand-300"
        >
          <Check className="size-4" />
        </button>
      </form>
      <button
        type="button"
        aria-label="Decline"
        onClick={() => setDeclineOpen(true)}
        className="flex size-7 items-center justify-center rounded-lg bg-ink-100 text-ink-500 hover:bg-ink-200"
      >
        <X className="size-4" />
      </button>
      <ConfirmDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline request?"
        description="This booking will not be scheduled."
        confirmLabel="Decline"
        tone="danger"
        formAction={declineBookingAction}
        hiddenFields={{ bookingRequestId }}
      />
    </>
  );
}
