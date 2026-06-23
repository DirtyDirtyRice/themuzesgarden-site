// app/tools/track-matcher/multi-track/wave-form/MultiTrackCandidateComparisonEngineSeed.ts

import type { MultiTrackCandidateComparisonWorkspace } from "./MultiTrackCandidateComparisonEngineTypes";

export const multiTrackCandidateComparisonWorkspaceSeed: MultiTrackCandidateComparisonWorkspace =
  {
    title: "Candidate Comparison Engine",

    summary:
      "Compares ranked candidates head-to-head and identifies the strongest build path before section extraction and final decision routing.",

    metrics: [
      {
        label: "Comparisons",
        value: 3,
        detail: "Head-to-head evaluations completed.",
      },
      {
        label: "Winners",
        value: 2,
        detail: "Candidates with clear advantages.",
      },
      {
        label: "Close Calls",
        value: 1,
        detail: "Results needing human review.",
      },
      {
        label: "Average Confidence",
        value: 87,
        detail: "Confidence across all comparisons.",
      },
    ],

    steps: [
      {
        step: "01",
        title: "Load rankings",
        status: "ready",
        detail: "Import ranking engine output.",
      },
      {
        step: "02",
        title: "Compare candidates",
        status: "ready",
        detail: "Run side-by-side evaluations.",
      },
      {
        step: "03",
        title: "Determine winners",
        status: "ready",
        detail: "Identify strongest build paths.",
      },
      {
        step: "04",
        title: "Prepare extraction",
        status: "needs-review",
        detail: "Confirm winner before extraction stage.",
      },
    ],

    comparisons: [
      {
        id: "comparison-01",
        title: "Candidate A vs Candidate B",
        verdict: "winner",
        readiness: "ready",
        winner: "Candidate A",
        confidence: 95,
        detail:
          "Recurring hook evidence and strongest-idea support favor Candidate A.",

        rows: [
          {
            category: "Overall Score",
            candidateA: 96,
            candidateB: 88,
            winner: "Candidate A",
            detail: "Higher aggregate score.",
          },
          {
            category: "Hook Strength",
            candidateA: 98,
            candidateB: 92,
            winner: "Candidate A",
            detail: "Recurring hook survives more versions.",
          },
          {
            category: "Arrangement",
            candidateA: "Ready",
            candidateB: "Review",
            winner: "Candidate A",
            detail: "Cleaner arrangement routing.",
          },
        ],
      },

      {
        id: "comparison-02",
        title: "Candidate B vs Candidate C",
        verdict: "winner",
        readiness: "ready",
        winner: "Candidate B",
        confidence: 89,
        detail:
          "Rock version maintains stronger evidence and keeper support.",

        rows: [
          {
            category: "Overall Score",
            candidateA: 88,
            candidateB: 74,
            winner: "Candidate B",
            detail: "Higher confidence score.",
          },
          {
            category: "Keeper Support",
            candidateA: "Strong",
            candidateB: "Moderate",
            winner: "Candidate B",
            detail: "More keeper-bank support.",
          },
          {
            category: "Promotion",
            candidateA: "Ready",
            candidateB: "Hold",
            winner: "Candidate B",
            detail: "Promotion advantage.",
          },
        ],
      },
    ],
  };