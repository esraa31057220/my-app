export interface PagedQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function applyClientSearch<T extends Record<string, unknown>>(
  rows: T[],
  q: string,
  keys: string[]
): T[] {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((row) =>
    keys.some((k) => String(row[k] ?? '').toLowerCase().includes(s))
  );
}

export function applyClientPaging<T>(rows: T[], page: number, pageSize: number): T[] {
  const p = Math.max(0, page);
  const ps = Math.max(1, pageSize);
  const start = p * ps;
  return rows.slice(start, start + ps);
}
