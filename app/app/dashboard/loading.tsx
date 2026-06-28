export default function DashboardLoading() {
  return (
    <div className="space-y-[18px]">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-white/80" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[110px] animate-pulse rounded-[18px] border border-[#E6EAF0] bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="h-[380px] animate-pulse rounded-[18px] border border-[#E6EAF0] bg-white" />
        <div className="h-[380px] animate-pulse rounded-[18px] border border-[#E6EAF0] bg-white" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[260px] animate-pulse rounded-[18px] border border-[#E6EAF0] bg-white" />
        <div className="h-[260px] animate-pulse rounded-[18px] border border-[#E6EAF0] bg-white" />
      </div>
    </div>
  );
}
