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

export function calculateRepairScore(params: {
  driftSeverity: number | null
  stabilityScore: number | null
  learningScore: number | null
  optimizationScore: number | null
}): number | null {

  const drift = Number(params.driftSeverity ?? 0)
  const stability = Number(params.stabilityScore ?? 1)
  const learning = Number(params.learningScore ?? 0)
  const optimization = Number(params.optimizationScore ?? 0)

  const score =
    drift * 0.4 +
    (1 - stability) * 0.3 +
    (1 - learning) * 0.2 +
    (1 - optimization) * 0.1

  return clamp01(score)
}

export function getRepairLabel(score: number | null): string | null {

  if (score === null) return null

  if (score >= 0.75) return "major-repair"
  if (score >= 0.5) return "moderate-repair"
  if (score >= 0.25) return "minor-repair"

  return "stable"
}