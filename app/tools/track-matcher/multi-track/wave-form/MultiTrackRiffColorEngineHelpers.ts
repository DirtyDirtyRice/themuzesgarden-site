import type {
  MultiTrackRiffColorConflict,
  MultiTrackRiffColorEngineState,
  MultiTrackRiffColorFamily,
  MultiTrackRiffColorName,
  MultiTrackRiffColorReadiness,
  MultiTrackRiffColorRegion,
  MultiTrackRiffColorStatus,
} from "./MultiTrackRiffColorEngineTypes";

export function getRiffColorReadinessLabel(readiness: MultiTrackRiffColorReadiness): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getRiffColorStatusLabel(status: MultiTrackRiffColorStatus): string {
  if (status === "assigned") return "Assigned";
  if (status === "suggested") return "Suggested";
  if (status === "review") return "Review";
  if (status === "unassigned") return "Unassigned";
  if (status === "conflict") return "Conflict";
  return "Future";
}

export function getRiffColorLabel(color: MultiTrackRiffColorName): string {
  if (color === "blue") return "Blue";
  if (color === "purple") return "Purple";
  if (color === "green") return "Green";
  if (color === "yellow") return "Yellow";
  if (color === "orange") return "Orange";
  if (color === "pink") return "Pink";
  if (color === "cyan") return "Cyan";
  return "White";
}

export function getAllRiffColorRegions(
  families: MultiTrackRiffColorFamily[],
): MultiTrackRiffColorRegion[] {
  return families.flatMap((family) => family.regions);
}

export function getReadyRiffColorRegions(
  families: MultiTrackRiffColorFamily[],
): MultiTrackRiffColorRegion[] {
  return getAllRiffColorRegions(families).filter(
    (region) => region.readiness === "ready",
  );
}

export function getReviewRiffColorRegions(
  families: MultiTrackRiffColorFamily[],
): MultiTrackRiffColorRegion[] {
  return getAllRiffColorRegions(families).filter(
    (region) => region.readiness === "needs-review",
  );
}

export function getRiffColorFamilyAverageConfidence(
  family: MultiTrackRiffColorFamily,
): number {
  if (family.regions.length === 0) return 0;

  const total = family.regions.reduce(
    (sum, region) => sum + region.confidencePercent,
    0,
  );

  return Math.round(total / family.regions.length);
}

export function getRiffColorFamilyAverageSimilarity(
  family: MultiTrackRiffColorFamily,
): number {
  if (family.regions.length === 0) return 0;

  const total = family.regions.reduce(
    (sum, region) => sum + region.similarityPercent,
    0,
  );

  return Math.round(total / family.regions.length);
}

export function getRiffColorFamilyScore(family: MultiTrackRiffColorFamily): number {
  const confidence = getRiffColorFamilyAverageConfidence(family);
  const similarity = getRiffColorFamilyAverageSimilarity(family);
  const readyBonus = family.regions.filter((region) => region.readiness === "ready").length * 2;
  const reviewPenalty =
    family.regions.filter((region) => region.readiness === "needs-review").length * 3;

  return Math.max(0, Math.min(100, Math.round(confidence * 0.55 + similarity * 0.45 + readyBonus - reviewPenalty)));
}

export function getRiffColorFamilyAction(family: MultiTrackRiffColorFamily): string {
  const score = getRiffColorFamilyScore(family);

  if (score >= 90) return "Paint waveform and prepare extraction";
  if (score >= 82) return "Paint with review warnings";
  if (score >= 70) return "Listening review before paint";
  return "Do not paint yet";
}

export function getRiffColorConflictSeverityLabel(conflict: MultiTrackRiffColorConflict): string {
  if (conflict.resolved) return "Resolved";
  if (conflict.severity >= 70) return "High Conflict";
  if (conflict.severity >= 40) return "Medium Conflict";
  return "Low Conflict";
}

export function getRiffColorRegionRiskLabel(region: MultiTrackRiffColorRegion): string {
  if (region.risks.length === 0) return "No risks";
  return region.risks.join(", ");
}

export function getRiffColorEngineMetrics(state: MultiTrackRiffColorEngineState): {
  familyCount: number;
  regionCount: number;
  readyRegionCount: number;
  reviewRegionCount: number;
  conflictCount: number;
  unresolvedConflictCount: number;
  extractionReadyCount: number;
  averageConfidence: number;
} {
  const regions = getAllRiffColorRegions(state.families);

  return {
    familyCount: state.families.length,
    regionCount: regions.length,
    readyRegionCount: getReadyRiffColorRegions(state.families).length,
    reviewRegionCount: getReviewRiffColorRegions(state.families).length,
    conflictCount: state.conflicts.length,
    unresolvedConflictCount: state.conflicts.filter((conflict) => !conflict.resolved).length,
    extractionReadyCount: state.extractionHints.filter((hint) => hint.ready).length,
    averageConfidence:
      regions.length === 0
        ? 0
        : Math.round(
            regions.reduce((sum, region) => sum + region.confidencePercent, 0) /
              regions.length,
          ),
  };
}

export function getRiffColorEngineDistanceLabel(state: MultiTrackRiffColorEngineState): string {
  const metrics = getRiffColorEngineMetrics(state);

  if (metrics.extractionReadyCount > 0 && metrics.averageConfidence >= 88) {
    return "Ready for riff extraction";
  }

  if (metrics.readyRegionCount > 0) return "Ready to paint regions";
  if (metrics.regionCount > 0) return "Color planning active";
  return "Planning only";
}