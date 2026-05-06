import {
  getProjectTrackSourceLabel,
  getProjectTrackVisibilityLabel,
} from "./projectTrackDecorators";
import type {
  AnyTrack,
  FilterMode,
  LocalVisibility,
} from "./projectLibraryPanelTypes";

export function getTrackTags(track: AnyTrack): string[] {
  const raw = (track as any)?.tags;
  if (!Array.isArray(raw)) return [];

  return Array.from(
    new Set(
      raw
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

export function scoreTrack(
  track: AnyTrack,
  query: string,
  isLinked: boolean
): number {
  const title = String(track?.title ?? "").toLowerCase();
  const artist = String(track?.artist ?? "").toLowerCase();
  const path = String(track?.path ?? "").toLowerCase();
  const tid = String(track?.id ?? "").toLowerCase();
  const tags = getTrackTags(track).map((value) => value.toLowerCase());

  let score = 0;

  if (!query) score += isLinked ? 5 : 10;

  if (query) {
    if (title === query) score += 100;
    else if (title.startsWith(query)) score += 70;
    else if (title.includes(query)) score += 35;

    if (artist === query) score += 20;
    else if (artist.startsWith(query)) score += 14;
    else if (artist.includes(query)) score += 8;

    for (const tag of tags) {
      if (tag === query) score += 24;
      else if (tag.startsWith(query)) score += 16;
      else if (tag.includes(query)) score += 10;
    }

    if (path.includes(query)) score += 4;
    if (tid.includes(query)) score += 2;
  }

  if (!isLinked) score += 10;

  return score;
}

export function hasPlayableSource(track: AnyTrack | null | undefined): boolean {
  if (!track) return false;

  return Boolean(
    String(track.path ?? "").trim() ||
      String(track.url ?? "").trim() ||
      String(track.storage_path ?? "").trim() ||
      String(track.file_path ?? "").trim() ||
      String(track.mp3 ?? "").trim()
  );
}

export function normalizeVisibility(value: unknown): LocalVisibility {
  const clean = String(value ?? "").trim().toLowerCase();
  return clean === "private" ? "private" : "public";
}

export function getBaseVisibility(track: AnyTrack): LocalVisibility {
  const directVisibility = normalizeVisibility(track?.visibility);
  if (directVisibility === "private") return "private";

  const decoratedVisibility = String(
    getProjectTrackVisibilityLabel(track) ?? ""
  )
    .trim()
    .toLowerCase();

  return decoratedVisibility === "private" ? "private" : "public";
}

export function getEffectiveVisibility(
  track: AnyTrack,
  visibilityOverrides: Record<string, LocalVisibility>
): LocalVisibility {
  const tid = String(track?.id ?? "");
  const override = visibilityOverrides[tid];
  if (override === "private" || override === "public") return override;
  return getBaseVisibility(track);
}

export function getEffectiveVisibilityLabel(
  track: AnyTrack,
  visibilityOverrides: Record<string, LocalVisibility>
): string {
  return getEffectiveVisibility(track, visibilityOverrides) === "private"
    ? "Private"
    : "Public";
}

export function filterTracks(
  allTracks: AnyTrack[],
  linkedTrackIds: Set<string>,
  q: string,
  mode: FilterMode
): AnyTrack[] {
  const query = q.trim().toLowerCase();

  let list = Array.isArray(allTracks) ? allTracks : [];

  if (mode === "linked") {
    list = list.filter((track) => linkedTrackIds.has(String(track?.id)));
  } else if (mode === "unlinked") {
    list = list.filter((track) => !linkedTrackIds.has(String(track?.id)));
  }

  const mapped = list
    .map((track) => {
      const isLinked = linkedTrackIds.has(String(track?.id));

      if (!query) {
        return {
          track,
          score: scoreTrack(track, query, isLinked),
        };
      }

      const title = String(track?.title ?? "").toLowerCase();
      const artist = String(track?.artist ?? "").toLowerCase();
      const path = String(track?.path ?? "").toLowerCase();
      const tid = String(track?.id ?? "").toLowerCase();
      const tags = getTrackTags(track).map((value) => value.toLowerCase());

      const matches =
        title.includes(query) ||
        artist.includes(query) ||
        path.includes(query) ||
        tid.includes(query) ||
        tags.some((tag) => tag.includes(query));

      if (!matches) return null;

      return {
        track,
        score: scoreTrack(track, query, isLinked),
      };
    })
    .filter(Boolean) as { track: AnyTrack; score: number }[];

  return mapped
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aTitle = String(a.track?.title ?? "");
      const bTitle = String(b.track?.title ?? "");
      const byTitle = aTitle.localeCompare(bTitle, undefined, {
        sensitivity: "base",
      });
      if (byTitle !== 0) return byTitle;

      return String(a.track?.id ?? "").localeCompare(
        String(b.track?.id ?? ""),
        undefined,
        {
          sensitivity: "base",
        }
      );
    })
    .map((item) => item.track);
}

export function getModeChipClass(active: boolean): string {
  return [
    "text-xs px-2 py-1 rounded border border-white bg-black text-white transition active:scale-[0.98]",
    active ? "shadow-[inset_0_0_0_1px_white]" : "",
  ].join(" ");
}

export function getSourceLabel(track: AnyTrack): string {
  return String(getProjectTrackSourceLabel(track) ?? "Library");
}