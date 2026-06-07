export type MultiTrackWaveformIntelligenceStatus =
  | "ready"
  | "waiting"
  | "future";

export type MultiTrackWaveformIntelligenceCategory =
  | "pattern"
  | "phrase"
  | "hook"
  | "arrangement"
  | "energy"
  | "confidence"
  | "training"
  | "ai"
  | "hybrid"
  | "comparison";

export type MultiTrackWaveformIntelligenceItem = {
  intelligenceId: string;
  label: string;
  category: MultiTrackWaveformIntelligenceCategory;
  status: MultiTrackWaveformIntelligenceStatus;
  readinessLabel: string;
  detail: string;
};

export type MultiTrackWaveformIntelligenceLane = {
  laneId: "track-a" | "track-b";
  title: string;
  sourceLabel: string;

  patternReady: boolean;
  phraseReady: boolean;
  hookReady: boolean;
  arrangementReady: boolean;
  energyReady: boolean;

  items: MultiTrackWaveformIntelligenceItem[];
};

export type MultiTrackWaveformIntelligenceWorkspace = {
  title: string;
  description: string;
  readinessLabel: string;

  lanes: MultiTrackWaveformIntelligenceLane[];

  futureCapabilities: string[];
  ownershipRules: string[];
};