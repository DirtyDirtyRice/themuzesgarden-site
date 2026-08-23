import { describe, expect, it } from "vitest";
import {
  createTimelineDawLaneWindow,
  indexTimelineDawItemsByTrack,
  timelineDawClipHistoryLimit,
} from "../../lib/timeline/TimelineDawLargeSessionPolicy";

describe("TimelineDawLargeSessionPolicy", () => {
  it("bounds a 119-track arrangement to a small render window", () => {
    expect(createTimelineDawLaneWindow(119, 0)).toEqual({
      page: 0, pageCount: 10, start: 0, end: 12, visibleCount: 12, totalCount: 119,
    });
    expect(createTimelineDawLaneWindow(119, 99)).toMatchObject({
      page: 9, start: 108, end: 119, visibleCount: 11,
    });
  });

  it("reduces full-array undo snapshots as clip counts grow", () => {
    expect(timelineDawClipHistoryLimit(100)).toBe(20);
    expect(timelineDawClipHistoryLimit(500)).toBe(10);
    expect(timelineDawClipHistoryLimit(5000)).toBe(5);
  });

  it("indexes track items in one pass while preserving order", () => {
    const indexed = indexTimelineDawItemsByTrack([
      { trackId: "a", id: 1 }, { trackId: "b", id: 2 }, { trackId: "a", id: 3 },
    ]);
    expect(indexed.get("a")?.map((item) => item.id)).toEqual([1, 3]);
    expect(indexed.get("b")?.map((item) => item.id)).toEqual([2]);
  });
});
