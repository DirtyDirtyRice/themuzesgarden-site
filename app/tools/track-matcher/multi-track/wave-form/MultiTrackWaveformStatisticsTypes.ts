export type MultiTrackWaveformStatisticStatus =
  | "ready"
  | "waiting"
  | "future";

export type MultiTrackWaveformStatisticLane = {
  laneId: "track-a" | "track-b";
  title: string;

  peakLevel: string;
  rmsLevel: string;
  dynamicRange: string;

  estimatedBpm: string;
  estimatedKey: string;

  sampleRate: string;
  bitDepth: string;
  channelMode: string;

  status: MultiTrackWaveformStatisticStatus;
};

export type MultiTrackWaveformStatisticsWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;

  lanes: MultiTrackWaveformStatisticLane[];

  futureCapabilities: string[];
};