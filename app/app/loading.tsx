export default function AppLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-56 rounded-lg bg-ink-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-ink-100" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-2xl bg-ink-100 lg:col-span-2" />
        <div className="h-72 rounded-2xl bg-ink-100" />
      </div>
    </div>
  );
}
