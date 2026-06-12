import type {
  MultiTrackIdeaCluster,
  MultiTrackIdeaClusterActionPlan,
  MultiTrackIdeaClusterEngineState,
  MultiTrackIdeaClusterEvidence,
  MultiTrackIdeaClusterEvidenceKind,
  MultiTrackIdeaClusterMember,
} from "./MultiTrackIdeaClusterEngineTypes";

function makeRange(startSecond: number, endSecond: number) {
  const durationSecond = Number((endSecond - startSecond).toFixed(2));

  return {
    startSecond,
    endSecond,
    durationSecond,
    label: `${startSecond.toFixed(1)}s - ${endSecond.toFixed(1)}s`,
  };
}

function makeMember(
  id: string,
  trackNumber: number,
  color: string,
  startSecond: number,
  endSecond: number,
  sourceRegionId: string,
  sourcePhraseId: string,
  similarityPercent: number,
  confidencePercent: number,
  mutationDistancePercent: number,
  notes: string,
): MultiTrackIdeaClusterMember {
  return {
    id,
    label: `${color} idea member · Track ${String(trackNumber).padStart(2, "0")}`,
    trackId: `suno-version-${String(trackNumber).padStart(2, "0")}`,
    trackLabel: `Track ${String(trackNumber).padStart(2, "0")}`,
    versionLabel: `Suno Version ${String(trackNumber).padStart(2, "0")}`,
    sourceRegionId,
    sourcePhraseId,
    source: "riff-color-engine",
    readiness: confidencePercent >= 88 ? "ready" : "needs-review",
    status: confidencePercent >= 90 ? "clustered" : "review",
    timeRange: makeRange(startSecond, endSecond),
    color,
    similarityPercent,
    confidencePercent,
    mutationDistancePercent,
    notes,
  };
}

function makeEvidence(
  id: string,
  label: string,
  kind: MultiTrackIdeaClusterEvidenceKind,
  scorePercent: number,
  weight: number,
  detail: string,
): MultiTrackIdeaClusterEvidence {
  return {
    id,
    label,
    kind,
    scorePercent,
    weight,
    detail,
  };
}

const blueMembers: MultiTrackIdeaClusterMember[] = [
  makeMember(
    "cluster-member-blue-01",
    1,
    "blue",
    42.1,
    46.8,
    "color-blue-track-01",
    "phrase-blue-hook-track-01",
    100,
    96,
    0,
    "Reference member for the blue hook idea cluster.",
  ),
  makeMember(
    "cluster-member-blue-02",
    2,
    "blue",
    42.4,
    47,
    "color-blue-track-02",
    "phrase-blue-hook-track-02",
    90,
    88,
    14,
    "Late-pocket blue hook mutation.",
  ),
  makeMember(
    "cluster-member-blue-04",
    4,
    "blue",
    41.9,
    46.5,
    "color-blue-track-04",
    "phrase-blue-hook-track-04",
    96,
    95,
    8,
    "Strongest source-track blue hook member.",
  ),
  makeMember(
    "cluster-member-blue-07",
    7,
    "blue",
    43,
    47.4,
    "color-blue-track-07",
    "phrase-blue-hook-track-07",
    86,
    82,
    28,
    "Borderline blue member. May split later if the note mutation matters too much.",
  ),
];

const purpleMembers: MultiTrackIdeaClusterMember[] = [
  makeMember(
    "cluster-member-purple-03",
    3,
    "purple",
    58.2,
    61.9,
    "color-purple-track-03",
    "phrase-purple-answer-track-03",
    100,
    92,
    0,
    "Reference purple answer idea member.",
  ),
  makeMember(
    "cluster-member-purple-05",
    5,
    "purple",
    58.7,
    62.5,
    "color-purple-track-05",
    "phrase-purple-answer-track-05",
    84,
    79,
    31,
    "Review member that may become its own response cluster.",
  ),
  makeMember(
    "cluster-member-purple-10",
    10,
    "purple",
    57.9,
    61.6,
    "color-purple-track-10",
    "phrase-purple-answer-track-10",
    92,
    90,
    12,
    "Strong purple answer survivor.",
  ),
];

export const multiTrackIdeaClusters: MultiTrackIdeaCluster[] = [
  {
    id: "idea-cluster-blue-hook",
    label: "Blue Hook Idea Cluster",
    kind: "hook",
    source: "riff-color-engine",
    readiness: "ready",
    status: "clustered",
    color: "blue",
    rootMemberId: "cluster-member-blue-01",
    strongestMemberId: "cluster-member-blue-04",
    minimumConfidencePercent: 88,
    clusterConfidencePercent: 93,
    members: blueMembers,
    evidence: [
      makeEvidence(
        "blue-evidence-same-color",
        "Same Color Family",
        "same-color",
        96,
        1.1,
        "All accepted members are blue riff color regions.",
      ),
      makeEvidence(
        "blue-evidence-same-phrase",
        "Same Phrase",
        "same-phrase",
        93,
        1.2,
        "Phrase matching says these members are the same hook idea.",
      ),
      makeEvidence(
        "blue-evidence-memory",
        "Listener Memory",
        "same-memory",
        95,
        1.3,
        "The hook is remembered as the same musical idea even when timing moves.",
      ),
      makeEvidence(
        "blue-evidence-manual",
        "Manual Confirmation",
        "manual-confirmed",
        92,
        1,
        "Seeded as a manually confirmed idea family.",
      ),
    ],
    risks: ["timing-drift", "note-mutation", "needs-listening"],
    decision: "promote",
    detail:
      "Main hook cluster. This is the strongest musical idea cluster and should feed extraction, keeper, and arrangement engines.",
  },
  {
    id: "idea-cluster-purple-answer",
    label: "Purple Answer Idea Cluster",
    kind: "answer",
    source: "riff-color-engine",
    readiness: "needs-review",
    status: "review",
    color: "purple",
    rootMemberId: "cluster-member-purple-03",
    strongestMemberId: "cluster-member-purple-10",
    minimumConfidencePercent: 88,
    clusterConfidencePercent: 86,
    members: purpleMembers,
    evidence: [
      makeEvidence(
        "purple-evidence-same-color",
        "Same Color Family",
        "same-color",
        90,
        1,
        "Most accepted regions belong to the purple answer color family.",
      ),
      makeEvidence(
        "purple-evidence-phrase",
        "Answer Phrase",
        "same-phrase",
        87,
        1.1,
        "Phrase matching supports the answer family, but Track 05 needs review.",
      ),
      makeEvidence(
        "purple-evidence-memory",
        "Supporting Memory",
        "same-memory",
        84,
        0.9,
        "The phrase feels like a supporting response idea.",
      ),
    ],
    risks: ["weak-confidence", "needs-listening"],
    decision: "review",
    detail:
      "Supporting answer cluster. Keep it near the blue hook, but do not promote above blue yet.",
  },
];

export const multiTrackIdeaClusterActionPlans: MultiTrackIdeaClusterActionPlan[] = [
  {
    id: "idea-action-promote-blue-hook",
    label: "Promote Blue Hook Cluster",
    clusterId: "idea-cluster-blue-hook",
    decision: "promote",
    ready: true,
    confidencePercent: 93,
    nextAction:
      "Send blue hook cluster to extraction, keeper bank, strongest idea, and arrangement candidates.",
    detail:
      "Blue hook has enough evidence to become the first promoted idea cluster.",
  },
  {
    id: "idea-action-review-purple-answer",
    label: "Review Purple Answer Cluster",
    clusterId: "idea-cluster-purple-answer",
    decision: "review",
    ready: false,
    confidencePercent: 86,
    nextAction:
      "Listen to Track 05 and decide whether it stays purple or splits into a new response color.",
    detail:
      "Purple answer should stay in review until the weak member is decided.",
  },
];

export const multiTrackIdeaClusterEngineSeedState: MultiTrackIdeaClusterEngineState = {
  id: "multi-track-idea-cluster-engine",
  title: "Multi Track Idea Cluster Engine",
  description:
    "Clusters same-family colored riff regions into higher-level musical ideas, so the app can promote the best idea instead of only comparing isolated clips.",
  readiness: "ready",
  targetKey: "C minor",
  targetBpm: 96,
  clusters: multiTrackIdeaClusters,
  actionPlans: multiTrackIdeaClusterActionPlans,
  engineNotes: [
    "Idea Cluster sits after Riff Color and before Extraction/Keeper/Arrangement.",
    "It groups multiple colored regions into a single musical idea family.",
    "This is the layer that says: these are not just similar clips, they are the same idea.",
    "Future DSP and AI should replace seed evidence with real audio-derived evidence.",
  ],
};