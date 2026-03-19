import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { FamilyTrustStateResult } from "./playerMomentFamilyTrustState";

import {
  buildDiagnosticNotes,
  buildRiskFlags,
  getEngineVerdict,
  getRecommendedNextStep,
} from "./momentInspectorRuntimeDiagnostics.decisions";
import {
  getScoreBand,
  getSeverityBand,
  normalizeText,
} from "./momentInspectorRuntimeDiagnostics.shared";
import {
  getConfidenceScore,
  getDriftSeverityScore,
  getNormalizedRepairPriorityScore,
  getReadinessScore,
} from "./momentInspectorRuntimeDiagnostics.scoring";

import type {
  BuildMomentInspectorRuntimeDiagnosticParams,
  MomentInspectorRuntimeDiagnostic,
} from "./momentInspectorRuntimeDiagnostics.types";

export type { BuildMomentInspectorRuntimeDiagnosticParams } from "./momentInspectorRuntimeDiagnostics.types";
export type {
  MomentInspectorEngineVerdict,
  MomentInspectorRuntimeDiagnostic,
} from "./momentInspectorRuntimeDiagnostics.types";

const MOMENT_INSPECTOR_RUNTIME_ENGINE_VERSION = 2;

type RuntimeDiagnosticsByFamilyParams = {
  actionSummaryRows?: InspectorIntendedActionSummaryRow[];
  driftFamilyRows?: InspectorPhraseDriftFamilyRow[];
  repairQueueRows?: InspectorRepairQueueRow[];
  stabilityFamilyRows?: InspectorPhraseStabilityFamilyRow[];
  trustStateResults?: FamilyTrustStateResult[];
};

function clampCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function getTrustStateResultOrNull(
  value: FamilyTrustStateResult | null | undefined
): FamilyTrustStateResult | null {
  return value ?? null;
}

function buildRuntimeDecisionInput(
  params: BuildMomentInspectorRuntimeDiagnosticParams & {
    confidenceScore: number;
    driftSeverityScore: number;
    readinessScore: number;
  }
) {
  return {
    actionSummaryRow: params.actionSummaryRow,
    driftFamilyRow: params.driftFamilyRow,
    repairQueueRow: params.repairQueueRow,
    stabilityFamilyRow: params.stabilityFamilyRow,
    confidenceScore: params.confidenceScore,
    driftSeverityScore: params.driftSeverityScore,
    readinessScore: params.readinessScore,
  };
}

function getFamilyId(value: unknown): string {
  return normalizeText((value as { familyId?: unknown } | null | undefined)?.familyId);
}

function indexRowsByFamilyId<T extends { familyId?: unknown }>(
  rows: T[] | undefined,
  familyIds: Set<string>
): Record<string, T> {
  const byFamilyId: Record<string, T> = {};

  for (const row of rows ?? []) {
    const familyId = getFamilyId(row);
    if (!familyId) continue;
    familyIds.add(familyId);
    byFamilyId[familyId] = row;
  }

  return byFamilyId;
}

export function buildMomentInspectorRuntimeDiagnostic(
  params: BuildMomentInspectorRuntimeDiagnosticParams
): MomentInspectorRuntimeDiagnostic {
  const familyId = normalizeText(params.familyId) || "unknown-family";

  const confidenceScore = getConfidenceScore(
    params.actionSummaryRow,
    params.stabilityFamilyRow
  );

  const driftSeverityScore = getDriftSeverityScore(params.driftFamilyRow);

  const repairPriorityScore = getNormalizedRepairPriorityScore(
    params.repairQueueRow?.repairPriorityScore
  );

  const readinessScore = getReadinessScore({
    confidenceScore,
    driftSeverityScore,
    repairPriorityScore,
    stabilityFamilyRow: params.stabilityFamilyRow,
  });

  const decisionInput = buildRuntimeDecisionInput({
    ...params,
    confidenceScore,
    driftSeverityScore,
    readinessScore,
  });

  const riskFlags = buildRiskFlags(decisionInput);
  const diagnosticNotes = buildDiagnosticNotes(decisionInput);
  const recommendedNextStep = getRecommendedNextStep(decisionInput);

  const engineVerdict = getEngineVerdict({
    confidenceScore,
    driftSeverityScore,
    repairPriorityScore,
    readinessScore,
    actionSummaryRow: params.actionSummaryRow,
    stabilityFamilyRow: params.stabilityFamilyRow,
  });

  const confidenceBand = getScoreBand(confidenceScore);
  const readinessBand = getScoreBand(readinessScore);
  const driftSeverityBand = getSeverityBand(driftSeverityScore);

  const missingActions = clampCount(params.actionSummaryRow?.missingActions);
  const nearActions = clampCount(params.actionSummaryRow?.nearActions);
  const unstableMembers = clampCount(params.driftFamilyRow?.unstableCount);

  const trustStateResult = getTrustStateResultOrNull(params.trustStateResult);
  const trustScore = trustStateResult?.trustScore ?? null;
  const trustLevel = trustStateResult?.trustLevel ?? null;
  const trustStrongestReason = trustStateResult?.strongestReason ?? null;

  return {
    familyId,

    confidenceScore,
    readinessScore,
    driftSeverityScore,
    repairPriorityScore,

    confidenceBand,
    readinessBand,
    driftSeverityBand,

    riskFlags,
    diagnosticNotes,
    recommendedNextStep,
    engineVerdict,

    missingActions,
    nearActions,
    unstableMembers,

    engineVersion: MOMENT_INSPECTOR_RUNTIME_ENGINE_VERSION,

    trustScore,
    trustLevel,
    trustStrongestReason,
    trustStateResult,
  };
}

export function buildMomentInspectorRuntimeDiagnosticsByFamily(
  params: RuntimeDiagnosticsByFamilyParams
): Record<string, MomentInspectorRuntimeDiagnostic> {
  const familyIds = new Set<string>();

  const actionByFamilyId = indexRowsByFamilyId(params.actionSummaryRows, familyIds);
  const driftByFamilyId = indexRowsByFamilyId(params.driftFamilyRows, familyIds);
  const repairByFamilyId = indexRowsByFamilyId(params.repairQueueRows, familyIds);
  const stabilityByFamilyId = indexRowsByFamilyId(params.stabilityFamilyRows, familyIds);
  const trustByFamilyId = indexRowsByFamilyId(params.trustStateResults, familyIds);

  const byFamilyId: Record<string, MomentInspectorRuntimeDiagnostic> = {};

  for (const familyId of familyIds) {
    byFamilyId[familyId] = buildMomentInspectorRuntimeDiagnostic({
      familyId,
      actionSummaryRow: actionByFamilyId[familyId] ?? null,
      driftFamilyRow: driftByFamilyId[familyId] ?? null,
      repairQueueRow: repairByFamilyId[familyId] ?? null,
      stabilityFamilyRow: stabilityByFamilyId[familyId] ?? null,
      trustStateResult: trustByFamilyId[familyId] ?? null,
    });
  }

  return byFamilyId;
}