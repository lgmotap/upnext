"use client";

import { useState } from "react";
import { CalendarPlus, Download, ExternalLink } from "lucide-react";
import { Modal } from "@/components/app/Modal";
import type { CalendarLinks } from "@/lib/datetime/calendar-links";

type Props = {
  whenLabel: string;
  links: CalendarLinks;
  className?: string;
};

function downloadIcsFile(ics: string, filename: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AddToCalendarButton({ whenLabel, links, className }: Props) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    close();
  };

  const openApple = () => {
    downloadIcsFile(links.ics, links.downloadFilename);
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-ink-100 px-4 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-200"
        }
      >
        <CalendarPlus className="size-4" aria-hidden />
        Add to calendar
      </button>

      <Modal open={open} onClose={close} title="Add to calendar" size="sm">
        <p className="text-sm text-ink-600">
          Save this appointment to your calendar. All options use the same date and time.
        </p>
        <p className="mt-1 text-sm font-semibold text-ink-900">{whenLabel}</p>

        <ul className="mt-4 space-y-2">
          <CalendarOption
            title="Google Calendar"
            hint="Opens in a new tab"
            icon={<GoogleMark />}
            trailing={<ExternalLink className="size-4 text-ink-400" aria-hidden />}
            onClick={() => openExternal(links.googleUrl)}
          />
          <CalendarOption
            title="Outlook"
            hint="Opens in a new tab"
            icon={<OutlookMark />}
            trailing={<ExternalLink className="size-4 text-ink-400" aria-hidden />}
            onClick={() => openExternal(links.outlookUrl)}
          />
          <CalendarOption
            title="Apple Calendar"
            hint="Downloads a calendar file"
            icon={<AppleMark />}
            trailing={<Download className="size-4 text-ink-400" aria-hidden />}
            onClick={openApple}
          />
        </ul>
      </Modal>
    </>
  );
}

function CalendarOption({
  title,
  hint,
  icon,
  trailing,
  onClick,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
  trailing: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl bg-white p-3.5 text-left ring-1 ring-ink-100 transition hover:bg-ink-50 hover:ring-ink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink-900">{title}</span>
          <span className="block text-xs text-ink-500">{hint}</span>
        </span>
        {trailing}
      </button>
    </li>
  );
}

function GoogleMark() {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-ink-100"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" role="img">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    </span>
  );
}

function OutlookMark() {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0078D4]/10 text-sm font-bold text-[#0078D4]"
      aria-hidden
    >
      O
    </span>
  );
}

function AppleMark() {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-800"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5 fill-current" role="img">
        <path d="M16.365 1.43c0 1.14-.42 2.19-1.23 3.08-.84.92-2.04 1.45-3.27 1.37-.14-1.1.45-2.26 1.22-3.05.87-.9 2.28-1.56 3.28-1.4zm3.2 16.87c-.74.86-1.62 1.62-2.62 1.5-.98-.12-1.28-.57-2.39-.57-1.11 0-1.45.55-2.38.65-.96.1-2.01-.82-2.75-1.68-1.5-1.74-2.65-4.93-1.11-7.08.77-1.12 2.15-1.83 3.55-1.85 1.1-.02 2.14.74 2.81.74.67 0 1.93-.91 3.26-.78.55.02 2.1.22 3.1 1.66-.08.05-1.85 1.08-1.83 3.22.03 2.56 2.24 3.41 2.27 3.42-.02.06-.36 1.22-1.19 2.42z" />
      </svg>
    </span>
  );
}
