// app/tools/track-matcher/multi-track/wave-form/MultiTrackSectionSurvivorEngineHelpers.ts

import type {
  MultiTrackSectionSurvivorEntry,
  MultiTrackSectionSurvivorReadiness,
  MultiTrackSectionSurvivorVerdict,
  MultiTrackSectionSurvivorWorkspace,
} from "./MultiTrackSectionSurvivorEngineTypes";

export function getSectionSurvivorReadinessLabel(
  readiness: MultiTrackSectionSurvivorReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getSectionSurvivorVerdictLabel(
  verdict: MultiTrackSectionSurvivorVerdict
) {
  if (verdict === "survivor") return "SURVIVOR";
  if (verdict === "contender") return "CONTENDER";
  if (verdict === "supporting") return "SUPPORTING";
  return "REJECTED";
}

export function getTopSurvivor(
  workspace: MultiTrackSectionSurvivorWorkspace
): MultiTrackSectionSurvivorEntry | null {
  return (
    [...workspace.survivors].sort(
      (a, b) => b.survivalScore - a.survivalScore
    )[0] ?? null
  );
}

export function getAverageSurvivorScore(
  workspace: MultiTrackSectionSurvivorWorkspace
) {
  if (!workspace.survivors.length) return 0;

  const total = workspace.survivors.reduce(
    (sum, survivor) => sum + survivor.survivalScore,
    0
  );

  return Math.round(total / workspace.survivors.length);
}

export function getSurvivorCount(
  workspace: MultiTrackSectionSurvivorWorkspace
) {
  return workspace.survivors.filter(
    (survivor) => survivor.verdict === "survivor"
  ).length;
}