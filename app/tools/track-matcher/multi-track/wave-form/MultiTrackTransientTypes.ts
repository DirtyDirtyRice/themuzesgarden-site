export type MultiTrackTransientStatus =
  | "ready"
  | "waiting"
  | "future";

export type MultiTrackTransientCheckpoint = {
  label: string;
  status: MultiTrackTransientStatus;
  detail: string;
};

export type MultiTrackTransientLane = {
  laneId: "track-a" | "track-b";
  title: string;

  kickDetectionReady: boolean;
  snareDetectionReady: boolean;
  vocalOnsetReady: boolean;

  cueGenerationReady: boolean;
  markerGenerationReady: boolean;

  checkpoints: MultiTrackTransientCheckpoint[];
};

export type MultiTrackTransientWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;

  lanes: MultiTrackTransientLane[];

  ownershipNotes: string[];
};