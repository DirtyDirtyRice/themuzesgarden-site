import type { MultiTrackTrainingIntelligenceWorkspace } from "./MultiTrackTrainingIntelligenceTypes";

export const multiTrackTrainingIntelligenceSeed: MultiTrackTrainingIntelligenceWorkspace =
  {
    title: "Training Intelligence Workspace",

    description:
      "Read-only training intelligence planning layer for future pattern learning, hook recognition, phrase memory, arrangement understanding, energy mapping, comparison intelligence, AI readiness, and hybrid song-building readiness.",

    readinessLabel:
      "Workspace ready / no model training, no AI calls, no persistence connected yet",

    lanes: [
      {
        laneId: "track-a",
        title: "Track A Training Lane",
        sourceLabel: "Track A training readiness planning",

        patternTrainingReady: false,
        hookTrainingReady: false,
        phraseTrainingReady: false,
        arrangementTrainingReady: false,
        energyTrainingReady: false,
        aiTrainingReady: false,
        hybridTrainingReady: false,

        trainingItems: [
          {
            trainingId: "track-a-pattern-training",
            label: "Pattern Training",
            category: "pattern",
            owner: "waveform",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Waveform pattern candidates",
            outputLabel: "Reusable pattern memory",
            detail:
              "Future training can learn repeated rhythmic shapes, melodic motifs, groove cells, and recurring waveform patterns from Track A.",
          },
          {
            trainingId: "track-a-phrase-training",
            label: "Phrase Training",
            category: "phrase",
            owner: "cue",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Cue and section boundaries",
            outputLabel: "Phrase map",
            detail:
              "Future training can learn where musical thoughts begin and end, then compare those phrases against Track B or future generated versions.",
          },
          {
            trainingId: "track-a-hook-training",
            label: "Hook Training",
            category: "hook",
            owner: "detection",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Repeated high-value moments",
            outputLabel: "Hook candidates",
            detail:
              "Future training can identify memorable repeated musical moments and score them as possible hooks.",
          },
          {
            trainingId: "track-a-arrangement-training",
            label: "Arrangement Training",
            category: "arrangement",
            owner: "marker",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Markers, cues, and timeline sections",
            outputLabel: "Arrangement map",
            detail:
              "Future training can understand intro, verse, chorus, bridge, breakdown, drop, and outro order.",
          },
          {
            trainingId: "track-a-energy-training",
            label: "Energy Training",
            category: "energy",
            owner: "statistics",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "RMS, peaks, density, and dynamics",
            outputLabel: "Energy curve",
            detail:
              "Future training can learn where the song grows, drops, opens up, gets dense, or needs lift.",
          },
          {
            trainingId: "track-a-ai-readiness",
            label: "AI Readiness",
            category: "ai",
            owner: "insight",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Clean derived analysis",
            outputLabel: "AI-safe prompt context",
            detail:
              "Future AI readiness can prepare clean musical facts for suggestions without using raw duplicate engine state.",
          },
          {
            trainingId: "track-a-hybrid-readiness",
            label: "Hybrid Readiness",
            category: "hybrid",
            owner: "stem",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Stem, cue, marker, and comparison candidates",
            outputLabel: "Hybrid build plan",
            detail:
              "Future hybrid readiness can help choose usable pieces from Track A for combining with Track B.",
          },
        ],
      },

      {
        laneId: "track-b",
        title: "Track B Training Lane",
        sourceLabel: "Track B training readiness planning",

        patternTrainingReady: false,
        hookTrainingReady: false,
        phraseTrainingReady: false,
        arrangementTrainingReady: false,
        energyTrainingReady: false,
        aiTrainingReady: false,
        hybridTrainingReady: false,

        trainingItems: [
          {
            trainingId: "track-b-pattern-training",
            label: "Pattern Training",
            category: "pattern",
            owner: "waveform",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Waveform pattern candidates",
            outputLabel: "Reusable pattern memory",
            detail:
              "Future training can learn repeated rhythmic shapes, melodic motifs, groove cells, and recurring waveform patterns from Track B.",
          },
          {
            trainingId: "track-b-phrase-training",
            label: "Phrase Training",
            category: "phrase",
            owner: "cue",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Cue and section boundaries",
            outputLabel: "Phrase map",
            detail:
              "Future training can learn where musical thoughts begin and end, then compare those phrases against Track A or future generated versions.",
          },
          {
            trainingId: "track-b-hook-training",
            label: "Hook Training",
            category: "hook",
            owner: "detection",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Repeated high-value moments",
            outputLabel: "Hook candidates",
            detail:
              "Future training can identify memorable repeated musical moments and score them as possible hooks.",
          },
          {
            trainingId: "track-b-arrangement-training",
            label: "Arrangement Training",
            category: "arrangement",
            owner: "marker",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Markers, cues, and timeline sections",
            outputLabel: "Arrangement map",
            detail:
              "Future training can understand intro, verse, chorus, bridge, breakdown, drop, and outro order.",
          },
          {
            trainingId: "track-b-energy-training",
            label: "Energy Training",
            category: "energy",
            owner: "statistics",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "RMS, peaks, density, and dynamics",
            outputLabel: "Energy curve",
            detail:
              "Future training can learn where the song grows, drops, opens up, gets dense, or needs lift.",
          },
          {
            trainingId: "track-b-ai-readiness",
            label: "AI Readiness",
            category: "ai",
            owner: "insight",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Clean derived analysis",
            outputLabel: "AI-safe prompt context",
            detail:
              "Future AI readiness can prepare clean musical facts for suggestions without using raw duplicate engine state.",
          },
          {
            trainingId: "track-b-hybrid-readiness",
            label: "Hybrid Readiness",
            category: "hybrid",
            owner: "stem",
            status: "future",
            readinessLabel: "Future",
            inputLabel: "Stem, cue, marker, and comparison candidates",
            outputLabel: "Hybrid build plan",
            detail:
              "Future hybrid readiness can help choose usable pieces from Track B for combining with Track A.",
          },
        ],
      },
    ],

    trainingRules: [
      "Training Intelligence Workspace is read-only.",
      "No AI model is trained here.",
      "No external AI call is made here.",
      "No Supabase persistence is created here.",
      "No engine state is mutated here.",
      "No Track A or Track B duplicate runtime is created here.",
      "Future training should consume derived facts only.",
      "Future training should keep raw audio ownership separate from intelligence ownership.",
      "Future AI prompt context should be built from verified analysis, not guesses.",
      "Future hybrid decisions should require confidence scores and user confirmation.",
    ],

    futureConnections: [
      "Waveform Intelligence Workspace",
      "Waveform Statistics",
      "Detection Workspace",
      "Cue Workspace",
      "Marker Workspace",
      "Stem Ownership Workspace",
      "DSP Ownership Workspace",
      "Insight V2",
      "Comparison Matrix",
      "Decision Center",
      "Future AI Prompt Builder",
      "Future Hybrid Song Builder",
    ],
  };