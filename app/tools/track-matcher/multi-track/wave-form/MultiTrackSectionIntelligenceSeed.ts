import type {
  MultiTrackSectionChecklistItem,
  MultiTrackSectionReviewGroup,
  MultiTrackSectionTransition,
  MultiTrackSectionUnit,
  MultiTrackSectionWorkspaceState,
} from "./MultiTrackSectionIntelligenceTypes";

export const multiTrackSectionUnits: MultiTrackSectionUnit[] = [
  {
    id: "section-opening-setup",
    label: "Opening Setup",
    role: "setup",
    behavior: "stable",
    energyShape: "flat",
    transitionIn: "clean-cut",
    transitionOut: "pickup",
    startLabel: "0:00",
    endLabel: "0:12",
    durationLabel: "12 sec",
    evidenceSource: "manual-section",
    readinessStatus: "ready",
    confidenceLabel: "Seeded section",
    summary:
      "Opening section used to establish tempo, feel, first cue, and future track identity.",
    reviewNote:
      "Safe as a read-only placeholder until real section boundaries are detected.",
    risks: ["needs-human-review"],
  },
  {
    id: "section-first-story",
    label: "First Story Section",
    role: "story",
    behavior: "adds-stems",
    energyShape: "rising",
    transitionIn: "pickup",
    transitionOut: "fill",
    startLabel: "0:12",
    endLabel: "0:42",
    durationLabel: "30 sec",
    evidenceSource: "cue",
    readinessStatus: "ready",
    confidenceLabel: "Cue-supported placeholder",
    summary:
      "Main early section for lyric, melody, riff, and source-idea review.",
    reviewNote:
      "Good target for checking original ad-lib DNA against generated song content.",
    risks: ["weak-confidence"],
  },
  {
    id: "section-lift",
    label: "Lift Section",
    role: "lift",
    behavior: "builds",
    energyShape: "rising",
    transitionIn: "fill",
    transitionOut: "drop",
    startLabel: "0:42",
    endLabel: "0:58",
    durationLabel: "16 sec",
    evidenceSource: "arrangement",
    readinessStatus: "needs-review",
    confidenceLabel: "Arrangement placeholder",
    summary:
      "Build section before release; useful for tension and pre-chorus behavior review.",
    reviewNote:
      "Needs real waveform, marker, or future AI confirmation before automation.",
    risks: ["missing-boundary", "needs-human-review"],
  },
  {
    id: "section-primary-hook",
    label: "Primary Hook",
    role: "hook",
    behavior: "repeats",
    energyShape: "peak",
    transitionIn: "drop",
    transitionOut: "clean-cut",
    startLabel: "0:58",
    endLabel: "1:24",
    durationLabel: "26 sec",
    evidenceSource: "waveform",
    readinessStatus: "ready",
    confidenceLabel: "Waveform-supported placeholder",
    summary:
      "Main hook section for melody retention, chorus comparison, and hybrid candidate review.",
    reviewNote:
      "Useful for comparing Track A and Track B strongest memorable sections.",
    risks: ["weak-confidence"],
  },
  {
    id: "section-contrast",
    label: "Contrast Section",
    role: "contrast",
    behavior: "changes-groove",
    energyShape: "dip-and-return",
    transitionIn: "clean-cut",
    transitionOut: "pickup",
    startLabel: "1:52",
    endLabel: "2:18",
    durationLabel: "26 sec",
    evidenceSource: "comparison",
    readinessStatus: "needs-review",
    confidenceLabel: "Comparison placeholder",
    summary:
      "Contrast area for checking whether the song changes mood, groove, instrumentation, or intensity.",
    reviewNote:
      "Do not treat this as a confirmed bridge until stronger section evidence exists.",
    risks: ["unverified-section-role", "needs-human-review"],
  },
  {
    id: "section-reset",
    label: "Reset Section",
    role: "reset",
    behavior: "removes-stems",
    energyShape: "falling",
    transitionIn: "drop",
    transitionOut: "pickup",
    startLabel: "2:18",
    endLabel: "2:34",
    durationLabel: "16 sec",
    evidenceSource: "transient",
    readinessStatus: "needs-review",
    confidenceLabel: "Transient review needed",
    summary:
      "Reset or breakdown area where density may drop before a final return.",
    reviewNote:
      "Important for future hybrid transitions but currently review-gated.",
    risks: ["missing-cue", "unclear-transition"],
  },
  {
    id: "section-final-release",
    label: "Final Release",
    role: "release",
    behavior: "repeats",
    energyShape: "peak",
    transitionIn: "pickup",
    transitionOut: "fade",
    startLabel: "2:34",
    endLabel: "3:04",
    durationLabel: "30 sec",
    evidenceSource: "confidence",
    readinessStatus: "ready",
    confidenceLabel: "Confidence-gated placeholder",
    summary:
      "Final strong section for checking payoff, repeated hook, and arrangement completion.",
    reviewNote:
      "Useful for final chorus, final hook, and master-output comparison review.",
    risks: ["weak-confidence"],
  },
  {
    id: "section-ending",
    label: "Ending",
    role: "ending",
    behavior: "drops",
    energyShape: "falling",
    transitionIn: "fade",
    transitionOut: "stop",
    startLabel: "3:04",
    endLabel: "3:18",
    durationLabel: "14 sec",
    evidenceSource: "marker",
    readinessStatus: "ready",
    confidenceLabel: "Marker-supported placeholder",
    summary:
      "Ending section for future stop, fade, final cue, and outro detection.",
    reviewNote:
      "Safe read-only endpoint for future arrangement and export review.",
    risks: ["needs-human-review"],
  },
  {
    id: "section-future-ai-map",
    label: "Future AI Section Map",
    role: "future",
    behavior: "future",
    energyShape: "future",
    transitionIn: "future",
    transitionOut: "future",
    startLabel: "Future",
    endLabel: "Future",
    durationLabel: "Future",
    evidenceSource: "future-ai",
    readinessStatus: "future",
    confidenceLabel: "Future analyzer only",
    summary:
      "Reserved section slot for future analyzer-confirmed boundaries and behaviors.",
    reviewNote: "Not active until real analyzer output exists.",
    risks: ["future-only"],
  },
];

export const multiTrackSectionTransitions: MultiTrackSectionTransition[] = [
  {
    id: "transition-setup-to-story",
    fromSectionId: "section-opening-setup",
    toSectionId: "section-first-story",
    transitionType: "pickup",
    readinessStatus: "ready",
    evidenceSource: "cue",
    confidenceLabel: "Cue-supported placeholder",
    description:
      "Opening moves into first story section with a pickup-style handoff.",
    risks: ["weak-confidence"],
  },
  {
    id: "transition-story-to-lift",
    fromSectionId: "section-first-story",
    toSectionId: "section-lift",
    transitionType: "fill",
    readinessStatus: "needs-review",
    evidenceSource: "arrangement",
    confidenceLabel: "Needs confirmation",
    description:
      "Story section appears to move into a lift section through a fill or energy rise.",
    risks: ["missing-boundary", "needs-human-review"],
  },
  {
    id: "transition-lift-to-hook",
    fromSectionId: "section-lift",
    toSectionId: "section-primary-hook",
    transitionType: "drop",
    readinessStatus: "needs-review",
    evidenceSource: "waveform",
    confidenceLabel: "Waveform placeholder",
    description: "Lift section drops into the main hook or release point.",
    risks: ["unclear-transition", "needs-human-review"],
  },
  {
    id: "transition-hook-to-contrast",
    fromSectionId: "section-primary-hook",
    toSectionId: "section-contrast",
    transitionType: "clean-cut",
    readinessStatus: "needs-review",
    evidenceSource: "comparison",
    confidenceLabel: "Comparison placeholder",
    description:
      "Hook exits into a contrast section that may change groove or arrangement density.",
    risks: ["unverified-section-role"],
  },
  {
    id: "transition-contrast-to-reset",
    fromSectionId: "section-contrast",
    toSectionId: "section-reset",
    transitionType: "drop",
    readinessStatus: "needs-review",
    evidenceSource: "transient",
    confidenceLabel: "Transient review needed",
    description: "Contrast section moves into a reset or breakdown area.",
    risks: ["missing-cue", "unclear-transition"],
  },
  {
    id: "transition-reset-to-final-release",
    fromSectionId: "section-reset",
    toSectionId: "section-final-release",
    transitionType: "pickup",
    readinessStatus: "ready",
    evidenceSource: "confidence",
    confidenceLabel: "Confidence-gated placeholder",
    description:
      "Reset section returns into a final release or final hook area.",
    risks: ["weak-confidence"],
  },
  {
    id: "transition-final-release-to-ending",
    fromSectionId: "section-final-release",
    toSectionId: "section-ending",
    transitionType: "fade",
    readinessStatus: "ready",
    evidenceSource: "marker",
    confidenceLabel: "Marker-supported placeholder",
    description:
      "Final release resolves into an ending through fade or final stop behavior.",
    risks: ["needs-human-review"],
  },
];

export const multiTrackSectionReviewGroups: MultiTrackSectionReviewGroup[] = [
  {
    id: "group-hook-review",
    title: "Hook Review",
    description:
      "Focuses on the strongest memorable section and its setup/release transitions.",
    status: "ready",
    sectionIds: ["section-lift", "section-primary-hook", "section-final-release"],
    transitionIds: [
      "transition-lift-to-hook",
      "transition-reset-to-final-release",
    ],
    reviewGoal:
      "Check whether the hook is repeated, varied, preserved, or transformed between tracks.",
  },
  {
    id: "group-energy-review",
    title: "Energy Shape Review",
    description:
      "Reviews rising, peak, falling, and reset behavior across the song.",
    status: "needs-review",
    sectionIds: [
      "section-opening-setup",
      "section-first-story",
      "section-lift",
      "section-primary-hook",
      "section-reset",
      "section-final-release",
    ],
    transitionIds: [
      "transition-setup-to-story",
      "transition-story-to-lift",
      "transition-lift-to-hook",
      "transition-reset-to-final-release",
    ],
    reviewGoal:
      "Check whether the song builds and releases in a useful arrangement pattern.",
  },
  {
    id: "group-transition-review",
    title: "Transition Review",
    description:
      "Reviews cuts, pickups, fills, drops, fades, and stops between sections.",
    status: "needs-review",
    sectionIds: [
      "section-first-story",
      "section-lift",
      "section-primary-hook",
      "section-contrast",
      "section-reset",
      "section-ending",
    ],
    transitionIds: [
      "transition-story-to-lift",
      "transition-lift-to-hook",
      "transition-hook-to-contrast",
      "transition-contrast-to-reset",
      "transition-final-release-to-ending",
    ],
    reviewGoal:
      "Prepare section handoffs for future hybrid-building and timeline intelligence.",
  },
  {
    id: "group-future-ai",
    title: "Future AI Section Review",
    description:
      "Reserved group for analyzer-confirmed section boundaries, roles, and behaviors.",
    status: "future",
    sectionIds: ["section-future-ai-map"],
    transitionIds: [],
    reviewGoal:
      "Accept future analyzer output only after confidence evidence is available.",
  },
];

export const multiTrackSectionChecklist: MultiTrackSectionChecklistItem[] = [
  {
    id: "check-family-name",
    label: "Section family names match",
    status: "ready",
    detail:
      "Types, seed, helpers, and panel all use MultiTrackSectionIntelligence naming.",
  },
  {
    id: "check-section-vs-arrangement",
    label: "Section stays separate from arrangement",
    status: "ready",
    detail:
      "Arrangement maps song flow; Section Intelligence audits section behavior and transitions.",
  },
  {
    id: "check-review-gated",
    label: "Review gated",
    status: "ready",
    detail:
      "Unconfirmed roles, transitions, and energy shapes stay marked as review items.",
  },
  {
    id: "check-future-ai",
    label: "Future AI isolated",
    status: "future",
    detail:
      "Future analyzer section maps are reserved and not treated as current evidence.",
  },
];

export const multiTrackSectionIntelligenceWorkspaceState: MultiTrackSectionWorkspaceState =
  {
    title: "Section Intelligence",
    description:
      "Read-only workstation branch for reviewing individual song sections, section behavior, energy shape, transitions, evidence, confidence, and future analyzer readiness.",
    status: "ready",
    sections: multiTrackSectionUnits,
    transitions: multiTrackSectionTransitions,
    reviewGroups: multiTrackSectionReviewGroups,
    checklist: multiTrackSectionChecklist,
  };