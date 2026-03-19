"use client";

import { useEffect, useMemo, useState } from "react";
import { buildMomentInspectorIntelligenceRuntime } from "./momentInspectorBuildIntelligenceRuntime";
import { buildMomentInspectorPhraseFamilyState } from "./momentInspectorPhraseFamilyState";
import { buildMomentInspectorRuntimeBridge } from "./momentInspectorRuntimeBridge";
import { buildMomentInspectorSelectedFamilyState } from "./momentInspectorSelectedFamilyState";
import { buildMomentInspectorSimilarity } from "./momentInspectorSimilarity";
import { buildMomentInspectorViewState } from "./momentInspectorViewState";
import { syncPhraseFamilySelection } from "./momentInspectorSelectionSync";
import type { AnyTrack } from "./playerTypes";
import { useMomentInspectorBookmarksRuntime } from "./useMomentInspectorBookmarksRuntime";
import { useMomentInspectorCompareRuntime } from "./useMomentInspectorCompareRuntime";
import { useMomentInspectorHostFilters } from "./useMomentInspectorHostFilters";
import { useMomentInspectorSectionFilterState } from "./useMomentInspectorSectionFilterState";
import { useMomentInspectorSnapshotRuntime } from "./useMomentInspectorSnapshotRuntime";
import { useMomentInspectorTrackState } from "./useMomentInspectorTrackState";

type AnyFn = (...args: any[]) => any;

function getFn(value: unknown, fallback: AnyFn): AnyFn {
  return typeof value === "function" ? (value as AnyFn) : fallback;
}

export function useMomentInspectorHostRuntime(params: {
  allTracks: AnyTrack[];
}) {
  const { allTracks } = params;

  const [open, setOpen] = useState(false);
  const [selectedPhraseFamilyId, setSelectedPhraseFamilyId] = useState("");

  const trackState = useMomentInspectorTrackState(allTracks);

  const {
    discoveryRuntime,
    sortedTracks,
    selectedTrack,
    setTrackId,
  } = trackState;

  const sectionState = useMomentInspectorSectionFilterState(selectedTrack);

  const {
    filter,
    setFilter,
    trimmedFilter,
    selectedSectionId,
    setSelectedSectionId,
    selectedTrackLabel,
    trackTags,
    momentTags,
    descriptions,
    sections,
    filteredSections,
    focusSections,
  } = sectionState;

  const viewState = useMemo(() => {
    return buildMomentInspectorViewState({
      selectedTrack,
      sections,
      filteredSections,
      trackTags,
      momentTags,
      descriptions,
    });
  }, [
    selectedTrack,
    sections,
    filteredSections,
    trackTags,
    momentTags,
    descriptions,
  ]);

  const runtimeBridge = useMemo(() => {
    return buildMomentInspectorRuntimeBridge({
      selectedTrack,
      discoveryRuntime,
      trackTags,
      momentTags,
      trimmedFilter,
    });
  }, [
    selectedTrack,
    discoveryRuntime,
    trackTags,
    momentTags,
    trimmedFilter,
  ]);

  const similarityState = useMemo(() => {
    return buildMomentInspectorSimilarity({
      track: selectedTrack,
      sections,
      selectedSectionId,
    });
  }, [selectedTrack, sections, selectedSectionId]);

  const phraseFamilyState = useMemo(() => {
    return buildMomentInspectorPhraseFamilyState({
      selectedTrack,
      discoverySnapshot: runtimeBridge.discoverySnapshot,
    });
  }, [selectedTrack, runtimeBridge.discoverySnapshot]);

  const {
    repairSimulationResult,
    confidenceHistoryResult: phraseConfidenceHistoryResult,
    familyLineageResult: phraseFamilyLineageResult,
    actionSummaryRows,
    inspectorHealth,
    driftView,
    stabilityView,
    actionView,
    repairQueueView,
    familyOptions,
    trustStateByFamilyId,
    trustSummaryRows,
  } = phraseFamilyState;

  const hostFilters = useMomentInspectorHostFilters({
    familyOptions,
    selectedPhraseFamilyId,
  });

  const {
    hostFilterState,
    pinnedState,
    hostFilterResult,
    pinnedResult,
    filteredFamilyOptions,
    compareFamilyOptions,
    isSelectedFamilyPinned,
    handleChangeHostVerdictFilter,
    handleTogglePinnedOnly,
    handleResetPins,
    handleToggleSelectedFamilyPin,
  } = hostFilters;

  useEffect(() => {
    syncPhraseFamilySelection({
      familyOptions: filteredFamilyOptions,
      selectedPhraseFamilyId,
      setSelectedPhraseFamilyId,
    });
  }, [filteredFamilyOptions, selectedPhraseFamilyId]);

  const selectedConfidenceHistoryResult =
    phraseConfidenceHistoryResult ??
    runtimeBridge.confidenceHistoryResult ??
    null;

  const selectedLineageResult =
    phraseFamilyLineageResult ??
    runtimeBridge.familyLineageResult ??
    null;

  const selectedFamilyState = useMemo(() => {
    return buildMomentInspectorSelectedFamilyState({
      selectedPhraseFamilyId,
      driftView,
      stabilityView,
      actionView,
      repairQueueView,
      trustStateByFamilyId,
      trustSummaryRows,
    });
  }, [
    selectedPhraseFamilyId,
    driftView,
    stabilityView,
    actionView,
    repairQueueView,
    trustStateByFamilyId,
    trustSummaryRows,
  ]);

  const {
    selectedDriftFamily,
    selectedStabilityFamily,
    selectedActionSummaryRow,
    selectedRepairQueueRow,
    selectedActionRows,
    selectedDriftMembers,
    hasMomentIntelligence,
    selectedFamilyRuntimeSignals,
    selectedTrustState,
  } = selectedFamilyState;

  const intelligenceRuntime = useMemo(() => {
    return buildMomentInspectorIntelligenceRuntime({
      selectedFamilyRuntimeSignals,
      selectedTrustState,
      selectedConfidenceHistoryResult,
      selectedLineageResult,
    });
  }, [
    selectedFamilyRuntimeSignals,
    selectedTrustState,
    selectedConfidenceHistoryResult,
    selectedLineageResult,
  ]);

  const compareRuntime = useMomentInspectorCompareRuntime({
    familyOptions: compareFamilyOptions,
    driftRows: driftView.familyRows,
    stabilityRows: stabilityView.familyRows,
    actionRows: actionView.summaryRows,
    repairRows: repairQueueView.rows,
    trustRows: trustSummaryRows,
  });

  const compareSetState = getFn(
    (compareRuntime as Record<string, unknown>).setCompareState,
    () => {}
  );

  const hostFilterSetState = getFn(
    (hostFilters as Record<string, unknown>).setHostFilterState,
    () => {}
  );

  const pinnedSetState = getFn(
    (hostFilters as Record<string, unknown>).setPinnedState,
    () => {}
  );

  const bookmarksRuntime = useMomentInspectorBookmarksRuntime({
    selectedTrackId: String(selectedTrack?.id ?? ""),
    selectedPhraseFamilyId,
    selectedVerdict: hostFilterState.selectedVerdict,
    pinnedFamilyIds: pinnedState.pinnedFamilyIds,
    pinnedOnly: pinnedState.pinnedOnly,
    comparePrimaryFamilyId: compareRuntime.compareState.primaryFamilyId,
    compareSecondaryFamilyId: compareRuntime.compareState.secondaryFamilyId,
    setTrackId,
    setSelectedPhraseFamilyId,
    setHostFilterState: hostFilterSetState,
    setPinnedState: pinnedSetState,
    setCompareState: compareSetState,
  });

  const snapshotRuntime = useMomentInspectorSnapshotRuntime({
    selectedTrackId: String(selectedTrack?.id ?? ""),
    selectedPhraseFamilyId,
    selectedVerdict: hostFilterState.selectedVerdict,
    pinnedFamilyIds: pinnedState.pinnedFamilyIds,
    pinnedOnly: pinnedState.pinnedOnly,
    comparePrimaryFamilyId: compareRuntime.compareState.primaryFamilyId,
    compareSecondaryFamilyId: compareRuntime.compareState.secondaryFamilyId,
  });

  return {
    open,
    setOpen,

    selectedPhraseFamilyId,
    setSelectedPhraseFamilyId,

    trackState,
    sectionState,
    viewState,
    runtimeBridge,
    similarityState,
    phraseFamilyState,
    hostFilters,
    selectedFamilyState,
    intelligenceRuntime,
    compareRuntime,
    bookmarksRuntime,
    snapshotRuntime,

    shellState: {
      selectedTrack,
      selectedTrackLabel,
      sortedTracks,
      setTrackId,
      filter,
      setFilter,
      trimmedFilter,
      selectedSectionId,
      setSelectedSectionId,
      sections,
      filteredSections,
      focusSections,
      trackTags,
      momentTags,
      descriptions,
    },

    healthState: {
      healthScore: viewState.healthScore,
      healthTone: viewState.healthTone,
      sectionStats: viewState.sectionStats,
      densityStats: viewState.densityStats,
      filteredStats: viewState.filteredStats,
      dataWarnings: viewState.dataWarnings,
      duplicateTrackTags: viewState.duplicateTrackTags,
      duplicateMomentTags: viewState.duplicateMomentTags,
      momentTagFrequency: viewState.momentTagFrequency,
    },

    bridgeState: {
      discoverySnapshot: runtimeBridge.discoverySnapshot,
      discoverySummary: runtimeBridge.discoverySummary,
      metadataSummary: runtimeBridge.metadataSummary,
      runtimeConfidenceHistoryResult: runtimeBridge.confidenceHistoryResult,
      runtimeFamilyLineageResult: runtimeBridge.familyLineageResult,
    },

    phraseState: {
      repairSimulationResult,
      actionSummaryRows,
      inspectorHealth,
      driftView,
      stabilityView,
      actionView,
      repairQueueView,
      familyOptions,
      trustStateByFamilyId,
      trustSummaryRows,
      selectedConfidenceHistoryResult,
      selectedLineageResult,
      selectedDriftFamily,
      selectedStabilityFamily,
      selectedActionSummaryRow,
      selectedRepairQueueRow,
      selectedActionRows,
      selectedDriftMembers,
      hasMomentIntelligence,
      selectedTrustState,
    },
  };
}