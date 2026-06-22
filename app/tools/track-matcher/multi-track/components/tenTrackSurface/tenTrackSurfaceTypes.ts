export type TrackVerdict = "undecided" | "keeper" | "reject" | "review";

export type TrackSourceType =
  | "empty"
  | "library"
  | "upload"
  | "track-a"
  | "track-b"
  | "suno"
  | "stem"
  | "manual";

export type TrackColorLabel =
  | "white"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "purple"
  | "red"
  | "pink";

export type TenTrackSlot = {
  id: string;
  slotNumber: number;
  selected: boolean;
  title: string;
  versionName: string;
  audioFileName: string;
  source: string;
  sourceType: TrackSourceType;
  bpm: string;
  musicalKey: string;
  volume: number;
  muted: boolean;
  soloed: boolean;
  verdict: TrackVerdict;
  rank: number;
  confidenceScore: number;
  mutationScore: number;
  arrangementScore: number;
  survivabilityScore: number;
  colorLabel: TrackColorLabel;
  keeperBankStatus: string;
  strongestIdeaStatus: string;
  notes: string;
};
