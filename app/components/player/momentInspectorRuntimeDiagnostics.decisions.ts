import type {
  BuildMomentInspectorEngineVerdictParams,
  BuildMomentInspectorRuntimeDecisionParams,
  MomentInspectorEngineVerdict,
} from "./momentInspectorRuntimeDiagnostics.types";

import {
  clamp01,
  clamp100,
  normalizeRiskFlags,
  normalizeText,
} from "./momentInspectorRuntimeDiagnostics.shared";

function getMissingActions(value: unknown): number {
  return Math.max(0, Number(value ?? 0));
}

function getNearActions(value: unknown): number {
  return Math.max(0, Number(value ?? 0));
}

function getPresentActions(value: unknown): number {
  return Math.max(0, Number(value ?? 0));
}

function getTotalActions(value: unknown): number {
  return Math.max(0, Number(value ?? 0));
}

function getTopConfidence(value: unknown): number {
  return clamp01(Number(value ?? 0)) * 100;
}

function getStabilityScore(value: unknown): number {
  return clamp100(Number(value ?? 0));
}

function getRepeatCoverage(value: unknown): number {
  return clamp100(Number(value ?? 0));
}

function getStructuralConfidence(value: unknown): number {
  return clamp100(Number(value ?? 0));
}

function getTimingConsistency(value: unknown): number {
  return clamp100(Number(value ?? 0));
}

function getDurationConsistency(value: unknown): number {
  return clamp100(Number(value ?? 0));
}

function getComparedMemberCount(value: unknown): number {
  return Math.max(0, Number(value ?? 0));
}

function getUnstableCount(value: unknown): number {
  return Math.max(0, Number(value ?? 0));
}

function getRepairPriority(value: unknown): number {
  return Math.max(0, Number(value ?? 0));
}

function hasSevereDriftLabel(value: unknown): boolean {
  return normalizeText(value).toLowerCase() === "high";
}

function getMissingRatio(totalActions: number, missingActions: number): number {
  if (totalActions <= 0) return 0;
  return missingActions / totalActions;
}

function getNearRatio(totalActions: number, nearActions: number): number {
  if (totalActions <= 0) return 0;
  return nearActions / totalActions;
}

function getPresentRatio(totalActions: number, presentActions: number): number {
  if (totalActions <= 0) return 0;
  return presentActions / totalActions;
}

function getUnstableRatio(
  comparedMemberCount: number,
  unstableCount: number
): number {
  if (comparedMemberCount <= 0) return 0;
  return unstableCount / comparedMemberCount;
}

export function buildRiskFlags(
  params: BuildMomentInspectorRuntimeDecisionParams
): string[] {
  const {
    actionSummaryRow,
    driftFamilyRow,
    repairQueueRow,
    stabilityFamilyRow,
    confidenceScore,
    driftSeverityScore,
    readinessScore,
  } = params;

  const flags: string[] = [];

  const totalActions = getTotalActions(actionSummaryRow?.totalActions);
  const presentActions = getPresentActions(actionSummaryRow?.presentActions);
  const missingActions = getMissingActions(actionSummaryRow?.missingActions);
  const nearActions = getNearActions(actionSummaryRow?.nearActions);
  const topConfidence = getTopConfidence(actionSummaryRow?.topConfidence);

  const missingRatio = getMissingRatio(totalActions, missingActions);
  const nearRatio = getNearRatio(totalActions, nearActions);
  const presentRatio = getPresentRatio(totalActions, presentActions);

  const stabilityScore = getStabilityScore(stabilityFamilyRow?.stabilityScore);
  const repeatCoverage = getRepeatCoverage(stabilityFamilyRow?.repeatCoverage);
  const structuralConfidence = getStructuralConfidence(
    stabilityFamilyRow?.structuralConfidence
  );
  const timingConsistency = getTimingConsistency(
    stabilityFamilyRow?.timingConsistency
  );
  const durationConsistency = getDurationConsistency(
    stabilityFamilyRow?.durationConsistency
  );

  const unstableCount = getUnstableCount(driftFamilyRow?.unstableCount);
  const comparedMemberCount = getComparedMemberCount(
    driftFamilyRow?.comparedMemberCount
  );
  const unstableRatio = getUnstableRatio(comparedMemberCount, unstableCount);

  const repairPriority = getRepairPriority(repairQueueRow?.repairPriorityScore);

  if (totalActions === 0) {
    flags.push("no intended action coverage");
  }

  if (missingActions > 0) {
    if (missingRatio >= 0.5 || missingActions >= 3) {
      flags.push("heavy missing intended actions");
    } else if (missingActions >= 2) {
      flags.push("multiple missing intended actions");
    } else {
      flags.push("missing intended actions");
    }
  }

  if (nearActions > 0) {
    if (nearRatio >= 0.5 || nearActions >= 4) {
      flags.push("heavy near-action ambiguity");
    } else if (nearActions >= 2) {
      flags.push("multiple near intended actions");
    } else {
      flags.push("near intended actions");
    }
  }

  if (presentActions === 0 && totalActions > 0) {
    flags.push("no confirmed intended actions");
  } else if (presentRatio < 0.35 && totalActions >= 3) {
    flags.push("weak confirmed action coverage");
  }

  if (topConfidence < 45) {
    flags.push("weak top action confidence");
  } else if (topConfidence < 60) {
    flags.push("soft top action confidence");
  }

  if (unstableCount > 0) {
    if (unstableRatio >= 0.6) {
      flags.push("majority unstable phrase members");
    } else if (unstableRatio >= 0.35) {
      flags.push("elevated unstable phrase members");
    } else {
      flags.push("unstable phrase members");
    }
  }

  if (hasSevereDriftLabel(driftFamilyRow?.highestSeverity)) {
    flags.push("high severity drift");
  }

  if (driftSeverityScore >= 80) {
    flags.push("severe drift exposure");
  } else if (driftSeverityScore >= 60) {
    flags.push("elevated drift exposure");
  } else if (driftSeverityScore >= 40) {
    flags.push("moderate drift exposure");
  }

  if (repairPriority >= 14) {
    flags.push("elevated repair pressure");
  } else if (repairPriority >= 8) {
    flags.push("active repair pressure");
  }

  if (stabilityScore < 55) {
    flags.push("low phrase stability");
  } else if (stabilityScore < 70) {
    flags.push("soft phrase stability");
  }

  if (repeatCoverage < 60) {
    flags.push("weak repeat coverage");
  } else if (repeatCoverage < 72) {
    flags.push("soft repeat coverage");
  }

  if (structuralConfidence < 60) {
    flags.push("weak structural confidence");
  } else if (structuralConfidence < 72) {
    flags.push("soft structural confidence");
  }

  if (timingConsistency < 60) {
    flags.push("weak timing consistency");
  }

  if (durationConsistency < 60) {
    flags.push("weak duration consistency");
  }

  if (confidenceScore < 45) {
    flags.push("low confidence");
  } else if (confidenceScore < 60) {
    flags.push("soft confidence");
  }

  if (readinessScore < 45) {
    flags.push("not discovery ready");
  } else if (readinessScore < 60) {
    flags.push("partially discovery ready");
  }

  for (const flag of stabilityFamilyRow?.issueFlags ?? []) {
    const clean = normalizeText(flag).replace(/-/g, " ");
    if (clean) flags.push(clean);
  }

  return normalizeRiskFlags(flags);
}

export function buildDiagnosticNotes(
  params: BuildMomentInspectorRuntimeDecisionParams
): string[] {
  const {
    actionSummaryRow,
    driftFamilyRow,
    repairQueueRow,
    stabilityFamilyRow,
    confidenceScore,
    driftSeverityScore,
    readinessScore,
  } = params;

  const notes: string[] = [];

  const missingActions = getMissingActions(actionSummaryRow?.missingActions);
  const nearActions = getNearActions(actionSummaryRow?.nearActions);
  const presentActions = getPresentActions(actionSummaryRow?.presentActions);
  const totalActions = getTotalActions(actionSummaryRow?.totalActions);
  const topConfidence = getTopConfidence(actionSummaryRow?.topConfidence);

  const missingRatio = getMissingRatio(totalActions, missingActions);
  const nearRatio = getNearRatio(totalActions, nearActions);
  const presentRatio = getPresentRatio(totalActions, presentActions);

  const stabilityScore = getStabilityScore(stabilityFamilyRow?.stabilityScore);
  const repeatCoverage = getRepeatCoverage(stabilityFamilyRow?.repeatCoverage);
  const structuralConfidence = getStructuralConfidence(
    stabilityFamilyRow?.structuralConfidence
  );

  const unstableCount = getUnstableCount(driftFamilyRow?.unstableCount);
  const comparedCount = getComparedMemberCount(driftFamilyRow?.comparedMemberCount);
  const unstableRatio = getUnstableRatio(comparedCount, unstableCount);

  if (actionSummaryRow) {
    notes.push(
      `Action coverage: ${presentActions} present, ${nearActions} near, ${missingActions} missing out of ${totalActions}.`
    );
    notes.push(`Top intended-action confidence is ${Math.round(topConfidence)}%.`);

    if (totalActions > 0) {
      notes.push(
        `Coverage ratios: ${Math.round(presentRatio * 100)}% present, ${Math.round(
          nearRatio * 100
        )}% near, ${Math.round(missingRatio * 100)}% missing.`
      );
    }
  }

  if (driftFamilyRow) {
    notes.push(
      `Drift profile: ${unstableCount}/${comparedCount} compared members unstable, highest severity ${normalizeText(
        driftFamilyRow.highestSeverity
      ) || "none"}.`
    );
    notes.push(
      `Drift health score is ${Math.round(
        clamp100(driftFamilyRow.driftHealthScore)
      )} with dominant label ${normalizeText(
        driftFamilyRow.dominantDriftLabel
      ).toLowerCase() || "stable"}.`
    );

    if (comparedCount > 0) {
      notes.push(
        `Unstable member ratio is ${Math.round(unstableRatio * 100)}% of compared phrase members.`
      );
    }
  }

  if (stabilityFamilyRow) {
    notes.push(
      `Stability profile: ${Math.round(stabilityScore)} stability, ${Math.round(
        repeatCoverage
      )} repeat coverage, ${Math.round(structuralConfidence)} structural confidence.`
    );
  }

  if (repairQueueRow) {
    notes.push(
      `Repair priority score is ${Number(
        repairQueueRow.repairPriorityScore.toFixed(1)
      )} with ${repairQueueRow.driftUnstableCount} unstable drift members.`
    );
  }

  if (missingActions > 0) {
    if (missingRatio >= 0.5) {
      notes.push("Missing intended actions are the dominant blocker right now.");
    } else {
      notes.push("Intended action coverage still has meaningful gaps.");
    }
  } else if (nearActions > 0) {
    if (nearRatio >= 0.5) {
      notes.push("Most intended action evidence is still ambiguous near-match behavior.");
    } else {
      notes.push("Intended action coverage is mostly present but still has ambiguous near matches.");
    }
  } else if (totalActions > 0) {
    notes.push("Intended action coverage is clean enough to support stronger engine trust.");
  }

  if (confidenceScore >= 78) {
    notes.push("Confidence is strong enough for downstream engine trust.");
  } else if (confidenceScore >= 60) {
    notes.push("Confidence is usable but should still be monitored.");
  } else {
    notes.push("Confidence is soft and needs reinforcement before deeper automation.");
  }

  if (driftSeverityScore >= 80) {
    notes.push("Drift severity is high enough to force repair-first handling.");
  } else if (driftSeverityScore >= 60) {
    notes.push("Drift severity is elevated and is actively reducing trust.");
  } else if (driftSeverityScore >= 40) {
    notes.push("Drift severity is moderate and should stay under watch.");
  } else {
    notes.push("Drift severity is currently contained.");
  }

  if (stabilityScore < 55) {
    notes.push("Stability is too weak for stronger discovery trust.");
  } else if (stabilityScore < 70) {
    notes.push("Stability is usable but still needs reinforcement.");
  } else {
    notes.push("Stability is currently supportive.");
  }

  if (readinessScore >= 78) {
    notes.push("Family appears discovery-ready.");
  } else if (readinessScore >= 60) {
    notes.push("Family is partially ready but still has stability or repair friction.");
  } else {
    notes.push("Family is not yet ready for reliable discovery-level trust.");
  }

  return notes;
}

export function getRecommendedNextStep(
  params: BuildMomentInspectorRuntimeDecisionParams
): string {
  const {
    actionSummaryRow,
    driftFamilyRow,
    repairQueueRow,
    stabilityFamilyRow,
    confidenceScore,
    driftSeverityScore,
    readinessScore,
  } = params;

  const missingActions = getMissingActions(actionSummaryRow?.missingActions);
  const nearActions = getNearActions(actionSummaryRow?.nearActions);
  const presentActions = getPresentActions(actionSummaryRow?.presentActions);
  const totalActions = getTotalActions(actionSummaryRow?.totalActions);

  const missingRatio = getMissingRatio(totalActions, missingActions);
  const nearRatio = getNearRatio(totalActions, nearActions);

  const repeatCoverage = getRepeatCoverage(stabilityFamilyRow?.repeatCoverage);
  const structuralConfidence = getStructuralConfidence(
    stabilityFamilyRow?.structuralConfidence
  );
  const stabilityScore = getStabilityScore(stabilityFamilyRow?.stabilityScore);

  const repairPriority = getRepairPriority(repairQueueRow?.repairPriorityScore);
  const unstableCount = getUnstableCount(driftFamilyRow?.unstableCount);

  if (missingActions >= 3 || missingRatio >= 0.5) {
    return "Fill the missing intended phrase actions first because coverage gaps are the main blocker.";
  }

  if (driftSeverityScore >= 80) {
    return "Repair severe drift before allowing stronger discovery or ranking influence.";
  }

  if (repairPriority >= 14) {
    return "Work the repair queue first because cleanup pressure is still high.";
  }

  if (stabilityScore < 55) {
    return "Improve phrase stability before promoting this family into stronger trust.";
  }

  if (repeatCoverage < 60) {
    return "Improve repeat coverage so the family pattern locks more cleanly.";
  }

  if (structuralConfidence < 60) {
    return "Strengthen structural confidence before engine promotion.";
  }

  if (missingActions > 0) {
    return "Fill the missing intended phrase action before promoting this family.";
  }

  if (unstableCount > 0) {
    return "Tighten unstable phrase members to reduce drift spread.";
  }

  if (nearActions >= 3 || nearRatio >= 0.45) {
    return "Resolve heavy near-action ambiguity so intended behavior becomes explicit.";
  }

  if (nearActions > 0) {
    return "Confirm or correct the remaining near-match intended actions.";
  }

  if (presentActions === 0 && totalActions > 0) {
    return "Confirm at least one intended action before trusting this family downstream.";
  }

  if (confidenceScore < 60) {
    return "Increase confidence signals before trusting automation output.";
  }

  if (readinessScore >= 78) {
    return "Promote this family as discovery-ready and continue passive monitoring.";
  }

  return "Monitor this family and continue light stabilization.";
}

export function getEngineVerdict(
  params: BuildMomentInspectorEngineVerdictParams
): MomentInspectorEngineVerdict {
  const {
    confidenceScore,
    driftSeverityScore,
    repairPriorityScore,
    readinessScore,
    actionSummaryRow,
    stabilityFamilyRow,
  } = params;

  const missingActions = getMissingActions(actionSummaryRow?.missingActions);
  const nearActions = getNearActions(actionSummaryRow?.nearActions);
  const presentActions = getPresentActions(actionSummaryRow?.presentActions);
  const totalActions = getTotalActions(actionSummaryRow?.totalActions);

  const missingRatio = getMissingRatio(totalActions, missingActions);
  const nearRatio = getNearRatio(totalActions, nearActions);
  const presentRatio = getPresentRatio(totalActions, presentActions);

  const stabilityScore = getStabilityScore(stabilityFamilyRow?.stabilityScore);
  const repeatCoverage = getRepeatCoverage(stabilityFamilyRow?.repeatCoverage);
  const structuralConfidence = getStructuralConfidence(
    stabilityFamilyRow?.structuralConfidence
  );

  if (
    missingActions >= 3 ||
    missingRatio >= 0.6 ||
    driftSeverityScore >= 85 ||
    repairPriorityScore >= 18 ||
    stabilityScore < 35 ||
    readinessScore < 30 ||
    (totalActions > 0 && presentActions === 0 && nearActions === 0)
  ) {
    return "blocked";
  }

  if (
    missingActions > 0 ||
    missingRatio >= 0.25 ||
    driftSeverityScore >= 60 ||
    repairPriorityScore >= 9 ||
    confidenceScore < 58 ||
    stabilityScore < 60 ||
    repeatCoverage < 60 ||
    structuralConfidence < 60 ||
    readinessScore < 58
  ) {
    return "repair";
  }

  if (
    nearActions > 0 ||
    nearRatio >= 0.25 ||
    driftSeverityScore >= 38 ||
    repairPriorityScore >= 5 ||
    confidenceScore < 78 ||
    stabilityScore < 74 ||
    readinessScore < 78 ||
    presentRatio < 0.5
  ) {
    return "watch";
  }

  return "stable";
}