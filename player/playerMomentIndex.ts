import type { AnyTrack, TrackSection } from "./playerTypes";
import {
  getSectionBooleanFlags,
  getSectionConfidence,
  getSectionDuration,
  getSectionEnergy,
  getSectionInstruments,
  getSectionIntensity,
  getSectionLabelText,
  getSectionMoods,
  getSectionSearchableText,
  getSectionSource,
  getSectionTextures,
  getSectionTimingProfile,
} from "./playerMomentMetadata";
import { getTrackSections, getTrackTags } from "./playerTrackMetadata";

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export type IndexedMoment = {
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  sectionId: string;
  start: number;
  end: number;
  duration: number;
  label: string;
  description: string;
  searchableText: string;
  trackTags: string[];
  sectionTags: string[];
  combinedTags: string[];
  instruments: string[];
  moods: string[];
  textures: string[];
  confidence: number | null;
  energy: number | null;
  intensity: number | null;
  source: string | null;
  isLoop: boolean;
  isTransition: boolean;
  isImpact: boolean;
};

export function buildIndexedMoment(
  track: AnyTrack,
  section: TrackSection
): IndexedMoment {
  const timing = getSectionTimingProfile(section);

  const sectionTags = uniqStrings(
    Array.isArray(section.tags)
      ? section.tags.map((tag) => String(tag ?? "").trim())
      : []
  );

  const trackTags = uniqStrings(getTrackTags(track));
  const combinedTags = uniqStrings([...trackTags, ...sectionTags]);

  const label = getSectionLabelText(section);
  const description = String(section.description ?? "").trim();
  const searchableText = getSectionSearchableText(section);

  const flags = getSectionBooleanFlags(section);

  return {
    trackId: String(track.id ?? "").trim(),
    trackTitle: String(track.title ?? "").trim(),
    trackArtist: String(track.artist ?? "").trim(),
    sectionId: String(section.id ?? "").trim(),
    start: timing.start,
    end: timing.end,
    duration: getSectionDuration(section),
    label,
    description,
    searchableText,
    trackTags,
    sectionTags,
    combinedTags,
    instruments: getSectionInstruments(section),
    moods: getSectionMoods(section),
    textures: getSectionTextures(section),
    confidence: getSectionConfidence(section),
    energy: getSectionEnergy(section),
    intensity: getSectionIntensity(section),
    source: getSectionSource(section),
    isLoop: flags.isLoop,
    isTransition: flags.isTransition,
    isImpact: flags.isImpact,
  };
}

export function buildTrackMomentIndex(track: AnyTrack): IndexedMoment[] {
  const sections = getTrackSections(track);
  if (!sections.length) return [];

  return sections.map((section) => buildIndexedMoment(track, section));
}

export function buildAllMomentsIndex(tracks: AnyTrack[]): IndexedMoment[] {
  return tracks.flatMap((track) => buildTrackMomentIndex(track));
}

export function getIndexedMomentSearchBlob(moment: IndexedMoment): string {
  return [
    moment.trackTitle,
    moment.trackArtist,
    moment.label,
    moment.description,
    moment.searchableText,
    ...moment.trackTags,
    ...moment.sectionTags,
    ...moment.instruments,
    ...moment.moods,
    ...moment.textures,
    moment.source ?? "",
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ")
    .trim();
}