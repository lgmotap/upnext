import Link from "next/link";

export function ListPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-5 py-3">
      <p className="text-xs text-ink-500">
        Showing {start}–{end} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-300 ring-1 ring-ink-100">
            Previous
          </span>
        )}
        <span className="text-xs font-medium text-ink-600">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-300 ring-1 ring-ink-100">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
