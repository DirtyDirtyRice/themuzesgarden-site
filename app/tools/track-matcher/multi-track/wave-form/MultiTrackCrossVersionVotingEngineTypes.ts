// app/tools/track-matcher/multi-track/wave-form/MultiTrackCrossVersionVotingEngineTypes.ts

export type MultiTrackCrossVersionVotingReadiness =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackCrossVersionVotingSourceKind =
  | "version-alignment"
  | "phrase-match"
  | "similarity"
  | "mutation"
  | "survivor"
  | "keeper"
  | "manual"
  | "seed";

export type MultiTrackCrossVersionVotingVoteKind =
  | "keep"
  | "promote"
  | "compare"
  | "review"
  | "hold"
  | "reject";

export type MultiTrackCrossVersionVotingStrength =
  | "elite"
  | "strong"
  | "medium"
  | "weak"
  | "missing";

export type MultiTrackCrossVersionVotingRisk =
  | "missing-audio"
  | "weak-match"
  | "conflicting-votes"
  | "low-confidence"
  | "needs-human-review"
  | "seed-placeholder";

export type MultiTrackCrossVersionVote = {
  id: string;
  versionId: string;
  versionLabel: string;
  sourceKind: MultiTrackCrossVersionVotingSourceKind;
  voteKind: MultiTrackCrossVersionVotingVoteKind;
  strength: MultiTrackCrossVersionVotingStrength;
  confidence: number;
  weight: number;
  detail: string;
};

export type MultiTrackCrossVersionVotingCandidate = {
  id: string;
  title: string;
  sectionLabel: string;
  startBar: number;
  endBar: number;
  readiness: MultiTrackCrossVersionVotingReadiness;
  voteKind: MultiTrackCrossVersionVotingVoteKind;
  votes: MultiTrackCrossVersionVote[];
  risks: MultiTrackCrossVersionVotingRisk[];
  notes: string[];
};

export type MultiTrackCrossVersionVotingWorkspaceState = {
  id: string;
  title: string;
  description: string;
  readiness: MultiTrackCrossVersionVotingReadiness;
  candidates: MultiTrackCrossVersionVotingCandidate[];
  nextActions: string[];
};