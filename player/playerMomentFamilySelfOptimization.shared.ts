function clamp01(value: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

export function normalizeBoolean(value: unknown): boolean {
  return Boolean(value)
}

export function calculateOptimizationScore(params: {
  learningScore: number | null
  trustScore: number | null
  stabilityScore: number | null
}): number | null {

  const learning = Number(params.learningScore ?? 0)
  const trust = Number(params.trustScore ?? 0)
  const stability = Number(params.stabilityScore ?? 0)

  const score =
    learning * 0.5 +
    trust * 0.3 +
    stability * 0.2

  return clamp01(score)
}

export function getOptimizationLabel(score: number | null): string | null {

  if (score === null) return null

  if (score >= 0.85) return "strong-reinforce"
  if (score >= 0.65) return "reinforce"
  if (score >= 0.45) return "neutral"
  if (score >= 0.25) return "repair"

  return "avoid"
}