import type {
  BuildFamilyOptimizationParams,
  FamilyOptimizationResult,
} from "./playerMomentFamilySelfOptimization.types"

import {
  calculateOptimizationScore,
  getOptimizationLabel,
  normalizeBoolean,
} from "./playerMomentFamilySelfOptimization.shared"

function normalizeNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function buildFamilySelfOptimization(
  params: BuildFamilyOptimizationParams
): FamilyOptimizationResult {
  const learningScore = normalizeNumber(params.learningScore)
  const trustScore = normalizeNumber(params.trustScore)
  const stabilityScore = normalizeNumber(params.stabilityScore)

  const reinforceStrategy = normalizeBoolean(params.reinforceStrategy)
  const reinforceStructure = normalizeBoolean(params.reinforceStructure)
  const reinforceRepeat = normalizeBoolean(params.reinforceRepeat)

  const adjustPlanning = normalizeBoolean(params.adjustPlanning)
  const avoidStrategy = normalizeBoolean(params.avoidStrategy)

  const optimizationScore = calculateOptimizationScore({
    learningScore,
    trustScore,
    stabilityScore,
  })

  const optimizationLabel = (getOptimizationLabel(optimizationScore) ?? null) as any

  const reinforceFamily =
    reinforceStrategy ||
    reinforceStructure ||
    reinforceRepeat

  const repairFamily =
    adjustPlanning && (optimizationScore ?? 0) < 0.5

  const avoidFamily =
    avoidStrategy && (optimizationScore ?? 0) < 0.3

  const reuseFamily =
    reinforceFamily && (optimizationScore ?? 0) >= 0.65

  const reasons: string[] = []

  if (reinforceFamily) reasons.push("reinforce-family")
  if (repairFamily) reasons.push("repair-family")
  if (avoidFamily) reasons.push("avoid-family")
  if (reuseFamily) reasons.push("reuse-family")

  return {
    familyId: params.familyId,

    optimizationScore,

    signals: {
      reinforceFamily,
      reuseFamily,
      repairFamily,
      avoidFamily,
    },

    optimizationLabel,

    reasons,
  }
}
