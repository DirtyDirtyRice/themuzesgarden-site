import type {
  BuildFamilyLearningParams,
  FamilyLearningResult,
} from "./playerMomentFamilyLearning.types";

import {
  calculateLearningScore,
  getLearningLabel,
  normalizeBoolean,
} from "./playerMomentFamilyLearning.shared";

function normalizeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildFamilyLearning(
  params: BuildFamilyLearningParams
): FamilyLearningResult {
  const outcomeScore = normalizeNumber(params.outcomeScore);

  const signalConfirmed = normalizeBoolean(params.signalConfirmed);
  const driftCorrected = normalizeBoolean(params.driftCorrected);
  const repeatReinforced = normalizeBoolean(params.repeatReinforced);
  const structureReinforced = normalizeBoolean(params.structureReinforced);

  const trustDelta = normalizeNumber(params.trustDelta);

  const learningScore = calculateLearningScore({
    outcomeScore,
    signalConfirmed,
    driftCorrected,
    repeatReinforced,
    structureReinforced,
    trustDelta,
  });

  const learningLabel =
    getLearningLabel(learningScore) as FamilyLearningResult["learningLabel"];

  const reinforceStrategy =
    signalConfirmed && (learningScore ?? 0) >= 0.65;

  const reinforceStructure =
    structureReinforced && (learningScore ?? 0) >= 0.6;

  const reinforceRepeat =
    repeatReinforced && (learningScore ?? 0) >= 0.6;

  const adjustPlanning = (learningScore ?? 0) < 0.5;

  const avoidStrategy = (learningScore ?? 0) < 0.3;

  const trustAcceleration =
    trustDelta !== null && trustDelta > 0 ? 0.1 : null;

  const trustPenalty =
    trustDelta !== null && trustDelta < 0 ? 0.1 : null;

  const reasons: string[] = [];

  if (signalConfirmed) reasons.push("signal-confirmed");
  if (driftCorrected) reasons.push("drift-corrected");
  if (repeatReinforced) reasons.push("repeat-reinforced");
  if (structureReinforced) reasons.push("structure-reinforced");

  if (reinforceStrategy) reasons.push("reinforce-strategy");
  if (adjustPlanning) reasons.push("planning-adjustment");
  if (avoidStrategy) reasons.push("avoid-strategy");

  return {
    familyId: params.familyId,

    learningScore,

    signals: {
      reinforceStrategy,
      reinforceStructure,
      reinforceRepeat,
      adjustPlanning,
      avoidStrategy,
    },

    trustImpact: {
      trustAcceleration,
      trustPenalty,
    },

    learningLabel,

    reasons,
  };
}
