"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock } from "lucide-react";
import { BookingMonthCalendar } from "@/components/booking/BookingMonthCalendar";
import { Modal } from "@/components/app/Modal";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { monthKeyFromYmd, type BookableDay } from "@/lib/availability/calendar-ui";
import {
  fetchPortalRescheduleDaysAction,
  fetchPortalRescheduleSlotsAction,
  rescheduleFromPortalAction,
} from "@/server/actions/customer-portal";

type SlotOption = { date: string; time: string; label: string };

export function PortalRescheduleModal({
  open,
  onClose,
  bookingRequestId,
  businessSlug,
}: {
  open: boolean;
  onClose: () => void;
  bookingRequestId: string;
  businessSlug: string;
}) {
  const [days, setDays] = useState<BookableDay[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [viewMonth, setViewMonth] = useState(() => monthKeyFromYmd(new Date().toISOString().slice(0, 10)));
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !bookingRequestId) return;
    startTransition(async () => {
      const result = await fetchPortalRescheduleDaysAction(bookingRequestId, businessSlug);
      setDays(result.days);
      setTimeZone(result.timeZone);
      const first = result.days[0]?.date ?? "";
      setDate(first);
      setViewMonth(result.days[0]?.monthKey ?? monthKeyFromYmd(first || new Date().toISOString().slice(0, 10)));
      if (first) {
        const slotResult = await fetchPortalRescheduleSlotsAction(bookingRequestId, businessSlug, first);
        setSlots(slotResult.slots);
        setTime(slotResult.slots[0]?.time ?? "");
      } else {
        setSlots([]);
        setTime("");
      }
    });
  }, [open, bookingRequestId, businessSlug]);

  function selectDate(nextDate: string) {
    setDate(nextDate);
    setViewMonth(monthKeyFromYmd(nextDate));
    startTransition(async () => {
      const slotResult = await fetchPortalRescheduleSlotsAction(
        bookingRequestId,
        businessSlug,
        nextDate,
      );
      setSlots(slotResult.slots);
      setTime(slotResult.slots[0]?.time ?? "");
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Reschedule booking" size="md">
      <form action={rescheduleFromPortalAction} className="space-y-4">
        <input type="hidden" name="bookingRequestId" value={bookingRequestId} />
        <input type="hidden" name="businessSlug" value={businessSlug} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="time" value={time} />

        <p className="text-sm text-ink-500">
          Pick a new date and time. Available slots respect the business schedule and avoid
          conflicts with other jobs.
        </p>

        {days.length === 0 && !loading ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No reschedule times are available right now. Contact the business for help.
          </p>
        ) : (
          <>
            <BookingMonthCalendar
              timeZone={timeZone}
              days={days}
              selectedDate={date}
              viewMonth={viewMonth}
              onViewMonthChange={setViewMonth}
              onSelectDate={selectDate}
              pending={loading}
            />

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <Clock className="size-3.5" /> Available times
              </p>
              {slots.length === 0 ? (
                <p className="text-sm text-ink-500">No times on this date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setTime(s.time)}
                      className={`rounded-xl px-2 py-2 text-sm font-medium ring-1 ${
                        time === s.time
                          ? "bg-brand-400 text-brand-950 ring-brand-400"
                          : "bg-white text-ink-700 ring-ink-200 hover:ring-brand-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
          >
            Cancel
          </button>
          <FormSubmitButton loadingLabel="Saving…" disabled={!date || !time || days.length === 0}>
            Confirm new time
          </FormSubmitButton>
        </div>
      </form>
    </Modal>
  );
}
