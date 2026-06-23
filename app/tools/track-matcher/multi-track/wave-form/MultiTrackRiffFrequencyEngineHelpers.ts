import type {
  MultiTrackRiffFrequencyReadiness,
  MultiTrackRiffFrequencyRecord,
  MultiTrackRiffFrequencyTier,
  MultiTrackRiffFrequencyWorkspace,
} from "./MultiTrackRiffFrequencyEngineTypes";

export function getMultiTrackRiffFrequencyReadinessLabel(
  readiness: MultiTrackRiffFrequencyReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getMultiTrackRiffFrequencyTierLabel(
  tier: MultiTrackRiffFrequencyTier
) {
  if (tier === "elite") return "ELITE";
  if (tier === "high") return "HIGH";
  if (tier === "medium") return "MEDIUM";
  return "LOW";
}

export function getMultiTrackRiffFrequencyTopRecord(
  workspace: MultiTrackRiffFrequencyWorkspace
): MultiTrackRiffFrequencyRecord | null {
  return (
    [...workspace.records].sort(
      (a, b) => b.frequencyScore - a.frequencyScore
    )[0] || null
  );
}

export function getMultiTrackRiffFrequencyEliteCount(
  workspace: MultiTrackRiffFrequencyWorkspace
) {
  return workspace.records.filter(
    (record) => record.tier === "elite"
  ).length;
}

export function getMultiTrackRiffFrequencyReadyCount(
  workspace: MultiTrackRiffFrequencyWorkspace
) {
  return workspace.records.filter(
    (record) => record.readiness === "ready"
  ).length;
}

export function getMultiTrackRiffFrequencyAverageScore(
  workspace: MultiTrackRiffFrequencyWorkspace
) {
  if (workspace.records.length === 0) return 0;

  const total = workspace.records.reduce(
    (sum, record) => sum + record.frequencyScore,
    0
  );

  return Math.round(total / workspace.records.length);
}