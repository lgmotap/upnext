"use client";

import { User } from "lucide-react";

const SIZE_CLASSES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-14 text-base",
} as const;

export type UserAvatarProps = {
  initials: string;
  imageUrl?: string | null;
  className?: string;
  size?: keyof typeof SIZE_CLASSES;
};

/** User or team member avatar — photo when available, otherwise initials. */
export function UserAvatar({
  initials,
  imageUrl,
  className = "",
  size = "md",
}: UserAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const label = initials.trim() || "?";

  if (imageUrl) {
    return (
      <span
        className={`relative inline-flex shrink-0 overflow-hidden rounded-full bg-ink-100 ${sizeClass} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800 ${sizeClass} ${className}`}
      aria-hidden={label !== "?"}
    >
      {label !== "?" ? label : <User className="size-4 text-brand-700" />}
    </span>
  );
}
