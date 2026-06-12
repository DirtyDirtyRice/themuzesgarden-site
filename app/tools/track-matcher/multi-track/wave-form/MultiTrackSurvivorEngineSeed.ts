import type {
  MultiTrackSurvivorEngineCandidate,
  MultiTrackSurvivorEngineWorkspace,
} from "./MultiTrackSurvivorEngineTypes";

export const multiTrackSurvivorEngineCandidates: MultiTrackSurvivorEngineCandidate[] = [
  {
    candidateId: "survivor-v7-chorus-hook",
    title: "Suno V7 chorus hook survivor",
    sourceKind: "suno-version",
    role: "primary-hook",
    sourceVersionId: "mutation-suno-v7-chorus",
    riffFamilyId: "riff-family-main-hook",
    mutationFamilyId: "mutation-family-main-hook",
    startMs: 48000,
    endMs: 61000,
    rank: 1,
    decision: "promote",
    readiness: "needs-review",
    status: "estimated",
    risk: "medium",
    scoreBreakdown: {
      survivalScore: 0.9,
      mutationScore: 0.82,
      riffGroupScore: 0.81,
      similarityScore: 0.78,
      transientScore: 0.88,
      energyScore: 0.72,
      timingScore: 0.66,
      riskPenalty: 0.09,
      finalScore: 0.82,
    },
    evidence: [
      {
        evidenceId: "v7-evidence-survival",
        kind: "mutation-survival",
        title: "Strong survival through mutation map",
        detail:
          "The V7 chorus preserves the original hook family while improving energy and transient confidence.",
        scoreImpact: 0.18,
        status: "estimated",
        risk: "low",
      },
      {
        evidenceId: "v7-evidence-riff-family",
        kind: "riff-family-strength",
        title: "Main hook family winner",
        detail:
          "The riff grouping engine marked this lane as part of the strongest keeper-candidate family.",
        scoreImpact: 0.16,
        status: "estimated",
        risk: "low",
      },
      {
        evidenceId: "v7-evidence-drift",
        kind: "timing-drift",
        title: "Timing drift still needs correction",
        detail:
          "The candidate carries 420ms drift from similarity and transient analysis, so extraction must compensate.",
        scoreImpact: -0.09,
        status: "estimated",
        risk: "medium",
      },
      {
        evidenceId: "v7-evidence-transient",
        kind: "transient-anchor",
        title: "Strong transient anchors",
        detail:
          "Chorus cluster has strong anchor hits and enough attack shape to guide extraction boundaries.",
        scoreImpact: 0.14,
        status: "estimated",
        risk: "low",
      },
    ],
    recommendation:
      "Promote this candidate into extraction planning as the primary survivor hook.",
    extractionHint:
      "Start with the chorus hook window, then apply drift correction before final cut points.",
    notes: [
      "Best current survivor candidate.",
      "Needs drift-aware extraction.",
      "Should not be exported until keeper selection confirms final use.",
    ],
  },
  {
    candidateId: "survivor-v7-final-hook",
    title: "Suno V7 final hook repeat",
    sourceKind: "suno-version",
    role: "supporting-repeat",
    sourceVersionId: "mutation-suno-v7-final-hook",
    riffFamilyId: "riff-family-variation",
    mutationFamilyId: "mutation-family-main-hook",
    startMs: 182400,
    endMs: 194000,
    rank: 2,
    decision: "hold",
    readiness: "needs-review",
    status: "seeded",
    risk: "medium",
    scoreBreakdown: {
      survivalScore: 0.72,
      mutationScore: 0.66,
      riffGroupScore: 0.59,
      similarityScore: 0.69,
      transientScore: 0.79,
      energyScore: 0.7,
      timingScore: 0.72,
      riskPenalty: 0.11,
      finalScore: 0.66,
    },
    evidence: [
      {
        evidenceId: "final-evidence-repeat",
        kind: "repeat-value",
        title: "Useful repeat value",
        detail:
          "The final hook repeats the family and may help build an arrangement even if it is not the main winner.",
        scoreImpact: 0.11,
        status: "seeded",
        risk: "low",
      },
      {
        evidenceId: "final-evidence-density",
        kind: "transient-anchor",
        title: "Lower density than first chorus",
        detail:
          "Mutation map flagged a density drop compared with the V7 chorus winner.",
        scoreImpact: -0.08,
        status: "seeded",
        risk: "medium",
      },
      {
        evidenceId: "final-evidence-mutation",
        kind: "mutation-survival",
        title: "Still related to main family",
        detail:
          "The final hook keeps enough similarity to remain available as a supporting lane.",
        scoreImpact: 0.09,
        status: "seeded",
        risk: "medium",
      },
    ],
    recommendation:
      "Hold as a supporting repeat and send to extraction only after the primary hook is locked.",
    extractionHint:
      "Use as a secondary repeat candidate, not as the first extraction target.",
    notes: [
      "Good support candidate.",
      "Not the top keeper.",
      "May help arrangement after primary hook is extracted.",
    ],
  },
  {
    candidateId: "survivor-v4-hook-sketch",
    title: "Suno V4 rough hook sketch",
    sourceKind: "suno-version",
    role: "variation",
    sourceVersionId: "mutation-suno-v4-hook",
    riffFamilyId: "riff-family-main-hook",
    mutationFamilyId: "mutation-family-main-hook",
    startMs: 44000,
    endMs: 57000,
    rank: 3,
    decision: "review",
    readiness: "needs-review",
    status: "seeded",
    risk: "medium",
    scoreBreakdown: {
      survivalScore: 0.63,
      mutationScore: 0.58,
      riffGroupScore: 0.62,
      similarityScore: 0.63,
      transientScore: 0.67,
      energyScore: 0.61,
      timingScore: 0.48,
      riskPenalty: 0.14,
      finalScore: 0.57,
    },
    evidence: [
      {
        evidenceId: "v4-evidence-family",
        kind: "riff-family-strength",
        title: "Still belongs to main hook family",
        detail:
          "Riff grouping keeps V4 inside the main hook family, but not as the winner.",
        scoreImpact: 0.08,
        status: "seeded",
        risk: "medium",
      },
      {
        evidenceId: "v4-evidence-drift",
        kind: "timing-drift",
        title: "Large timing drift",
        detail:
          "The V4 hook sketch has larger drift than V7 and would need heavier alignment.",
        scoreImpact: -0.14,
        status: "seeded",
        risk: "medium",
      },
    ],
    recommendation:
      "Review manually before extraction. Keep it as a rough mutation reference.",
    extractionHint:
      "Do not extract first. Use as comparison material if V7 needs alternate phrasing.",
    notes: [
      "Useful as mutation history.",
      "Not a clean keeper candidate yet.",
      "Could help training or prompt explanation later.",
    ],
  },
  {
    candidateId: "survivor-v9-weakened-hook",
    title: "Suno V9 weakened hook lane",
    sourceKind: "suno-version",
    role: "unknown",
    sourceVersionId: "mutation-suno-v9-lost",
    riffFamilyId: "riff-family-main-hook",
    mutationFamilyId: "mutation-family-main-hook",
    startMs: 52000,
    endMs: 65000,
    rank: 4,
    decision: "reject",
    readiness: "blocked",
    status: "seeded",
    risk: "high",
    scoreBreakdown: {
      survivalScore: 0.34,
      mutationScore: 0.28,
      riffGroupScore: 0.31,
      similarityScore: 0.34,
      transientScore: 0.41,
      energyScore: 0.49,
      timingScore: 0.22,
      riskPenalty: 0.28,
      finalScore: 0.29,
    },
    evidence: [
      {
        evidenceId: "v9-evidence-loss",
        kind: "mutation-survival",
        title: "Hook identity weakens",
        detail:
          "Mutation engine marked this lane as weakened with poor similarity and anchor support.",
        scoreImpact: -0.2,
        status: "seeded",
        risk: "high",
      },
      {
        evidenceId: "v9-evidence-drift",
        kind: "timing-drift",
        title: "Drift too large for keeper selection",
        detail:
          "High drift and low confidence make this unsafe for extraction.",
        scoreImpact: -0.12,
        status: "seeded",
        risk: "high",
      },
    ],
    recommendation:
      "Reject from keeper selection unless new evidence appears after real engine analysis.",
    extractionHint:
      "Do not extract. Keep only as a negative example for training and review.",
    notes: [
      "Rejected candidate.",
      "Useful as a warning case.",
      "Should not enter render preparation.",
    ],
  },
];

export const multiTrackSurvivorEngineWorkspace: MultiTrackSurvivorEngineWorkspace = {
  workspaceId: "multi-track-survivor-engine",
  title: "Survivor Engine Foundation",
  summary:
    "Seventh real engine layer. Ranks which hook, riff, or idea survived best across original and Suno versions after waveform, statistics, transients, similarity, riff grouping, and mutation mapping.",
  readiness: "needs-review",
  readinessLabel: "Seeded survivor ranking is ready. Real mutation-map input comes next.",
  engineGoal:
    "Pick the strongest surviving musical idea before extraction, keeper selection, or hybrid construction.",
  engineBoundary:
    "This layer ranks survivor candidates. It does not cut audio or render final output.",
  candidates: multiTrackSurvivorEngineCandidates,
  comparisons: [
    {
      comparisonId: "survivor-v7-chorus-vs-final",
      title: "V7 chorus hook beats V7 final hook",
      leftCandidateId: "survivor-v7-chorus-hook",
      rightCandidateId: "survivor-v7-final-hook",
      winnerCandidateId: "survivor-v7-chorus-hook",
      scoreDifference: 0.16,
      detail:
        "The chorus hook has stronger transient density, better mutation survival, and higher final score.",
      decisionReason:
        "Promote chorus as primary extraction target and hold final hook as support.",
      status: "estimated",
      risk: "medium",
    },
    {
      comparisonId: "survivor-v7-chorus-vs-v4",
      title: "V7 chorus hook beats V4 rough hook",
      leftCandidateId: "survivor-v7-chorus-hook",
      rightCandidateId: "survivor-v4-hook-sketch",
      winnerCandidateId: "survivor-v7-chorus-hook",
      scoreDifference: 0.25,
      detail:
        "V4 preserves history but has weaker timing, lower confidence, and less extraction readiness.",
      decisionReason:
        "Use V4 for review context only. Do not prioritize it for extraction.",
      status: "estimated",
      risk: "medium",
    },
    {
      comparisonId: "survivor-v7-chorus-vs-v9",
      title: "V9 weakened hook is rejected",
      leftCandidateId: "survivor-v7-chorus-hook",
      rightCandidateId: "survivor-v9-weakened-hook",
      winnerCandidateId: "survivor-v7-chorus-hook",
      scoreDifference: 0.53,
      detail:
        "V9 loses too much identity and carries too much timing risk.",
      decisionReason:
        "Reject V9 from keeper selection and keep as negative training evidence.",
      status: "seeded",
      risk: "high",
    },
  ],
  findings: [
    {
      findingId: "survivor-finding-primary",
      title: "Primary survivor is V7 chorus hook",
      detail:
        "It has the strongest final score and the best balance of survival, evolution, and extraction readiness.",
      action: "Send V7 chorus hook to extraction engine first.",
      status: "estimated",
      risk: "medium",
    },
    {
      findingId: "survivor-finding-support",
      title: "Final hook is support only",
      detail:
        "The V7 final hook is useful but should not replace the first chorus as the main keeper lane.",
      action: "Hold it as supporting material for arrangement or repeat extraction.",
      status: "seeded",
      risk: "medium",
    },
    {
      findingId: "survivor-finding-reject",
      title: "Weak lanes are blocked from render",
      detail:
        "The V9 weakened lane has too much loss and should not enter extraction or render prep.",
      action: "Block weak lanes before they pollute keeper selection.",
      status: "seeded",
      risk: "high",
    },
  ],
  engineRules: [
    "Survivor ranking must include mutation survival, not just loudness.",
    "A survivor candidate can be promoted only if extraction risk is acceptable.",
    "Supporting repeats should not replace the primary hook winner.",
    "Rejected lanes remain useful for training and negative review evidence.",
    "Survivor engine feeds extraction engine; it does not cut audio itself.",
  ],
  nextSteps: [
    "Connect candidates to real mutation engine family output.",
    "Calculate final survivor score from real evidence weights.",
    "Send promoted candidates to extraction engine.",
    "Send held candidates to keeper selection review.",
    "Send rejected candidates to training evidence only.",
  ],
};
