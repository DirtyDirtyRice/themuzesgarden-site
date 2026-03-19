export type SimilarityMatchKind =
  | "exact"
  | "near"
  | "loose"
  | "different";

export type RepeatIntervalUnit = "bars" | "beats" | "seconds";

export type RepeatRule = {
  every: number;
  unit: RepeatIntervalUnit;
  startAt: number;
  endAt?: number | null;
  maxDifferencePercent?: number;
};

export type MomentSimilarityComparable = {
  trackId: string;
  sectionId: string;
  startTime: number;
  endTime?: number | null;
  label: string;
  tags?: string[];
  description?: string | null;
};

export type MomentSimilarityBreakdown = {
  labelScore: number;
  tagScore: number;
  durationScore: number;
  timingScore: number;
  textScore: number;
};

export type MomentSimilarityResult = {
  reference: MomentSimilarityComparable;
  candidate: MomentSimilarityComparable;
  similarityScore: number;
  differencePercent: number;
  matchKind: SimilarityMatchKind;
  breakdown: MomentSimilarityBreakdown;
};

export type MomentFamilyMember = {
  moment: MomentSimilarityComparable;
  similarityScoreToReference: number;
  differencePercentToReference: number;
  matchKind: SimilarityMatchKind;
};

export type MomentFamily = {
  familyId: string;
  reference: MomentSimilarityComparable;
  members: MomentFamilyMember[];
  averageSimilarityScore: number;
  averageDifferencePercent: number;
  repeatRule?: RepeatRule | null;
};

export type ExpectedRepeatPlacement = {
  familyId: string;
  expectedAt: number;
  nearestActualStart: number | null;
  matchedSectionId: string | null;
  differenceSeconds: number | null;
  status: "matched" | "near" | "missing";
};

export type RepeatPlan = {
  familyId: string;
  rule: RepeatRule;
  placements: ExpectedRepeatPlacement[];
};