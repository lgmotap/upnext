"use client";

import { useState } from "react";
import type { PortalFaqItem } from "@/lib/portal/faq";
import { MAX_PORTAL_FAQ_ITEMS } from "@/lib/portal/faq";

const emptyItem = (): PortalFaqItem => ({ question: "", answer: "" });

export function PortalFaqEditor({
  initialItems,
  disabled,
}: {
  initialItems: PortalFaqItem[];
  disabled?: boolean;
}) {
  const [items, setItems] = useState<PortalFaqItem[]>(
    initialItems.length > 0 ? initialItems : [emptyItem()],
  );

  function updateItem(index: number, field: keyof PortalFaqItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    if (items.length >= MAX_PORTAL_FAQ_ITEMS) return;
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length <= 1 ? [emptyItem()] : prev.filter((_, i) => i !== index)));
  }

  const serialized = JSON.stringify(
    items.filter((item) => item.question.trim() && item.answer.trim()),
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name="portalFaqJson" value={serialized} readOnly />
      <p className="text-xs text-ink-500">
        Shown on the Book again tab (max {MAX_PORTAL_FAQ_ITEMS}). Cleaning businesses get starter
        FAQs if left empty.
      </p>
      {items.map((item, index) => (
        <div key={index} className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-100">
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Question {index + 1}
          </label>
          <input
            type="text"
            value={item.question}
            disabled={disabled}
            onChange={(e) => updateItem(index, "question", e.target.value)}
            placeholder="What's included in a standard cleaning?"
            className="mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-60"
          />
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Answer
          </label>
          <textarea
            value={item.answer}
            disabled={disabled}
            onChange={(e) => updateItem(index, "answer", e.target.value)}
            rows={3}
            placeholder="We clean kitchens, bathrooms, and living areas…"
            className="mt-1 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-60"
          />
          {!disabled && items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {!disabled && items.length < MAX_PORTAL_FAQ_ITEMS && (
        <button
          type="button"
          onClick={addItem}
          className="text-sm font-semibold text-brand-700 hover:underline"
        >
          Add FAQ item
        </button>
      )}
    </div>
  );
}
