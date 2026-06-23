// app/tools/track-matcher/multi-track/wave-form/MultiTrackSectionExtractionEngineHelpers.ts

import type {
  MultiTrackExtractedSection,
  MultiTrackSectionExtractionReadiness,
  MultiTrackSectionExtractionWorkspace,
  MultiTrackSectionType,
} from "./MultiTrackSectionExtractionEngineTypes";

export function getSectionExtractionReadinessLabel(
  readiness: MultiTrackSectionExtractionReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getSectionTypeLabel(
  sectionType: MultiTrackSectionType
) {
  return sectionType.toUpperCase();
}

export function getTopExtractedSection(
  workspace: MultiTrackSectionExtractionWorkspace
): MultiTrackExtractedSection | null {
  return (
    [...workspace.sections].sort(
      (a, b) => b.confidence - a.confidence
    )[0] ?? null
  );
}

export function getAverageExtractionConfidence(
  workspace: MultiTrackSectionExtractionWorkspace
) {
  if (!workspace.sections.length) return 0;

  const total = workspace.sections.reduce(
    (sum, section) => sum + section.confidence,
    0
  );

  return Math.round(total / workspace.sections.length);
}

export function getKeeperSectionCount(
  workspace: MultiTrackSectionExtractionWorkspace
) {
  return workspace.sections.filter(
    (section) =>
      section.keeperStatus === "keeper" ||
      section.keeperStatus === "elite"
  ).length;
}