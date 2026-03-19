import type { MomentInspectorRuntimeBridgeResult } from "./momentInspectorRuntimeBridge";
import type {
  InspectorIntendedActionRow,
  InspectorIntendedActionSummaryRow,
} from "./momentInspectorIntendedActionView";
import type {
  InspectorPhraseDriftFamilyRow,
  InspectorPhraseDriftMemberRow,
} from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { ConfidenceHistoryResult } from "./playerMomentConfidenceHistory";
import type { FamilyLineageResult } from "./playerMomentFamilyLineage";
import type { RepairSimulationResult } from "./playerMomentRepairSimulation.types";
import type { FamilyTrustStateResult } from "./playerMomentFamilyTrustState";

export type BuildMomentInspectorIntelligenceViewArgs = {
  bridge: MomentInspectorRuntimeBridgeResult;
  onChangeSelectedPhraseFamilyId: (value: string) => void;

  selectedRepairQueueRow: InspectorRepairQueueRow | null;
  repairQueueRows: InspectorRepairQueueRow[];

  repairSimulationResult: RepairSimulationResult | null;

  actionSummaryRows: InspectorIntendedActionSummaryRow[];
  driftFamilyRows: InspectorPhraseDriftFamilyRow[];
  stabilityFamilyRows: InspectorPhraseStabilityFamilyRow[];

  selectedActionSummaryRow: InspectorIntendedActionSummaryRow | null;
  selectedActionRows: InspectorIntendedActionRow[];

  selectedDriftFamily: InspectorPhraseDriftFamilyRow | null;
  selectedDriftMembers: InspectorPhraseDriftMemberRow[];

  selectedStabilityFamily: InspectorPhraseStabilityFamilyRow | null;

  selectedTrustStateResult?: FamilyTrustStateResult | null;
  selectedConfidenceHistoryResult?: ConfidenceHistoryResult | null;
  selectedLineageResult?: FamilyLineageResult | null;
};

export type MomentInspectorIntelligencePanelView = {
  hasMomentIntelligence: boolean;
  intelligenceRuntime: MomentInspectorRuntimeBridgeResult["intelligenceRuntime"];
  familyOptions: string[];
  selectedPhraseFamilyId: string;
  onChangeSelectedPhraseFamilyId: (value: string) => void;

  selectedRepairQueueRow: InspectorRepairQueueRow | null;
  repairQueueRows: InspectorRepairQueueRow[];
  repairSimulationResult: RepairSimulationResult | null;

  actionSummaryRows: InspectorIntendedActionSummaryRow[];
  driftFamilyRows: InspectorPhraseDriftFamilyRow[];
  stabilityFamilyRows: InspectorPhraseStabilityFamilyRow[];

  selectedActionSummaryRow: InspectorIntendedActionSummaryRow | null;
  selectedActionRows: InspectorIntendedActionRow[];

  selectedDriftFamily: InspectorPhraseDriftFamilyRow | null;
  selectedDriftMembers: InspectorPhraseDriftMemberRow[];

  selectedStabilityFamily: InspectorPhraseStabilityFamilyRow | null;

  selectedTrustStateResult: FamilyTrustStateResult | null;
  selectedConfidenceHistoryResult: ConfidenceHistoryResult | null;
  selectedLineageResult: FamilyLineageResult | null;
};

function sortFamilyOptions(value: string[]): string[] {
  return [...value].sort((a, b) => a.localeCompare(b));
}

export function buildMomentInspectorIntelligenceView(
  args: BuildMomentInspectorIntelligenceViewArgs
): MomentInspectorIntelligencePanelView {
  const {
    bridge,
    onChangeSelectedPhraseFamilyId,

    selectedRepairQueueRow,
    repairQueueRows,

    repairSimulationResult,

    actionSummaryRows,
    driftFamilyRows,
    stabilityFamilyRows,

    selectedActionSummaryRow,
    selectedActionRows,

    selectedDriftFamily,
    selectedDriftMembers,

    selectedStabilityFamily,

    selectedTrustStateResult = null,
    selectedConfidenceHistoryResult = null,
    selectedLineageResult = null,
  } = args;

  return {
    hasMomentIntelligence: bridge.hasMomentIntelligence,
    intelligenceRuntime: bridge.intelligenceRuntime,
    familyOptions: sortFamilyOptions(bridge.familyOptions),
    selectedPhraseFamilyId: bridge.selectedPhraseFamilyId,
    onChangeSelectedPhraseFamilyId,

    selectedRepairQueueRow,
    repairQueueRows,
    repairSimulationResult,

    actionSummaryRows,
    driftFamilyRows,
    stabilityFamilyRows,

    selectedActionSummaryRow,
    selectedActionRows,

    selectedDriftFamily,
    selectedDriftMembers,

    selectedStabilityFamily,

    selectedTrustStateResult,
    selectedConfidenceHistoryResult,
    selectedLineageResult,
  };
}