import type { MultiTrackCandidateWorkspace } from "./MultiTrackCandidateEngineTypes";

export const multiTrackCandidateWorkspaceSeed: MultiTrackCandidateWorkspace = {
  title: "Candidate Engine",
  summary:
    "Turns recurring riffs, strongest ideas, arrangement evidence, hybrid evidence, and keeper-bank evidence into possible build candidates for a finished song direction.",
  metrics: [
    {
      label: "Candidates",
      value: 4,
      detail: "Possible build paths generated from recurring musical ideas.",
    },
    {
      label: "Elite Builds",
      value: 1,
      detail: "Highest-confidence arrangement candidate.",
    },
    {
      label: "Keeper Ready",
      value: 3,
      detail: "Candidates that include keeper-bank material.",
    },
    {
      label: "Review Needed",
      value: 1,
      detail: "Candidates needing manual listening before promotion.",
    },
  ],
  steps: [
    {
      step: "01",
      title: "Collect evidence",
      status: "ready",
      detail:
        "Pull evidence from recurring riffs, riff frequency, strongest idea, arrangement, hybrid, and keeper-bank systems.",
    },
    {
      step: "02",
      title: "Build candidate maps",
      status: "ready",
      detail:
        "Group the best intro, verse, chorus, bridge, and ending ideas into possible song builds.",
    },
    {
      step: "03",
      title: "Score build paths",
      status: "ready",
      detail:
        "Rank candidates by repeated riff evidence, version coverage, confidence, and arrangement usefulness.",
    },
    {
      step: "04",
      title: "Prepare manual review",
      status: "needs-review",
      detail:
        "Keep final choice human-led because genre feel, emotion, and vocal delivery still matter.",
    },
  ],
  candidates: [
    {
      id: "candidate-build-01",
      title: "Candidate A - Recurring Hook Build",
      tier: "elite",
      readiness: "ready",
      candidateScore: 96,
      buildPurpose:
        "Use the most repeated chorus hook as the center of the song.",
      strongestIdeaLink: "Main Hook Motif",
      keeperBankStatus: "Keeper ready",
      arrangementStatus: "Arrangement ready",
      hybridStatus: "Hybrid optional",
      detail:
        "Best build candidate because the same hook survives across the most versions and remains strong after BPM/key normalization.",
      sections: [
        {
          label: "Intro",
          versionTitle: "14 Days - Suno Version 03",
          source: "arrangement",
          riffOrIdea: "Short intro lift",
          confidenceScore: 84,
          detail: "Useful setup before the recurring hook enters.",
        },
        {
          label: "Verse",
          versionTitle: "14 Days - Suno Version 02",
          source: "recurring-riff",
          riffOrIdea: "Verse Answer Figure",
          confidenceScore: 88,
          detail: "Strong verse response phrase with clean match evidence.",
        },
        {
          label: "Chorus",
          versionTitle: "14 Days - Suno Version 02",
          source: "strongest-idea",
          riffOrIdea: "Main Hook Motif",
          confidenceScore: 98,
          detail: "Clearest statement of the most repeated musical idea.",
        },
        {
          label: "Bridge",
          versionTitle: "14 Days - Dark Version",
          source: "hybrid",
          riffOrIdea: "Bridge Pulse Pattern",
          confidenceScore: 72,
          detail: "Adds contrast while keeping a related rhythmic idea.",
        },
        {
          label: "Ending",
          versionTitle: "14 Days - Rock Version",
          source: "keeper-bank",
          riffOrIdea: "Outro energy lift",
          confidenceScore: 81,
          detail: "Keeps energy up for the final pass.",
        },
      ],
    },
    {
      id: "candidate-build-02",
      title: "Candidate B - Rock Feel Build",
      tier: "strong",
      readiness: "ready",
      candidateScore: 88,
      buildPurpose:
        "Prioritize the faster original feel while still keeping the repeated hook.",
      strongestIdeaLink: "Main Hook Motif",
      keeperBankStatus: "Keeper ready",
      arrangementStatus: "Needs section timing",
      hybridStatus: "Hybrid ready",
      detail:
        "Good if the final song needs more drive and live-band feel than the normalized reference version.",
      sections: [
        {
          label: "Intro",
          versionTitle: "14 Days - Rock Version",
          source: "arrangement",
          riffOrIdea: "Rock pickup intro",
          confidenceScore: 83,
          detail: "Faster opening creates energy immediately.",
        },
        {
          label: "Verse",
          versionTitle: "14 Days - Rock Version",
          source: "keeper-bank",
          riffOrIdea: "Driving verse rhythm",
          confidenceScore: 86,
          detail: "Works better for rock feel than the normalized version.",
        },
        {
          label: "Chorus",
          versionTitle: "14 Days - Rock Version",
          source: "recurring-riff",
          riffOrIdea: "Main Hook Motif",
          confidenceScore: 92,
          detail:
            "Same hook survives, but the faster BPM changes the emotional push.",
        },
        {
          label: "Bridge",
          versionTitle: "14 Days - Suno Version 03",
          source: "hybrid",
          riffOrIdea: "Lift bridge",
          confidenceScore: 76,
          detail: "Potential hybrid bridge candidate.",
        },
        {
          label: "Ending",
          versionTitle: "14 Days - Rock Version",
          source: "arrangement",
          riffOrIdea: "Final chorus extension",
          confidenceScore: 85,
          detail: "Best ending if the rock version becomes the base.",
        },
      ],
    },
    {
      id: "candidate-build-03",
      title: "Candidate C - Dark Emotion Build",
      tier: "supporting",
      readiness: "needs-review",
      candidateScore: 74,
      buildPurpose:
        "Preserve darker emotional weight while borrowing the repeated hook shape.",
      strongestIdeaLink: "Main Hook Motif",
      keeperBankStatus: "Review",
      arrangementStatus: "Review",
      hybridStatus: "Hybrid possible",
      detail:
        "Interesting emotional direction, but larger BPM/key shifts require manual listening before promotion.",
      sections: [
        {
          label: "Intro",
          versionTitle: "14 Days - Dark Version",
          source: "manual",
          riffOrIdea: "Dark intro bed",
          confidenceScore: 70,
          detail: "Sets mood but needs listening confirmation.",
        },
        {
          label: "Verse",
          versionTitle: "14 Days - Dark Version",
          source: "hybrid",
          riffOrIdea: "Low verse contour",
          confidenceScore: 73,
          detail: "Could work if the final song leans heavier.",
        },
        {
          label: "Chorus",
          versionTitle: "14 Days - Suno Version 02",
          source: "strongest-idea",
          riffOrIdea: "Main Hook Motif",
          confidenceScore: 91,
          detail:
            "Borrow the strongest hook but test whether it keeps the darker feel.",
        },
        {
          label: "Bridge",
          versionTitle: "14 Days - Dark Version",
          source: "recurring-riff",
          riffOrIdea: "Bridge Pulse Pattern",
          confidenceScore: 68,
          detail: "Related rhythmic bridge idea needs manual review.",
        },
        {
          label: "Ending",
          versionTitle: "14 Days - Dark Version",
          source: "manual",
          riffOrIdea: "Low ending resolve",
          confidenceScore: 69,
          detail: "May fit emotionally even if score is lower.",
        },
      ],
    },
    {
      id: "candidate-build-04",
      title: "Candidate D - Experimental Hybrid Build",
      tier: "experimental",
      readiness: "future",
      candidateScore: 61,
      buildPurpose:
        "Explore a more aggressive hybrid assembled from multiple surviving ideas.",
      strongestIdeaLink: "Secondary motifs",
      keeperBankStatus: "Not ready",
      arrangementStatus: "Future",
      hybridStatus: "Future",
      detail:
        "Not a primary build yet, but useful as a future hybrid experiment once more evidence exists.",
      sections: [
        {
          label: "Intro",
          versionTitle: "14 Days - Phone Melody",
          source: "manual",
          riffOrIdea: "Ad-lib source fragment",
          confidenceScore: 55,
          detail: "May contain the seed idea but needs manual confirmation.",
        },
        {
          label: "Verse",
          versionTitle: "14 Days - Suno Version 01",
          source: "riff-frequency",
          riffOrIdea: "Loose verse motif",
          confidenceScore: 60,
          detail: "Possible supporting idea.",
        },
        {
          label: "Chorus",
          versionTitle: "14 Days - Suno Version 03",
          source: "hybrid",
          riffOrIdea: "Alternate chorus contour",
          confidenceScore: 66,
          detail: "Different chorus path for later experimenting.",
        },
        {
          label: "Bridge",
          versionTitle: "14 Days - Dark Version",
          source: "arrangement",
          riffOrIdea: "Dark bridge pulse",
          confidenceScore: 62,
          detail: "Could be reused in a hybrid-only build.",
        },
        {
          label: "Ending",
          versionTitle: "14 Days - Suno Version 03",
          source: "riff-frequency",
          riffOrIdea: "Outro Turnaround",
          confidenceScore: 63,
          detail: "Weak but possibly useful as an alternate ending.",
        },
      ],
    },
  ],
};