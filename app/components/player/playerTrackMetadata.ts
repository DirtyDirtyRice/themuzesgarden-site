import type { AnyTrack, TrackSection } from "./playerTypes";

export type DiscoveryIndex = {
  title: string;
  artist: string;
  tags: string[];
  descriptions: string[];
  path: string;
  id: string;
};

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeSearchQuery(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
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
  const needle = normalizeSearchQuery(tag);

  if (!needle) return false;

  return getTrackTags(t).some((x) => normalizeSearchQuery(x) === needle);
}

export function hasSectionTag(t: AnyTrack, tag: string): boolean {
  const needle = normalizeSearchQuery(tag);

  if (!needle) return false;

  return getSectionTags(t).some((x) => normalizeSearchQuery(x) === needle);
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

export function buildDiscoveryIndex(t: AnyTrack): DiscoveryIndex {
  return {
    title: normalizeSearchQuery(t?.title),
    artist: normalizeSearchQuery(t?.artist),
    tags: getAllDiscoveryTags(t).map((x) => normalizeSearchQuery(x)),
    descriptions: getSectionDescriptions(t).map((x) => normalizeSearchQuery(x)),
    path: normalizeSearchQuery(t?.path),
    id: normalizeSearchQuery(t?.id),
  };
}

export function normalizeSectionText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeStartTime(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function getSectionLabel(section: TrackSection): string {
  const desc = String(section.description ?? "").trim();
  if (desc) return desc;

  const tags = Array.isArray(section.tags)
    ? section.tags.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];

  if (tags.length) return tags[0]!;
  return section.id;
}