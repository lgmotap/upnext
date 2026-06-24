"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock } from "lucide-react";
import { BookingMonthCalendar } from "@/components/booking/BookingMonthCalendar";
import { Modal } from "@/components/app/Modal";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { monthKeyFromYmd, type BookableDay } from "@/lib/availability/calendar-ui";

type SlotOption = { date: string; time: string; label: string };

export function RescheduleModal({
  open,
  onClose,
  title,
  entityId,
  idFieldName,
  formAction,
  fetchDays,
  fetchSlots,
  initialDays,
  initialSlots,
  initialDate,
  initialTime,
  timeZone,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  entityId: string;
  idFieldName: "jobId" | "bookingRequestId";
  formAction: (formData: FormData) => void | Promise<void>;
  fetchDays: (id: string) => Promise<{ days: BookableDay[]; timeZone: string }>;
  fetchSlots: (id: string, dateYmd: string) => Promise<{ slots: SlotOption[] }>;
  initialDays: BookableDay[];
  initialSlots: SlotOption[];
  initialDate: string;
  initialTime: string;
  timeZone: string;
}) {
  const [days, setDays] = useState(initialDays);
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [viewMonth, setViewMonth] = useState(
    () => initialDays[0]?.monthKey ?? monthKeyFromYmd(new Date().toISOString().slice(0, 10)),
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDays(initialDays);
    setSlots(initialSlots);
    setDate(initialDate);
    setTime(initialTime);
    if (initialDate) setViewMonth(monthKeyFromYmd(initialDate));
  }, [open, initialDays, initialSlots, initialDate, initialTime]);

  function selectDate(nextDate: string) {
    setDate(nextDate);
    setViewMonth(monthKeyFromYmd(nextDate));
    startTransition(async () => {
      const { slots: nextSlots } = await fetchSlots(entityId, nextDate);
      setSlots(nextSlots);
      setTime(nextSlots[0]?.time ?? "");
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name={idFieldName} value={entityId} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="time" value={time} />

        <p className="text-sm text-ink-500">
          Pick a new date and time. Times respect your availability and avoid conflicts with other
          jobs.
        </p>

        <BookingMonthCalendar
          timeZone={timeZone}
          days={days}
          selectedDate={date}
          viewMonth={viewMonth}
          onViewMonthChange={setViewMonth}
          onSelectDate={selectDate}
          pending={pending}
        />

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <Clock className="size-3.5" /> Available times
          </p>
          {slots.length === 0 ? (
            <p className="text-sm text-ink-500">No open slots on this day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={`${s.date}-${s.time}`}
                  type="button"
                  onClick={() => setTime(s.time)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                    time === s.time
                      ? "bg-brand-400 text-brand-950 ring-brand-400"
                      : "bg-white text-ink-700 ring-ink-200 hover:ring-brand-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200"
          >
            Cancel
          </button>
          <FormSubmitButton loadingLabel="Saving…" disabled={!date || !time}>
            Save new time
          </FormSubmitButton>
        </div>
      </form>
    </Modal>
  );
}
