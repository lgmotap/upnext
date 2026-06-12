"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

/**
 * Draggable before/after comparison. The "after" layer sits underneath at
 * full width; the "before" layer is clipped from the left, so neither side
 * squishes as the handle moves. Keyboard accessible (arrow keys).
 */
export function CompareSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
  className = "",
}: {
  before: React.ReactNode;
  after: React.ReactNode;
  beforeLabel: string;
  afterLabel: string;
  className?: string;
}) {
  const [pos, setPos] = useState(55);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(94, Math.max(6, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    update(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) update(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(6, p - 5));
    if (e.key === "ArrowRight") setPos((p) => Math.min(94, p + 5));
  };

  return (
    <div
      ref={ref}
      className={`relative select-none overflow-hidden rounded-2xl bg-ink-50 ring-1 ring-ink-200/70 shadow-lift ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "pan-y" }}
    >
      {/* after (base layer) */}
      <div className="p-6 sm:p-10">{after}</div>
      <span className="absolute bottom-3 right-3 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold text-white shadow-md sm:text-xs">
        {afterLabel}
      </span>

      {/* before (clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden bg-[#fdf6ec]"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <div className="p-6 sm:p-10">{before}</div>
        <span className="absolute bottom-3 left-3 rounded-full bg-ink-800 px-3 py-1 text-[10px] font-bold text-white shadow-md sm:text-xs">
          {beforeLabel}
        </span>
      </div>

      {/* handle */}
      <div
        role="slider"
        aria-label={`Comparison between ${beforeLabel} and ${afterLabel}`}
        aria-valuenow={Math.round(pos)}
        aria-valuemin={6}
        aria-valuemax={94}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="absolute inset-y-0 z-10 w-1 cursor-ew-resize bg-white shadow-[0_0_0_1px_rgba(11,43,46,0.1)] focus-visible:outline-2 focus-visible:outline-brand-600"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-700 shadow-float ring-1 ring-ink-200">
          <ChevronsLeftRight className="size-5" />
        </span>
      </div>
    </div>
  );
}
