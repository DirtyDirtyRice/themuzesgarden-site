import type {
  MultiTrackCompatibilityChecklistItem,
  MultiTrackCompatibilityLane,
  MultiTrackCompatibilityPair,
  MultiTrackCompatibilitySignal,
  MultiTrackCompatibilityWorkspaceState,
} from "./MultiTrackCompatibilityIntelligenceTypes";

export const multiTrackCompatibilitySignals: MultiTrackCompatibilitySignal[] = [
  {
    id: "compat-tempo-lock",
    label: "Tempo Lock",
    category: "tempo",
    rating: "good",
    readinessStatus: "ready",
    evidenceSource: "statistics",
    scoreLabel: "BPM review ready",
    summary:
      "Checks whether Track A and Track B can be aligned by tempo, drift, or browser/DSP playback planning.",
    reviewNote:
      "Safe as a read-only compatibility signal until live BPM analysis is connected.",
    risks: ["missing-bpm", "weak-confidence"],
  },
  {
    id: "compat-key-fit",
    label: "Key Fit",
    category: "key",
    rating: "possible",
    readinessStatus: "needs-review",
    evidenceSource: "dsp-ownership",
    scoreLabel: "Pitch review needed",
    summary:
      "Checks whether the tracks can sit together musically through key match, pitch shift, or harmonic relationship.",
    reviewNote:
      "Needs stronger key evidence before recommending automatic pitch moves.",
    risks: ["missing-key", "manual-review-required"],
  },
  {
    id: "compat-section-overlap",
    label: "Section Overlap",
    category: "section",
    rating: "good",
    readinessStatus: "ready",
    evidenceSource: "section",
    scoreLabel: "Section review ready",
    summary:
      "Checks whether hooks, lifts, resets, and endings can line up between two tracks.",
    reviewNote:
      "Uses Section Intelligence placeholders until real analyzer boundaries exist.",
    risks: ["missing-section-map", "weak-confidence"],
  },
  {
    id: "compat-stem-fit",
    label: "Stem Fit",
    category: "stem",
    rating: "possible",
    readinessStatus: "needs-review",
    evidenceSource: "stem-ownership",
    scoreLabel: "Stem review needed",
    summary:
      "Checks whether vocals, drums, bass, instruments, and references can be separated or layered safely.",
    reviewNote:
      "Needs verified stem ownership before hybrid or mashup recommendations.",
    risks: ["missing-stem-map", "manual-review-required"],
  },
  {
    id: "compat-arrangement-fit",
    label: "Arrangement Fit",
    category: "arrangement",
    rating: "good",
    readinessStatus: "ready",
    evidenceSource: "arrangement",
    scoreLabel: "Arrangement mapped",
    summary:
      "Checks whether the songs share a useful arrangement path for review or hybrid planning.",
    reviewNote:
      "Good for read-only planning, not automatic generation.",
    risks: ["missing-section-map", "weak-confidence"],
  },
  {
    id: "compat-energy-fit",
    label: "Energy Fit",
    category: "energy",
    rating: "possible",
    readinessStatus: "needs-review",
    evidenceSource: "comparison",
    scoreLabel: "Energy comparison needed",
    summary:
      "Checks whether the two tracks rise, drop, peak, and reset in compatible ways.",
    reviewNote:
      "Useful for identifying whether two tracks feel like they belong together.",
    risks: ["weak-confidence", "manual-review-required"],
  },
  {
    id: "compat-lineage-safety",
    label: "Lineage Safety",
    category: "lineage",
    rating: "good",
    readinessStatus: "ready",
    evidenceSource: "lineage",
    scoreLabel: "Source review ready",
    summary:
      "Checks whether source, reference, generated, stem, and master relationships are safe to describe.",
    reviewNote:
      "Prevents reference tracks from being treated as parent songs.",
    risks: ["conflicting-evidence", "manual-review-required"],
  },
  {
    id: "compat-confidence-gate",
    label: "Confidence Gate",
    category: "confidence",
    rating: "excellent",
    readinessStatus: "ready",
    evidenceSource: "confidence",
    scoreLabel: "Confidence protected",
    summary:
      "Requires confidence labels before compatibility claims become recommendations.",
    reviewNote:
      "This is the safety gate for all compatibility decisions.",
    risks: ["weak-confidence"],
  },
  {
    id: "compat-hybrid-readiness",
    label: "Hybrid Readiness",
    category: "hybrid",
    rating: "possible",
    readinessStatus: "needs-review",
    evidenceSource: "comparison",
    scoreLabel: "Hybrid review needed",
    summary:
      "Checks whether two tracks are useful candidates for a future third-song plan.",
    reviewNote:
      "Should remain review-gated until Future Hybrid Builder is complete.",
    risks: ["missing-section-map", "missing-stem-map", "manual-review-required"],
  },
  {
    id: "compat-future-ai",
    label: "Future AI Compatibility",
    category: "future",
    rating: "future",
    readinessStatus: "future",
    evidenceSource: "future-ai",
    scoreLabel: "Future analyzer only",
    summary:
      "Reserved compatibility signal for future machine-confirmed audio analysis.",
    reviewNote:
      "Not active until future analyzer evidence exists.",
    risks: ["future-only"],
  },
];

export const multiTrackCompatibilityPairs: MultiTrackCompatibilityPair[] = [
  {
    id: "pair-review-a-b",
    title: "Track A / Track B Review Pair",
    useCase: "a-b-review",
    readinessStatus: "ready",
    rating: "good",
    signalIds: [
      "compat-tempo-lock",
      "compat-section-overlap",
      "compat-arrangement-fit",
      "compat-confidence-gate",
    ],
    evidenceSources: ["statistics", "section", "arrangement", "confidence"],
    recommendation:
      "Safe for read-only comparison review when both tracks are loaded and confidence notes are visible.",
    risks: ["missing-track-a", "missing-track-b", "weak-confidence"],
  },
  {
    id: "pair-sync-planning",
    title: "Sync Planning Pair",
    useCase: "sync-check",
    readinessStatus: "ready",
    rating: "good",
    signalIds: [
      "compat-tempo-lock",
      "compat-section-overlap",
      "compat-energy-fit",
    ],
    evidenceSources: ["statistics", "section", "comparison"],
    recommendation:
      "Good candidate for checking timing alignment, section overlap, and energy movement.",
    risks: ["missing-bpm", "missing-section-map"],
  },
  {
    id: "pair-key-planning",
    title: "Key Planning Pair",
    useCase: "key-check",
    readinessStatus: "needs-review",
    rating: "possible",
    signalIds: ["compat-key-fit", "compat-confidence-gate"],
    evidenceSources: ["dsp-ownership", "confidence"],
    recommendation:
      "Needs stronger key evidence before pitch-shift or harmonic-fit recommendations.",
    risks: ["missing-key", "manual-review-required"],
  },
  {
    id: "pair-stem-hybrid",
    title: "Stem Hybrid Pair",
    useCase: "hybrid-planning",
    readinessStatus: "needs-review",
    rating: "possible",
    signalIds: [
      "compat-stem-fit",
      "compat-arrangement-fit",
      "compat-hybrid-readiness",
      "compat-confidence-gate",
    ],
    evidenceSources: [
      "stem-ownership",
      "arrangement",
      "comparison",
      "confidence",
    ],
    recommendation:
      "Possible future hybrid candidate if stems, sections, and confidence evidence are confirmed.",
    risks: ["missing-stem-map", "missing-section-map", "manual-review-required"],
  },
  {
    id: "pair-lineage-safety",
    title: "Lineage Safety Pair",
    useCase: "a-b-review",
    readinessStatus: "ready",
    rating: "good",
    signalIds: ["compat-lineage-safety", "compat-confidence-gate"],
    evidenceSources: ["lineage", "confidence"],
    recommendation:
      "Safe for explaining relationship possibilities without making unsupported ownership claims.",
    risks: ["conflicting-evidence", "manual-review-required"],
  },
  {
    id: "pair-future-builder",
    title: "Future Builder Pair",
    useCase: "future-builder",
    readinessStatus: "future",
    rating: "future",
    signalIds: ["compat-future-ai"],
    evidenceSources: ["future-ai"],
    recommendation:
      "Reserved for future analyzer-confirmed compatibility and hybrid-builder automation.",
    risks: ["future-only"],
  },
];

export const multiTrackCompatibilityLanes: MultiTrackCompatibilityLane[] = [
  {
    id: "lane-basic-review",
    title: "Basic A/B Review",
    description:
      "Read-only compatibility lane for tempo, sections, arrangement, and confidence.",
    status: "ready",
    useCase: "a-b-review",
    signalIds: [
      "compat-tempo-lock",
      "compat-section-overlap",
      "compat-arrangement-fit",
      "compat-confidence-gate",
    ],
    pairIds: ["pair-review-a-b", "pair-sync-planning"],
    reviewGoal:
      "Decide whether two loaded tracks are worth comparing more deeply.",
  },
  {
    id: "lane-musical-fit",
    title: "Musical Fit",
    description:
      "Review lane for key, energy, groove, and section compatibility.",
    status: "needs-review",
    useCase: "key-check",
    signalIds: [
      "compat-key-fit",
      "compat-energy-fit",
      "compat-section-overlap",
      "compat-confidence-gate",
    ],
    pairIds: ["pair-key-planning"],
    reviewGoal:
      "Check whether two tracks can sit together musically without overclaiming key evidence.",
  },
  {
    id: "lane-hybrid-fit",
    title: "Hybrid Fit",
    description:
      "Review lane for stems, arrangement, lineage, and third-song planning.",
    status: "needs-review",
    useCase: "hybrid-planning",
    signalIds: [
      "compat-stem-fit",
      "compat-arrangement-fit",
      "compat-lineage-safety",
      "compat-hybrid-readiness",
    ],
    pairIds: ["pair-stem-hybrid", "pair-lineage-safety"],
    reviewGoal:
      "Prepare safe inputs for the final Future Hybrid Builder branch.",
  },
  {
    id: "lane-future-ai",
    title: "Future AI Compatibility",
    description:
      "Reserved lane for future analyzer-confirmed compatibility scoring.",
    status: "future",
    useCase: "future-builder",
    signalIds: ["compat-future-ai"],
    pairIds: ["pair-future-builder"],
    reviewGoal:
      "Accept machine-confirmed compatibility only after future analyzer confidence evidence exists.",
  },
];

export const multiTrackCompatibilityChecklist: MultiTrackCompatibilityChecklistItem[] =
  [
    {
      id: "check-family-name",
      label: "Compatibility family names match",
      status: "ready",
      detail:
        "Types, seed, helpers, and panel all use MultiTrackCompatibilityIntelligence naming.",
    },
    {
      id: "check-track-pairing",
      label: "Track pairing protected",
      status: "ready",
      detail:
        "Compatibility is framed as Track A / Track B review, not automatic decision making.",
    },
    {
      id: "check-confidence-gated",
      label: "Confidence gated",
      status: "ready",
      detail:
        "Compatibility recommendations require confidence evidence and visible review risks.",
    },
    {
      id: "check-hybrid-not-automatic",
      label: "Hybrid not automatic",
      status: "needs-review",
      detail:
        "Hybrid readiness is only a planning signal until Future Hybrid Builder is added.",
    },
    {
      id: "check-future-ai",
      label: "Future AI isolated",
      status: "future",
      detail:
        "Future analyzer compatibility remains reserved and does not act as current evidence.",
    },
  ];

export const multiTrackCompatibilityIntelligenceWorkspaceState: MultiTrackCompatibilityWorkspaceState =
  {
    title: "Compatibility Intelligence",
    description:
      "Read-only workstation branch for reviewing Track A and Track B compatibility across tempo, key, sections, stems, arrangement, energy, lineage, confidence, and future hybrid readiness.",
    status: "ready",
    signals: multiTrackCompatibilitySignals,
    pairs: multiTrackCompatibilityPairs,
    lanes: multiTrackCompatibilityLanes,
    checklist: multiTrackCompatibilityChecklist,
  };