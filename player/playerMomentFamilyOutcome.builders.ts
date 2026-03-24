import type {
  BuildFamilyOutcomeParams,
  FamilyOutcomeResult,
} from "./playerMomentFamilyOutcome.types";

import {
  calculateOutcomeScore,
  getOutcomeLabel,
  normalizeBoolean,
} from "./playerMomentFamilyOutcome.shared";

function normalizeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildFamilyOutcome(
  params: BuildFamilyOutcomeParams
): FamilyOutcomeResult {
  const executed = normalizeBoolean(params.executed);
  const success = normalizeBoolean(params.executionSuccess);

  const signalConfirmed = normalizeBoolean(params.signalConfirmed);
  const driftCorrected = normalizeBoolean(params.driftCorrected);
  const repeatReinforced = normalizeBoolean(params.repeatReinforced);
  const structureReinforced = normalizeBoolean(params.structureReinforced);

  const previousTrust = normalizeNumber(params.previousTrust);
  const newTrust = normalizeNumber(params.newTrust);

  let trustDelta: number | null = null;

  if (previousTrust !== null && newTrust !== null) {
    trustDelta = newTrust - previousTrust;
  }

  const outcomeScore = calculateOutcomeScore({
    success,
    signalConfirmed,
    driftCorrected,
    repeatReinforced,
    structureReinforced,
    trustDelta,
  });

  const outcomeLabel =
    getOutcomeLabel(outcomeScore) as FamilyOutcomeResult["outcomeLabel"];

  const reasons: string[] = [];

  if (!executed) reasons.push("family-not-executed");

  if (executed && !success) reasons.push("execution-failed");

  if (signalConfirmed) reasons.push("signal-confirmed");

  if (driftCorrected) reasons.push("drift-corrected");

  if (repeatReinforced) reasons.push("repeat-reinforced");

  if (structureReinforced) reasons.push("structure-reinforced");

  if (trustDelta !== null) {
    if (trustDelta > 0) reasons.push("trust-improved");
    if (trustDelta < 0) reasons.push("trust-declined");
  }

  return {
    familyId: params.familyId,

    execution: {
      familyId: params.familyId,
      executed,
      success,
      timestamp: normalizeNumber(params.timestamp),
    },

    signals: {
      signalConfirmed,
      driftCorrected,
      repeatReinforced,
      structureReinforced,
    },

    trust: {
      previousTrust,
      newTrust,
      trustDelta,
    },

    outcomeScore,
    outcomeLabel,

    reasons,
  };
}
