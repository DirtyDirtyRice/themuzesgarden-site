"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addMultiTrackEngineFinding,
  addMultiTrackEngineTimelineCue,
  addMultiTrackEngineTimelineMarker,
  clearMultiTrackEngineFindings,
  createMultiTrackEngineState,
  getEngineReadiness,
  getLongestTrackDurationSeconds,
  getMultiTrackEngineTrackPair,
  getMultiTrackEngineVisibleMarkers,
  getMultiTrackEngineVisibleCues,
  removeMultiTrackEngineTimelineCue,
  removeMultiTrackEngineTimelineMarker,
  resetMultiTrackEngineState,
  saveMultiTrackEngineSnapshot,
  setMultiTrackEngineDecisionRoute,
  setMultiTrackEngineLoop,
  setMultiTrackEnginePlayhead,
  setMultiTrackEngineTransportStatus,
  toggleMultiTrackEngineSnapToMarkers,
  toggleMultiTrackEngineTrackLock,
  toggleMultiTrackEngineTrackMute,
  toggleMultiTrackEngineTrackSolo,
  updateMultiTrackEngineTrack,
} from "./multiTrackEngineHelpers";
import type {
  MultiTrackEngineAnalysisFinding,
  MultiTrackEngineDecisionRoute,
  MultiTrackEngineReadinessLevel,
  MultiTrackEngineState,
  MultiTrackEngineTimelineCue,
  MultiTrackEngineTimelineMarker,
  MultiTrackEngineTrackSlotId,
  MultiTrackEngineTrackState,
  MultiTrackEngineTransportStatus,
} from "./multiTrackEngineTypes";

export type UseMultiTrackEngineResult = {
  engineState: MultiTrackEngineState;
  trackPair: readonly [MultiTrackEngineTrackState, MultiTrackEngineTrackState];
  readiness: MultiTrackEngineReadinessLevel;
  readinessLabel: string;
  readinessDetail: string;
  snapshotCount: number;
  markerCount: number;
  cueCount: number;
  findingCount: number;
  longestTrackDurationSeconds: number;
  visibleMarkers: MultiTrackEngineTimelineMarker[];
  visibleCues: MultiTrackEngineTimelineCue[];
  canSaveSnapshot: boolean;
  canExportComparison: boolean;
  updateTrack: (
    trackSlotId: MultiTrackEngineTrackSlotId,
    patch: Partial<MultiTrackEngineTrackState>,
  ) => void;
  muteTrack: (trackSlotId: MultiTrackEngineTrackSlotId) => void;
  soloTrack: (trackSlotId: MultiTrackEngineTrackSlotId) => void;
  lockTrack: (trackSlotId: MultiTrackEngineTrackSlotId) => void;
  addMarker: (marker: MultiTrackEngineTimelineMarker) => void;
  removeMarker: (markerId: string) => void;
  addCue: (cue: MultiTrackEngineTimelineCue) => void;
  removeCue: (cueId: string) => void;
  addFinding: (finding: MultiTrackEngineAnalysisFinding) => void;
  clearFindings: () => void;
  setDecisionRoute: (route: MultiTrackEngineDecisionRoute) => void;
  setPlayhead: (playheadSeconds: number) => void;
  setLoop: (loopStartSeconds: number, loopEndSeconds: number) => void;
  setTransportStatus: (transportStatus: MultiTrackEngineTransportStatus) => void;
  toggleSnapToMarkers: () => void;
  saveSnapshot: () => void;
  resetEngine: () => void;
};

export function useMultiTrackEngine(): UseMultiTrackEngineResult {
  const [engineState, setEngineState] = useState<MultiTrackEngineState>(() =>
    createMultiTrackEngineState(),
  );

  const trackPair = useMemo(() => getMultiTrackEngineTrackPair(engineState), [engineState]);

  const readiness = useMemo(() => getEngineReadiness(engineState), [engineState]);

  const readinessLabel = useMemo(() => getReadinessLabel(readiness), [readiness]);

  const readinessDetail = useMemo(
    () => getReadinessDetail(readiness, engineState),
    [engineState, readiness],
  );

  const snapshotCount = engineState.snapshots.length;

  const markerCount = engineState.timeline.markers.length;

  const cueCount = engineState.timeline.cues.length;

  const findingCount = engineState.analysis.findings.length;

  const longestTrackDurationSeconds = useMemo(
    () => getLongestTrackDurationSeconds(engineState),
    [engineState],
  );

  const visibleMarkers = useMemo(
    () => getMultiTrackEngineVisibleMarkers(engineState),
    [engineState],
  );

  const visibleCues = useMemo(
    () => getMultiTrackEngineVisibleCues(engineState),
    [engineState],
  );

  const canSaveSnapshot = engineState.decision.canSave;

  const canExportComparison = engineState.decision.canExport;

  const updateTrack = useCallback(
    (trackSlotId: MultiTrackEngineTrackSlotId, patch: Partial<MultiTrackEngineTrackState>) => {
      setEngineState((currentState) =>
        updateMultiTrackEngineTrack(currentState, trackSlotId, patch),
      );
    },
    [],
  );

  const muteTrack = useCallback((trackSlotId: MultiTrackEngineTrackSlotId) => {
    setEngineState((currentState) => toggleMultiTrackEngineTrackMute(currentState, trackSlotId));
  }, []);

  const soloTrack = useCallback((trackSlotId: MultiTrackEngineTrackSlotId) => {
    setEngineState((currentState) => toggleMultiTrackEngineTrackSolo(currentState, trackSlotId));
  }, []);

  const lockTrack = useCallback((trackSlotId: MultiTrackEngineTrackSlotId) => {
    setEngineState((currentState) => toggleMultiTrackEngineTrackLock(currentState, trackSlotId));
  }, []);

  const addMarker = useCallback((marker: MultiTrackEngineTimelineMarker) => {
    setEngineState((currentState) => addMultiTrackEngineTimelineMarker(currentState, marker));
  }, []);

  const removeMarker = useCallback((markerId: string) => {
    setEngineState((currentState) => removeMultiTrackEngineTimelineMarker(currentState, markerId));
  }, []);

  const addCue = useCallback((cue: MultiTrackEngineTimelineCue) => {
    setEngineState((currentState) => addMultiTrackEngineTimelineCue(currentState, cue));
  }, []);

  const removeCue = useCallback((cueId: string) => {
    setEngineState((currentState) => removeMultiTrackEngineTimelineCue(currentState, cueId));
  }, []);

  const addFinding = useCallback((finding: MultiTrackEngineAnalysisFinding) => {
    setEngineState((currentState) => addMultiTrackEngineFinding(currentState, finding));
  }, []);

  const clearFindings = useCallback(() => {
    setEngineState((currentState) => clearMultiTrackEngineFindings(currentState));
  }, []);

  const setDecisionRoute = useCallback((route: MultiTrackEngineDecisionRoute) => {
    setEngineState((currentState) => setMultiTrackEngineDecisionRoute(currentState, route));
  }, []);

  const setPlayhead = useCallback((playheadSeconds: number) => {
    setEngineState((currentState) => setMultiTrackEnginePlayhead(currentState, playheadSeconds));
  }, []);

  const setLoop = useCallback((loopStartSeconds: number, loopEndSeconds: number) => {
    setEngineState((currentState) =>
      setMultiTrackEngineLoop(currentState, loopStartSeconds, loopEndSeconds),
    );
  }, []);

  const setTransportStatus = useCallback((transportStatus: MultiTrackEngineTransportStatus) => {
    setEngineState((currentState) =>
      setMultiTrackEngineTransportStatus(currentState, transportStatus),
    );
  }, []);

  const toggleSnapToMarkers = useCallback(() => {
    setEngineState((currentState) => toggleMultiTrackEngineSnapToMarkers(currentState));
  }, []);

  const saveSnapshot = useCallback(() => {
    setEngineState((currentState) => saveMultiTrackEngineSnapshot(currentState));
  }, []);

  const resetEngine = useCallback(() => {
    setEngineState(() => resetMultiTrackEngineState());
  }, []);

  return {
    engineState,
    trackPair,
    readiness,
    readinessLabel,
    readinessDetail,
    snapshotCount,
    markerCount,
    cueCount,
    findingCount,
    longestTrackDurationSeconds,
    visibleMarkers,
    visibleCues,
    canSaveSnapshot,
    canExportComparison,
    updateTrack,
    muteTrack,
    soloTrack,
    lockTrack,
    addMarker,
    removeMarker,
    addCue,
    removeCue,
    addFinding,
    clearFindings,
    setDecisionRoute,
    setPlayhead,
    setLoop,
    setTransportStatus,
    toggleSnapToMarkers,
    saveSnapshot,
    resetEngine,
  };
}

function getReadinessLabel(readiness: MultiTrackEngineReadinessLevel): string {
  switch (readiness) {
    case "empty":
      return "Empty";
    case "draft":
      return "Draft";
    case "ready":
      return "Ready";
    case "warning":
      return "Warning";
    case "blocked":
      return "Blocked";
    default:
      return "Draft";
  }
}

function getReadinessDetail(
  readiness: MultiTrackEngineReadinessLevel,
  engineState: MultiTrackEngineState,
): string {
  switch (readiness) {
    case "empty":
      return "Load Track A and Track B before engine comparison begins.";
    case "draft":
      return "Engine has partial data and is waiting for waveform, metadata, analysis, or sync readiness.";
    case "warning":
      return `Engine has partial readiness with ${engineState.analysis.warningCount} warning item(s).`;
    case "ready":
      return "Engine foundation is ready to save a comparison snapshot.";
    case "blocked":
      return `Engine has ${engineState.analysis.blockedCount} blocked item(s) that need attention.`;
    default:
      return "Engine is waiting for the next safe action.";
  }
}