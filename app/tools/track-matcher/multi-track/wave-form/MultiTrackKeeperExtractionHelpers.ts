import type {
  MultiTrackKeeperExtractionAction,
  MultiTrackKeeperExtractionConfidence,
  MultiTrackKeeperExtractionReadinessStatus,
  MultiTrackKeeperExtractionRegion,
  MultiTrackKeeperExtractionRegionKind,
  MultiTrackKeeperExtractionRisk,
  MultiTrackKeeperExtractionWorkspaceState,
} from "./MultiTrackKeeperExtractionTypes";

export function getMultiTrackKeeperExtractionReadinessLabel(
  status: MultiTrackKeeperExtractionReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackKeeperExtractionRegionKindLabel(
  kind: MultiTrackKeeperExtractionRegionKind,
): string {
  if (kind === "hook") return "Hook";
  if (kind === "riff") return "Riff";
  if (kind === "chorus") return "Chorus";
  if (kind === "verse") return "Verse";
  if (kind === "bridge") return "Bridge";
  if (kind === "breakdown") return "Breakdown";
  if (kind === "intro") return "Intro";
  if (kind === "outro") return "Outro";
  return "Transition";
}

export function getMultiTrackKeeperExtractionConfidenceLabel(
  confidence: MultiTrackKeeperExtractionConfidence,
): string {
  if (confidence === "verified") return "Verified";
  if (confidence === "strong") return "Strong";
  if (confidence === "medium") return "Medium";
  if (confidence === "weak") return "Weak";
  return "Missing";
}

export function getMultiTrackKeeperExtractionActionLabel(
  action: MultiTrackKeeperExtractionAction,
): string {
  if (action === "extract") return "Extract";
  if (action === "duplicate") return "Duplicate";
  if (action === "trim") return "Trim";
  if (action === "loop") return "Loop";
  if (action === "send-to-edit-lane") return "Send To Edit Lane";
  if (action === "send-to-arrangement") return "Send To Arrangement";
  if (action === "send-to-render-queue") return "Send To Render Queue";
  return "Review";
}

export function getMultiTrackKeeperExtractionRiskLabel(risk: MultiTrackKeeperExtractionRisk): string {
  if (risk === "rough-boundary") return "Rough Boundary";
  if (risk === "missing-downbeat") return "Missing Downbeat";
  if (risk === "missing-bpm") return "Missing BPM";
  if (risk === "missing-key") return "Missing Key";
  if (risk === "overlap-risk") return "Overlap Risk";
  if (risk === "needs-human-confirmation") return "Needs Human Confirmation";
  return "Seed Placeholder";
}

export function getMultiTrackKeeperExtractionDurationSeconds(
  region: MultiTrackKeeperExtractionRegion,
): number {
  return Math.max(0, region.endTimeSeconds - region.startTimeSeconds);
}

export function getMultiTrackKeeperExtractionBeatLength(
  region: MultiTrackKeeperExtractionRegion,
): number {
  return Math.max(0, region.endBeat - region.startBeat);
}

export function getMultiTrackKeeperExtractionComputedScore(
  region: MultiTrackKeeperExtractionRegion,
): number {
  const confidenceBoost = getMultiTrackKeeperExtractionConfidenceBoost(region.confidence);
  const readinessBoost = getMultiTrackKeeperExtractionReadinessBoost(region.readinessStatus);
  const riskPenalty = Math.min(region.risks.length * 4, 18);

  return Math.round(
    region.strengthScore * 0.32 +
      region.boundaryScore * 0.2 +
      region.loopScore * 0.16 +
      region.extractionScore * 0.22 +
      confidenceBoost * 100 * 0.06 +
      readinessBoost * 100 * 0.04 -
      riskPenalty,
  );
}

export function sortMultiTrackKeeperExtractionRegionsByScore(
  regions: MultiTrackKeeperExtractionRegion[],
): MultiTrackKeeperExtractionRegion[] {
  return [...regions].sort(
    (left, right) =>
      getMultiTrackKeeperExtractionComputedScore(right) -
      getMultiTrackKeeperExtractionComputedScore(left),
  );
}

export function getMultiTrackKeeperExtractionBestRegion(
  regions: MultiTrackKeeperExtractionRegion[],
): MultiTrackKeeperExtractionRegion | undefined {
  return sortMultiTrackKeeperExtractionRegionsByScore(regions)[0];
}

export function getMultiTrackKeeperExtractionRegionsByKind(
  regions: MultiTrackKeeperExtractionRegion[],
  kind: MultiTrackKeeperExtractionRegionKind,
): MultiTrackKeeperExtractionRegion[] {
  return regions.filter((region) => region.regionKind === kind);
}

export function getMultiTrackKeeperExtractionRegionsByReadiness(
  regions: MultiTrackKeeperExtractionRegion[],
  readinessStatus: MultiTrackKeeperExtractionReadinessStatus,
): MultiTrackKeeperExtractionRegion[] {
  return regions.filter((region) => region.readinessStatus === readinessStatus);
}

export function getMultiTrackKeeperExtractionRegionsForAction(
  regions: MultiTrackKeeperExtractionRegion[],
  action: MultiTrackKeeperExtractionAction,
): MultiTrackKeeperExtractionRegion[] {
  return regions.filter((region) => region.actions.includes(action));
}

export function getMultiTrackKeeperExtractionLaneRegions(
  state: MultiTrackKeeperExtractionWorkspaceState,
  laneId: string,
): MultiTrackKeeperExtractionRegion[] {
  const lane = state.lanes.find((item) => item.id === laneId);
  if (!lane) return [];

  return lane.regionIds
    .map((regionId) => state.regions.find((region) => region.id === regionId))
    .filter((region): region is MultiTrackKeeperExtractionRegion => Boolean(region));
}

export function getMultiTrackKeeperExtractionRegionTitle(
  state: MultiTrackKeeperExtractionWorkspaceState,
  regionId: string,
): string {
  return state.regions.find((region) => region.id === regionId)?.title ?? "Unknown extraction region";
}

export function getMultiTrackKeeperExtractionWorkspaceSummary(
  state: MultiTrackKeeperExtractionWorkspaceState,
): {
  regionCount: number;
  hookCount: number;
  riffCount: number;
  readyCount: number;
  reviewCount: number;
  extractableCount: number;
  bestRegionTitle: string;
  bestRegionScore: number;
} {
  const bestRegion = getMultiTrackKeeperExtractionBestRegion(state.regions);

  return {
    regionCount: state.regions.length,
    hookCount: getMultiTrackKeeperExtractionRegionsByKind(state.regions, "hook").length,
    riffCount: getMultiTrackKeeperExtractionRegionsByKind(state.regions, "riff").length,
    readyCount: getMultiTrackKeeperExtractionRegionsByReadiness(state.regions, "ready").length,
    reviewCount: getMultiTrackKeeperExtractionRegionsByReadiness(state.regions, "needs-review").length,
    extractableCount: getMultiTrackKeeperExtractionRegionsForAction(state.regions, "extract").length,
    bestRegionTitle: bestRegion?.title ?? "No extraction region",
    bestRegionScore: bestRegion ? getMultiTrackKeeperExtractionComputedScore(bestRegion) : 0,
  };
}

function getMultiTrackKeeperExtractionConfidenceBoost(
  confidence: MultiTrackKeeperExtractionConfidence,
): number {
  if (confidence === "verified") return 1;
  if (confidence === "strong") return 0.86;
  if (confidence === "medium") return 0.62;
  if (confidence === "weak") return 0.32;
  return 0;
}

function getMultiTrackKeeperExtractionReadinessBoost(
  status: MultiTrackKeeperExtractionReadinessStatus,
): number {
  if (status === "ready") return 1;
  if (status === "needs-review") return 0.6;
  if (status === "future") return 0.36;
  return 0;
}