export type TimelineDawLaneWindow = {
  page: number;
  pageCount: number;
  start: number;
  end: number;
  visibleCount: number;
  totalCount: number;
};

export function createTimelineDawLaneWindow(
  totalCount: number,
  requestedPage: number,
  pageSize = 12,
): TimelineDawLaneWindow {
  const total = Number.isSafeInteger(totalCount) ? Math.max(0, totalCount) : 0;
  const size = Number.isSafeInteger(pageSize) ? Math.min(32, Math.max(4, pageSize)) : 12;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(pageCount - 1, Math.max(0, Number.isSafeInteger(requestedPage) ? requestedPage : 0));
  const start = page * size;
  const end = Math.min(total, start + size);
  return { page, pageCount, start, end, visibleCount: end - start, totalCount: total };
}

export function timelineDawClipHistoryLimit(clipCount: number): number {
  if (!Number.isFinite(clipCount) || clipCount < 0) return 5;
  if (clipCount > 1000) return 5;
  if (clipCount > 250) return 10;
  return 20;
}

export function indexTimelineDawItemsByTrack<T extends { trackId: string }>(
  items: T[],
): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const item of items) {
    const current = result.get(item.trackId);
    if (current) current.push(item);
    else result.set(item.trackId, [item]);
  }
  return result;
}
