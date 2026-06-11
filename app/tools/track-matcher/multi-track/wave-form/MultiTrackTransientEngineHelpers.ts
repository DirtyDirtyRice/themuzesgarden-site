import { multiTrackTransientEngineWorkspace } from "./MultiTrackTransientEngineSeed";
import type {
  MultiTrackTransientEngineCluster,
  MultiTrackTransientEngineComparison,
  MultiTrackTransientEngineFinding,
  MultiTrackTransientEngineHit,
  MultiTrackTransientEngineReadiness,
  MultiTrackTransientEngineRisk,
  MultiTrackTransientEngineSource,
  MultiTrackTransientEngineStatus,
  MultiTrackTransientEngineStrength,
  MultiTrackTransientEngineWorkspace,
} from "./MultiTrackTransientEngineTypes";

export function getMultiTrackTransientEngineWorkspace(): MultiTrackTransientEngineWorkspace {
  return multiTrackTransientEngineWorkspace;
}

export function getTransientEngineReadinessLabel(
  readiness: MultiTrackTransientEngineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-waveform") return "Needs Waveform";
  if (readiness === "needs-statistics") return "Needs Statistics";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getTransientEngineStatusLabel(status: MultiTrackTransientEngineStatus): string {
  if (status === "detected") return "Detected";
  if (status === "estimated") return "Estimated";
  if (status === "seeded") return "Seeded";
  if (status === "missing") return "Missing";
  return "Future";
}

export function getTransientEngineRiskLabel(risk: MultiTrackTransientEngineRisk): string {
  if (risk === "low") return "Low";
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Blocked";
}

export function getTransientEngineStrengthLabel(
  strength: MultiTrackTransientEngineStrength,
): string {
  if (strength === "weak") return "Weak";
  if (strength === "medium") return "Medium";
  if (strength === "strong") return "Strong";
  return "Anchor";
}

export function getTransientEngineBooleanLabel(value: boolean): string {
  return value ? "Ready" : "Not Ready";
}

export function getTransientEngineDurationLabel(durationMs: number): string {
  if (durationMs <= 0) return "0:00";
  const seconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function getTransientEngineTimeLabel(timeMs: number): string {
  const seconds = Math.round(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function getTransientEnginePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 100;
  return Math.round(value * 100);
}

export function getTransientEngineConfidenceWidth(hit: MultiTrackTransientEngineHit): string {
  return `${Math.max(4, getTransientEnginePercent(hit.confidence))}%`;
}

export function getTransientEngineRmsJumpWidth(hit: MultiTrackTransientEngineHit): string {
  return `${Math.max(4, getTransientEnginePercent(hit.rmsJump))}%`;
}

export function getTransientEngineAnchorHits(
  source: MultiTrackTransientEngineSource,
): MultiTrackTransientEngineHit[] {
  return source.hits.filter((hit) => hit.strength === "anchor");
}

export function getTransientEngineStrongHits(
  source: MultiTrackTransientEngineSource,
): MultiTrackTransientEngineHit[] {
  return source.hits.filter((hit) => hit.strength === "anchor" || hit.strength === "strong");
}

export function getTransientEngineAverageConfidence(
  hits: MultiTrackTransientEngineHit[],
): number {
  if (hits.length === 0) return 0;
  const total = hits.reduce((sum, hit) => sum + hit.confidence, 0);
  return roundTransientNumber(total / hits.length);
}

export function getTransientEngineAverageRmsJump(hits: MultiTrackTransientEngineHit[]): number {
  if (hits.length === 0) return 0;
  const total = hits.reduce((sum, hit) => sum + hit.rmsJump, 0);
  return roundTransientNumber(total / hits.length);
}

export function getTransientEngineStrongestHit(
  source: MultiTrackTransientEngineSource,
): MultiTrackTransientEngineHit | null {
  if (source.hits.length === 0) return null;
  return source.hits.reduce((strongest, hit) => {
    if (hit.confidence > strongest.confidence) return hit;
    return strongest;
  }, source.hits[0]);
}

export function getTransientEngineStrongestCluster(
  source: MultiTrackTransientEngineSource,
): MultiTrackTransientEngineCluster | null {
  if (source.clusters.length === 0) return null;
  return source.clusters.reduce((strongest, cluster) => {
    if (cluster.averageConfidence > strongest.averageConfidence) return cluster;
    return strongest;
  }, source.clusters[0]);
}

export function getTransientEngineRiskCount(source: MultiTrackTransientEngineSource): number {
  return source.findings.filter(
    (finding) => finding.risk === "medium" || finding.risk === "high" || finding.risk === "blocked",
  ).length;
}

export function getTransientEngineSourceSummary(source: MultiTrackTransientEngineSource): string {
  const anchors = getTransientEngineAnchorHits(source);
  const strongest = getTransientEngineStrongestHit(source);
  const averageConfidence = getTransientEngineAverageConfidence(source.hits);

  if (!strongest) {
    return "No transient hits exist yet.";
  }

  return `${anchors.length} anchors, strongest hit ${strongest.label}, average confidence ${averageConfidence}.`;
}

export function getTransientEngineClusterTimeLabel(
  cluster: MultiTrackTransientEngineCluster,
): string {
  return `${getTransientEngineTimeLabel(cluster.startMs)} - ${getTransientEngineTimeLabel(
    cluster.endMs,
  )}`;
}

export function getTransientEngineClusterWidth(cluster: MultiTrackTransientEngineCluster): string {
  return `${Math.max(4, getTransientEnginePercent(cluster.averageConfidence))}%`;
}

export function getTransientEngineComparisonSummary(
  comparison: MultiTrackTransientEngineComparison,
): string {
  return `${comparison.sharedAnchorCount} shared anchors, ${comparison.timingDriftMs}ms drift, density difference ${roundTransientNumber(
    comparison.densityDifference,
  )}.`;
}

export function getTransientEngineFindingAction(
  finding: MultiTrackTransientEngineFinding,
): string {
  return `${getTransientEngineStatusLabel(finding.status)} / ${getTransientEngineRiskLabel(
    finding.risk,
  )}: ${finding.action}`;
}

export function buildTransientEnginePlanningSentence(
  source: MultiTrackTransientEngineSource,
): string {
  const strongestCluster = getTransientEngineStrongestCluster(source);
  const strongestHit = getTransientEngineStrongestHit(source);

  if (!strongestCluster || !strongestHit) {
    return "Transient engine needs hits and clusters before planning.";
  }

  return `${source.title}: strongest cluster is ${strongestCluster.title}, strongest hit is ${
    strongestHit.label
  } at ${getTransientEngineTimeLabel(strongestHit.timeMs)}.`;
}

function roundTransientNumber(value: number): number {
  return Math.round(value * 100) / 100;
}