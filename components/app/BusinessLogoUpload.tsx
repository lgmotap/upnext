"use client";

import { useFormStatus } from "react-dom";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";
import {
  removeBusinessLogoAction,
  uploadBusinessLogoAction,
} from "@/server/actions/business-logo";

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-600 disabled:opacity-70"
    >
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="size-4 animate-spin" /> Uploading…
        </span>
      ) : (
        "Upload logo"
      )}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      Remove
    </button>
  );
}

type Props = {
  logoUrl: string | null;
  displayName: string;
  canEdit: boolean;
};

export function BusinessLogoUpload({ logoUrl, displayName, canEdit }: Props) {
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-100 shadow-soft">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink-950">
        <ImageIcon className="size-4 text-brand-600" />
        Business logo
      </h3>
      <p className="mt-1 text-sm text-ink-500">Shown on your public booking page. Square images work best.</p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="size-16 shrink-0 rounded-2xl object-cover ring-1 ring-ink-200"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-800">
            {initial}
          </span>
        )}

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <form action={uploadBusinessLogoAction} className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                name="logo"
                accept="image/jpeg,image/png,image/webp"
                className="max-w-[14rem] text-sm text-ink-600 file:mr-2 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink-800"
              />
              <UploadButton />
            </form>
            {logoUrl && (
              <form action={removeBusinessLogoAction}>
                <RemoveButton />
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
