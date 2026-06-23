// app/tools/track-matcher/multi-track/wave-form/MultiTrackBuildDecisionEngineSeed.ts

import type { MultiTrackBuildDecisionWorkspace } from "./MultiTrackBuildDecisionEngineTypes";

export const multiTrackBuildDecisionWorkspaceSeed: MultiTrackBuildDecisionWorkspace =
  {
    title: "Build Decision Engine",

    summary:
      "Final decision layer that evaluates strongest ideas, recurring riffs, survivor sections, arrangement evidence, hybrid evidence, keeper-bank support, and ranking results to determine which build should advance toward render preparation.",

    metrics: [
      {
        label: "Candidates Evaluated",
        value: 4,
        detail: "Final build candidates reviewed.",
      },
      {
        label: "Promotions",
        value: 1,
        detail: "Candidates approved for next stage.",
      },
      {
        label: "Review Queue",
        value: 2,
        detail: "Candidates requiring listening review.",
      },
      {
        label: "Average Confidence",
        value: 89,
        detail: "Average decision confidence.",
      },
    ],

    steps: [
      {
        step: "01",
        title: "Load survivor results",
        status: "ready",
        detail:
          "Import strongest surviving sections from survivor analysis.",
      },
      {
        step: "02",
        title: "Evaluate evidence",
        status: "ready",
        detail:
          "Review strongest ideas, recurring riffs, frequency evidence, keeper support, arrangement support, and hybrid support.",
      },
      {
        step: "03",
        title: "Select promotion candidates",
        status: "ready",
        detail:
          "Promote highest-confidence builds for render preparation.",
      },
      {
        step: "04",
        title: "Human validation",
        status: "needs-review",
        detail:
          "Final listening pass remains human-controlled.",
      },
    ],

    decisions: [
      {
        id: "decision-a",
        title: "Candidate A - Recurring Hook Build",
        outcome: "promote",
        readiness: "ready",
        finalScore: 97,
        strongestIdea: "Main Hook Motif",
        recurringRiffSupport: 98,
        frequencySupport: 95,
        arrangementSupport: 94,
        hybridSupport: 82,
        keeperSupport: 99,
        survivorSupport: 99,
        confidence: 98,
        detail:
          "Highest confidence candidate with strongest recurring hook evidence and strongest survivor support.",

        evidence: [
          {
            label: "Strongest Idea",
            value: "Main Hook Motif",
            confidence: 99,
            detail: "Highest scoring idea across versions.",
          },
          {
            label: "Keeper Bank",
            value: "Promoted",
            confidence: 99,
            detail: "Strong keeper-bank support.",
          },
          {
            label: "Survivor Analysis",
            value: "Winner",
            confidence: 99,
            detail: "Survived all comparison stages.",
          },
        ],
      },

      {
        id: "decision-b",
        title: "Candidate B - Rock Feel Build",
        outcome: "review",
        readiness: "needs-review",
        finalScore: 88,
        strongestIdea: "Main Hook Motif",
        recurringRiffSupport: 91,
        frequencySupport: 86,
        arrangementSupport: 90,
        hybridSupport: 80,
        keeperSupport: 89,
        survivorSupport: 86,
        confidence: 89,
        detail:
          "Strong alternative build requiring additional listening review.",

        evidence: [
          {
            label: "Arrangement",
            value: "Strong",
            confidence: 90,
            detail: "Excellent arrangement energy.",
          },
          {
            label: "Keeper Bank",
            value: "Supported",
            confidence: 88,
            detail: "Supported by keeper routing.",
          },
        ],
      },

      {
        id: "decision-c",
        title: "Candidate C - Dark Emotion Build",
        outcome: "hold",
        readiness: "needs-review",
        finalScore: 75,
        strongestIdea: "Main Hook Motif",
        recurringRiffSupport: 72,
        frequencySupport: 70,
        arrangementSupport: 71,
        hybridSupport: 77,
        keeperSupport: 68,
        survivorSupport: 73,
        confidence: 74,
        detail:
          "Interesting emotional direction but currently weaker evidence.",
        evidence: [
          {
            label: "Hybrid Potential",
            value: "Possible",
            confidence: 77,
            detail: "Future hybrid candidate.",
          },
        ],
      },
    ],
  };