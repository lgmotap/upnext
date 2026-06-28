import { Card, PageHeader } from "@/components/app/ui";

export default function ActivityLoading() {
  return (
    <>
      <PageHeader title="Activity" subtitle="Loading activity…" />
      <Card className="h-96 animate-pulse bg-ink-50">
        <span className="sr-only">Loading</span>
      </Card>
    </>
  );
}
