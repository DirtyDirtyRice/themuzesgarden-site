"use client";

import { useMemo } from "react";

export function useMomentInspectorHostIntelligenceProps(params: {
  selectedTrack: any;
  selectedPhraseFamilyId: string;
  isSelectedFamilyPinned: boolean;

  hostFilterState: any;
  hostFilterResult: any;
  pinnedState: any;
  pinnedResult: any;

  handleChangeHostVerdictFilter: (verdict: any) => void;
  handleTogglePinnedOnly: () => void;
  handleResetPins: () => void;
  handleToggleSelectedFamilyPin: () => void;

  bookmarkOptions: any[];
  saveBookmark: (label: string) => void;
  loadBookmark: (id: string) => void;
  deleteBookmark: (id: string) => void;

  snapshotFilename: string;
  handleExportSnapshot: () => void;

  compareFamilyOptions: any[];
  compareState: any;
  compareResult: any;
  handleChangePrimaryFamilyId: (id: string) => void;
  handleChangeSecondaryFamilyId: (id: string) => void;

  hasMomentIntelligence: boolean;
  intelligenceRuntime: any;
  filteredFamilyOptions: any[];
  setSelectedPhraseFamilyId: (id: string) => void;

  selectedRepairQueueRow: any;
  repairQueueRows: any[];
  repairSimulationResult: any;
  actionSummaryRows: any[];
  driftFamilyRows: any[];
  stabilityFamilyRows: any[];
  selectedActionSummaryRow: any;
  selectedActionRows: any[];
  selectedDriftFamily: any;
  selectedDriftMembers: any[];
  selectedStabilityFamily: any;
  selectedTrustState: any;
  selectedConfidenceHistoryResult: any;
}) {
  return useMemo(() => {
    return {
      filterProps: {
        selectedVerdict: params.hostFilterState.selectedVerdict,
        counts: params.hostFilterResult.counts,
        visibleCount: params.hostFilterResult.visibleCount,
        totalCount: params.hostFilterResult.totalCount,
        onChange: params.handleChangeHostVerdictFilter,
      },

      pinnedProps: {
        pinnedCount: params.pinnedResult.pinnedCount,
        totalCount: params.pinnedResult.totalCount,
        visibleCount: params.pinnedResult.visibleCount,
        pinnedOnly: params.pinnedState.pinnedOnly,
        onTogglePinnedOnly: params.handleTogglePinnedOnly,
        onResetPins: params.handleResetPins,
      },

      pinProps: {
        selectedPhraseFamilyId: params.selectedPhraseFamilyId,
        isSelectedFamilyPinned: params.isSelectedFamilyPinned,
        onToggleSelectedFamilyPin: params.handleToggleSelectedFamilyPin,
      },

      bookmarkProps: {
        bookmarkOptions: params.bookmarkOptions,
        onSaveBookmark: params.saveBookmark,
        onLoadBookmark: params.loadBookmark,
        onDeleteBookmark: params.deleteBookmark,
      },

      snapshotProps: {
        filename: params.snapshotFilename,
        selectedTrackId: String(params.selectedTrack?.id ?? ""),
        selectedPhraseFamilyId: params.selectedPhraseFamilyId,
        selectedVerdict: params.hostFilterState.selectedVerdict,
        pinnedCount: params.pinnedState.pinnedFamilyIds.length,
        pinnedOnly: params.pinnedState.pinnedOnly,
        compareReady: params.compareResult.summary.ready,
        onExportSnapshot: params.handleExportSnapshot,
      },

      compareBarProps: {
        familyOptions: params.compareFamilyOptions,
        compareState: params.compareState,
        ready: params.compareResult.summary.ready,
        reasons: params.compareResult.summary.reasons,
        onChangePrimaryFamilyId: params.handleChangePrimaryFamilyId,
        onChangeSecondaryFamilyId: params.handleChangeSecondaryFamilyId,
      },

      comparePanelProps: {
        result: params.compareResult,
      },

      intelligenceProps: {
        hasMomentIntelligence: params.hasMomentIntelligence,
        intelligenceRuntime: params.intelligenceRuntime,
        familyOptions: params.filteredFamilyOptions,
        selectedPhraseFamilyId: params.selectedPhraseFamilyId,
        onChangeSelectedPhraseFamilyId: params.setSelectedPhraseFamilyId,
        selectedRepairQueueRow: params.selectedRepairQueueRow,
        repairQueueRows: params.repairQueueRows,
        repairSimulationResult: params.repairSimulationResult,
        actionSummaryRows: params.actionSummaryRows,
        driftFamilyRows: params.driftFamilyRows,
        stabilityFamilyRows: params.stabilityFamilyRows,
        selectedActionSummaryRow: params.selectedActionSummaryRow,
        selectedActionRows: params.selectedActionRows,
        selectedDriftFamily: params.selectedDriftFamily,
        selectedDriftMembers: params.selectedDriftMembers,
        selectedStabilityFamily: params.selectedStabilityFamily,
        selectedTrustStateResult: params.selectedTrustState,
        selectedConfidenceHistoryResult: params.selectedConfidenceHistoryResult,
      },
    };
  }, [
    params.selectedTrack,
    params.selectedPhraseFamilyId,
    params.isSelectedFamilyPinned,
    params.hostFilterState,
    params.hostFilterResult,
    params.pinnedState,
    params.pinnedResult,
    params.handleChangeHostVerdictFilter,
    params.handleTogglePinnedOnly,
    params.handleResetPins,
    params.handleToggleSelectedFamilyPin,
    params.bookmarkOptions,
    params.saveBookmark,
    params.loadBookmark,
    params.deleteBookmark,
    params.snapshotFilename,
    params.handleExportSnapshot,
    params.compareFamilyOptions,
    params.compareState,
    params.compareResult,
    params.handleChangePrimaryFamilyId,
    params.handleChangeSecondaryFamilyId,
    params.hasMomentIntelligence,
    params.intelligenceRuntime,
    params.filteredFamilyOptions,
    params.setSelectedPhraseFamilyId,
    params.selectedRepairQueueRow,
    params.repairQueueRows,
    params.repairSimulationResult,
    params.actionSummaryRows,
    params.driftFamilyRows,
    params.stabilityFamilyRows,
    params.selectedActionSummaryRow,
    params.selectedActionRows,
    params.selectedDriftFamily,
    params.selectedDriftMembers,
    params.selectedStabilityFamily,
    params.selectedTrustState,
    params.selectedConfidenceHistoryResult,
  ]);
}