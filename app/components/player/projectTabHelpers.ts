import type { AnyTrack, TrackSection } from "./playerTypes";
import {
  debugMomentPlayback,
  getSectionDescriptions,
  getTrackSections,
} from "./playerUtils";

import { MUZES_PLAYBACK_TARGET_EVENT } from "./playerEvents";

export function getSectionDescriptionSummary(t: AnyTrack): string | null {
  const descriptions = getSectionDescriptions(t);
  return descriptions[0] ?? null;
}

export function getOriginUiLabel(
  originLabel: "track" | "moment" | "track+moment" | "none"
): string {
  if (originLabel === "track+moment") return "TRACK+MOMENT";
  if (originLabel === "moment") return "MOMENT";
  if (originLabel === "track") return "TRACK";
  return "TAG";
}

export function getMomentLabel(section: TrackSection): string {
  const description = String(section.description ?? "").trim();
  if (description) return description;

  const tags = Array.isArray(section.tags)
    ? section.tags.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];

  if (tags.length > 0) return tags[0]!;
  return String(section.id ?? "Moment");
}

export function getSafeMomentStart(section: TrackSection): number {
  const n = Number(section.start);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function getSortedTrackSections(track: AnyTrack): TrackSection[] {
  return [...getTrackSections(track)].sort((a, b) => {
    const aStart = getSafeMomentStart(a);
    const bStart = getSafeMomentStart(b);
    if (aStart !== bStart) return aStart - bStart;

    return String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, {
      sensitivity: "base",
    });
  });
}

export function getMomentDensityLabel(sectionCount: number): string {
  if (sectionCount >= 6) return "High Density";
  if (sectionCount >= 3) return "Dense";
  if (sectionCount >= 1) return "Indexed";
  return "No Moments";
}

export function getMomentDensityChipClass(sectionCount: number): string {
  if (sectionCount >= 6) return "border-amber-200 bg-amber-50 text-amber-800";
  if (sectionCount >= 3) return "border-yellow-200 bg-yellow-50 text-yellow-800";
  if (sectionCount >= 1) return "border-zinc-200 bg-white text-zinc-600";
  return "border-zinc-200 bg-zinc-50 text-zinc-500";
}

export function getTrackMomentCoverageLabel(
  sectionCount: number,
  trackTagCount: number,
  sectionTagCount: number
): string {
  if (sectionCount >= 4 && sectionTagCount >= 4) return "Moment Rich";
  if (sectionCount >= 1 && sectionTagCount >= 1) return "Moment Ready";
  if (trackTagCount >= 1) return "Track Tagged";
  return "Sparse";
}

export function emitProjectMomentPlaybackTarget(track: AnyTrack, section: TrackSection) {
  const trackId = String(track?.id ?? "").trim();
  const sectionId = String(section?.id ?? "").trim();
  if (!trackId || !sectionId) return;

  const startTime = getSafeMomentStart(section);

  debugMomentPlayback({
    source: "ProjectTab/PlayMoment",
    trackId,
    sectionId,
    startTime,
  });

  window.dispatchEvent(
    new CustomEvent(MUZES_PLAYBACK_TARGET_EVENT, {
      detail: {
        trackId,
        sectionId,
        startTime,
        preferProjectTab: true,
      },
    })
  );
}