import { buildMomentInspectorActionSummary } from "./momentInspectorActionSummary";
import { buildMomentInspectorFamilyOptions } from "./momentInspectorFamilyOptions";
import { buildMomentInspectorHealth } from "./momentInspectorHealth";
import { buildInspectorIntendedActionView } from "./momentInspectorIntendedActionView";
import { buildInspectorPhraseDriftView } from "./momentInspectorPhraseDriftView";
import { buildInspectorRepairQueueView } from "./momentInspectorRepairQueueView";
import { buildInspectorPhraseStabilityView } from "./momentInspectorPhraseStabilityView";
import {
  getOptionalConfidenceHistoryResult,
  getOptionalFamilyLineageResult,
  getOptionalIntendedActionPlans,
  getOptionalPhraseDriftResult,
  getOptionalPhraseStabilityResult,
  getOptionalRepairSimulationResult,
} from "./momentInspectorRuntimeAccess";
import { buildMomentFamilyTrustState } from "./playerMomentFamilyTrustState";
import type { AnyTrack } from "./playerTypes";
import type { FamilyTrustStateResult } from "./playerMomentFamilyTrustState.types";

type PhraseFamilyParams = {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
};

type FamilyIdRow = {
  familyId: string;
};

type TrustSummaryRow = {
  familyId: string;
  trustScore: number;
  trustLevel: string;
  recoveryScore: number;
  volatilityScore: number;
  repairOpportunityScore: number;
  strongestReason: string | null;
  reasonCount: number;
};

type InspectorPhraseStabilityInput =
  Parameters<typeof buildInspectorPhraseStabilityView>[0];

type InspectorRepairQueueParams =
  Parameters<typeof buildInspectorRepairQueueView>[0];

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function getUniqueFamilyIds(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const familyId = normalizeText(value);
    if (!familyId || seen.has(familyId)) continue;
    seen.add(familyId);
    result.push(familyId);
  }

  return result;
}

function indexRowsByFamilyId<RowType extends FamilyIdRow>(
  rows: RowType[]
): Record<string, RowType> {
  return Object.fromEntries(
    rows
      .map((row) => {
        const familyId = normalizeText(row.familyId);
        if (!familyId) return null;
        return [familyId, row] as const;
      })
      .filter((entry): entry is readonly [string, RowType] => Boolean(entry))
  );
}

export function buildMomentInspectorPhraseFamilyState(params: PhraseFamilyParams) {
  const { selectedTrack, discoverySnapshot } = params;

  const runtimeAccessParams = {
    selectedTrack,
    discoverySnapshot,
  };

  const phraseDriftResult = getOptionalPhraseDriftResult(runtimeAccessParams);
  const phraseStabilityResult = getOptionalPhraseStabilityResult(runtimeAccessParams);
  const intendedActionPlans = getOptionalIntendedActionPlans(runtimeAccessParams);
  const repairSimulationResult = getOptionalRepairSimulationResult(runtimeAccessParams);
  const confidenceHistoryResult = getOptionalConfidenceHistoryResult(runtimeAccessParams);
  const familyLineageResult = getOptionalFamilyLineageResult(runtimeAccessParams);

  const actionSummaryRows = buildMomentInspectorActionSummary(intendedActionPlans);
  const inspectorHealth = buildMomentInspectorHealth(actionSummaryRows);

  const driftView = buildInspectorPhraseDriftView(phraseDriftResult);
  const stabilityView = buildInspectorPhraseStabilityView(
    phraseStabilityResult as unknown as InspectorPhraseStabilityInput
  );
  const actionView = buildInspectorIntendedActionView(intendedActionPlans);

  const repairQueueView = buildInspectorRepairQueueView({
    intendedPlans: intendedActionPlans,
    phraseDriftResult,
    phraseStabilityResult:
      phraseStabilityResult as unknown as InspectorRepairQueueParams["phraseStabilityResult"],
  });

  const familyOptions = buildMomentInspectorFamilyOptions({
    repairFamilyIds: repairQueueView.rows.map((row) => row.familyId),
    actionFamilyIds: actionView.summaryRows.map((row) => row.familyId),
    stabilityFamilyIds: stabilityView.familyRows.map((row) => row.familyId),
    driftFamilyIds: driftView.familyRows.map((row) => row.familyId),
  });

  const familyIds = getUniqueFamilyIds([
    ...repairQueueView.rows.map((row) => row.familyId),
    ...actionView.summaryRows.map((row) => row.familyId),
    ...stabilityView.familyRows.map((row) => row.familyId),
    ...driftView.familyRows.map((row) => row.familyId),
  ]);

  const driftFamilyById = indexRowsByFamilyId(driftView.familyRows);
  const stabilityFamilyById = indexRowsByFamilyId(stabilityView.familyRows);
  const actionSummaryById = indexRowsByFamilyId(actionView.summaryRows);
  const repairQueueById = indexRowsByFamilyId(repairQueueView.rows);

  const trustStateEntries = familyIds.map((familyId) => {
    const trustState = buildMomentFamilyTrustState({
      familyId,
      driftFamilyRow: driftFamilyById[familyId] ?? null,
      stabilityFamilyRow: stabilityFamilyById[familyId] ?? null,
      actionSummaryRow: actionSummaryById[familyId] ?? null,
      repairQueueRow: repairQueueById[familyId] ?? null,
      repairSimulationResult,
    });

    return [familyId, trustState] as const;
  });

  const trustStateByFamilyId: Record<string, FamilyTrustStateResult> =
    Object.fromEntries(trustStateEntries);

  const trustSummaryRows: TrustSummaryRow[] = familyIds
    .map((familyId) => trustStateByFamilyId[familyId] ?? null)
    .filter((trustState): trustState is FamilyTrustStateResult => Boolean(trustState))
    .map((trustState) => ({
      familyId: trustState.familyId,
      trustScore: trustState.trustScore,
      trustLevel: trustState.trustLevel,
      recoveryScore: trustState.recoveryScore,
      volatilityScore: trustState.volatilityScore,
      repairOpportunityScore: trustState.repairOpportunityScore,
      strongestReason: trustState.strongestReason,
      reasonCount: trustState.reasons.length,
    }))
    .sort((a, b) => b.trustScore - a.trustScore);

  return {
    phraseDriftResult,
    phraseStabilityResult,
    intendedActionPlans,
    repairSimulationResult,
    confidenceHistoryResult,
    familyLineageResult,
    actionSummaryRows,
    inspectorHealth,
    driftView,
    stabilityView,
    actionView,
    repairQueueView,
    familyOptions,
    trustStateByFamilyId,
    trustSummaryRows,
  };
}
