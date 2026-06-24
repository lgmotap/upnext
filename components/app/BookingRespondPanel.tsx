"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { acceptBookingAction, declineBookingAction } from "@/server/actions/bookings";

export function BookingRespondPanel({ bookingRequestId }: { bookingRequestId: string }) {
  const [declineOpen, setDeclineOpen] = useState(false);

  return (
    <>
      <form action={acceptBookingAction} className="space-y-2.5">
        <input type="hidden" name="bookingRequestId" value={bookingRequestId} />
        <FormSubmitButton
          loadingLabel="Accepting…"
          className="flex w-full !rounded-full !py-2.5"
        >
          <Check className="size-4" /> Accept &amp; create job
        </FormSubmitButton>
      </form>
      <button
        type="button"
        onClick={() => setDeclineOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
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
      <p className="pt-1 text-center text-xs text-ink-400">
        Accepting creates a scheduled job and opens it for assignment.
      </p>
    </>
  );
}
