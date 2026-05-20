import {
  getCombinedBrowserPlaybackRate,
  type TrackMatcherAudioEngineMode,
} from "../trackMatcherAudioEngine";
import type { TrackMatcherProPitchRuntimeState } from "../trackMatcherProPitchDspRuntime";
import {
  PRO_PITCH_AUTO_FALLBACK_STATUSES,
  TRACK_MATCHER_KEYS,
} from "./trackMatcherControllerConstants";
import {
  getDeckFileLabel,
  getReadinessClasses,
  getReadinessStatus,
  getRuntimeStatusDetail,
} from "./trackMatcherControllerLabels";
import {
  clampPlaybackRate,
  getEffectivePlaybackRate,
  getKeyShiftFromKeyIndex,
} from "./trackMatcherControllerMath";
import type {
  ControllerDeckSnapshot,
  ControllerEngineHealth,
  TrackMatcherDeckId,
  TrackMatcherTrackState,
} from "./trackMatcherControllerTypes";

export function getControllerDeckSnapshot({
  deckId,
  track,
  runtime,
  canUseProPitch,
  audioMode,
  warning,
}: {
  deckId: TrackMatcherDeckId;
  track: TrackMatcherTrackState;
  runtime: TrackMatcherProPitchRuntimeState;
  canUseProPitch: boolean;
  audioMode: TrackMatcherAudioEngineMode;
  warning: string;
}): ControllerDeckSnapshot {
  const browserRate = clampPlaybackRate(
    getCombinedBrowserPlaybackRate(
      track.bpm,
      getKeyShiftFromKeyIndex(track.keyIndex),
    ),
  );
  const effectiveRate = getEffectivePlaybackRate(track, audioMode, canUseProPitch);
  const fileLoaded = Boolean(track.fileUrl);
  const readinessStatus = getReadinessStatus({
    fileLoaded,
    runtimeStatus: runtime.status,
    canUseProPitch,
  });
  const keyShiftSemitones = getKeyShiftFromKeyIndex(track.keyIndex);
  const keyLabel = TRACK_MATCHER_KEYS[track.keyIndex] ?? "C";
  const fallbackDetail = canUseProPitch
    ? "Granular DSP can handle pitch while BPM stays tempo-focused."
    : getRuntimeStatusDetail(runtime.status);

  return {
    deckId,
    title: `Track ${deckId}`,
    trackName: getDeckFileLabel(track.trackName),
    fileLoaded,
    bpm: track.bpm,
    keyLabel,
    keyShiftSemitones,
    mode: track.mode,
    runtimeStatus: runtime.status,
    readinessStatus,
    canUseProPitch,
    browserRate,
    effectiveRate,
    warning,
    detail: warning || fallbackDetail,
  };
}

export function getControllerEngineHealth({
  audioMode,
  deckA,
  deckB,
}: {
  audioMode: TrackMatcherAudioEngineMode;
  deckA: ControllerDeckSnapshot;
  deckB: ControllerDeckSnapshot;
}): ControllerEngineHealth {
  const loadedDeckCount = [deckA, deckB].filter((deck) => deck.fileLoaded).length;
  const proPitchDeckCount = [deckA, deckB].filter(
    (deck) => deck.canUseProPitch,
  ).length;
  const failedDeckCount = [deckA, deckB].filter(
    (deck) => deck.readinessStatus === "failed",
  ).length;
  const loadingDeckCount = [deckA, deckB].filter(
    (deck) => deck.readinessStatus === "loading",
  ).length;

  if (failedDeckCount > 0) {
    return {
      status: "failed",
      label: "DSP needs attention",
      detail:
        "At least one deck failed Pro Pitch preparation. Browser fallback is still available.",
      toneClasses: getReadinessClasses("failed"),
    };
  }

  if (loadingDeckCount > 0) {
    return {
      status: "loading",
      label: "Preparing Pro Pitch",
      detail: "One or more decks are decoding audio for the granular DSP path.",
      toneClasses: getReadinessClasses("loading"),
    };
  }

  if (loadedDeckCount === 0) {
    return {
      status: "empty",
      label: "Load tracks to begin",
      detail: "Track Matcher is ready. Load Track A and Track B to prepare DSP.",
      toneClasses: getReadinessClasses("empty"),
    };
  }

  if (audioMode === "pro-pitch-dsp" && proPitchDeckCount === loadedDeckCount) {
    return {
      status: "pro-pitch-ready",
      label: "Pro Pitch armed",
      detail:
        "Loaded decks are ready for pitch-stable granular playback with browser fallback nearby.",
      toneClasses: getReadinessClasses("pro-pitch-ready"),
    };
  }

  if (audioMode === "pro-pitch-dsp") {
    return {
      status: "browser-only",
      label: "Mixed DSP readiness",
      detail:
        "Some loaded decks are using browser fallback until Pro Pitch becomes available.",
      toneClasses: getReadinessClasses("browser-only"),
    };
  }

  return {
    status: "browser-only",
    label: "Browser mode active",
    detail: "Browser playback is active. Pro Pitch remains prepared when available.",
    toneClasses: getReadinessClasses("browser-only"),
  };
}

export function shouldForceBrowserFallback({
  audioMode,
  runtimeA,
  runtimeB,
}: {
  audioMode: TrackMatcherAudioEngineMode;
  runtimeA: TrackMatcherProPitchRuntimeState;
  runtimeB: TrackMatcherProPitchRuntimeState;
}) {
  if (audioMode !== "pro-pitch-dsp") {
    return false;
  }

  return [runtimeA.status, runtimeB.status].some((status) =>
    PRO_PITCH_AUTO_FALLBACK_STATUSES.includes(status),
  );
}
