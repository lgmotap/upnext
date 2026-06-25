"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CUSTOMER_DETAIL_TABS, type CustomerDetailTabId } from "@/lib/customers/detail-tabs";

export function CustomerDetailTabs({
  customerId,
  active,
}: {
  customerId: string;
  active: CustomerDetailTabId;
}) {
  const pathname = usePathname();

  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-ink-100 pb-px">
      {CUSTOMER_DETAIL_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`${pathname}?tab=${tab.id}`}
            className={`rounded-t-lg px-3.5 py-2 text-sm font-semibold transition ${
              isActive ? "border-b-2 border-brand-500 text-ink-950" : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
