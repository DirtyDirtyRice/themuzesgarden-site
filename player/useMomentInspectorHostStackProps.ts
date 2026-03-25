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
  const { runtime } = params ?? {};

  return useMemo(() => {
    const safeRuntime = (runtime ?? {}) as any;

    const selectedPhraseFamilyId =
      safeRuntime?.selectedPhraseFamilyId ?? null;

    const similarityState = safeRuntime?.similarityState ?? {};

    const intelligenceRuntime = safeRuntime?.intelligenceRuntime ?? {};
    const compareRuntime = safeRuntime?.compareRuntime ?? {
      compareResult: { summary: {} },
      compareState: {},
    };

    const bookmarksRuntime = safeRuntime?.bookmarksRuntime ?? {};
    const snapshotRuntime = safeRuntime?.snapshotRuntime ?? {};

    const shellState = safeRuntime?.shellState ?? {};
    const healthState = safeRuntime?.healthState ?? {
      sectionStats: {},
      densityStats: {},
      filteredStats: {},
    };

    const bridgeState = safeRuntime?.bridgeState ?? {};
    const phraseState = safeRuntime?.phraseState ?? {};

    const hostFilters = safeRuntime?.hostFilters ?? {
      hostFilterState: {},
      hostFilterResult: {},
      pinnedResult: {},
      pinnedState: { pinnedFamilyIds: [] },
    };

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
      selectedTrack: shellState?.selectedTrack,
      sortedTracks: shellState?.sortedTracks ?? [],
      setTrackId: shellState?.setTrackId ?? (() => {}),
      filter: shellState?.filter ?? "",
      setFilter: shellState?.setFilter ?? (() => {}),
      trimmedFilter: shellState?.trimmedFilter ?? "",
      filteredSections: shellState?.filteredSections ?? [],
      focusSections: shellState?.focusSections ?? [],
      similaritySelectedSectionId:
        similarityState?.selectedMoment?.sectionId ?? "",
      setSelectedSectionId:
        shellState?.setSelectedSectionId ?? (() => {}),
    };

    const summaryStackProps = {
      summaryProps: {
        selectedTrackLabel: shellState?.selectedTrackLabel ?? "",
        selectedTrackId: String(shellState?.selectedTrack?.id ?? ""),
        selectedTrackPath: getTrackDisplayPath(
          shellState?.selectedTrack ?? null
        ),
        healthTone: healthState?.healthTone ?? "",
        healthScore: healthState?.healthScore ?? 0,
        trackTagsCount: shellState?.trackTags?.length ?? 0,
        momentTagsCount: shellState?.momentTags?.length ?? 0,
        descriptionsCount: shellState?.descriptions?.length ?? 0,
        sectionsCount: shellState?.sections?.length ?? 0,
        sectionsWithTags:
          healthState?.sectionStats?.sectionsWithTags ?? 0,
        sectionsWithDescription:
          healthState?.sectionStats?.sectionsWithDescription ?? 0,
        sectionsWithStart:
          healthState?.sectionStats?.sectionsWithStart ?? 0,
        densityStats: healthState?.densityStats ?? {},
        dataWarnings: healthState?.dataWarnings ?? [],
        discoverySummary: bridgeState?.discoverySummary ?? {},
        metadataSummary: bridgeState?.metadataSummary ?? {},
      },

      discoveryProps: {
        discoverySnapshot: bridgeState?.discoverySnapshot ?? {},
      },

      similarityProps: {
        similarityState,
      },

      tagProps: {
        trackTags: shellState?.trackTags ?? [],
        momentTagFrequency:
          healthState?.momentTagFrequency ?? {},
        descriptions: shellState?.descriptions ?? [],
        duplicateTrackTags:
          healthState?.duplicateTrackTags ?? [],
        duplicateMomentTags:
          healthState?.duplicateMomentTags ?? [],
        duplicateSectionIds:
          healthState?.sectionStats?.duplicateSectionIds ?? [],
      },

      diagnosticsProps: {
        actionRows: phraseState?.actionSummaryRows ?? [],
        health: phraseState?.inspectorHealth ?? {},
      },
    };

    const intelligenceStackProps = {
      filterProps: {
        selectedVerdict:
          hostFilters?.hostFilterState?.selectedVerdict ?? "",
        counts: hostFilters?.hostFilterResult?.counts ?? {},
        visibleCount:
          hostFilters?.hostFilterResult?.visibleCount ?? 0,
        totalCount:
          hostFilters?.hostFilterResult?.totalCount ?? 0,
        onChange:
          hostFilters?.handleChangeHostVerdictFilter ??
          (() => {}),
      },

      pinnedProps: {
        pinnedCount:
          hostFilters?.pinnedResult?.pinnedCount ?? 0,
        totalCount:
          hostFilters?.pinnedResult?.totalCount ?? 0,
        visibleCount:
          hostFilters?.pinnedResult?.visibleCount ?? 0,
        pinnedOnly:
          hostFilters?.pinnedState?.pinnedOnly ?? false,
        onTogglePinnedOnly:
          hostFilters?.handleTogglePinnedOnly ?? (() => {}),
        onResetPins:
          hostFilters?.handleResetPins ?? (() => {}),
      },

      pinProps: {
        selectedPhraseFamilyId,
        isSelectedFamilyPinned:
          hostFilters?.isSelectedFamilyPinned ?? false,
        onToggleSelectedFamilyPin:
          hostFilters?.handleToggleSelectedFamilyPin ??
          (() => {}),
      },

      bookmarkProps: {
        bookmarkOptions:
          bookmarksRuntime?.bookmarkOptions ?? [],
        onSaveBookmark:
          bookmarksRuntime?.saveBookmark ?? (() => {}),
        onLoadBookmark:
          bookmarksRuntime?.loadBookmark ?? (() => {}),
        onDeleteBookmark:
          bookmarksRuntime?.deleteBookmark ?? (() => {}),
      },

      snapshotProps: {
        filename: snapshotRuntime?.snapshotFilename ?? "",
        selectedTrackId: String(
          shellState?.selectedTrack?.id ?? ""
        ),
        selectedPhraseFamilyId,
        selectedVerdict:
          hostFilters?.hostFilterState?.selectedVerdict ?? "",
        pinnedCount:
          hostFilters?.pinnedState?.pinnedFamilyIds?.length ??
          0,
        pinnedOnly:
          hostFilters?.pinnedState?.pinnedOnly ?? false,
        compareReady:
          compareRuntime?.compareResult?.summary?.ready ??
          false,
        onExportSnapshot:
          snapshotRuntime?.handleExportSnapshot ??
          (() => {}),
      },

      compareBarProps: {
        familyOptions:
          hostFilters?.compareFamilyOptions ?? [],
        compareState:
          compareRuntime?.compareState ?? {},
        ready:
          compareRuntime?.compareResult?.summary?.ready ??
          false,
        reasons:
          compareRuntime?.compareResult?.summary?.reasons ??
          [],
        onChangePrimaryFamilyId:
          compareRuntime?.handleChangePrimaryFamilyId ??
          (() => {}),
        onChangeSecondaryFamilyId:
          compareRuntime?.handleChangeSecondaryFamilyId ??
          (() => {}),
      },

      comparePanelProps: {
        result: compareRuntime?.compareResult ?? {},
      },

      workspaceProps: {
        families: workspaceFamilies,
      },

      intelligenceProps: {
        hasMomentIntelligence:
          phraseState?.hasMomentIntelligence ?? false,
        intelligenceRuntime,
        familyOptions:
          hostFilters?.filteredFamilyOptions ?? [],
        selectedPhraseFamilyId,
        onChangeSelectedPhraseFamilyId:
          safeRuntime?.setSelectedPhraseFamilyId ??
          (() => {}),
        selectedRepairQueueRow:
          phraseState?.selectedRepairQueueRow ?? null,
        repairQueueRows:
          phraseState?.repairQueueView?.rows ??
          phraseState?.repairQueueRows ??
          [],
        repairSimulationResult:
          phraseState?.repairSimulationResult ?? {},
        actionSummaryRows:
          phraseState?.actionView?.summaryRows ??
          phraseState?.actionSummaryRows ??
          [],
        driftFamilyRows:
          phraseState?.driftView?.familyRows ??
          phraseState?.driftFamilyRows ??
          [],
        stabilityFamilyRows:
          phraseState?.stabilityView?.familyRows ??
          phraseState?.stabilityFamilyRows ??
          [],
        selectedActionSummaryRow:
          phraseState?.selectedActionSummaryRow ?? null,
        selectedActionRows:
          phraseState?.selectedActionRows ?? [],
        selectedDriftFamily:
          phraseState?.selectedDriftFamily ?? null,
        selectedDriftMembers:
          phraseState?.selectedDriftMembers ?? [],
        selectedStabilityFamily:
          phraseState?.selectedStabilityFamily ?? null,
        selectedTrustStateResult:
          phraseState?.selectedTrustState ?? null,
        selectedConfidenceHistoryResult:
          phraseState?.selectedConfidenceHistoryResult ??
          null,
      },
    };

    const timelineStackProps = {
      timelineProps: {
        trimmedFilter: shellState?.trimmedFilter ?? "",
        filteredSections:
          shellState?.filteredSections ?? [],
        sections: shellState?.sections ?? [],
        filteredStats:
          healthState?.filteredStats ?? {},
        sectionStats:
          healthState?.sectionStats ?? {},
        selectedLineageResult:
          phraseState?.selectedLineageResult ?? null,
        selectedConfidenceHistoryResult:
          phraseState?.selectedConfidenceHistoryResult ??
          null,
      },

      selectedProps: {
        selectedPhraseFamilyId,
        selectedActionSummaryRow:
          phraseState?.selectedActionSummaryRow ?? null,
        selectedRepairQueueRow:
          phraseState?.selectedRepairQueueRow ?? null,
        selectedDriftFamily:
          phraseState?.selectedDriftFamily ?? null,
        selectedStabilityFamily:
          phraseState?.selectedStabilityFamily ?? null,
        selectedTrustStateResult:
          phraseState?.selectedTrustState ?? null,
        selectedConfidenceHistoryResult:
          phraseState?.selectedConfidenceHistoryResult ??
          null,
        selectedLineageResult:
          phraseState?.selectedLineageResult ?? null,
      },

      columnsProps: {
        selectedRepairQueueRow:
          phraseState?.selectedRepairQueueRow ?? null,
        repairQueueRows:
          phraseState?.repairQueueView?.rows ??
          phraseState?.repairQueueRows ??
          [],
        actionSummaryRows:
          phraseState?.actionView?.summaryRows ??
          phraseState?.actionSummaryRows ??
          [],
        driftFamilyRows:
          phraseState?.driftView?.familyRows ??
          phraseState?.driftFamilyRows ??
          [],
        stabilityFamilyRows:
          phraseState?.stabilityView?.familyRows ??
          phraseState?.stabilityFamilyRows ??
          [],
        trustSummaryRows:
          phraseState?.trustSummaryRows ?? [],
        selectedConfidenceHistoryResult:
          phraseState?.selectedConfidenceHistoryResult ??
          null,
        selectedLineageResult:
          phraseState?.selectedLineageResult ?? null,
      },

      sectionsProps: {
        filteredSections:
          shellState?.filteredSections ?? [],
        trimmedFilter: shellState?.trimmedFilter ?? "",
        filteredWithStart:
          healthState?.filteredStats?.filteredWithStart ??
          0,
        filteredOutOfOrderCount:
          healthState?.filteredStats
            ?.filteredOutOfOrderCount ?? 0,
        sectionsWithStart:
          healthState?.sectionStats?.sectionsWithStart ??
          0,
        outOfOrderCount:
          healthState?.sectionStats?.outOfOrderCount ?? 0,
        sectionsLength:
          shellState?.sections?.length ?? 0,
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
