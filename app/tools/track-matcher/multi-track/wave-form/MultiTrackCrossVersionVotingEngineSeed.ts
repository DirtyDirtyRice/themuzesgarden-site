// app/tools/track-matcher/multi-track/wave-form/MultiTrackCrossVersionVotingEngineSeed.ts

import type {
  MultiTrackCrossVersionVotingCandidate,
  MultiTrackCrossVersionVotingWorkspaceState,
} from "./MultiTrackCrossVersionVotingEngineTypes";

export const multiTrackCrossVersionVotingCandidates: MultiTrackCrossVersionVotingCandidate[] = [
  {
    id: "cross-version-main-hook",
    title: "Main Hook Vote Cluster",
    sectionLabel: "Hook",
    startBar: 25,
    endBar: 40,
    readiness: "ready",
    voteKind: "promote",
    votes: [
      {
        id: "vote-main-hook-version-01",
        versionId: "version-01",
        versionLabel: "Suno Version 01",
        sourceKind: "version-alignment",
        voteKind: "keep",
        strength: "strong",
        confidence: 91,
        weight: 1,
        detail: "Hook phrase survives clearly in the aligned version.",
      },
      {
        id: "vote-main-hook-version-04",
        versionId: "version-04",
        versionLabel: "Suno Version 04",
        sourceKind: "phrase-match",
        voteKind: "promote",
        strength: "elite",
        confidence: 96,
        weight: 1.2,
        detail: "Best matching phrase energy across compared versions.",
      },
      {
        id: "vote-main-hook-version-07",
        versionId: "version-07",
        versionLabel: "Suno Version 07",
        sourceKind: "survivor",
        voteKind: "promote",
        strength: "elite",
        confidence: 94,
        weight: 1.15,
        detail: "Survivor engine keeps this as a top hook candidate.",
      },
    ],
    risks: ["seed-placeholder"],
    notes: [
      "This is the current voting favorite.",
      "Later this should receive real version votes from 10+ Suno versions.",
    ],
  },
  {
    id: "cross-version-verse-pocket",
    title: "Verse Groove Vote Cluster",
    sectionLabel: "Verse",
    startBar: 9,
    endBar: 24,
    readiness: "needs-review",
    voteKind: "review",
    votes: [
      {
        id: "vote-verse-pocket-version-02",
        versionId: "version-02",
        versionLabel: "Suno Version 02",
        sourceKind: "similarity",
        voteKind: "compare",
        strength: "medium",
        confidence: 78,
        weight: 0.82,
        detail: "Verse groove appears related but needs human listening review.",
      },
      {
        id: "vote-verse-pocket-version-05",
        versionId: "version-05",
        versionLabel: "Suno Version 05",
        sourceKind: "mutation",
        voteKind: "review",
        strength: "medium",
        confidence: 74,
        weight: 0.75,
        detail: "Mutation may be useful, but it is not locked yet.",
      },
    ],
    risks: ["needs-human-review", "low-confidence", "seed-placeholder"],
    notes: [
      "Do not promote over the hook yet.",
      "Review if this supports the hook or distracts from it.",
    ],
  },
  {
    id: "cross-version-bridge-lift",
    title: "Bridge Lift Vote Cluster",
    sectionLabel: "Bridge",
    startBar: 41,
    endBar: 56,
    readiness: "future",
    voteKind: "hold",
    votes: [
      {
        id: "vote-bridge-lift-version-03",
        versionId: "version-03",
        versionLabel: "Suno Version 03",
        sourceKind: "manual",
        voteKind: "hold",
        strength: "weak",
        confidence: 62,
        weight: 0.55,
        detail: "Bridge lift is interesting but not ready for promotion.",
      },
    ],
    risks: ["weak-match", "needs-human-review", "seed-placeholder"],
    notes: [
      "Hold for later.",
      "May become useful after arrangement scoring exists.",
    ],
  },
];

export const multiTrackCrossVersionVotingWorkspaceState: MultiTrackCrossVersionVotingWorkspaceState = {
  id: "multi-track-cross-version-voting-engine-workspace",
  title: "Cross Version Voting Engine",
  description:
    "Compares votes across multiple Suno versions to decide which musical ideas should move forward into survivor, keeper, arrangement, and strongest idea work.",
  readiness: "ready",
  candidates: multiTrackCrossVersionVotingCandidates,
  nextActions: [
    "Preserve this as a standalone engine.",
    "Do not wire into the controller yet.",
    "Later connect real version alignment, phrase matching, similarity, mutation, survivor, and keeper signals.",
    "Use voting results to help choose the strongest idea across 10+ versions.",
  ],
};