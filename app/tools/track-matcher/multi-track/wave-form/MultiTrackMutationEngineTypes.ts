
export type MultiTrackMutationEngineReadiness =
  | "ready"
  | "needs-riff-groups"
  | "needs-similarity"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackMutationEngineStatus =
  | "mapped"
  | "estimated"
  | "seeded"
  | "missing"
  | "future";

export type MultiTrackMutationEngineRisk =
  | "low"
  | "medium"
  | "high"
  | "blocked";

export type MultiTrackMutationEngineMutationKind =
  | "timing-shift"
  | "energy-lift"
  | "melody-shape"
  | "rhythm-change"
  | "section-move"
  | "density-change"
  | "arrangement-change"
  | "unknown";

export type MultiTrackMutationEngineSurvivalState =
  | "survived"
  | "mutated"
  | "weakened"
  | "lost"
  | "unknown";

export type MultiTrackMutationEngineSourceKind =
  | "original"
  | "suno-version"
  | "stem"
  | "hybrid-render"
  | "reference";

export type MultiTrackMutationEngineVersion = {
  versionId: string;
  title: string;
  sourceKind: MultiTrackMutationEngineSourceKind;
  fileLabel: string;
  order: number;
  riffFamilyId: string;
  startMs: number;
  endMs: number;
  similarityScore: number;
  confidence: number;
  driftMs: number;
  energyScore: number;
  transientScore: number;
  survivalState: MultiTrackMutationEngineSurvivalState;
  status: MultiTrackMutationEngineStatus;
  risk: MultiTrackMutationEngineRisk;
};

export type MultiTrackMutationEngineMutation = {
  mutationId: string;
  title: string;
  fromVersionId: string;
  toVersionId: string;
  mutationKind: MultiTrackMutationEngineMutationKind;
  amount: number;
  amountLabel: string;
  detail: string;
  impact: string;
  status: MultiTrackMutationEngineStatus;
  risk: MultiTrackMutationEngineRisk;
};

export type MultiTrackMutationEngineFamily = {
  familyId: string;
  title: string;
  riffFamilyId: string;
  sourceSegmentIds: string[];
  versionIds: string[];
  mutationIds: string[];
  survivalScore: number;
  mutationScore: number;
  keeperPotential: number;
  detail: string;
  recommendation: string;
  status: MultiTrackMutationEngineStatus;
  risk: MultiTrackMutationEngineRisk;
};

export type MultiTrackMutationEngineFinding = {
  findingId: string;
  title: string;
  detail: string;
  action: string;
  status: MultiTrackMutationEngineStatus;
  risk: MultiTrackMutationEngineRisk;
};

export type MultiTrackMutationEngineWorkspace = {
  workspaceId: string;
  title: string;
  summary: string;
  readiness: MultiTrackMutationEngineReadiness;
  readinessLabel: string;
  engineGoal: string;
  engineBoundary: string;
  versions: MultiTrackMutationEngineVersion[];
  mutations: MultiTrackMutationEngineMutation[];
  families: MultiTrackMutationEngineFamily[];
  findings: MultiTrackMutationEngineFinding[];
  engineRules: string[];
  nextSteps: string[];
};