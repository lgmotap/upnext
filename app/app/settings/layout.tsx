import { PageHeader } from "@/components/app/ui";
import { SettingsTabs } from "./SettingsTabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" subtitle="Business, portals, availability, notifications, booking form, billing, and API." />
      <SettingsTabs />
      <div className="max-w-3xl">{children}</div>
    </>
  );
}
