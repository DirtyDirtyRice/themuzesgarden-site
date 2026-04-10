import type { AnyTrack, TrackSection } from "./playerTypes";
import { clampNonNegative } from "./audioEngineHelpers";

export function getSortedTrackSections(
  track: AnyTrack | null | undefined
): TrackSection[] {
  const sections = Array.isArray(track?.sections) ? [...track.sections] : [];

  return sections
    .filter(
      (section): section is TrackSection =>
        Boolean(section) &&
        typeof section === "object" &&
        typeof section.id === "string"
    )
    .sort((a, b) => {
      const aStart = Number(a.start);
      const bStart = Number(b.start);

      const safeA = Number.isFinite(aStart) ? aStart : 0;
      const safeB = Number.isFinite(bStart) ? bStart : 0;

      if (safeA !== safeB) return safeA - safeB;

      return String(a.id ?? "").localeCompare(String(b.id ?? ""), undefined, {
        sensitivity: "base",
      });
    });
}

export function getTrackSectionById(
  track: AnyTrack | null | undefined,
  sectionId: string | null | undefined
): TrackSection | null {
  if (!track || !sectionId) return null;
  const needle = String(sectionId).trim();
  if (!needle) return null;

  const found = getSortedTrackSections(track).find(
    (section) => String(section?.id ?? "") === needle
  );

  return found ?? null;
}

export function getTrackSectionByStartTime(
  track: AnyTrack | null | undefined,
  startTime: number | null | undefined
): TrackSection | null {
  if (!track || typeof startTime !== "number" || !Number.isFinite(startTime)) {
    return null;
  }

  const safeStartTime = clampNonNegative(startTime);
  const sections = getSortedTrackSections(track);

  for (const section of sections) {
    const sectionStart = clampNonNegative(Number(section.start));
    if (Math.abs(sectionStart - safeStartTime) < 0.05) {
      return section;
    }
  }

  return null;
}

export function getSafeSectionEnd(
  section: TrackSection | null,
  startTime: number
): number | null {
  if (!section) return null;

  const end = Number(section.end);
  if (!Number.isFinite(end)) return null;
  if (end <= startTime) return null;

  return end;
}