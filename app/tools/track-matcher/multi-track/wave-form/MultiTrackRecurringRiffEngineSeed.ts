import type { MultiTrackRecurringRiffWorkspace } from "./MultiTrackRecurringRiffEngineTypes";

export const multiTrackRecurringRiffWorkspaceSeed: MultiTrackRecurringRiffWorkspace =
  {
    title: "Recurring Riff Engine",
    summary:
      "Finds riffs, hooks, motifs, and phrase shapes that appear across multiple versions of the same song after temporary BPM/key normalization.",
    metrics: [
      {
        label: "Recurring Riffs",
        value: 4,
        detail: "Riff ideas found across more than one version.",
      },
      {
        label: "Dominant Ideas",
        value: 1,
        detail: "Riffs appearing across most normalized versions.",
      },
      {
        label: "Review Needed",
        value: 2,
        detail: "Matches that need ear confirmation.",
      },
      {
        label: "Keeper Candidates",
        value: 3,
        detail: "Recurring riffs ready for keeper-bank review.",
      },
    ],
    steps: [
      {
        step: "01",
        title: "Use normalized comparison copies",
        status: "ready",
        detail:
          "Read temporary analysis BPM/key values from the riff normalization layer.",
      },
      {
        step: "02",
        title: "Search for repeated riff shapes",
        status: "ready",
        detail:
          "Look for matching hooks, melodic contours, rhythmic figures, and repeated phrase shapes.",
      },
      {
        step: "03",
        title: "Count version coverage",
        status: "ready",
        detail:
          "Rank riffs by how many versions contain the same musical idea.",
      },
      {
        step: "04",
        title: "Flag manual review",
        status: "needs-review",
        detail:
          "Large BPM/key shifts or fuzzy matches should be confirmed by listening.",
      },
      {
        step: "05",
        title: "Send repeated ideas forward",
        status: "future",
        detail:
          "Recurring riffs can feed Strongest Idea, Keeper Bank, and arrangement candidate engines.",
      },
    ],
    riffs: [
      {
        id: "recurring-riff-01",
        label: "Main Hook Motif",
        description:
          "Primary hook shape appearing in several normalized versions with small rhythmic changes.",
        usageCount: 5,
        versionCoverage: "5 / 6 versions",
        strength: "dominant",
        readiness: "ready",
        keeperBankStatus: "Keeper candidate",
        strongestIdeaStatus: "Strongest idea candidate",
        uses: [
          {
            versionTitle: "14 Days - Suno Version 01",
            originalBpm: 96,
            originalKey: "G minor",
            normalizedBpm: 120,
            normalizedKey: "A minor",
            section: "Chorus",
            matchType: "tempo-shifted",
            detail:
              "Same hook shape appears after tempo and key normalization.",
          },
          {
            versionTitle: "14 Days - Suno Version 02",
            originalBpm: 120,
            originalKey: "A minor",
            normalizedBpm: 120,
            normalizedKey: "A minor",
            section: "Chorus",
            matchType: "exact-shape",
            detail: "Reference version contains the clearest hook statement.",
          },
          {
            versionTitle: "14 Days - Rock Version",
            originalBpm: 132,
            originalKey: "A minor",
            normalizedBpm: 120,
            normalizedKey: "A minor",
            section: "Chorus",
            matchType: "tempo-shifted",
            detail:
              "Faster original keeps the riff shape but changes the feel.",
          },
        ],
      },
      {
        id: "recurring-riff-02",
        label: "Verse Answer Riff",
        description:
          "Short answer phrase appearing after vocal lines in multiple versions.",
        usageCount: 3,
        versionCoverage: "3 / 6 versions",
        strength: "strong",
        readiness: "ready",
        keeperBankStatus: "Keeper candidate",
        strongestIdeaStatus: "Supporting idea",
        uses: [
          {
            versionTitle: "14 Days - Suno Version 02",
            originalBpm: 120,
            originalKey: "A minor",
            normalizedBpm: 120,
            normalizedKey: "A minor",
            section: "Verse",
            matchType: "exact-shape",
            detail: "Phrase appears as a clear post-vocal response.",
          },
          {
            versionTitle: "14 Days - Suno Version 03",
            originalBpm: 128,
            originalKey: "B minor",
            normalizedBpm: 120,
            normalizedKey: "A minor",
            section: "Verse",
            matchType: "key-shifted",
            detail: "Same melodic contour appears after pitch alignment.",
          },
        ],
      },
      {
        id: "recurring-riff-03",
        label: "Bridge Pulse Figure",
        description:
          "Rhythmic pulse idea that survives across versions even when the melody changes.",
        usageCount: 2,
        versionCoverage: "2 / 6 versions",
        strength: "moderate",
        readiness: "needs-review",
        keeperBankStatus: "Review before keeper",
        strongestIdeaStatus: "Not promoted",
        uses: [
          {
            versionTitle: "14 Days - Dark Version",
            originalBpm: 90,
            originalKey: "F minor",
            normalizedBpm: 120,
            normalizedKey: "A minor",
            section: "Bridge",
            matchType: "rhythm-related",
            detail:
              "Rhythm appears related, but pitch shift is large enough to require listening.",
          },
          {
            versionTitle: "14 Days - Phone Melody",
            originalBpm: 0,
            originalKey: "Unknown",
            normalizedBpm: 120,
            normalizedKey: "A minor",
            section: "Ad-lib",
            matchType: "manual-review",
            detail:
              "Possible original source idea, but manual BPM/key confirmation is needed.",
          },
        ],
      },
      {
        id: "recurring-riff-04",
        label: "Outro Turnaround",
        description:
          "Ending turnaround phrase that appears in a few later versions.",
        usageCount: 2,
        versionCoverage: "2 / 6 versions",
        strength: "weak",
        readiness: "future",
        keeperBankStatus: "Not ready",
        strongestIdeaStatus: "Not promoted",
        uses: [
          {
            versionTitle: "14 Days - Suno Version 03",
            originalBpm: 128,
            originalKey: "B minor",
            normalizedBpm: 120,
            normalizedKey: "A minor",
            section: "Outro",
            matchType: "melody-related",
            detail:
              "Potential repeated ending idea, but needs stronger evidence.",
          },
        ],
      },
    ],
  };