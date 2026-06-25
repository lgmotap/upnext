export const CUSTOMER_DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "jobs", label: "Jobs" },
  { id: "addresses", label: "Addresses" },
  { id: "notes", label: "Notes" },
  { id: "payments", label: "Payments" },
] as const;

export type CustomerDetailTabId = (typeof CUSTOMER_DETAIL_TABS)[number]["id"];

export function parseCustomerDetailTab(raw: string | undefined): CustomerDetailTabId {
  return CUSTOMER_DETAIL_TABS.some((t) => t.id === raw) ? (raw as CustomerDetailTabId) : "overview";
}
