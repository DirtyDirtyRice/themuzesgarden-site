export type MultiTrackWaveformReadiness = "ready" | "partial" | "future";
export type MultiTrackWaveformLaneId = "track-a" | "track-b";
export type MultiTrackWaveformStatus = "ready" | "waiting" | "future";

export type MultiTrackWaveformCheckpoint = {
  label: string;
  status: MultiTrackWaveformStatus;
  detail: string;
};

export type MultiTrackWaveformLane = {
  laneId: MultiTrackWaveformLaneId;
  title: string;
  sourceLabel: string;
  durationLabel: string;
  durationSeconds: number;
  waveformReady: boolean;
  transientReady: boolean;
  analysisReady: boolean;
  dspOwner: string;
  waveformOwner: string;
  stemOwner: string;
  checkpoints: MultiTrackWaveformCheckpoint[];
};

export type MultiTrackWaveformWorkspaceState = {
  title: string;
  summary: string;
  readiness: MultiTrackWaveformReadiness;
  readinessLabel: string;
  lanes: MultiTrackWaveformLane[];
  futureOwnershipNotes: string[];
};