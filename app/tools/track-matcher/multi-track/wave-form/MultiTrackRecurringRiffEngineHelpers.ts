import type {
  MultiTrackRecurringRiff,
  MultiTrackRecurringRiffMatchType,
  MultiTrackRecurringRiffReadiness,
  MultiTrackRecurringRiffStrength,
  MultiTrackRecurringRiffWorkspace,
} from "./MultiTrackRecurringRiffEngineTypes";

export function getMultiTrackRecurringRiffReadinessLabel(
  readiness: MultiTrackRecurringRiffReadiness
) {
  if (readiness === "ready") return "READY";
  if (readiness === "needs-review") return "NEEDS REVIEW";
  if (readiness === "blocked") return "BLOCKED";
  return "FUTURE";
}

export function getMultiTrackRecurringRiffStrengthLabel(
  strength: MultiTrackRecurringRiffStrength
) {
  if (strength === "dominant") return "DOMINANT";
  if (strength === "strong") return "STRONG";
  if (strength === "moderate") return "MODERATE";
  return "WEAK";
}

export function getMultiTrackRecurringRiffMatchTypeLabel(
  matchType: MultiTrackRecurringRiffMatchType
) {
  if (matchType === "exact-shape") return "EXACT SHAPE";
  if (matchType === "tempo-shifted") return "TEMPO SHIFTED";
  if (matchType === "key-shifted") return "KEY SHIFTED";
  if (matchType === "rhythm-related") return "RHYTHM RELATED";
  if (matchType === "melody-related") return "MELODY RELATED";
  return "MANUAL REVIEW";
}

export function getMultiTrackRecurringRiffReadyCount(
  workspace: MultiTrackRecurringRiffWorkspace
) {
  return workspace.riffs.filter((riff) => riff.readiness === "ready").length;
}

export function getMultiTrackRecurringRiffReviewCount(
  workspace: MultiTrackRecurringRiffWorkspace
) {
  return workspace.riffs.filter((riff) => riff.readiness === "needs-review")
    .length;
}

export function getMultiTrackRecurringRiffDominantCount(
  workspace: MultiTrackRecurringRiffWorkspace
) {
  return workspace.riffs.filter((riff) => riff.strength === "dominant").length;
}

export function getMultiTrackRecurringRiffKeeperCandidateCount(
  workspace: MultiTrackRecurringRiffWorkspace
) {
  return workspace.riffs.filter((riff) =>
    riff.keeperBankStatus.toLowerCase().includes("keeper")
  ).length;
}

export function getMultiTrackRecurringRiffTotalUses(
  workspace: MultiTrackRecurringRiffWorkspace
) {
  return workspace.riffs.reduce((total, riff) => total + riff.usageCount, 0);
}

export function getMultiTrackRecurringRiffTopCandidate(
  workspace: MultiTrackRecurringRiffWorkspace
): MultiTrackRecurringRiff | null {
  return (
    [...workspace.riffs].sort((firstRiff, secondRiff) => {
      if (secondRiff.usageCount !== firstRiff.usageCount) {
        return secondRiff.usageCount - firstRiff.usageCount;
      }

      return firstRiff.label.localeCompare(secondRiff.label);
    })[0] || null
  );
}