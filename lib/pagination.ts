export const DEFAULT_LIST_PAGE_SIZE = 50;

export function parseListPage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}
