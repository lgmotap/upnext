"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { acceptBookingAction, declineBookingAction } from "@/server/actions/bookings";

export function BookingListActions({ bookingRequestId }: { bookingRequestId: string }) {
  const [declineOpen, setDeclineOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <form action={acceptBookingAction}>
        <input type="hidden" name="bookingRequestId" value={bookingRequestId} />
        <FormSubmitButton
          loadingLabel="Accepting…"
          className="!px-4 !py-2"
        >
          <Check className="size-4" /> Accept
        </FormSubmitButton>
      </form>
      <button
        type="button"
        onClick={() => setDeclineOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100"
      >
        <X className="size-4" /> Decline
      </button>
      <ConfirmDialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline booking request?"
        description="The customer will not be scheduled. You can still view this request in your bookings list."
        confirmLabel="Decline request"
        tone="danger"
        formAction={declineBookingAction}
        hiddenFields={{ bookingRequestId }}
      />
    </div>
  );
}
