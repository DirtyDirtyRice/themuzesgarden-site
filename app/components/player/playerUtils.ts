import type { AnyTrack, TrackSection } from "./playerTypes";

export const MUZES_SEARCH_TAG_EVENT = "muzesgarden-search-tag";

export function looksLikeUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export function pickUrl(t: AnyTrack): string {
  const u = String(t?.url ?? "").trim();
  if (u) return u;

  const p = String(t?.path ?? "").trim();
  if (p.startsWith("http")) return p;

  return "";
}

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;

  const tag = (el.tagName || "").toLowerCase();

  if (tag === "input" || tag === "textarea" || tag === "select") return true;

  if ((el as any).isContentEditable) return true;

  return false;
}

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
    )
  );
}

export function emitTagSearch(tag: string): string {
  const clean = String(tag).trim();
  if (!clean) return "";

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MUZES_SEARCH_TAG_EVENT, {
        detail: { tag: clean },
      })
    );
  }

  return clean;
}

export function getTrackTags(t: AnyTrack): string[] {
  const raw = t?.tags;
  if (!Array.isArray(raw)) return [];
  return uniqStrings(raw.map((x) => String(x ?? "")));
}

export function getTrackSections(t: AnyTrack): TrackSection[] {
  const raw = t?.sections;

  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (section): section is TrackSection =>
      Boolean(section) &&
      typeof section === "object" &&
      typeof section.id === "string"
  );
}

export function getSectionTags(t: AnyTrack): string[] {
  const sections = getTrackSections(t);

  return uniqStrings(
    sections.flatMap((section) =>
      Array.isArray(section.tags)
        ? section.tags.map((x) => String(x ?? ""))
        : []
    )
  );
}

export function getSectionDescriptions(t: AnyTrack): string[] {
  const sections = getTrackSections(t);

  return sections
    .map((section) => String(section.description ?? "").trim())
    .filter(Boolean);
}

export function getAllDiscoveryTags(t: AnyTrack): string[] {
  return uniqStrings([...getTrackTags(t), ...getSectionTags(t)]);
}

export function hasTrackTag(t: AnyTrack, tag: string): boolean {
  const needle = String(tag).trim().toLowerCase();

  if (!needle) return false;

  return getTrackTags(t).some((x) => x.toLowerCase() === needle);
}

export function hasSectionTag(t: AnyTrack, tag: string): boolean {
  const needle = String(tag).trim().toLowerCase();

  if (!needle) return false;

  return getSectionTags(t).some((x) => x.toLowerCase() === needle);
}

export function getTagSourceSummary(
  t: AnyTrack,
  tag: string
): {
  tag: string;
  inTrackTags: boolean;
  inSectionTags: boolean;
  originLabel: "track" | "moment" | "track+moment" | "none";
} {
  const clean = String(tag).trim();

  const inTrackTags = hasTrackTag(t, clean);

  const inSectionTags = hasSectionTag(t, clean);

  let originLabel: "track" | "moment" | "track+moment" | "none" = "none";

  if (inTrackTags && inSectionTags) originLabel = "track+moment";
  else if (inSectionTags) originLabel = "moment";
  else if (inTrackTags) originLabel = "track";

  return {
    tag: clean,
    inTrackTags,
    inSectionTags,
    originLabel,
  };
}

export function getDiscoveryTagBreakdown(t: AnyTrack): {
  trackTags: string[];
  sectionTags: string[];
  combinedTags: string[];
} {
  const trackTags = getTrackTags(t);

  const sectionTags = getSectionTags(t);

  const combinedTags = uniqStrings([...trackTags, ...sectionTags]);

  return {
    trackTags,
    sectionTags,
    combinedTags,
  };
}

/*
  NEW: Discovery Index
  ----------------------------------
  Prepares searchable data once per track
  instead of recalculating during every search.
*/

export type DiscoveryIndex = {
  title: string;
  artist: string;
  tags: string[];
  descriptions: string[];
  path: string;
  id: string;
};

export function buildDiscoveryIndex(t: AnyTrack): DiscoveryIndex {
  return {
    title: String(t?.title ?? "").toLowerCase(),
    artist: String(t?.artist ?? "").toLowerCase(),
    tags: getAllDiscoveryTags(t).map((x) => x.toLowerCase()),
    descriptions: getSectionDescriptions(t).map((x) => x.toLowerCase()),
    path: String(t?.path ?? "").toLowerCase(),
    id: String(t?.id ?? "").toLowerCase(),
  };
}