import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";

type ComparableMoment = {
  id?: string;
  sectionId?: string;
  startTime?: number | null;
  start?: number | null;
  endTime?: number | null;
  end?: number | null;
  duration?: number | null;
  label?: string;
  description?: string;
  tags?: string[];
  trackId?: string;
  [key: string]: any;
};

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
  moments: ComparableMoment[];
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
