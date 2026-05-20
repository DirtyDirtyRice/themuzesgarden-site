import {
  getCombinedBrowserPlaybackRate,
  type TrackMatcherAudioEngineMode,
  type TrackMatcherAudioTrackInput,
} from "../trackMatcherAudioEngine";
import {
  MAX_RATE_CORRECTION,
  PHASE_BEATS,
} from "./trackMatcherControllerConstants";
import type { TrackMatcherTrackState } from "./trackMatcherControllerTypes";

export function clampBpm(value: number) {
  return Math.min(180, Math.max(60, Number(value.toFixed(2))));
}

export function clampPlaybackRate(value: number) {
  return Math.min(4, Math.max(0.25, value));
}

export function getPlaybackRateFromBpm(bpm: number) {
  return clampPlaybackRate(bpm / 100);
}

export function getSecondsPerBeat(bpm: number) {
  return 60 / clampBpm(bpm);
}

export function getPhaseLengthSeconds(bpm: number) {
  return getSecondsPerBeat(bpm) * PHASE_BEATS;
}

export function getLoopPhase(time: number, loopLength: number) {
  if (
    !Number.isFinite(time) ||
    !Number.isFinite(loopLength) ||
    loopLength <= 0
  ) {
    return 0;
  }

  const phase = time % loopLength;
  return phase < 0 ? phase + loopLength : phase;
}

export function getShortestPhaseDrift(
  sourcePhase: number,
  targetPhase: number,
  loopLength: number,
) {
  if (!Number.isFinite(loopLength) || loopLength <= 0) {
    return 0;
  }

  let drift = sourcePhase - targetPhase;

  if (drift > loopLength / 2) {
    drift -= loopLength;
  }

  if (drift < -loopLength / 2) {
    drift += loopLength;
  }

  return drift;
}

export function getSafeCorrectionAmount(drift: number) {
  return Math.max(
    -MAX_RATE_CORRECTION,
    Math.min(MAX_RATE_CORRECTION, drift * 0.5),
  );
}

export function getSafeCorrectionRate(baseRate: number, drift: number) {
  return clampPlaybackRate(baseRate + getSafeCorrectionAmount(drift));
}

export function getSafeDuration(audio: HTMLAudioElement | null) {
  if (!audio) return Number.POSITIVE_INFINITY;

  if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return audio.duration;
}

export function setSafeCurrentTime(audio: HTMLAudioElement, time: number) {
  const duration = getSafeDuration(audio);
  audio.currentTime = Math.min(duration, Math.max(0, time));
}

export function revokeFileUrl(fileUrl: string | null) {
  if (!fileUrl) return;

  window.URL.revokeObjectURL(fileUrl);
}

export function getKeyShiftFromKeyIndex(keyIndex: number) {
  const normalized = ((keyIndex % 12) + 12) % 12;

  if (normalized > 6) {
    return normalized - 12;
  }

  return normalized;
}

export function getAudioTrackInput(
  track: TrackMatcherTrackState,
): TrackMatcherAudioTrackInput {
  return {
    bpm: track.bpm,
    keyShiftSemitones: getKeyShiftFromKeyIndex(track.keyIndex),
  };
}

export function getEffectivePlaybackRate(
  track: TrackMatcherTrackState,
  audioMode: TrackMatcherAudioEngineMode,
  canUseProPitchForTrack: boolean,
) {
  if (audioMode === "pro-pitch-dsp" && canUseProPitchForTrack) {
    return getPlaybackRateFromBpm(track.bpm);
  }

  return clampPlaybackRate(
    getCombinedBrowserPlaybackRate(
      track.bpm,
      getKeyShiftFromKeyIndex(track.keyIndex),
    ),
  );
}
