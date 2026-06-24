"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { RescheduleModal } from "@/components/app/RescheduleModal";
import {
  rescheduleBookingRequestAction,
  fetchBookingRescheduleDaysAction,
  fetchBookingRescheduleSlotsAction,
} from "@/server/actions/scheduling";
import type { BookableDay } from "@/lib/availability/calendar-ui";

type SlotOption = { date: string; time: string; label: string };

export function BookingRescheduleButton({
  bookingRequestId,
  reschedule,
}: {
  bookingRequestId: string;
  reschedule: {
    timeZone: string;
    initialDays: BookableDay[];
    initialSlots: SlotOption[];
    initialDate: string;
    initialTime: string;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
      >
        <CalendarClock className="size-4" /> Reschedule request
      </button>
      <RescheduleModal
        open={open}
        onClose={() => setOpen(false)}
        title="Reschedule booking request"
        entityId={bookingRequestId}
        idFieldName="bookingRequestId"
        formAction={rescheduleBookingRequestAction}
        fetchDays={fetchBookingRescheduleDaysAction}
        fetchSlots={fetchBookingRescheduleSlotsAction}
        initialDays={reschedule.initialDays}
        initialSlots={reschedule.initialSlots}
        initialDate={reschedule.initialDate}
        initialTime={reschedule.initialTime}
        timeZone={reschedule.timeZone}
      />
    </>
  );
}
