"use client";

import { useMemo } from "react";
import { getTrackDisplayPath } from "./momentInspectorHelpers";

type GenericRecord = Record<string, unknown>;

function toRecord(value: unknown): GenericRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as GenericRecord;
}

function toRecordArray(value: unknown): GenericRecord[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is GenericRecord =>
      !!item && typeof item === "object" && !Array.isArray(item)
  );
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function getFamilyId(row: GenericRecord, index: number): string {
  return (
    normalizeText(row.familyId) ||
    normalizeText(row.id) ||
    normalizeText(row.key) ||
    `workspace-family-${index + 1}`
  );
}

function mergeWorkspaceFamilies(candidates: unknown[]): GenericRecord[] {
  const merged = new Map<string, GenericRecord>();

  candidates.forEach((candidate) => {
    const rows = toRecordArray(candidate);

    rows.forEach((row, index) => {
      const familyId = getFamilyId(row, index);
      const previous = merged.get(familyId) ?? {};

      merged.set(familyId, {
        ...previous,
        ...row,
        familyId,
      });
    });
  });

  return Array.from(merged.values());
}

export function useMomentInspectorHostStackProps(params: {
  runtime: any;
}) {
  const { runtime } = params;

  return useMemo(() => {
    const {
      selectedPhraseFamilyId,
      similarityState,
      intelligenceRuntime,
      compareRuntime,
      bookmarksRuntime,
      snapshotRuntime,
      shellState,
      healthState,
      bridgeState,
      phraseState,
      hostFilters,
    } = runtime;

    const workspaceFamilies = mergeWorkspaceFamilies([
      phraseState?.repairQueueView?.rows,
      phraseState?.repairQueueRows,
      phraseState?.driftView?.familyRows,
      phraseState?.driftFamilyRows,
      phraseState?.stabilityView?.familyRows,
      phraseState?.stabilityFamilyRows,
      phraseState?.trustSummaryRows,
      phraseState?.actionView?.summaryRows,
      phraseState?.actionSummaryRows,
      hostFilters?.filteredFamilyOptions,
      hostFilters?.compareFamilyOptions,
      shellState?.selectedTrack?.families,
      shellState?.selectedTrack?.familyRows,
    ]);

    const controlStackProps = {
      selectedTrack: shellState.selectedTrack,
      sortedTracks: shellState.sortedTracks,
      setTrackId: shellState.setTrackId,
      filter: shellState.filter,
      setFilter: shellState.setFilter,
      trimmedFilter: shellState.trimmedFilter,
      filteredSections: shellState.filteredSections,
      focusSections: shellState.focusSections,
      similaritySelectedSectionId:
        similarityState.selectedMoment?.sectionId ?? "",
      setSelectedSectionId: shellState.setSelectedSectionId,
    };

    const summaryStackProps = {
      summaryProps: {
        selectedTrackLabel: shellState.selectedTrackLabel,
        selectedTrackId: String(shellState.selectedTrack?.id ?? ""),
        selectedTrackPath: getTrackDisplayPath(shellState.selectedTrack),
        healthTone: healthState.healthTone,
        healthScore: healthState.healthScore,
        trackTagsCount: shellState.trackTags.length,
        momentTagsCount: shellState.momentTags.length,
        descriptionsCount: shellState.descriptions.length,
        sectionsCount: shellState.sections.length,
        sectionsWithTags: healthState.sectionStats.sectionsWithTags,
        sectionsWithDescription:
          healthState.sectionStats.sectionsWithDescription,
        sectionsWithStart: healthState.sectionStats.sectionsWithStart,
        densityStats: healthState.densityStats,
        dataWarnings: healthState.dataWarnings,
        discoverySummary: bridgeState.discoverySummary,
        metadataSummary: bridgeState.metadataSummary,
      },

      discoveryProps: {
        discoverySnapshot: bridgeState.discoverySnapshot,
      },

      similarityProps: {
        similarityState,
      },

      tagProps: {
        trackTags: shellState.trackTags,
        momentTagFrequency: healthState.momentTagFrequency,
        descriptions: shellState.descriptions,
        duplicateTrackTags: healthState.duplicateTrackTags,
        duplicateMomentTags: healthState.duplicateMomentTags,
        duplicateSectionIds: healthState.sectionStats.duplicateSectionIds,
      },

      diagnosticsProps: {
        actionRows: phraseState.actionSummaryRows,
        health: phraseState.inspectorHealth,
      },
    };

    const intelligenceStackProps = {
      filterProps: {
        selectedVerdict: hostFilters.hostFilterState.selectedVerdict,
        counts: hostFilters.hostFilterResult.counts,
        visibleCount: hostFilters.hostFilterResult.visibleCount,
        totalCount: hostFilters.hostFilterResult.totalCount,
        onChange: hostFilters.handleChangeHostVerdictFilter,
      },

      pinnedProps: {
        pinnedCount: hostFilters.pinnedResult.pinnedCount,
        totalCount: hostFilters.pinnedResult.totalCount,
        visibleCount: hostFilters.pinnedResult.visibleCount,
        pinnedOnly: hostFilters.pinnedState.pinnedOnly,
        onTogglePinnedOnly: hostFilters.handleTogglePinnedOnly,
        onResetPins: hostFilters.handleResetPins,
      },

      pinProps: {
        selectedPhraseFamilyId,
        isSelectedFamilyPinned: hostFilters.isSelectedFamilyPinned,
        onToggleSelectedFamilyPin:
          hostFilters.handleToggleSelectedFamilyPin,
      },

      bookmarkProps: {
        bookmarkOptions: bookmarksRuntime.bookmarkOptions,
        onSaveBookmark: bookmarksRuntime.saveBookmark,
        onLoadBookmark: bookmarksRuntime.loadBookmark,
        onDeleteBookmark: bookmarksRuntime.deleteBookmark,
      },

      snapshotProps: {
        filename: snapshotRuntime.snapshotFilename,
        selectedTrackId: String(shellState.selectedTrack?.id ?? ""),
        selectedPhraseFamilyId,
        selectedVerdict: hostFilters.hostFilterState.selectedVerdict,
        pinnedCount: hostFilters.pinnedState.pinnedFamilyIds.length,
        pinnedOnly: hostFilters.pinnedState.pinnedOnly,
        compareReady: compareRuntime.compareResult.summary.ready,
        onExportSnapshot: snapshotRuntime.handleExportSnapshot,
      },

      compareBarProps: {
        familyOptions: hostFilters.compareFamilyOptions,
        compareState: compareRuntime.compareState,
        ready: compareRuntime.compareResult.summary.ready,
        reasons: compareRuntime.compareResult.summary.reasons,
        onChangePrimaryFamilyId:
          compareRuntime.handleChangePrimaryFamilyId,
        onChangeSecondaryFamilyId:
          compareRuntime.handleChangeSecondaryFamilyId,
      },

      comparePanelProps: {
        result: compareRuntime.compareResult,
      },

      workspaceProps: {
        families: workspaceFamilies,
      },

      intelligenceProps: {
        hasMomentIntelligence: phraseState.hasMomentIntelligence,
        intelligenceRuntime,
        familyOptions: hostFilters.filteredFamilyOptions,
        selectedPhraseFamilyId,
        onChangeSelectedPhraseFamilyId:
          runtime.setSelectedPhraseFamilyId,
        selectedRepairQueueRow: phraseState.selectedRepairQueueRow,
        repairQueueRows:
          phraseState.repairQueueView?.rows ??
          phraseState.repairQueueRows ??
          [],
        repairSimulationResult: phraseState.repairSimulationResult,
        actionSummaryRows:
          phraseState.actionView?.summaryRows ??
          phraseState.actionSummaryRows ??
          [],
        driftFamilyRows:
          phraseState.driftView?.familyRows ??
          phraseState.driftFamilyRows ??
          [],
        stabilityFamilyRows:
          phraseState.stabilityView?.familyRows ??
          phraseState.stabilityFamilyRows ??
          [],
        selectedActionSummaryRow: phraseState.selectedActionSummaryRow,
        selectedActionRows: phraseState.selectedActionRows,
        selectedDriftFamily: phraseState.selectedDriftFamily,
        selectedDriftMembers: phraseState.selectedDriftMembers,
        selectedStabilityFamily: phraseState.selectedStabilityFamily,
        selectedTrustStateResult: phraseState.selectedTrustState,
        selectedConfidenceHistoryResult:
          phraseState.selectedConfidenceHistoryResult,
      },
    };

    const timelineStackProps = {
      timelineProps: {
        trimmedFilter: shellState.trimmedFilter,
        filteredSections: shellState.filteredSections,
        sections: shellState.sections,
        filteredStats: healthState.filteredStats,
        sectionStats: healthState.sectionStats,
        selectedLineageResult: phraseState.selectedLineageResult,
        selectedConfidenceHistoryResult:
          phraseState.selectedConfidenceHistoryResult,
      },

      selectedProps: {
        selectedPhraseFamilyId,
        selectedActionSummaryRow: phraseState.selectedActionSummaryRow,
        selectedRepairQueueRow: phraseState.selectedRepairQueueRow,
        selectedDriftFamily: phraseState.selectedDriftFamily,
        selectedStabilityFamily: phraseState.selectedStabilityFamily,
        selectedTrustStateResult: phraseState.selectedTrustState,
        selectedConfidenceHistoryResult:
          phraseState.selectedConfidenceHistoryResult,
        selectedLineageResult: phraseState.selectedLineageResult,
      },

      columnsProps: {
        selectedRepairQueueRow: phraseState.selectedRepairQueueRow,
        repairQueueRows:
          phraseState.repairQueueView?.rows ??
          phraseState.repairQueueRows ??
          [],
        actionSummaryRows:
          phraseState.actionView?.summaryRows ??
          phraseState.actionSummaryRows ??
          [],
        driftFamilyRows:
          phraseState.driftView?.familyRows ??
          phraseState.driftFamilyRows ??
          [],
        stabilityFamilyRows:
          phraseState.stabilityView?.familyRows ??
          phraseState.stabilityFamilyRows ??
          [],
        trustSummaryRows: phraseState.trustSummaryRows,
        selectedConfidenceHistoryResult:
          phraseState.selectedConfidenceHistoryResult,
        selectedLineageResult: phraseState.selectedLineageResult,
      },

      sectionsProps: {
        filteredSections: shellState.filteredSections,
        trimmedFilter: shellState.trimmedFilter,
        filteredWithStart: healthState.filteredStats.filteredWithStart,
        filteredOutOfOrderCount:
          healthState.filteredStats.filteredOutOfOrderCount,
        sectionsWithStart: healthState.sectionStats.sectionsWithStart,
        outOfOrderCount: healthState.sectionStats.outOfOrderCount,
        sectionsLength: shellState.sections.length,
      },
    };

    return {
      controlStackProps,
      summaryStackProps,
      intelligenceStackProps,
      timelineStackProps,
    };
  }, [runtime]);
}