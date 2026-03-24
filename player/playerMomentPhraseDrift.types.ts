import type { MomentSimilarityComparable } from "./playerMomentSimilarityTypes";
import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";

export type PhraseDriftLabel =
  | "stable"
  | "early"
  | "late"
  | "stretched"
  | "compressed"
  | "mixed";

export type PhraseDriftSeverity = "none" | "low" | "medium" | "high";

export type PhraseDriftMemberResult = {
  familyId: string;
  anchorMomentId: string;
  momentId: string;
  memberIndex: number;
  expectedStartTime: number | null;
  actualStartTime: number | null;
  timingOffset: number | null;
  durationDrift: number | null;
  driftLabel: PhraseDriftLabel;
  driftSeverity: PhraseDriftSeverity;
  confidenceScore: number;
};

export type PhraseDriftFamilyResult = {
  familyId: string;
  anchorMomentId: string;
  repeatIntervalHint: number | null;
  comparedMemberCount: number;
  stableCount: number;
  unstableCount: number;
  averageAbsoluteTimingOffset: number | null;
  averageAbsoluteDurationDrift: number | null;
  dominantDriftLabel: PhraseDriftLabel;
  highestSeverity: PhraseDriftSeverity;
  members: PhraseDriftMemberResult[];
};

export type PhraseDriftEngineInput = {
  moments: MomentSimilarityComparable[];
  families: MomentFamilyEngineFamily[];
  earlyLateTolerance?: number;
  durationTolerance?: number;
  mediumTimingThreshold?: number;
  highTimingThreshold?: number;
  mediumDurationThreshold?: number;
  highDurationThreshold?: number;
};

export type PhraseDriftEngineResult = {
  families: PhraseDriftFamilyResult[];
  byFamilyId: Record<string, PhraseDriftFamilyResult>;
  byMomentId: Record<string, PhraseDriftMemberResult>;
};
