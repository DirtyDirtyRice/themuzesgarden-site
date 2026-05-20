import type { TrackMatcherProPitchRuntimeState } from "../trackMatcherProPitchDspRuntime";
import type {
  SyncSnapshot,
  TrackMatcherTrackState,
} from "./trackMatcherControllerTypes";
import {
  TRACK_MATCHER_DEFAULT_LANES,
  TRACK_MATCHER_DEFAULT_LANE_RELATIONSHIPS,
} from "./trackMatcherLaneSeed";

export const TRACK_MATCHER_KEYS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const DEFAULT_TRACK_A: TrackMatcherTrackState = {
  bpm: 100,
  keyIndex: 0,
  mode: "major",
  trackName: "",
  fileUrl: null,
};

export const DEFAULT_TRACK_B: TrackMatcherTrackState = {
  bpm: 120,
  keyIndex: 7,
  mode: "minor",
  trackName: "",
  fileUrl: null,
};

export const DEFAULT_SYNC_SNAPSHOT: SyncSnapshot = {
  status: "idle",
  driftSeconds: 0,
  phaseSeconds: 0,
  bpmDifference: 0,
  rateCorrection: 0,
};

export const DEFAULT_TRACK_MATCHER_LANES = TRACK_MATCHER_DEFAULT_LANES;

export const DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS =
  TRACK_MATCHER_DEFAULT_LANE_RELATIONSHIPS;

export const SYNC_INTERVAL_MS = 120;
export const PHASE_BEATS = 4;
export const SOFT_DRIFT_SECONDS = 0.01;
export const HARD_DRIFT_SECONDS = 0.3;
export const HARD_PHASE_SECONDS = 0.18;
export const MAX_RATE_CORRECTION = 0.08;
export const BPM_SMOOTHING = 0.15;

export const PRO_PITCH_AUTO_FALLBACK_STATUSES: TrackMatcherProPitchRuntimeState["status"][] =
  ["unsupported", "failed"];