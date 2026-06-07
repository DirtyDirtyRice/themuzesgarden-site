import type {
  MultiTrackLineageChain,
  MultiTrackLineageChecklistItem,
  MultiTrackLineageNode,
  MultiTrackLineageRelationship,
  MultiTrackLineageReviewLane,
  MultiTrackLineageWorkspaceState,
} from "./MultiTrackLineageIntelligenceTypes";

export const multiTrackLineageNodes: MultiTrackLineageNode[] = [
  {
    id: "lineage-phone-original",
    title: "Phone Original Idea",
    sourceType: "original-phone-recording",
    readinessStatus: "ready",
    confidenceLevel: "strong",
    evidenceSource: "manual-review",
    description:
      "Original voice, melody, riff, or scratch idea captured before later generation.",
    notes:
      "Used as the starting point for checking what musical DNA survived into later versions.",
    risks: ["needs-human-review"],
  },
  {
    id: "lineage-demo-arrangement",
    title: "Demo Arrangement",
    sourceType: "demo",
    readinessStatus: "needs-review",
    confidenceLevel: "moderate",
    evidenceSource: "metadata",
    description:
      "Intermediate demo or rough arrangement created from the original idea.",
    notes:
      "Can become the bridge between the raw phone idea and a generated or mastered result.",
    risks: ["weak-confidence", "needs-human-review"],
  },
  {
    id: "lineage-suno-output",
    title: "Suno Generated Output",
    sourceType: "suno-generation",
    readinessStatus: "ready",
    confidenceLevel: "strong",
    evidenceSource: "filename",
    description:
      "Generated song candidate that may contain melodic, rhythmic, lyric, or arrangement DNA from the original idea.",
    notes:
      "Primary lineage target for comparing the original ad-lib idea against the generated song.",
    risks: ["filename-only", "needs-human-review"],
  },
  {
    id: "lineage-stem-export",
    title: "Stem Export",
    sourceType: "stem-export",
    readinessStatus: "ready",
    confidenceLevel: "moderate",
    evidenceSource: "stem-ownership",
    description:
      "Separated or exported stem source used for ownership, hybrid, and arrangement review.",
    notes:
      "Important for proving which parts came from drums, bass, vocal, instrument, or reference material.",
    risks: ["missing-stem-map", "weak-confidence"],
  },
  {
    id: "lineage-master-export",
    title: "Master Export",
    sourceType: "master-export",
    readinessStatus: "ready",
    confidenceLevel: "strong",
    evidenceSource: "library-link",
    description:
      "Final or near-final mastered output used as a stable comparison endpoint.",
    notes:
      "Best node for downstream metadata, library, release, and reference comparisons.",
    risks: ["needs-human-review"],
  },
  {
    id: "lineage-reference-track",
    title: "Reference Track",
    sourceType: "reference-track",
    readinessStatus: "needs-review",
    confidenceLevel: "moderate",
    evidenceSource: "comparison",
    description:
      "External or internal reference used to compare feel, arrangement, tempo, key, or production direction.",
    notes:
      "Reference relationships must stay clearly separated from direct parent-child lineage.",
    risks: ["unverified-claim", "needs-human-review"],
  },
  {
    id: "lineage-hybrid-output",
    title: "Future Hybrid Output",
    sourceType: "hybrid-output",
    readinessStatus: "future",
    confidenceLevel: "future",
    evidenceSource: "future-ai",
    description:
      "Future third-song or combined output created from two or more verified sources.",
    notes:
      "Reserved until hybrid-builder workflows produce real outputs.",
    risks: ["future-only"],
  },
];

export const multiTrackLineageRelationships: MultiTrackLineageRelationship[] = [
  {
    id: "relationship-original-to-demo",
    fromNodeId: "lineage-phone-original",
    toNodeId: "lineage-demo-arrangement",
    relationshipType: "parent",
    readinessStatus: "needs-review",
    confidenceLevel: "moderate",
    evidenceSource: "manual-review",
    explanation:
      "The demo arrangement is treated as a likely child of the original phone idea until stronger evidence confirms it.",
    risks: ["weak-confidence", "needs-human-review"],
  },
  {
    id: "relationship-original-to-suno",
    fromNodeId: "lineage-phone-original",
    toNodeId: "lineage-suno-output",
    relationshipType: "derived-from",
    readinessStatus: "ready",
    confidenceLevel: "strong",
    evidenceSource: "manual-review",
    explanation:
      "The generated output can be reviewed against the phone original to check retained melody, rhythm, riff, and structure.",
    risks: ["needs-human-review"],
  },
  {
    id: "relationship-suno-to-stems",
    fromNodeId: "lineage-suno-output",
    toNodeId: "lineage-stem-export",
    relationshipType: "child",
    readinessStatus: "ready",
    confidenceLevel: "moderate",
    evidenceSource: "stem-ownership",
    explanation:
      "Stem exports are treated as child assets of the generated output when ownership evidence supports the connection.",
    risks: ["missing-stem-map", "weak-confidence"],
  },
  {
    id: "relationship-stems-to-master",
    fromNodeId: "lineage-stem-export",
    toNodeId: "lineage-master-export",
    relationshipType: "derived-from",
    readinessStatus: "ready",
    confidenceLevel: "strong",
    evidenceSource: "library-link",
    explanation:
      "Master exports can be reviewed as final outputs built from stem and mix decisions.",
    risks: ["needs-human-review"],
  },
  {
    id: "relationship-reference-to-suno",
    fromNodeId: "lineage-reference-track",
    toNodeId: "lineage-suno-output",
    relationshipType: "reference",
    readinessStatus: "needs-review",
    confidenceLevel: "moderate",
    evidenceSource: "comparison",
    explanation:
      "Reference tracks can influence review language but should not be treated as direct parents unless verified.",
    risks: ["unverified-claim", "needs-human-review"],
  },
  {
    id: "relationship-master-to-hybrid",
    fromNodeId: "lineage-master-export",
    toNodeId: "lineage-hybrid-output",
    relationshipType: "future",
    readinessStatus: "future",
    confidenceLevel: "future",
    evidenceSource: "future-ai",
    explanation:
      "Future hybrid output relationship is reserved for later generated third-song workflows.",
    risks: ["future-only"],
  },
];

export const multiTrackLineageChains: MultiTrackLineageChain[] = [
  {
    id: "chain-original-to-master",
    title: "Original Idea To Master",
    description:
      "Tracks the likely path from phone idea through generation, stems, and master export.",
    nodeIds: [
      "lineage-phone-original",
      "lineage-suno-output",
      "lineage-stem-export",
      "lineage-master-export",
    ],
    relationshipIds: [
      "relationship-original-to-suno",
      "relationship-suno-to-stems",
      "relationship-stems-to-master",
    ],
    readinessStatus: "ready",
    reviewNote:
      "Best current chain for reviewing what survived from the original idea into the final output.",
  },
  {
    id: "chain-demo-review",
    title: "Demo Review Chain",
    description:
      "Tracks possible intermediate demo lineage before generated or mastered versions.",
    nodeIds: [
      "lineage-phone-original",
      "lineage-demo-arrangement",
      "lineage-suno-output",
    ],
    relationshipIds: [
      "relationship-original-to-demo",
      "relationship-original-to-suno",
    ],
    readinessStatus: "needs-review",
    reviewNote:
      "Needs stronger evidence before treating the demo as confirmed lineage.",
  },
  {
    id: "chain-reference-context",
    title: "Reference Context Chain",
    description:
      "Keeps reference influence separate from parent-child lineage.",
    nodeIds: ["lineage-reference-track", "lineage-suno-output"],
    relationshipIds: ["relationship-reference-to-suno"],
    readinessStatus: "needs-review",
    reviewNote:
      "Reference tracks can explain taste and direction but should not become ownership claims.",
  },
  {
    id: "chain-future-hybrid",
    title: "Future Hybrid Chain",
    description:
      "Reserved chain for future third-song output built from verified source assets.",
    nodeIds: ["lineage-master-export", "lineage-hybrid-output"],
    relationshipIds: ["relationship-master-to-hybrid"],
    readinessStatus: "future",
    reviewNote:
      "Future-only until hybrid builder produces a real output and confidence evidence.",
  },
];

export const multiTrackLineageReviewLanes: MultiTrackLineageReviewLane[] = [
  {
    id: "lane-source-proof",
    title: "Source Proof Lane",
    description:
      "Checks whether the earliest source, generation, stems, and master can be connected safely.",
    status: "ready",
    nodeIds: [
      "lineage-phone-original",
      "lineage-suno-output",
      "lineage-stem-export",
      "lineage-master-export",
    ],
    relationshipIds: [
      "relationship-original-to-suno",
      "relationship-suno-to-stems",
      "relationship-stems-to-master",
    ],
    requiredEvidence: ["manual-review", "stem-ownership", "library-link"],
    reviewNote:
      "Use this lane before making claims about what version came from what source.",
  },
  {
    id: "lane-reference-safety",
    title: "Reference Safety Lane",
    description:
      "Keeps inspiration, reference, and direct lineage claims separated.",
    status: "needs-review",
    nodeIds: ["lineage-reference-track", "lineage-suno-output"],
    relationshipIds: ["relationship-reference-to-suno"],
    requiredEvidence: ["comparison", "confidence"],
    reviewNote:
      "Prevents reference tracks from being incorrectly treated as parent songs.",
  },
  {
    id: "lane-future-output",
    title: "Future Output Lane",
    description:
      "Reserved for future hybrid, remix, arrangement, or AI-generated outputs.",
    status: "future",
    nodeIds: ["lineage-hybrid-output"],
    relationshipIds: ["relationship-master-to-hybrid"],
    requiredEvidence: ["future-ai"],
    reviewNote:
      "Not active until future creation tools produce traceable outputs.",
  },
];

export const multiTrackLineageChecklist: MultiTrackLineageChecklistItem[] = [
  {
    id: "check-family-name",
    label: "Lineage family names match",
    status: "ready",
    detail:
      "Types, seed, helpers, and panel all use MultiTrackLineageIntelligence naming.",
  },
  {
    id: "check-reference-separated",
    label: "Reference is separated",
    status: "ready",
    detail:
      "Reference tracks are not treated as parent songs unless future evidence confirms the relationship.",
  },
  {
    id: "check-confidence-gated",
    label: "Confidence gated",
    status: "ready",
    detail:
      "Lineage relationships carry confidence levels and risks to prevent unsupported ownership claims.",
  },
  {
    id: "check-future-isolated",
    label: "Future outputs isolated",
    status: "future",
    detail:
      "Hybrid output nodes are future-only until real generated assets exist.",
  },
];

export const multiTrackLineageIntelligenceWorkspaceState: MultiTrackLineageWorkspaceState =
  {
    title: "Lineage Intelligence",
    description:
      "Read-only workstation branch for tracking source history, parent-child relationships, generated outputs, stems, masters, reference tracks, and future hybrid lineage.",
    status: "ready",
    nodes: multiTrackLineageNodes,
    relationships: multiTrackLineageRelationships,
    chains: multiTrackLineageChains,
    reviewLanes: multiTrackLineageReviewLanes,
    checklist: multiTrackLineageChecklist,
  };