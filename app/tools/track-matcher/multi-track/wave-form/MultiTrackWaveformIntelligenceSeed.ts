import type { MultiTrackWaveformIntelligenceWorkspace } from "./MultiTrackWaveformIntelligenceTypes";

export const multiTrackWaveformIntelligenceSeed: MultiTrackWaveformIntelligenceWorkspace =
  {
    title: "Waveform Intelligence Workspace",

    description:
      "Umbrella intelligence layer above waveform statistics, transients, cues, markers, detection, stems, DSP, comparison, and future AI readiness systems.",

    readinessLabel:
      "Workspace ready / intelligence systems not connected yet",

    lanes: [
      {
        laneId: "track-a",
        title: "Track A Intelligence Lane",
        sourceLabel: "Track A intelligence planning",

        patternReady: false,
        phraseReady: false,
        hookReady: false,
        arrangementReady: false,
        energyReady: false,

        items: [
          {
            intelligenceId: "track-a-pattern",
            label: "Pattern Detection",
            category: "pattern",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future recurring rhythm and motif detection.",
          },
          {
            intelligenceId: "track-a-phrase",
            label: "Phrase Detection",
            category: "phrase",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future phrase and section boundary recognition.",
          },
          {
            intelligenceId: "track-a-hook",
            label: "Hook Detection",
            category: "hook",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future hook and memorable segment detection.",
          },
          {
            intelligenceId: "track-a-arrangement",
            label: "Arrangement Detection",
            category: "arrangement",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future song structure and arrangement analysis.",
          },
          {
            intelligenceId: "track-a-energy",
            label: "Energy Mapping",
            category: "energy",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future energy and intensity mapping.",
          },
          {
            intelligenceId: "track-a-comparison",
            label: "Comparison Readiness",
            category: "comparison",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future comparison intelligence preparation.",
          },
          {
            intelligenceId: "track-a-ai",
            label: "AI Readiness",
            category: "ai",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future AI-assisted interpretation readiness.",
          },
        ],
      },

      {
        laneId: "track-b",
        title: "Track B Intelligence Lane",
        sourceLabel: "Track B intelligence planning",

        patternReady: false,
        phraseReady: false,
        hookReady: false,
        arrangementReady: false,
        energyReady: false,

        items: [
          {
            intelligenceId: "track-b-pattern",
            label: "Pattern Detection",
            category: "pattern",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future recurring rhythm and motif detection.",
          },
          {
            intelligenceId: "track-b-phrase",
            label: "Phrase Detection",
            category: "phrase",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future phrase and section boundary recognition.",
          },
          {
            intelligenceId: "track-b-hook",
            label: "Hook Detection",
            category: "hook",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future hook and memorable segment detection.",
          },
          {
            intelligenceId: "track-b-arrangement",
            label: "Arrangement Detection",
            category: "arrangement",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future song structure and arrangement analysis.",
          },
          {
            intelligenceId: "track-b-energy",
            label: "Energy Mapping",
            category: "energy",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future energy and intensity mapping.",
          },
          {
            intelligenceId: "track-b-comparison",
            label: "Comparison Readiness",
            category: "comparison",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future comparison intelligence preparation.",
          },
          {
            intelligenceId: "track-b-ai",
            label: "AI Readiness",
            category: "ai",
            status: "future",
            readinessLabel: "Future",
            detail:
              "Future AI-assisted interpretation readiness.",
          },
        ],
      },
    ],

    futureCapabilities: [
      "Pattern Recognition",
      "Phrase Recognition",
      "Hook Detection",
      "Arrangement Intelligence",
      "Energy Mapping",
      "Training Readiness",
      "AI Readiness",
      "Hybrid Readiness",
      "Comparison Intelligence",
      "Confidence Systems",
    ],

    ownershipRules: [
      "Read-only workspace.",
      "No DSP ownership.",
      "No waveform rendering ownership.",
      "No engine mutation.",
      "No duplicate runtime state.",
      "Derived data only.",
    ],
  };