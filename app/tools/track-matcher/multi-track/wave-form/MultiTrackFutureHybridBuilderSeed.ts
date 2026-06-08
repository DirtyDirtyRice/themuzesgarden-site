import type {
  MultiTrackFutureHybridBuilderCandidate,
  MultiTrackFutureHybridBuilderChecklistItem,
  MultiTrackFutureHybridBuilderLane,
  MultiTrackFutureHybridBuilderRecipeStep,
  MultiTrackFutureHybridBuilderWorkspaceState,
} from "./MultiTrackFutureHybridBuilderTypes";

export const multiTrackFutureHybridBuilderCandidates: MultiTrackFutureHybridBuilderCandidate[] =
  [
    {
      id: "candidate-track-a-core",
      title: "Track A Core Identity",
      sourceRole: "track-a",
      readinessStatus: "ready",
      evidenceSource: "compatibility",
      strengthLabel: "Primary source",
      summary:
        "Track A can provide the original musical identity, source idea, groove, or first arrangement direction.",
      usableFor: ["review-notes", "hybrid-arrangement", "suno-prompt"],
      risks: ["missing-confidence", "manual-review-required"],
    },
    {
      id: "candidate-track-b-core",
      title: "Track B Core Identity",
      sourceRole: "track-b",
      readinessStatus: "ready",
      evidenceSource: "compatibility",
      strengthLabel: "Comparison source",
      summary:
        "Track B can provide contrast, reference direction, alternate energy, or a second arrangement path.",
      usableFor: ["review-notes", "hybrid-arrangement", "mix-plan"],
      risks: ["missing-confidence", "manual-review-required"],
    },
    {
      id: "candidate-section-hook",
      title: "Shared Hook Candidate",
      sourceRole: "section-source",
      readinessStatus: "needs-review",
      evidenceSource: "section",
      strengthLabel: "Hook review needed",
      summary:
        "Potential hook section that can become the anchor for a third-song plan.",
      usableFor: ["hybrid-arrangement", "suno-prompt", "review-notes"],
      risks: ["missing-section-map", "manual-review-required"],
    },
    {
      id: "candidate-arrangement-flow",
      title: "Arrangement Flow Candidate",
      sourceRole: "arrangement-source",
      readinessStatus: "ready",
      evidenceSource: "arrangement",
      strengthLabel: "Arrangement-ready",
      summary:
        "Arrangement structure can guide intro, lift, hook, reset, final release, and ending choices.",
      usableFor: ["hybrid-arrangement", "metadata-plan", "review-notes"],
      risks: ["missing-section-map", "missing-confidence"],
    },
    {
      id: "candidate-stem-layer",
      title: "Stem Layer Candidate",
      sourceRole: "stem-source",
      readinessStatus: "needs-review",
      evidenceSource: "stem-ownership",
      strengthLabel: "Stem review needed",
      summary:
        "Stem ownership can guide which drums, bass, vocal, instrument, or reference parts are safe to layer.",
      usableFor: ["stem-plan", "mix-plan", "hybrid-arrangement"],
      risks: ["missing-stem-map", "manual-review-required"],
    },
    {
      id: "candidate-lineage-safe",
      title: "Lineage Safe Candidate",
      sourceRole: "lineage-source",
      readinessStatus: "ready",
      evidenceSource: "lineage",
      strengthLabel: "Source-safe",
      summary:
        "Lineage evidence can prevent reference tracks from being treated as parent songs.",
      usableFor: ["review-notes", "metadata-plan", "suno-prompt"],
      risks: ["missing-lineage", "manual-review-required"],
    },
    {
      id: "candidate-ai-prompt",
      title: "AI Prompt Candidate",
      sourceRole: "future-ai-source",
      readinessStatus: "needs-review",
      evidenceSource: "ai-prompt",
      strengthLabel: "Prompt review needed",
      summary:
        "AI prompt planning can turn verified evidence into a controlled Suno or future analyzer request.",
      usableFor: ["suno-prompt", "review-notes", "future-render"],
      risks: ["missing-confidence", "manual-review-required"],
    },
    {
      id: "candidate-future-render",
      title: "Future Render Candidate",
      sourceRole: "future-ai-source",
      readinessStatus: "future",
      evidenceSource: "future-ai",
      strengthLabel: "Future only",
      summary:
        "Reserved candidate for future automated hybrid rendering or third-song generation.",
      usableFor: ["future-ai-output", "future-render"],
      risks: ["future-only"],
    },
  ];

export const multiTrackFutureHybridBuilderRecipeSteps: MultiTrackFutureHybridBuilderRecipeStep[] =
  [
    {
      id: "recipe-step-01-review",
      orderLabel: "01",
      title: "Review Compatibility First",
      recipeType: "third-song-plan",
      readinessStatus: "ready",
      candidateIds: ["candidate-track-a-core", "candidate-track-b-core"],
      evidenceSources: ["compatibility", "confidence"],
      instruction:
        "Start by reviewing whether Track A and Track B are compatible enough for a hybrid idea.",
      reviewNote:
        "Do not move into generation language until confidence and compatibility are visible.",
      risks: ["missing-compatibility", "missing-confidence"],
    },
    {
      id: "recipe-step-02-anchor",
      orderLabel: "02",
      title: "Choose A Hybrid Anchor",
      recipeType: "section-blend",
      readinessStatus: "needs-review",
      candidateIds: ["candidate-section-hook", "candidate-arrangement-flow"],
      evidenceSources: ["section", "arrangement", "confidence"],
      instruction:
        "Pick the hook, lift, reset, or final release that should anchor the hybrid plan.",
      reviewNote:
        "Needs real section confidence before becoming an automatic builder step.",
      risks: ["missing-section-map", "manual-review-required"],
    },
    {
      id: "recipe-step-03-stems",
      orderLabel: "03",
      title: "Choose Safe Stem Layers",
      recipeType: "stem-blend",
      readinessStatus: "needs-review",
      candidateIds: ["candidate-stem-layer", "candidate-lineage-safe"],
      evidenceSources: ["stem-ownership", "lineage", "confidence"],
      instruction:
        "Identify which stems can safely be layered, removed, borrowed, or kept separate.",
      reviewNote:
        "Stem blending stays review-gated until ownership and labels are verified.",
      risks: ["missing-stem-map", "missing-lineage", "manual-review-required"],
    },
    {
      id: "recipe-step-04-tempo-key",
      orderLabel: "04",
      title: "Check Tempo And Key Plan",
      recipeType: "tempo-key-blend",
      readinessStatus: "needs-review",
      candidateIds: ["candidate-track-a-core", "candidate-track-b-core"],
      evidenceSources: ["dsp-ownership", "compatibility", "confidence"],
      instruction:
        "Review whether tempo, drift, key, pitch shift, or DSP ownership makes the hybrid musically possible.",
      reviewNote:
        "Do not recommend pitch or tempo moves without stronger evidence.",
      risks: ["missing-key-map", "missing-confidence", "manual-review-required"],
    },
    {
      id: "recipe-step-05-arrangement",
      orderLabel: "05",
      title: "Draft Hybrid Arrangement",
      recipeType: "arrangement-remap",
      readinessStatus: "ready",
      candidateIds: [
        "candidate-track-a-core",
        "candidate-track-b-core",
        "candidate-arrangement-flow",
      ],
      evidenceSources: ["arrangement", "section", "compatibility"],
      instruction:
        "Draft a read-only arrangement path such as intro from A, hook from B, reset from A, and final release from B.",
      reviewNote:
        "This is planning only. No audio mutation or file rendering happens here.",
      risks: ["missing-section-map", "manual-review-required"],
    },
    {
      id: "recipe-step-06-prompt",
      orderLabel: "06",
      title: "Prepare Controlled AI Prompt",
      recipeType: "suno-prompt-plan",
      readinessStatus: "needs-review",
      candidateIds: ["candidate-ai-prompt", "candidate-lineage-safe"],
      evidenceSources: ["ai-prompt", "lineage", "confidence"],
      instruction:
        "Convert verified compatibility, section, lineage, and arrangement notes into a controlled Suno or future AI prompt.",
      reviewNote:
        "Creative prompt text should stay human-reviewed before use.",
      risks: ["missing-confidence", "manual-review-required"],
    },
    {
      id: "recipe-step-07-future-render",
      orderLabel: "07",
      title: "Future Hybrid Render",
      recipeType: "future-ai-build",
      readinessStatus: "future",
      candidateIds: ["candidate-future-render"],
      evidenceSources: ["future-ai"],
      instruction:
        "Reserved step for a future renderer that can build or export a hybrid output.",
      reviewNote:
        "Future only. This branch does not render, mutate, or generate audio.",
      risks: ["future-only"],
    },
  ];

export const multiTrackFutureHybridBuilderLanes: MultiTrackFutureHybridBuilderLane[] =
  [
    {
      id: "lane-review-plan",
      title: "Review Plan",
      description:
        "Safe first lane for checking compatibility, confidence, source identity, and lineage before creative planning.",
      status: "ready",
      outputTarget: "review-notes",
      candidateIds: [
        "candidate-track-a-core",
        "candidate-track-b-core",
        "candidate-lineage-safe",
      ],
      recipeStepIds: ["recipe-step-01-review"],
      reviewGoal:
        "Confirm the two tracks are worth hybrid planning without making unsupported claims.",
    },
    {
      id: "lane-arrangement-plan",
      title: "Arrangement Plan",
      description:
        "Read-only lane for planning which song sections may become the new hybrid structure.",
      status: "ready",
      outputTarget: "hybrid-arrangement",
      candidateIds: [
        "candidate-section-hook",
        "candidate-arrangement-flow",
        "candidate-track-a-core",
        "candidate-track-b-core",
      ],
      recipeStepIds: [
        "recipe-step-02-anchor",
        "recipe-step-05-arrangement",
      ],
      reviewGoal:
        "Draft a third-song arrangement map without touching audio files.",
    },
    {
      id: "lane-stem-mix-plan",
      title: "Stem And Mix Plan",
      description:
        "Review lane for stems, source safety, mix ideas, and compatibility risks.",
      status: "needs-review",
      outputTarget: "stem-plan",
      candidateIds: ["candidate-stem-layer", "candidate-lineage-safe"],
      recipeStepIds: ["recipe-step-03-stems", "recipe-step-04-tempo-key"],
      reviewGoal:
        "Decide which stems might be usable only after ownership and confidence are visible.",
    },
    {
      id: "lane-suno-prompt-plan",
      title: "Suno Prompt Plan",
      description:
        "Converts verified review notes into a controlled prompt direction for future generation.",
      status: "needs-review",
      outputTarget: "suno-prompt",
      candidateIds: [
        "candidate-ai-prompt",
        "candidate-lineage-safe",
        "candidate-arrangement-flow",
      ],
      recipeStepIds: ["recipe-step-06-prompt"],
      reviewGoal:
        "Prepare creative prompt language while keeping evidence and guesses separated.",
    },
    {
      id: "lane-future-render",
      title: "Future Render Lane",
      description:
        "Reserved for later hybrid rendering, export, or AI build automation.",
      status: "future",
      outputTarget: "future-render",
      candidateIds: ["candidate-future-render"],
      recipeStepIds: ["recipe-step-07-future-render"],
      reviewGoal:
        "Future-only lane for real generated outputs after analyzers and builders exist.",
    },
  ];

export const multiTrackFutureHybridBuilderChecklist: MultiTrackFutureHybridBuilderChecklistItem[] =
  [
    {
      id: "check-family-name",
      label: "Future Hybrid Builder family names match",
      status: "ready",
      detail:
        "Types, seed, helpers, and panel all use MultiTrackFutureHybridBuilder naming.",
    },
    {
      id: "check-read-only",
      label: "Read-only builder plan",
      status: "ready",
      detail:
        "This branch plans hybrid recipes only and does not mutate, render, export, or generate audio.",
    },
    {
      id: "check-compatibility-first",
      label: "Compatibility comes first",
      status: "ready",
      detail:
        "Hybrid planning starts from Compatibility Intelligence and Confidence Intelligence.",
    },
    {
      id: "check-review-gated",
      label: "Creative steps review-gated",
      status: "needs-review",
      detail:
        "Suno prompts, stem blends, key moves, and third-song plans stay human-reviewed.",
    },
    {
      id: "check-future-ai",
      label: "Future rendering isolated",
      status: "future",
      detail:
        "Future render and future AI output lanes are reserved and not treated as current functionality.",
    },
  ];

export const multiTrackFutureHybridBuilderWorkspaceState: MultiTrackFutureHybridBuilderWorkspaceState =
  {
    title: "Future Hybrid Builder",
    description:
      "Read-only final workstation branch for planning future third-song, stem-blend, arrangement-remap, Suno prompt, mix-plan, and future AI hybrid workflows from verified multi-track intelligence.",
    status: "ready",
    candidates: multiTrackFutureHybridBuilderCandidates,
    recipeSteps: multiTrackFutureHybridBuilderRecipeSteps,
    lanes: multiTrackFutureHybridBuilderLanes,
    checklist: multiTrackFutureHybridBuilderChecklist,
  };