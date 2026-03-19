import type { AnyTrack, TrackSection } from "./playerTypes";
import type { DiscoveryMoment } from "./playerDiscoveryTypes";
import type {
  MetadataEntry,
  MetadataObjectType,
  MetadataRegistry,
} from "./playerMetadataRegistry";
import { getMetadataEntry } from "./playerMetadataRegistry";

export type MetadataLinkTargetType =
  | "track"
  | "track-section"
  | "sound-moment"
  | "tag";

export type MetadataLink = {
  targetType: MetadataLinkTargetType;
  targetKey: string;
  metadataObjectType: MetadataObjectType;
  metadataObjectKey: string;
  entry: MetadataEntry;
};

export type MetadataLinkSummary = {
  trackLinks: MetadataLink[];
  sectionLinks: MetadataLink[];
  momentLinks: MetadataLink[];
  tagLinks: MetadataLink[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean))
  );
}

export function buildTrackMetadataObjectKey(track: AnyTrack): string {
  return normalizeText(track?.id);
}

export function buildTrackSectionMetadataObjectKey(
  trackId: string,
  section: Pick<TrackSection, "id">
): string {
  const cleanTrackId = normalizeText(trackId);
  const cleanSectionId = normalizeText(section?.id);

  return `${cleanTrackId}::${cleanSectionId}`;
}

export function buildDiscoveryMomentMetadataObjectKey(
  moment: Pick<DiscoveryMoment, "trackId" | "sectionId" | "startTime">
): string {
  const cleanTrackId = normalizeText(moment?.trackId);
  const cleanSectionId = normalizeText(moment?.sectionId);
  const startTime = Number.isFinite(moment?.startTime) ? Number(moment.startTime) : 0;

  return `${cleanTrackId}::${cleanSectionId}::${startTime}`;
}

export function buildTagMetadataObjectKey(tag: string): string {
  return normalizeText(tag);
}

export function getTrackMetadataLink(
  registry: MetadataRegistry,
  track: AnyTrack
): MetadataLink | null {
  const objectKey = buildTrackMetadataObjectKey(track);
  if (!objectKey) return null;

  const entry = getMetadataEntry(registry, "tag", objectKey);
  if (!entry) return null;

  return {
    targetType: "track",
    targetKey: objectKey,
    metadataObjectType: "tag",
    metadataObjectKey: objectKey,
    entry,
  };
}

export function getTrackSectionMetadataLink(
  registry: MetadataRegistry,
  trackId: string,
  section: TrackSection
): MetadataLink | null {
  const objectKey = buildTrackSectionMetadataObjectKey(trackId, section);
  if (!objectKey) return null;

  const entry = getMetadataEntry(registry, "track-section", objectKey);
  if (!entry) return null;

  return {
    targetType: "track-section",
    targetKey: objectKey,
    metadataObjectType: "track-section",
    metadataObjectKey: objectKey,
    entry,
  };
}

export function getDiscoveryMomentMetadataLink(
  registry: MetadataRegistry,
  moment: DiscoveryMoment
): MetadataLink | null {
  const objectKey = buildDiscoveryMomentMetadataObjectKey(moment);
  if (!objectKey) return null;

  const entry = getMetadataEntry(registry, "sound-moment", objectKey);
  if (!entry) return null;

  return {
    targetType: "sound-moment",
    targetKey: objectKey,
    metadataObjectType: "sound-moment",
    metadataObjectKey: objectKey,
    entry,
  };
}

export function getTagMetadataLink(
  registry: MetadataRegistry,
  tag: string
): MetadataLink | null {
  const objectKey = buildTagMetadataObjectKey(tag);
  if (!objectKey) return null;

  const entry = getMetadataEntry(registry, "tag", objectKey);
  if (!entry) return null;

  return {
    targetType: "tag",
    targetKey: objectKey,
    metadataObjectType: "tag",
    metadataObjectKey: objectKey,
    entry,
  };
}

export function getTrackSectionMetadataLinks(
  registry: MetadataRegistry,
  track: AnyTrack
): MetadataLink[] {
  const trackId = normalizeText(track?.id);
  const sections = Array.isArray(track?.sections) ? track.sections : [];

  return sections
    .map((section) => getTrackSectionMetadataLink(registry, trackId, section))
    .filter((link): link is MetadataLink => Boolean(link));
}

export function getDiscoveryMomentMetadataLinks(
  registry: MetadataRegistry,
  moments: DiscoveryMoment[]
): MetadataLink[] {
  return (Array.isArray(moments) ? moments : [])
    .map((moment) => getDiscoveryMomentMetadataLink(registry, moment))
    .filter((link): link is MetadataLink => Boolean(link));
}

export function getTagMetadataLinks(
  registry: MetadataRegistry,
  tags: string[]
): MetadataLink[] {
  return uniqStrings(tags)
    .map((tag) => getTagMetadataLink(registry, tag))
    .filter((link): link is MetadataLink => Boolean(link));
}

export function getTrackMetadataLinkSummary(
  registry: MetadataRegistry,
  track: AnyTrack
): MetadataLinkSummary {
  const trackLink = getTrackMetadataLink(registry, track);
  const sectionLinks = getTrackSectionMetadataLinks(registry, track);
  const tagLinks = getTagMetadataLinks(registry, [
    ...(Array.isArray(track?.tags) ? track.tags : []),
    ...(Array.isArray(track?.sections)
      ? track.sections.flatMap((section) =>
          Array.isArray(section?.tags) ? section.tags : []
        )
      : []),
  ]);

  return {
    trackLinks: trackLink ? [trackLink] : [],
    sectionLinks,
    momentLinks: [],
    tagLinks,
  };
}

export function getDiscoveryMetadataLinkSummary(
  registry: MetadataRegistry,
  args: {
    track?: AnyTrack | null;
    moments?: DiscoveryMoment[] | null;
    tags?: string[] | null;
  }
): MetadataLinkSummary {
  const track = args.track ?? null;
  const moments = Array.isArray(args.moments) ? args.moments : [];
  const tags = Array.isArray(args.tags) ? args.tags : [];

  const trackSummary = track
    ? getTrackMetadataLinkSummary(registry, track)
    : {
        trackLinks: [],
        sectionLinks: [],
        momentLinks: [],
        tagLinks: [],
      };

  const momentLinks = getDiscoveryMomentMetadataLinks(registry, moments);
  const tagLinks = getTagMetadataLinks(registry, [
    ...trackSummary.tagLinks.map((link) => link.metadataObjectKey),
    ...tags,
    ...moments.flatMap((moment) => moment.tags ?? []),
  ]);

  return {
    trackLinks: trackSummary.trackLinks,
    sectionLinks: trackSummary.sectionLinks,
    momentLinks,
    tagLinks,
  };
}