import type {
  MultiTrackEngineState,
  MultiTrackEngineTimelineCue,
  MultiTrackEngineTimelineMarker,
  MultiTrackEngineTransportStatus,
} from "./multiTrackEngineTypes";
import { getLongestTrackDurationSeconds } from "./multiTrackEngineTrackHelpers";
import { clampNumber } from "./multiTrackEngineUtilityHelpers";

export function getMultiTrackEngineVisibleMarkers(
  state: MultiTrackEngineState,
): MultiTrackEngineTimelineMarker[] {
  const playhead = state.timeline.playheadSeconds;
  const windowSize = Math.max(16, 60 / Math.max(state.timeline.zoomLevel, 1));

  return state.timeline.markers.filter(
    (marker) =>
      marker.startSeconds <= playhead + windowSize && marker.endSeconds >= playhead - windowSize,
  );
}

export function getMultiTrackEngineVisibleCues(
  state: MultiTrackEngineState,
): MultiTrackEngineTimelineCue[] {
  const playhead = state.timeline.playheadSeconds;
  const windowSize = Math.max(16, 60 / Math.max(state.timeline.zoomLevel, 1));

  return state.timeline.cues.filter(
    (cue) => cue.seconds <= playhead + windowSize && cue.seconds >= playhead - windowSize,
  );
}

export function setMultiTrackEnginePlayhead(
  state: MultiTrackEngineState,
  playheadSeconds: number,
): MultiTrackEngineState {
  return {
    ...state,
    editedAtLabel: new Date().toISOString(),
    timeline: {
      ...state.timeline,
      playheadSeconds: clampNumber(playheadSeconds, 0, getLongestTrackDurationSeconds(state)),
    },
  };
}

export function setMultiTrackEngineLoop(
  state: MultiTrackEngineState,
  loopStartSeconds: number,
  loopEndSeconds: number,
): MultiTrackEngineState {
  const longestDuration = getLongestTrackDurationSeconds(state);
  const safeStart = clampNumber(loopStartSeconds, 0, longestDuration);
  const safeEnd = clampNumber(loopEndSeconds, safeStart, longestDuration);

  return {
    ...state,
    editedAtLabel: new Date().toISOString(),
    timeline: {
      ...state.timeline,
      loopEnabled: safeEnd > safeStart,
      loopStartSeconds: safeStart,
      loopEndSeconds: safeEnd,
    },
  };
}

export function setMultiTrackEngineTransportStatus(
  state: MultiTrackEngineState,
  transportStatus: MultiTrackEngineTransportStatus,
): MultiTrackEngineState {
  return {
    ...state,
    editedAtLabel: new Date().toISOString(),
    timeline: {
      ...state.timeline,
      transportStatus,
    },
  };
}

export function toggleMultiTrackEngineSnapToMarkers(state: MultiTrackEngineState): MultiTrackEngineState {
  return {
    ...state,
    editedAtLabel: new Date().toISOString(),
    timeline: {
      ...state.timeline,
      snapToMarkers: !state.timeline.snapToMarkers,
    },
  };
}