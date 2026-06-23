import type {
  MultiTrackRiffNormalizationReadiness,
  MultiTrackRiffNormalizationVersion,
  MultiTrackRiffNormalizationWorkspace,
} from "./MultiTrackRiffNormalizationEngineTypes";

export function getMultiTrackRiffNormalizationReadinessLabel(
  readiness: MultiTrackRiffNormalizationReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getMultiTrackRiffNormalizationReadyCount(
  workspace: MultiTrackRiffNormalizationWorkspace
) {
  return workspace.versions.filter((version) => version.readiness === "ready")
    .length;
}

export function getMultiTrackRiffNormalizationReviewCount(
  workspace: MultiTrackRiffNormalizationWorkspace
) {
  return workspace.versions.filter(
    (version) => version.readiness === "needs-review"
  ).length;
}

export function getMultiTrackRiffNormalizationLockedOriginalCount(
  workspace: MultiTrackRiffNormalizationWorkspace
) {
  return workspace.versions.filter(
    (version) =>
      version.originalBpm > 0 &&
      version.originalKey.trim().length > 0 &&
      version.originalKey !== "Unknown"
  ).length;
}

export function getMultiTrackRiffNormalizationRiskCount(
  workspace: MultiTrackRiffNormalizationWorkspace
) {
  return workspace.versions.filter((version) => version.risk !== "safe").length;
}

export function getMultiTrackRiffNormalizationShiftSummary(
  version: MultiTrackRiffNormalizationVersion
) {
  if (version.mode === "reference-version") {
    return "Reference version. No shift needed.";
  }

  if (version.mode === "manual") {
    return "Manual BPM/key confirmation required.";
  }

  return `${version.bpmShift} / ${version.keyShift}`;
}

export function getMultiTrackRiffNormalizationRiskLabel(
  version: MultiTrackRiffNormalizationVersion
) {
  if (version.risk === "safe") return "SAFE";
  if (version.risk === "watch-artifacts") return "WATCH ARTIFACTS";
  if (version.risk === "feel-change") return "FEEL CHANGE";
  return "MANUAL CHECK";
}

export function getMultiTrackRiffNormalizationModeLabel(
  version: MultiTrackRiffNormalizationVersion
) {
  if (version.mode === "tempo-only") return "TEMPO ONLY";
  if (version.mode === "key-only") return "KEY ONLY";
  if (version.mode === "tempo-and-key") return "TEMPO + KEY";
  if (version.mode === "reference-version") return "REFERENCE";
  return "MANUAL";
}

export function getMultiTrackRiffNormalizationScopeLabel(
  version: MultiTrackRiffNormalizationVersion
) {
  if (version.scope === "riff") return "RIFF";
  if (version.scope === "phrase") return "PHRASE";
  if (version.scope === "section") return "SECTION";
  return "FULL VERSION";
}