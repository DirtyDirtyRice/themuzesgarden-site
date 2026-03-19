import type {
  FamilyTrustStateResult,
  FamilyTrustSummaryRow,
} from "./playerMomentFamilyTrustState.types";

type FamilyRow = {
  familyId: string;
};

type DriftView = {
  familyRows: FamilyRow[];
  membersByFamily: Record<string, unknown[]>;
};

type StabilityView = {
  familyRows: FamilyRow[];
};

type ActionView = {
  summaryRows: FamilyRow[];
  actionsByFamilyId: Record<string, unknown[]>;
};

type RepairQueueView = {
  rows: FamilyRow[];
};

type SelectedFamilyStateParams = {
  selectedPhraseFamilyId: string;
  driftView: DriftView;
  stabilityView: StabilityView;
  actionView: ActionView;
  repairQueueView: RepairQueueView;
  trustStateByFamilyId?: Record<string, FamilyTrustStateResult>;
  trustSummaryRows?: FamilyTrustSummaryRow[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function indexRowsByFamilyId<RowType extends FamilyRow>(rows: RowType[]): Record<string, RowType> {
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

function getSelectedTrustSummaryRow(params: {
  selectedPhraseFamilyId: string;
  trustSummaryRows?: FamilyTrustSummaryRow[] | null;
  selectedTrustState?: FamilyTrustStateResult | null;
}): FamilyTrustSummaryRow | null {
  const familyId = normalizeText(params.selectedPhraseFamilyId);
  const rows = params.trustSummaryRows ?? [];

  const directMatch = rows.find((row) => row.familyId === familyId) ?? null;
  if (directMatch) return directMatch;

  if (!params.selectedTrustState) return null;

  return {
    familyId: params.selectedTrustState.familyId,
    trustScore: params.selectedTrustState.trustScore,
    trustLevel: params.selectedTrustState.trustLevel,
    recoveryScore: params.selectedTrustState.recoveryScore,
    volatilityScore: params.selectedTrustState.volatilityScore,
    repairOpportunityScore: params.selectedTrustState.repairOpportunityScore,
    strongestReason: params.selectedTrustState.strongestReason,
    reasonCount: params.selectedTrustState.reasons.length,
  };
}

export function buildMomentInspectorSelectedFamilyState(
  params: SelectedFamilyStateParams
) {
  const {
    selectedPhraseFamilyId,
    driftView,
    stabilityView,
    actionView,
    repairQueueView,
    trustStateByFamilyId = {},
    trustSummaryRows = [],
  } = params;

  const normalizedSelectedFamilyId = normalizeText(selectedPhraseFamilyId);

  const driftFamilyById = indexRowsByFamilyId(driftView.familyRows);
  const stabilityFamilyById = indexRowsByFamilyId(stabilityView.familyRows);
  const actionSummaryById = indexRowsByFamilyId(actionView.summaryRows);
  const repairQueueById = indexRowsByFamilyId(repairQueueView.rows);

  const selectedDriftFamily = normalizedSelectedFamilyId
    ? driftFamilyById[normalizedSelectedFamilyId] ?? null
    : null;

  const selectedStabilityFamily = normalizedSelectedFamilyId
    ? stabilityFamilyById[normalizedSelectedFamilyId] ?? null
    : null;

  const selectedActionSummaryRow = normalizedSelectedFamilyId
    ? actionSummaryById[normalizedSelectedFamilyId] ?? null
    : null;

  const selectedRepairQueueRow = normalizedSelectedFamilyId
    ? repairQueueById[normalizedSelectedFamilyId] ?? repairQueueView.rows[0] ?? null
    : repairQueueView.rows[0] ?? null;

  const selectedActionRows = actionView.actionsByFamilyId[normalizedSelectedFamilyId] ?? [];
  const selectedDriftMembers = driftView.membersByFamily[normalizedSelectedFamilyId] ?? [];
  const selectedTrustState = trustStateByFamilyId[normalizedSelectedFamilyId] ?? null;

  const selectedTrustSummaryRow = getSelectedTrustSummaryRow({
    selectedPhraseFamilyId: normalizedSelectedFamilyId,
    trustSummaryRows,
    selectedTrustState,
  });

  const hasMomentIntelligence =
    driftView.familyRows.length > 0 ||
    stabilityView.familyRows.length > 0 ||
    actionView.summaryRows.length > 0 ||
    repairQueueView.rows.length > 0 ||
    Object.keys(trustStateByFamilyId).length > 0;

  const selectedFamilyRuntimeSignals = {
    familyId: normalizedSelectedFamilyId,
    hasSelectedFamily: Boolean(normalizedSelectedFamilyId),
    hasDriftFamily: Boolean(selectedDriftFamily),
    hasStabilityFamily: Boolean(selectedStabilityFamily),
    hasActionSummary: Boolean(selectedActionSummaryRow),
    hasRepairQueueRow: Boolean(selectedRepairQueueRow),
    hasTrustState: Boolean(selectedTrustState),
    hasTrustSummaryRow: Boolean(selectedTrustSummaryRow),
    actionCount: selectedActionRows.length,
    driftMemberCount: selectedDriftMembers.length,
    trustReasonCount: selectedTrustState?.reasons.length ?? 0,
    trustLevel: selectedTrustState?.trustLevel ?? null,
    trustScore: selectedTrustState?.trustScore ?? null,
  };

  return {
    selectedDriftFamily,
    selectedStabilityFamily,
    selectedActionSummaryRow,
    selectedRepairQueueRow,
    selectedActionRows,
    selectedDriftMembers,
    selectedTrustState,
    selectedTrustSummaryRow,
    hasMomentIntelligence,
    selectedFamilyRuntimeSignals,
  };
}