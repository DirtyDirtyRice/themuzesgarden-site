export type MultiTrackCueStatus = "ready" | "waiting" | "future";

export type MultiTrackCuePoint = {
  label: string;
  status: MultiTrackCueStatus;
  detail: string;
};

export type MultiTrackCueLane = {
  laneId: "track-a" | "track-b";
  title: string;

  introCueReady: boolean;
  verseCueReady: boolean;
  chorusCueReady: boolean;
  bridgeCueReady: boolean;
  outroCueReady: boolean;
  loopCueReady: boolean;

  cuePoints: MultiTrackCuePoint[];
};

export type MultiTrackCueWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;

  lanes: MultiTrackCueLane[];

  ownershipNotes: string[];
};