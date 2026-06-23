// app/tools/track-matcher/multi-track/wave-form/MultiTrackCandidateRankingEngineSeed.ts

import type { MultiTrackCandidateRankingWorkspace } from "./MultiTrackCandidateRankingEngineTypes";

export const multiTrackCandidateRankingWorkspaceSeed: MultiTrackCandidateRankingWorkspace =
  {
    title: "Candidate Ranking Engine",
    summary:
      "Ranks all generated song candidates using strongest idea evidence, recurring riff evidence, keeper-bank support, arrangement confidence, and hybrid validation.",

    metrics: [
      {
        label: "Candidates",
        value: 4,
        detail: "Candidates available for ranking.",
      },
      {
        label: "Promotion Ready",
        value: 2,
        detail: "Candidates ready for comparison stage.",
      },
      {
        label: "Elite",
        value: 1,
        detail: "Highest ranking tier.",
      },
      {
        label: "Average Score",
        value: 80,
        detail: "Average ranking score.",
      },
    ],

    steps: [
      {
        step: "01",
        title: "Load candidates",
        status: "ready",
        detail: "Import candidate engine output.",
      },
      {
        step: "02",
        title: "Score evidence",
        status: "ready",
        detail:
          "Score strongest idea, recurring riff, arrangement, and keeper evidence.",
      },
      {
        step: "03",
        title: "Assign rankings",
        status: "ready",
        detail: "Generate strongest-to-weakest ordering.",
      },
      {
        step: "04",
        title: "Prepare comparison stage",
        status: "needs-review",
        detail:
          "Human listening still determines final musical preference.",
      },
    ],

    rankings: [
      {
        id: "candidate-a",
        title: "Candidate A - Recurring Hook Build",
        rank: 1,
        score: 96,
        tier: "elite",
        readiness: "ready",
        strongestIdea: "Main Hook Motif",
        evidenceSources: 6,
        confidence: 98,
        promotionReady: true,
        detail:
          "Highest confidence build with strongest recurring hook support.",
      },
      {
        id: "candidate-b",
        title: "Candidate B - Rock Feel Build",
        rank: 2,
        score: 88,
        tier: "strong",
        readiness: "ready",
        strongestIdea: "Main Hook Motif",
        evidenceSources: 5,
        confidence: 91,
        promotionReady: true,
        detail:
          "Strong alternate build emphasizing energy and drive.",
      },
      {
        id: "candidate-c",
        title: "Candidate C - Dark Emotion Build",
        rank: 3,
        score: 74,
        tier: "supporting",
        readiness: "needs-review",
        strongestIdea: "Main Hook Motif",
        evidenceSources: 4,
        confidence: 73,
        promotionReady: false,
        detail:
          "Interesting emotional direction requiring manual review.",
      },
      {
        id: "candidate-d",
        title: "Candidate D - Experimental Hybrid",
        rank: 4,
        score: 61,
        tier: "experimental",
        readiness: "future",
        strongestIdea: "Secondary Motifs",
        evidenceSources: 2,
        confidence: 60,
        promotionReady: false,
        detail:
          "Future experiment not ready for promotion yet.",
      },
    ],
  };