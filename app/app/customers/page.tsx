import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Card, PageHeader, Avatar, AppButton } from "@/components/app/ui";
import { customers, formatMoney } from "@/lib/mock/data";

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Profiles, history, and lifetime value."
        action={<AppButton>+ Add customer</AppButton>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {customers.map((c) => (
          <Link key={c.id} href={`/app/customers/${c.id}`}>
            <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-center gap-3">
                <Avatar initials={c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")} className="size-10" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink-950">{c.name}</p>
                  <p className="truncate text-xs text-ink-500">{c.contact}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-ink-500">
                <p className="flex items-center gap-1.5"><Mail className="size-3.5" /> {c.email}</p>
                <p className="flex items-center gap-1.5"><Phone className="size-3.5" /> {c.phone}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                <span className="text-xs text-ink-500">{c.jobs} jobs</span>
                <span className="text-sm font-bold text-ink-950">{formatMoney(c.lifetimeCents)}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
