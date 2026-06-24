"use client";

import { Modal } from "@/components/app/Modal";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  formAction,
  hiddenFields,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  formAction: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string>;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-ink-600">{description}</p>
      <form action={formAction} className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {hiddenFields &&
          Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
        >
          {cancelLabel}
        </button>
        <FormSubmitButton loadingLabel="Working…" variant={tone === "danger" ? "danger" : "primary"}>
          {confirmLabel}
        </FormSubmitButton>
      </form>
    </Modal>
  );
}
