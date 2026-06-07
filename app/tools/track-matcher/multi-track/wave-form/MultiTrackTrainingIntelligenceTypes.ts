export type MultiTrackTrainingStatus = "ready" | "waiting" | "future";

export type MultiTrackTrainingCategory =
  | "pattern"
  | "phrase"
  | "hook"
  | "arrangement"
  | "energy"
  | "comparison"
  | "ai"
  | "hybrid"
  | "confidence"
  | "memory";

export type MultiTrackTrainingOwner =
  | "waveform"
  | "statistics"
  | "detection"
  | "marker"
  | "cue"
  | "stem"
  | "dsp"
  | "insight"
  | "future";

export type MultiTrackTrainingItem = {
  trainingId: string;
  label: string;
  category: MultiTrackTrainingCategory;
  owner: MultiTrackTrainingOwner;
  status: MultiTrackTrainingStatus;
  readinessLabel: string;
  inputLabel: string;
  outputLabel: string;
  detail: string;
};

export type MultiTrackTrainingLane = {
  laneId: "track-a" | "track-b";
  title: string;
  sourceLabel: string;

  patternTrainingReady: boolean;
  hookTrainingReady: boolean;
  phraseTrainingReady: boolean;
  arrangementTrainingReady: boolean;
  energyTrainingReady: boolean;
  aiTrainingReady: boolean;
  hybridTrainingReady: boolean;

  trainingItems: MultiTrackTrainingItem[];
};

export type MultiTrackTrainingIntelligenceWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;
  lanes: MultiTrackTrainingLane[];
  trainingRules: string[];
  futureConnections: string[];
};