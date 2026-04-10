import type { AnyTrack, TrackSection } from "./playerTypes";
import { pickUrl } from "./playerUtils";
import { buildNowLabel, clampNonNegative } from "./audioEngineHelpers";
import {
  getSafeSectionEnd,
  getTrackSectionById,
  getTrackSectionByStartTime,
} from "./audioEngineSections";

export type ResolvedPlaybackTarget = {
  rawUrl: string;
  resolvedSection: TrackSection | null;
  resolvedSectionId: string | null;
  resolvedStartTime: number;
  resolvedSectionEnd: number | null;
  displayLabel: string;
};

export function resolvePlaybackTarget(args: {
  track: AnyTrack;
  startTime?: number;
  sectionId?: string | null;
}): ResolvedPlaybackTarget | null {
  const { track, startTime, sectionId } = args;

  const rawUrl = pickUrl(track);
  if (!rawUrl) return null;

  const requestedStartTime =
    typeof startTime === "number" && Number.isFinite(startTime)
      ? clampNonNegative(startTime)
      : 0;

  const resolvedSectionById =
    typeof sectionId === "string"
      ? getTrackSectionById(track, sectionId)
      : null;

  const resolvedSectionByTime =
    !resolvedSectionById && requestedStartTime > 0
      ? getTrackSectionByStartTime(track, requestedStartTime)
      : null;

  const resolvedSection = resolvedSectionById ?? resolvedSectionByTime;
  const resolvedStartTime = resolvedSection
    ? clampNonNegative(Number(resolvedSection.start))
    : requestedStartTime;

  const resolvedSectionId = resolvedSection ? String(resolvedSection.id) : null;
  const resolvedSectionEnd = getSafeSectionEnd(resolvedSection, resolvedStartTime);

  return {
    rawUrl,
    resolvedSection,
    resolvedSectionId,
    resolvedStartTime,
    resolvedSectionEnd,
    displayLabel: buildNowLabel(track, resolvedSection, resolvedStartTime),
  };
}

export function shouldStopAtSectionEnd(args: {
  currentTime: number;
  sectionEnd: number | null;
}): boolean {
  const { currentTime, sectionEnd } = args;

  return (
    typeof sectionEnd === "number" &&
    Number.isFinite(sectionEnd) &&
    currentTime >= sectionEnd
  );
}