
import { multiTrackRiffGroupingEngineWorkspace } from "./MultiTrackRiffGroupingEngineSeed";
import type {
  MultiTrackRiffGroupingEngineFinding,
  MultiTrackRiffGroupingEngineGroup,
  MultiTrackRiffGroupingEngineGroupStrength,
  MultiTrackRiffGroupingEngineReadiness,
  MultiTrackRiffGroupingEngineRisk,
  MultiTrackRiffGroupingEngineSegment,
  MultiTrackRiffGroupingEngineSource,
  MultiTrackRiffGroupingEngineStatus,
  MultiTrackRiffGroupingEngineWorkspace,
} from "./MultiTrackRiffGroupingEngineTypes";

export function getMultiTrackRiffGroupingEngineWorkspace(): MultiTrackRiffGroupingEngineWorkspace {
  return multiTrackRiffGroupingEngineWorkspace;
}

export function getRiffGroupingEngineReadinessLabel(
  readiness: MultiTrackRiffGroupingEngineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-similarity") return "Needs Similarity";
  if (readiness === "needs-transients") return "Needs Transients";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getRiffGroupingEngineStatusLabel(
  status: MultiTrackRiffGroupingEngineStatus,
): string {
  if (status === "grouped") return "Grouped";
  if (status === "estimated") return "Estimated";
  if (status === "seeded") return "Seeded";
  if (status === "missing") return "Missing";
  return "Future";
}

export function getRiffGroupingEngineRiskLabel(risk: MultiTrackRiffGroupingEngineRisk): string {
  if (risk === "low") return "Low";
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Blocked";
}

export function getRiffGroupingEngineStrengthLabel(
  strength: MultiTrackRiffGroupingEngineGroupStrength,
): string {
  if (strength === "weak") return "Weak";
  if (strength === "moderate") return "Moderate";
  if (strength === "strong") return "Strong";
  if (strength === "keeper-candidate") return "Keeper Candidate";
  return "Blocked";
}

export function getRiffGroupingEngineBooleanLabel(value: boolean): string {
  return value ? "Ready" : "Not Ready";
}

export function getRiffGroupingEngineTimeLabel(timeMs: number): string {
  const seconds = Math.round(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function getRiffGroupingEngineSegmentTimeLabel(
  segment: MultiTrackRiffGroupingEngineSegment,
): string {
  return `${getRiffGroupingEngineTimeLabel(segment.startMs)} - ${getRiffGroupingEngineTimeLabel(
    segment.endMs,
  )}`;
}

export function getRiffGroupingEnginePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 100;
  return Math.round(value * 100);
}

export function getRiffGroupingEngineScoreWidth(value: number): string {
  return `${Math.max(4, getRiffGroupingEnginePercent(value))}%`;
}

export function getRiffGroupingEngineBestSegment(
  source: MultiTrackRiffGroupingEngineSource,
): MultiTrackRiffGroupingEngineSegment | null {
  if (source.segments.length === 0) return null;

  return source.segments.reduce((best, segment) => {
    if (segment.confidence > best.confidence) return segment;
    return best;
  }, source.segments[0]);
}

export function getRiffGroupingEngineBestGroup(
  groups: MultiTrackRiffGroupingEngineGroup[],
): MultiTrackRiffGroupingEngineGroup | null {
  if (groups.length === 0) return null;

  return groups.reduce((best, group) => {
    if (group.survivorPotential > best.survivorPotential) return group;
    return best;
  }, groups[0]);
}

export function getRiffGroupingEngineKeeperGroupCount(
  groups: MultiTrackRiffGroupingEngineGroup[],
): number {
  return groups.filter((group) => group.groupStrength === "keeper-candidate").length;
}

export function getRiffGroupingEngineRiskCount(
  groups: MultiTrackRiffGroupingEngineGroup[],
): number {
  return groups.filter(
    (group) => group.risk === "medium" || group.risk === "high" || group.risk === "blocked",
  ).length;
}

export function getRiffGroupingEngineAverageSurvivorPotential(
  groups: MultiTrackRiffGroupingEngineGroup[],
): number {
  if (groups.length === 0) return 0;
  const total = groups.reduce((sum, group) => sum + group.survivorPotential, 0);
  return roundRiffGroupingNumber(total / groups.length);
}

export function getRiffGroupingEngineAverageConfidence(
  groups: MultiTrackRiffGroupingEngineGroup[],
): number {
  if (groups.length === 0) return 0;
  const total = groups.reduce((sum, group) => sum + group.averageConfidence, 0);
  return roundRiffGroupingNumber(total / groups.length);
}

export function getRiffGroupingEngineSourceSummary(
  source: MultiTrackRiffGroupingEngineSource,
): string {
  const bestSegment = getRiffGroupingEngineBestSegment(source);

  if (!bestSegment) {
    return "No riff segments exist yet.";
  }

  return `${bestSegment.title} is strongest with confidence ${bestSegment.confidence}.`;
}

export function getRiffGroupingEngineGroupSummary(
  group: MultiTrackRiffGroupingEngineGroup,
): string {
  return `${getRiffGroupingEngineStrengthLabel(group.groupStrength)} / ${group.segmentIds.length} segments / survivor potential ${group.survivorPotential}.`;
}

export function getRiffGroupingEngineFindingAction(
  finding: MultiTrackRiffGroupingEngineFinding,
): string {
  return `${getRiffGroupingEngineStatusLabel(finding.status)} / ${getRiffGroupingEngineRiskLabel(
    finding.risk,
  )}: ${finding.action}`;
}

export function buildRiffGroupingEnginePlanningSentence(
  workspace: MultiTrackRiffGroupingEngineWorkspace,
): string {
  const bestGroup = getRiffGroupingEngineBestGroup(workspace.groups);

  if (!bestGroup) {
    return "Riff grouping engine needs grouped families before planning.";
  }

  return `${bestGroup.title} is the strongest current riff family. Recommendation: ${bestGroup.recommendation}`;
}

function roundRiffGroupingNumber(value: number): number {
  return Math.round(value * 100) / 100;
}