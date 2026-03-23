import { buildMomentFamilyLearning } from "./playerMomentFamilyLearning";
import { buildMomentFamilyOutcome } from "./playerMomentFamilyOutcome";
import { buildPlayerMomentIntelligenceRuntime } from "./playerMomentIntelligenceRuntime";

type RuntimeSignals = {
  familyId: string;
  hasDriftFamily?: boolean;
  driftMemberCount?: number;
  hasStabilityFamily?: boolean;
  hasRepairQueueRow?: boolean;
  hasSelectedFamily?: boolean;
  hasActionSummary?: boolean;
  actionCount?: number;
};

type RuntimeTrustLevel =
  Parameters<typeof buildPlayerMomentIntelligenceRuntime>[0]["trustLevel"];

type TrustState = {
  trustScore?: number;
  recoveryScore?: number;
  volatilityScore?: number;
  trustLevel?: string | null;
  strongestReason?: string | null;
  reasons?: string[];
  repeatCoverageScore?: number;
  structuralConfidenceScore?: number;
};

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizePercentLike(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}

function normalizeTrustLevel(value: unknown): RuntimeTrustLevel {
  if (typeof value !== "string") return null;

  const clean = value.trim();
  if (!clean) return null;

  return clean as RuntimeTrustLevel;
}

export function buildMomentInspectorIntelligenceRuntime(params: {
  selectedFamilyRuntimeSignals: RuntimeSignals;
  selectedTrustState: TrustState | null;
  selectedConfidenceHistoryResult: any;
  selectedLineageResult: any;
}) {
  const {
    selectedFamilyRuntimeSignals,
    selectedTrustState,
    selectedConfidenceHistoryResult,
    selectedLineageResult,
  } = params;

  const familyId = selectedFamilyRuntimeSignals.familyId ?? "unknown";

  const driftSignal = selectedFamilyRuntimeSignals.hasDriftFamily
    ? clamp01(0.35 + (selectedFamilyRuntimeSignals.driftMemberCount ?? 0) * 0.1)
    : null;

  const stabilitySignal = selectedFamilyRuntimeSignals.hasStabilityFamily ? 0.72 : null;
  const repairSignal = selectedFamilyRuntimeSignals.hasRepairQueueRow ? 0.58 : null;

  const previousTrust =
    normalizePercentLike(selectedConfidenceHistoryResult?.previousPoint?.trustScore) ??
    normalizePercentLike(selectedLineageResult?.previousSnapshot?.trustScore) ??
    null;

  const newTrust = normalizePercentLike(selectedTrustState?.trustScore);

  const signalConfirmed =
    selectedFamilyRuntimeSignals.hasActionSummary &&
    (selectedFamilyRuntimeSignals.actionCount ?? 0) > 0;

  const driftCorrected =
    selectedFamilyRuntimeSignals.hasDriftFamily &&
    !selectedFamilyRuntimeSignals.hasRepairQueueRow;

  const repeatCoverage = normalizePercentLike(selectedTrustState?.repeatCoverageScore) ?? 0;

  const structuralConfidence =
    normalizePercentLike(selectedTrustState?.structuralConfidenceScore) ?? 0;

  const repeatReinforced =
    selectedFamilyRuntimeSignals.hasStabilityFamily && repeatCoverage >= 60;

  const structureReinforced =
    selectedFamilyRuntimeSignals.hasStabilityFamily && structuralConfidence >= 60;

  const executionSuccess = Boolean(
    selectedFamilyRuntimeSignals.hasSelectedFamily &&
      selectedTrustState &&
      (selectedTrustState.trustScore ?? 0) >= 60 &&
      (selectedTrustState.volatilityScore ?? 100) <= 60
  );

  const outcomeResult = buildMomentFamilyOutcome({
    familyId,
    executed: selectedFamilyRuntimeSignals.hasSelectedFamily ?? false,
    executionSuccess,
    signalConfirmed,
    driftCorrected,
    repeatReinforced,
    structureReinforced,
    previousTrust,
    newTrust,
    timestamp: null,
  });

  const learningResult = buildMomentFamilyLearning({
    familyId,
    outcomeScore: outcomeResult.outcomeScore,
    outcomeLabel: outcomeResult.outcomeLabel,
    signalConfirmed,
    driftCorrected,
    repeatReinforced,
    structureReinforced,
    trustDelta: outcomeResult.trust.trustDelta,
  });

  const optimizationInputs = [
    learningResult.learningScore,
    stabilitySignal,
    repairSignal,
  ].filter((value): value is number => value !== null);

  const optimizationScore = optimizationInputs.length
    ? clamp01(
        optimizationInputs.reduce((sum, value) => sum + value, 0) /
          optimizationInputs.length
      )
    : null;

  const repairScore =
    driftSignal !== null || repairSignal !== null
      ? clamp01((driftSignal ?? 0.25) * 0.55 + (repairSignal ?? 0.25) * 0.45)
      : null;

  return buildPlayerMomentIntelligenceRuntime({
    familyId,
    outcomeScore: outcomeResult.outcomeScore,
    learningScore: learningResult.learningScore,
    optimizationScore,
    repairScore,
    outcomeLabel: outcomeResult.outcomeLabel,
    learningLabel: learningResult.learningLabel,
    optimizationLabel: optimizationScore ? "selected-family-optimization" : null,
    repairLabel: repairScore ? "selected-family-repair" : null,
    trustScore: selectedTrustState?.trustScore ?? null,
    recoveryScore: selectedTrustState?.recoveryScore ?? null,
    volatilityScore: selectedTrustState?.volatilityScore ?? null,
    trustLevel: normalizeTrustLevel(selectedTrustState?.trustLevel),
    strongestTrustReason: selectedTrustState?.strongestReason ?? null,
    trustReasons: selectedTrustState?.reasons ?? [],
  });
}