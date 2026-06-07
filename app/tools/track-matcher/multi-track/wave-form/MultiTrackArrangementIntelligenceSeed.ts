import type {
  MultiTrackArrangementChecklistItem,
  MultiTrackArrangementFlow,
  MultiTrackArrangementPattern,
  MultiTrackArrangementSection,
  MultiTrackArrangementWorkspaceState,
} from "./MultiTrackArrangementIntelligenceTypes";

export const multiTrackArrangementSections: MultiTrackArrangementSection[] = [
  {
    id: "arrangement-intro",
    label: "Intro",
    sectionType: "intro",
    startLabel: "0:00",
    endLabel: "0:12",
    durationLabel: "12 sec",
    energyLevel: "low",
    role: "setup",
    evidenceSource: "manual-marker",
    readinessStatus: "ready",
    confidenceLabel: "Seeded arrangement marker",
    notes: "Opening setup area for future waveform and cue alignment.",
    risks: ["needs-human-review"],
  },
  {
    id: "arrangement-verse-a",
    label: "Verse A",
    sectionType: "verse",
    startLabel: "0:12",
    endLabel: "0:42",
    durationLabel: "30 sec",
    energyLevel: "medium",
    role: "story",
    evidenceSource: "cue",
    readinessStatus: "ready",
    confidenceLabel: "Cue-supported placeholder",
    notes: "First story section where lyric and melody identity can be reviewed.",
    risks: ["weak-confidence"],
  },
  {
    id: "arrangement-pre-chorus",
    label: "Pre-Chorus",
    sectionType: "pre-chorus",
    startLabel: "0:42",
    endLabel: "0:58",
    durationLabel: "16 sec",
    energyLevel: "high",
    role: "lift",
    evidenceSource: "detection",
    readinessStatus: "needs-review",
    confidenceLabel: "Needs section confirmation",
    notes: "Lift area before chorus; later analyzers can confirm tension build.",
    risks: ["missing-section-boundary", "needs-human-review"],
  },
  {
    id: "arrangement-chorus-a",
    label: "Chorus A",
    sectionType: "chorus",
    startLabel: "0:58",
    endLabel: "1:24",
    durationLabel: "26 sec",
    energyLevel: "peak",
    role: "release",
    evidenceSource: "waveform",
    readinessStatus: "ready",
    confidenceLabel: "Waveform-supported placeholder",
    notes: "Primary hook release area for future common-ground comparison.",
    risks: ["weak-confidence"],
  },
  {
    id: "arrangement-bridge",
    label: "Bridge",
    sectionType: "bridge",
    startLabel: "1:52",
    endLabel: "2:18",
    durationLabel: "26 sec",
    energyLevel: "medium",
    role: "contrast",
    evidenceSource: "comparison",
    readinessStatus: "needs-review",
    confidenceLabel: "Comparison-ready placeholder",
    notes: "Contrast section for future lineage and arrangement difference review.",
    risks: ["unclear-role", "needs-human-review"],
  },
  {
    id: "arrangement-breakdown",
    label: "Breakdown",
    sectionType: "breakdown",
    startLabel: "2:18",
    endLabel: "2:34",
    durationLabel: "16 sec",
    energyLevel: "low",
    role: "reset",
    evidenceSource: "transient",
    readinessStatus: "needs-review",
    confidenceLabel: "Transient review needed",
    notes: "Drop/reset area for future hybrid-builder transition ideas.",
    risks: ["missing-section-boundary"],
  },
  {
    id: "arrangement-final-chorus",
    label: "Final Chorus",
    sectionType: "chorus",
    startLabel: "2:34",
    endLabel: "3:04",
    durationLabel: "30 sec",
    energyLevel: "peak",
    role: "release",
    evidenceSource: "confidence",
    readinessStatus: "ready",
    confidenceLabel: "Confidence-gated placeholder",
    notes: "Final high-energy chorus used for future arrangement strength review.",
    risks: ["weak-confidence"],
  },
  {
    id: "arrangement-outro",
    label: "Outro",
    sectionType: "outro",
    startLabel: "3:04",
    endLabel: "3:18",
    durationLabel: "14 sec",
    energyLevel: "low",
    role: "ending",
    evidenceSource: "manual-marker",
    readinessStatus: "ready",
    confidenceLabel: "Seeded ending marker",
    notes: "Ending section for future fade, stop, and final cue detection.",
    risks: ["needs-human-review"],
  },
];

export const multiTrackArrangementFlows: MultiTrackArrangementFlow[] = [
  {
    id: "flow-classic-song",
    title: "Classic Song Flow",
    description:
      "Intro, verse, pre-chorus, chorus, bridge, final chorus, and outro.",
    sectionIds: [
      "arrangement-intro",
      "arrangement-verse-a",
      "arrangement-pre-chorus",
      "arrangement-chorus-a",
      "arrangement-bridge",
      "arrangement-final-chorus",
      "arrangement-outro",
    ],
    readinessStatus: "ready",
    reviewNote:
      "Safe read-only structure for checking whether a track follows a common song form.",
  },
  {
    id: "flow-hybrid-builder",
    title: "Hybrid Builder Flow",
    description:
      "Sections most useful for combining two songs into a future third arrangement.",
    sectionIds: [
      "arrangement-intro",
      "arrangement-chorus-a",
      "arrangement-breakdown",
      "arrangement-final-chorus",
      "arrangement-outro",
    ],
    readinessStatus: "needs-review",
    reviewNote:
      "Needs human review before any hybrid generation because section boundaries are placeholders.",
  },
  {
    id: "flow-future-ai",
    title: "Future AI Arrangement Flow",
    description:
      "Reserved lane for future analyzer-confirmed arrangement maps.",
    sectionIds: [],
    readinessStatus: "future",
    reviewNote:
      "Blocked from automation until future analyzers produce verified section evidence.",
  },
];

export const multiTrackArrangementPatterns: MultiTrackArrangementPattern[] = [
  {
    id: "pattern-verse-chorus",
    title: "Verse / Chorus Pattern",
    description:
      "Basic section relationship for tracking story release and hook return.",
    sectionTypes: ["verse", "chorus"],
    readinessStatus: "ready",
    useCase: "Good for comparing original ad-lib structure against Suno output.",
  },
  {
    id: "pattern-lift-release",
    title: "Lift / Release Pattern",
    description:
      "Pre-chorus lift into chorus release for energy and tension review.",
    sectionTypes: ["pre-chorus", "chorus"],
    readinessStatus: "needs-review",
    useCase: "Useful for checking whether a generated song kept the emotional build.",
  },
  {
    id: "pattern-contrast-reset",
    title: "Contrast / Reset Pattern",
    description:
      "Bridge or breakdown sections that change feel before returning to the hook.",
    sectionTypes: ["bridge", "breakdown", "chorus"],
    readinessStatus: "needs-review",
    useCase: "Useful for future remix, hybrid, and third-song arrangement ideas.",
  },
  {
    id: "pattern-future-map",
    title: "Future Analyzer Map",
    description:
      "Reserved pattern for machine-confirmed section boundaries and roles.",
    sectionTypes: ["future"],
    readinessStatus: "future",
    useCase: "Future AI analyzer output target.",
  },
];

export const multiTrackArrangementChecklist: MultiTrackArrangementChecklistItem[] = [
  {
    id: "check-family-name",
    label: "Arrangement family names match",
    status: "ready",
    detail:
      "Types, seed, helpers, and panel all use MultiTrackArrangementIntelligence naming.",
  },
  {
    id: "check-read-only",
    label: "Read-only workstation",
    status: "ready",
    detail:
      "This branch does not mutate audio, write files, or change existing confidence branches.",
  },
  {
    id: "check-confidence-gated",
    label: "Confidence gated",
    status: "ready",
    detail:
      "Arrangement notes are labeled as placeholders unless backed by stronger future evidence.",
  },
  {
    id: "check-future-ai",
    label: "Future AI isolated",
    status: "future",
    detail:
      "Future analyzer arrangement maps are reserved and not treated as active evidence.",
  },
];

export const multiTrackArrangementIntelligenceWorkspaceState: MultiTrackArrangementWorkspaceState =
  {
    title: "Arrangement Intelligence",
    description:
      "Read-only workstation branch for mapping intro, verse, pre-chorus, chorus, bridge, breakdown, and outro structure before future AI arrangement analysis.",
    status: "ready",
    sections: multiTrackArrangementSections,
    flows: multiTrackArrangementFlows,
    patterns: multiTrackArrangementPatterns,
    checklist: multiTrackArrangementChecklist,
  };