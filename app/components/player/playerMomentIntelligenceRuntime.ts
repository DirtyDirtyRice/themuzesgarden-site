import { runFamilyOrchestrator } from "./playerMomentFamilyOrchestrator";
import type {
  FamilyTrustLevel,
  FamilyTrustReason,
} from "./playerMomentFamilyTrustState.types";

export type PlayerMomentIntelligenceRuntimeInput = {
  familyId: string;

  outcomeScore?: number | null;
  learningScore?: number | null;
  optimizationScore?: number | null;
  repairScore?: number | null;

  outcomeLabel?: string | null;
  learningLabel?: string | null;
  optimizationLabel?: string | null;
  repairLabel?: string | null;

  trustScore?: number | null;
  recoveryScore?: number | null;
  volatilityScore?: number | null;
  trustLevel?: FamilyTrustLevel | null;
  strongestTrustReason?: FamilyTrustReason | null;
  trustReasons?: FamilyTrustReason[] | null;
};

export type PlayerMomentIntelligenceRuntimeState = {
  familyId: string;

  outcomeScore: number | null;
  learningScore: number | null;
  optimizationScore: number | null;
  repairScore: number | null;

  outcomeLabel: string | null;
  learningLabel: string | null;
  optimizationLabel: string | null;
  repairLabel: string | null;

  trustScore: number | null;
  recoveryScore: number | null;
  volatilityScore: number | null;
  trustLevel: FamilyTrustLevel | null;
  strongestTrustReason: FamilyTrustReason | null;
  trustReasons: FamilyTrustReason[];

  hasOutcome: boolean;
  hasLearning: boolean;
  hasOptimization: boolean;
  hasRepair: boolean;
  hasTrust: boolean;

  healthBand: "strong" | "good" | "watch" | "weak";
  summary: string[];
};

function normalizeNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function normalizeUnitScore(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function normalizePercentScore(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}

function normalizeText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function normalizeReasonList(value: unknown): FamilyTrustReason[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: FamilyTrustReason[] = [];

  for (const item of value) {
    const reason = String(item ?? "").trim();
    if (!reason || seen.has(reason)) continue;
    seen.add(reason);
    result.push(reason as FamilyTrustReason);
  }

  return result;
}

function getHealthBand(params: {
  outcomeScore: number | null;
  learningScore: number | null;
  optimizationScore: number | null;
  repairScore: number | null;
  trustScore: number | null;
  volatilityScore: number | null;
}): "strong" | "good" | "watch" | "weak" {
  const normalizedScores = [
    normalizeUnitScore(params.outcomeScore),
    normalizeUnitScore(params.learningScore),
    normalizeUnitScore(params.optimizationScore),
    params.trustScore === null ? null : normalizeUnitScore(params.trustScore / 100),
  ].filter((value): value is number => value !== null);

  const repairScore = normalizeUnitScore(params.repairScore) ?? 0;
  const volatilityScore =
    params.volatilityScore === null
      ? 0
      : normalizeUnitScore(params.volatilityScore / 100) ?? 0;

  if (!normalizedScores.length) return "weak";

  const average =
    normalizedScores.reduce((sum, value) => sum + value, 0) / normalizedScores.length;

  if (average >= 0.82 && repairScore < 0.25 && volatilityScore < 0.35) {
    return "strong";
  }
  if (average >= 0.62 && repairScore < 0.45 && volatilityScore < 0.55) {
    return "good";
  }
  if (average >= 0.42) return "watch";
  return "weak";
}

function buildSummary(params: {
  outcomeLabel: string | null;
  learningLabel: string | null;
  optimizationLabel: string | null;
  repairLabel: string | null;
  trustLevel: FamilyTrustLevel | null;
  strongestTrustReason: FamilyTrustReason | null;
  recoveryScore: number | null;
  volatilityScore: number | null;
  healthBand: "strong" | "good" | "watch" | "weak";
}): string[] {
  const summary: string[] = [];

  if (params.outcomeLabel) summary.push(`outcome:${params.outcomeLabel}`);
  if (params.learningLabel) summary.push(`learning:${params.learningLabel}`);
  if (params.optimizationLabel) {
    summary.push(`optimization:${params.optimizationLabel}`);
  }
  if (params.repairLabel) summary.push(`repair:${params.repairLabel}`);
  if (params.trustLevel) summary.push(`trust:${params.trustLevel}`);
  if (params.strongestTrustReason) {
    summary.push(`trust-reason:${params.strongestTrustReason}`);
  }

  if (params.recoveryScore !== null) {
    summary.push(`recovery:${Math.round(params.recoveryScore)}`);
  }

  if (params.volatilityScore !== null) {
    summary.push(`volatility:${Math.round(params.volatilityScore)}`);
  }

  summary.push(`health:${params.healthBand}`);

  return summary;
}

export function buildPlayerMomentIntelligenceRuntime(
  input: PlayerMomentIntelligenceRuntimeInput
): PlayerMomentIntelligenceRuntimeState {
  const familyId = String(input.familyId ?? "").trim() || "unknown-family";

  const trustScore = normalizePercentScore(input.trustScore);
  const recoveryScore = normalizePercentScore(input.recoveryScore);
  const volatilityScore = normalizePercentScore(input.volatilityScore);

  const trustLevel =
    (normalizeText(input.trustLevel) as FamilyTrustLevel | null) ?? null;

  const strongestTrustReason =
    (normalizeText(input.strongestTrustReason) as FamilyTrustReason | null) ?? null;

  const trustReasons = normalizeReasonList(input.trustReasons);

  const orchestrated = runFamilyOrchestrator({
    familyId,
    outcomeScore: normalizeNumber(input.outcomeScore),
    learningScore: normalizeNumber(input.learningScore),
    optimizationScore: normalizeNumber(input.optimizationScore),
    repairScore: normalizeNumber(input.repairScore),
    outcomeLabel: normalizeText(input.outcomeLabel),
    learningLabel: normalizeText(input.learningLabel),
    optimizationLabel: normalizeText(input.optimizationLabel),
    repairLabel: normalizeText(input.repairLabel),
  });

  const hasOutcome = orchestrated.outcomeScore !== null;
  const hasLearning = orchestrated.learningScore !== null;
  const hasOptimization = orchestrated.optimizationScore !== null;
  const hasRepair = orchestrated.repairScore !== null;
  const hasTrust = trustScore !== null;

  const healthBand = getHealthBand({
    outcomeScore: orchestrated.outcomeScore,
    learningScore: orchestrated.learningScore,
    optimizationScore: orchestrated.optimizationScore,
    repairScore: orchestrated.repairScore,
    trustScore,
    volatilityScore,
  });

  const summary = buildSummary({
    outcomeLabel: orchestrated.outcomeLabel,
    learningLabel: orchestrated.learningLabel,
    optimizationLabel: orchestrated.optimizationLabel,
    repairLabel: orchestrated.repairLabel,
    trustLevel,
    strongestTrustReason,
    recoveryScore,
    volatilityScore,
    healthBand,
  });

  return {
    familyId: orchestrated.familyId || familyId,

    outcomeScore: orchestrated.outcomeScore,
    learningScore: orchestrated.learningScore,
    optimizationScore: orchestrated.optimizationScore,
    repairScore: orchestrated.repairScore,

    outcomeLabel: orchestrated.outcomeLabel,
    learningLabel: orchestrated.learningLabel,
    optimizationLabel: orchestrated.optimizationLabel,
    repairLabel: orchestrated.repairLabel,

    trustScore,
    recoveryScore,
    volatilityScore,
    trustLevel,
    strongestTrustReason,
    trustReasons,

    hasOutcome,
    hasLearning,
    hasOptimization,
    hasRepair,
    hasTrust,

    healthBand,
    summary,
  };
}