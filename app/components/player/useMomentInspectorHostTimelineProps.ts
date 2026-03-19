"use client";

import { useMemo } from "react";

export function useMomentInspectorHostTimelineProps(params: {
  trimmedFilter: string;
  filteredSections: any[];
  sections: any[];
  filteredStats: any;
  sectionStats: any;
  selectedLineageResult: any;
  selectedConfidenceHistoryResult: any;

  selectedPhraseFamilyId: string;
  selectedActionSummaryRow: any;
  selectedRepairQueueRow: any;
  selectedDriftFamily: any;
  selectedStabilityFamily: any;
  selectedTrustState: any;

  repairQueueRows: any[];
  actionSummaryRows: any[];
  driftFamilyRows: any[];
  stabilityFamilyRows: any[];
  trustSummaryRows: any[];
}) {
  return useMemo(() => {
    return {
      timelineProps: {
        trimmedFilter: params.trimmedFilter,
        filteredSections: params.filteredSections,
        sections: params.sections,
        filteredStats: params.filteredStats,
        sectionStats: params.sectionStats,
        selectedLineageResult: params.selectedLineageResult,
        selectedConfidenceHistoryResult: params.selectedConfidenceHistoryResult,
      },

      selectedProps: {
        selectedPhraseFamilyId: params.selectedPhraseFamilyId,
        selectedActionSummaryRow: params.selectedActionSummaryRow,
        selectedRepairQueueRow: params.selectedRepairQueueRow,
        selectedDriftFamily: params.selectedDriftFamily,
        selectedStabilityFamily: params.selectedStabilityFamily,
        selectedTrustStateResult: params.selectedTrustState,
        selectedConfidenceHistoryResult: params.selectedConfidenceHistoryResult,
        selectedLineageResult: params.selectedLineageResult,
      },

      columnsProps: {
        selectedRepairQueueRow: params.selectedRepairQueueRow,
        repairQueueRows: params.repairQueueRows,
        actionSummaryRows: params.actionSummaryRows,
        driftFamilyRows: params.driftFamilyRows,
        stabilityFamilyRows: params.stabilityFamilyRows,
        trustSummaryRows: params.trustSummaryRows,
        selectedConfidenceHistoryResult: params.selectedConfidenceHistoryResult,
        selectedLineageResult: params.selectedLineageResult,
      },

      sectionsProps: {
        filteredSections: params.filteredSections,
        trimmedFilter: params.trimmedFilter,
        filteredWithStart: params.filteredStats.filteredWithStart,
        filteredOutOfOrderCount: params.filteredStats.filteredOutOfOrderCount,
        sectionsWithStart: params.sectionStats.sectionsWithStart,
        outOfOrderCount: params.sectionStats.outOfOrderCount,
        sectionsLength: params.sections.length,
      },
    };
  }, [
    params.trimmedFilter,
    params.filteredSections,
    params.sections,
    params.filteredStats,
    params.sectionStats,
    params.selectedLineageResult,
    params.selectedConfidenceHistoryResult,
    params.selectedPhraseFamilyId,
    params.selectedActionSummaryRow,
    params.selectedRepairQueueRow,
    params.selectedDriftFamily,
    params.selectedStabilityFamily,
    params.selectedTrustState,
    params.repairQueueRows,
    params.actionSummaryRows,
    params.driftFamilyRows,
    params.stabilityFamilyRows,
    params.trustSummaryRows,
  ]);
}