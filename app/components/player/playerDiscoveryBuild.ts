import type { AnyTrack, TrackSection } from "./playerTypes";
import type {
  DiscoveryBuildInput,
  DiscoveryMoment,
  DiscoveryTrack,
} from "./playerDiscoveryTypes";

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

function safeStartTime(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function getTrackTagsSafe(track: AnyTrack): string[] {
  return Array.isArray(track.tags)
    ? uniqStrings(track.tags.map((tag) => String(tag ?? "")))
    : [];
}

function getTrackSectionsSafe(track: AnyTrack): TrackSection[] {
  if (!Array.isArray(track.sections)) return [];

  return track.sections
    .filter(
      (section): section is TrackSection =>
        Boolean(section) &&
        typeof section === "object" &&
        typeof section.id === "string"
    )
    .slice()
    .sort((a, b) => {
      const aStart = safeStartTime(a.start);
      const bStart = safeStartTime(b.start);
      if (aStart !== bStart) return aStart - bStart;

      return String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, {
        sensitivity: "base",
      });
    });
}

function getSectionTagsSafe(section: TrackSection): string[] {
  return Array.isArray(section.tags)
    ? uniqStrings(section.tags.map((tag) => String(tag ?? "")))
    : [];
}

function getMomentLabel(section: TrackSection): string {
  const description = String(section.description ?? "").trim();
  if (description) return description;

  const tags = getSectionTagsSafe(section);
  if (tags.length > 0) return tags[0]!;

  return String(section.id ?? "Moment").trim() || "Moment";
}

function buildDiscoveryMoment(track: AnyTrack, section: TrackSection): DiscoveryMoment {
  return {
    trackId: String(track.id ?? "").trim(),
    sectionId: String(section.id ?? "").trim(),
    startTime: safeStartTime(section.start),
    label: getMomentLabel(section),
    description: String(section.description ?? "").trim() || undefined,
    tags: getSectionTagsSafe(section),
  };
}

function buildDiscoveryTrack(track: AnyTrack): DiscoveryTrack | null {
  const trackId = String(track.id ?? "").trim();
  if (!trackId) return null;

  const sections = getTrackSectionsSafe(track);
  const moments = sections.map((section) => buildDiscoveryMoment(track, section));

  return {
    trackId,
    title: String(track.title ?? "").trim() || undefined,
    artist: String(track.artist ?? "").trim() || undefined,
    trackTags: getTrackTagsSafe(track),
    moments,
  };
}

export function buildDiscoveryTracks(input: DiscoveryBuildInput): DiscoveryTrack[] {
  const tracks = Array.isArray(input.tracks) ? input.tracks : [];

  return tracks
    .map((track) => buildDiscoveryTrack(track))
    .filter((track): track is DiscoveryTrack => Boolean(track));
}