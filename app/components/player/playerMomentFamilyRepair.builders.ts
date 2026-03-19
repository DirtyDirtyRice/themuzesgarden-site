import type {
  BuildFamilyRepairParams,
  FamilyRepairResult,
} from "./playerMomentFamilyRepair.types"

import {
  calculateRepairScore,
  getRepairLabel,
  normalizeBoolean,
} from "./playerMomentFamilyRepair.shared"

function normalizeNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function buildFamilyRepair(
  params: BuildFamilyRepairParams
): FamilyRepairResult {

  const driftSeverity = normalizeNumber(params.driftSeverity)
  const stabilityScore = normalizeNumber(params.stabilityScore)
  const learningScore = normalizeNumber(params.learningScore)
  const optimizationScore = normalizeNumber(params.optimizationScore)

  const adjustPlanning = normalizeBoolean(params.adjustPlanning)
  const avoidStrategy = normalizeBoolean(params.avoidStrategy)

  const repairScore = calculateRepairScore({
    driftSeverity,
    stabilityScore,
    learningScore,
    optimizationScore,
  })

  const repairLabel = getRepairLabel(repairScore)

  const repairDrift =
    (driftSeverity ?? 0) > 0.3

  const repairStructure =
    (stabilityScore ?? 1) < 0.6

  const repairRepeat =
    adjustPlanning && (learningScore ?? 0) < 0.5

  const repairStability =
    (optimizationScore ?? 0) < 0.5

  const reasons: string[] = []

  if (repairDrift) reasons.push("drift-repair-needed")
  if (repairStructure) reasons.push("structure-repair-needed")
  if (repairRepeat) reasons.push("repeat-adjustment-needed")
  if (repairStability) reasons.push("stability-repair-needed")
  if (avoidStrategy) reasons.push("strategy-avoidance-signal")

  return {
    familyId: params.familyId,

    repairScore,

    signals: {
      repairDrift,
      repairStructure,
      repairRepeat,
      repairStability,
    },

    repairLabel,

    reasons,
  }
}