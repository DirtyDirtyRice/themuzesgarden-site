import type { AnyTrack } from "./playerTypes";
import { getSectionTags, getTrackTags } from "./playerUtils";

export type TopTagItem = {
  tag: string;
  total: number;
  trackCount: number;
  sectionCount: number;
  originLabel: string;
};

export function emitTagSearch(tag: string) {
  const clean = String(tag).trim();
  if (!clean) return;

  window.dispatchEvent(
    new CustomEvent("muzesgarden-search-tag", {
      detail: { tag: clean },
    })
  );
}

export function getTagOriginLabel(
  trackCount: number,
  sectionCount: number
): string {
  if (trackCount > 0 && sectionCount > 0) return "Track + Moment";
  if (sectionCount > 0) return "Moment";
  return "Track";
}

export function buildTopTags(allTracks: AnyTrack[]): TopTagItem[] {
  const counts = new Map<
    string,
    {
      total: number;
      trackCount: number;
      sectionCount: number;
    }
  >();

  for (const track of allTracks) {
    for (const tag of getTrackTags(track)) {
      const key = String(tag).trim();
      if (!key) continue;

      const prev = counts.get(key) ?? {
        total: 0,
        trackCount: 0,
        sectionCount: 0,
      };

      counts.set(key, {
        total: prev.total + 1,
        trackCount: prev.trackCount + 1,
        sectionCount: prev.sectionCount,
      });
    }

    for (const tag of getSectionTags(track)) {
      const key = String(tag).trim();
      if (!key) continue;

      const prev = counts.get(key) ?? {
        total: 0,
        trackCount: 0,
        sectionCount: 0,
      };

      counts.set(key, {
        total: prev.total + 1,
        trackCount: prev.trackCount,
        sectionCount: prev.sectionCount + 1,
      });
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1].total !== a[1].total) return b[1].total - a[1].total;
      if (b[1].sectionCount !== a[1].sectionCount) {
        return b[1].sectionCount - a[1].sectionCount;
      }

      return a[0].localeCompare(b[0], undefined, {
        sensitivity: "base",
      });
    })
    .slice(0, 18)
    .map(([tag, meta]) => ({
      tag,
      total: meta.total,
      trackCount: meta.trackCount,
      sectionCount: meta.sectionCount,
      originLabel: getTagOriginLabel(meta.trackCount, meta.sectionCount),
    }));
}