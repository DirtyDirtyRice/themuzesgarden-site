import type {
  MultiTrackRenderPrepChecklistItem,
  MultiTrackRenderPrepItem,
  MultiTrackRenderPrepLane,
  MultiTrackRenderPrepWorkspaceState,
} from "./MultiTrackRenderPrepIntelligenceTypes";

export const multiTrackRenderPrepItems: MultiTrackRenderPrepItem[] = [
  {
    id: "render-prep-wav-master",
    title: "WAV Master Prep",
    target: "wav-export",
    source: "track-a",
    format: "wav",
    readinessStatus: "ready",
    priorityLabel: "Primary musician format",
    summary:
      "Prepares the future render checklist for a WAV-first master export path.",
    reviewNote:
      "Read-only planning only. This does not render or alter audio.",
    risks: ["manual-review-required"],
  },
  {
    id: "render-prep-mp3-reference",
    title: "MP3 Reference Prep",
    target: "mp3-export",
    source: "manual-review",
    format: "mp3",
    readinessStatus: "ready",
    priorityLabel: "Small reference format",
    summary:
      "Prepares a lightweight MP3 reference output plan for sharing and quick review.",
    reviewNote:
      "MP3 remains secondary to WAV for musician workflow.",
    risks: ["missing-confidence"],
  },
  {
    id: "render-prep-stem-bounce",
    title: "Stem Bounce Prep",
    target: "stem-bounce",
    source: "stem-plan",
    format: "wav",
    readinessStatus: "needs-review",
    priorityLabel: "Stem review needed",
    summary:
      "Plans future stem bounce readiness for vocals, drums, bass, instruments, and hybrid layers.",
    reviewNote:
      "Needs verified stem ownership before export recommendations.",
    risks: ["missing-stem", "manual-review-required"],
  },
  {
    id: "render-prep-hybrid-preview",
    title: "Hybrid Preview Prep",
    target: "hybrid-preview",
    source: "hybrid-builder",
    format: "wav",
    readinessStatus: "needs-review",
    priorityLabel: "Hybrid review needed",
    summary:
      "Plans a future preview render from the Future Hybrid Builder recipe.",
    reviewNote:
      "Blocked from automation until compatibility and confidence are confirmed.",
    risks: ["unverified-hybrid-plan", "missing-confidence"],
  },
  {
    id: "render-prep-suno-reference",
    title: "Suno Reference Prep",
    target: "suno-reference",
    source: "arrangement",
    format: "mp3",
    readinessStatus: "needs-review",
    priorityLabel: "Prompt reference",
    summary:
      "Plans a future reference export that can support Suno-style prompt workflows.",
    reviewNote:
      "Human review required before using generated prompt or reference language.",
    risks: ["missing-metadata", "manual-review-required"],
  },
  {
    id: "render-prep-metadata-package",
    title: "Metadata Package Prep",
    target: "metadata-package",
    source: "lineage",
    format: "json",
    readinessStatus: "ready",
    priorityLabel: "Library support",
    summary:
      "Plans metadata packaging for track identity, lineage, compatibility, and confidence notes.",
    reviewNote:
      "Safe read-only metadata planning path.",
    risks: ["missing-metadata"],
  },
  {
    id: "render-prep-project-package",
    title: "Project Package Prep",
    target: "project-package",
    source: "confidence",
    format: "json",
    readinessStatus: "ready",
    priorityLabel: "Project support",
    summary:
      "Plans future project packaging for selected tracks, render notes, metadata, and review state.",
    reviewNote:
      "Good target for later workspace project export planning.",
    risks: ["manual-review-required"],
  },
  {
    id: "render-prep-future-render",
    title: "Future Render Engine Prep",
    target: "future-render",
    source: "future-ai",
    format: "future",
    readinessStatus: "future",
    priorityLabel: "Future only",
    summary:
      "Reserved item for a future render engine that can actually create audio outputs.",
    reviewNote:
      "Future only. No rendering happens in this workstation branch.",
    risks: ["future-only"],
  },
];

export const multiTrackRenderPrepLanes: MultiTrackRenderPrepLane[] = [
  {
    id: "lane-musician-export",
    title: "Musician Export Prep",
    description:
      "WAV-first export planning for masters, stems, and musician-ready outputs.",
    status: "ready",
    itemIds: [
      "render-prep-wav-master",
      "render-prep-stem-bounce",
      "render-prep-project-package",
    ],
    outputGoal:
      "Prepare future musician-friendly render paths without changing audio.",
  },
  {
    id: "lane-reference-export",
    title: "Reference Export Prep",
    description:
      "Lightweight MP3 and Suno reference planning for sharing and generation review.",
    status: "needs-review",
    itemIds: ["render-prep-mp3-reference", "render-prep-suno-reference"],
    outputGoal:
      "Prepare future reference outputs while keeping WAV as the master workflow.",
  },
  {
    id: "lane-hybrid-export",
    title: "Hybrid Export Prep",
    description:
      "Planning lane for future hybrid previews and third-song render targets.",
    status: "needs-review",
    itemIds: ["render-prep-hybrid-preview", "render-prep-metadata-package"],
    outputGoal:
      "Connect Future Hybrid Builder plans to future render/export preparation.",
  },
  {
    id: "lane-future-render-engine",
    title: "Future Render Engine",
    description:
      "Reserved lane for actual future rendering, exporting, and automated output creation.",
    status: "future",
    itemIds: ["render-prep-future-render"],
    outputGoal:
      "Keep real rendering isolated until a dedicated render engine exists.",
  },
];

export const multiTrackRenderPrepChecklist: MultiTrackRenderPrepChecklistItem[] =
  [
    {
      id: "check-family-name",
      label: "Render Prep family names match",
      status: "ready",
      detail:
        "Types, seed, helpers, and panel all use MultiTrackRenderPrepIntelligence naming.",
    },
    {
      id: "check-read-only",
      label: "Read-only only",
      status: "ready",
      detail:
        "This branch does not export, mutate, render, upload, or write audio files.",
    },
    {
      id: "check-wav-first",
      label: "WAV-first workflow",
      status: "ready",
      detail:
        "WAV remains the primary musician format while MP3 is kept as a reference format.",
    },
    {
      id: "check-confidence-gated",
      label: "Confidence gated",
      status: "ready",
      detail:
        "Render prep stays tied to confidence, lineage, stem, and compatibility review.",
    },
    {
      id: "check-future-render",
      label: "Future render isolated",
      status: "future",
      detail:
        "Actual rendering is reserved for a later dedicated render engine branch.",
    },
  ];

export const multiTrackRenderPrepIntelligenceWorkspaceState: MultiTrackRenderPrepWorkspaceState =
  {
    title: "Render Prep Intelligence",
    description:
      "Read-only post-roadmap workstation branch for preparing future WAV, MP3, stem, hybrid preview, metadata package, project package, and future render-engine paths.",
    status: "ready",
    items: multiTrackRenderPrepItems,
    lanes: multiTrackRenderPrepLanes,
    checklist: multiTrackRenderPrepChecklist,
  };