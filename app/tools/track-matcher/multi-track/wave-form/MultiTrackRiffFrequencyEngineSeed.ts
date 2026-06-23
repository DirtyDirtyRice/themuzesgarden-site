import type { MultiTrackRiffFrequencyWorkspace } from "./MultiTrackRiffFrequencyEngineTypes";

export const multiTrackRiffFrequencyWorkspaceSeed: MultiTrackRiffFrequencyWorkspace =
  {
    title: "Riff Frequency Engine",
    summary:
      "Ranks recurring riffs by how often they survive across versions, sections, and normalized comparisons.",
    metrics: [
      {
        label: "Tracked Riffs",
        value: 12,
        detail: "Riffs currently being ranked.",
      },
      {
        label: "Elite Riffs",
        value: 2,
        detail: "Most repeated musical ideas.",
      },
      {
        label: "Keeper Candidates",
        value: 5,
        detail: "Riffs suitable for keeper routing.",
      },
      {
        label: "Strongest Idea Candidates",
        value: 3,
        detail: "Riffs feeding strongest-idea analysis.",
      },
    ],
    steps: [
      {
        step: "01",
        title: "Collect recurring riffs",
        status: "ready",
        detail:
          "Import recurring riff evidence from the recurring riff engine.",
      },
      {
        step: "02",
        title: "Count appearances",
        status: "ready",
        detail:
          "Measure how often each riff survives across versions.",
      },
      {
        step: "03",
        title: "Calculate frequency score",
        status: "ready",
        detail:
          "Combine usage, coverage, and confidence into a ranking score.",
      },
      {
        step: "04",
        title: "Promote top ideas",
        status: "ready",
        detail:
          "Route the highest-ranked riffs toward keeper and strongest-idea analysis.",
      },
    ],
    records: [
      {
        id: "riff-frequency-01",
        label: "Main Hook Motif",
        usageCount: 8,
        versionCoverage: 7,
        sectionCoverage: 5,
        confidenceScore: 96,
        frequencyScore: 98,
        readiness: "ready",
        tier: "elite",
        keeperBankStatus: "Candidate",
        strongestIdeaStatus: "Candidate",
        detail:
          "Most repeated riff across the comparison set.",
      },
      {
        id: "riff-frequency-02",
        label: "Verse Answer Figure",
        usageCount: 5,
        versionCoverage: 4,
        sectionCoverage: 3,
        confidenceScore: 88,
        frequencyScore: 84,
        readiness: "ready",
        tier: "high",
        keeperBankStatus: "Candidate",
        strongestIdeaStatus: "Review",
        detail:
          "Strong recurring response phrase.",
      },
      {
        id: "riff-frequency-03",
        label: "Bridge Pulse Pattern",
        usageCount: 3,
        versionCoverage: 2,
        sectionCoverage: 2,
        confidenceScore: 71,
        frequencyScore: 68,
        readiness: "needs-review",
        tier: "medium",
        keeperBankStatus: "Review",
        strongestIdeaStatus: "Not Promoted",
        detail:
          "Possible survivor riff needing listening review.",
      },
    ],
  };