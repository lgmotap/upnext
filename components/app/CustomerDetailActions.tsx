"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus } from "lucide-react";
import { AppButton } from "@/components/app/ui";
import { Modal } from "@/components/app/Modal";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { addCustomerAddressAction, sendCustomerPortalLinkAction, updateCustomerNotesAction } from "@/server/actions/customers";
import { US_REGIONS } from "@/server/validators/onboarding";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400";

export function CustomerDetailActions({
  customerId,
  notes,
  bookAgainHref,
  canEdit,
}: {
  customerId: string;
  notes: string;
  bookAgainHref: string;
  canEdit: boolean;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <AppButton href={bookAgainHref} variant="primary">
        Book again
      </AppButton>
      <AppButton href={`/app/bookings/new?customerId=${customerId}`} variant="outline">
        New booking
      </AppButton>
      {canEdit && (
        <form action={sendCustomerPortalLinkAction}>
          <input type="hidden" name="customerId" value={customerId} />
          <FormSubmitButton
            variant="outline"
            loadingLabel="Sending…"
            className="rounded-full px-4 py-2 text-sm font-semibold"
          >
            Send portal link
          </FormSubmitButton>
        </form>
      )}
      {canEdit && (
        <>
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:ring-brand-400"
          >
            <Pencil className="size-4" /> {notes ? "Edit notes" : "Add notes"}
          </button>
          <button
            type="button"
            onClick={() => setAddressOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:ring-brand-400"
          >
            <Plus className="size-4" /> Add address
          </button>
        </>
      )}

      <Modal open={notesOpen} onClose={() => setNotesOpen(false)} title="Customer notes">
        <form action={updateCustomerNotesAction} className="space-y-4">
          <input type="hidden" name="customerId" value={customerId} />
          <textarea
            name="notes"
            rows={5}
            defaultValue={notes}
            placeholder="Gate codes, pets, preferences…"
            className={input}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNotesOpen(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200">
              Cancel
            </button>
            <FormSubmitButton loadingLabel="Saving…">Save notes</FormSubmitButton>
          </div>
        </form>
      </Modal>

      <Modal open={addressOpen} onClose={() => setAddressOpen(false)} title="Add address" size="lg">
        <form action={addCustomerAddressAction} className="space-y-4">
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="country" value="US" />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-ink-400">Street</label>
            <input name="line1" required className={input} placeholder="123 Main St" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-ink-400">Unit (optional)</label>
            <input name="line2" className={input} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-ink-400">City</label>
              <input name="city" required className={input} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-ink-400">State</label>
              <select name="region" required className={input}>
                <option value="">Select…</option>
                {US_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-ink-400">ZIP</label>
            <input name="postalCode" required className={input} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-ink-400">Access notes (optional)</label>
            <input name="notes" className={input} placeholder="Gate code, dog in yard…" />
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <MapPin className="size-3.5" /> Used for job location when this is the default address.
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddressOpen(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200">
              Cancel
            </button>
            <FormSubmitButton loadingLabel="Adding…">Add address</FormSubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
