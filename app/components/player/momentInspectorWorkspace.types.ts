export type MomentInspectorWorkspaceLane = "watch" | "repair" | "blocked";

export type MomentInspectorWorkspaceSortMode =
  | "priority"
  | "confidence"
  | "readiness"
  | "alphabetical";

export type MomentInspectorWorkspaceFamilySource = {
  familyId?: string | null;
  label?: string | null;
  title?: string | null;
  familyLabel?: string | null;
  familyTitle?: string | null;
  verdict?: string | null;
  confidenceScore?: number | null;
  readinessScore?: number | null;
  repairPriorityScore?: number | null;
  driftSeverityScore?: number | null;
  riskFlags?: string[] | null;
  diagnosticNotes?: string[] | null;
  recommendedNextStep?: string | null;
  pinned?: boolean | null;
  bookmarked?: boolean | null;
  compared?: boolean | null;
  blocked?: boolean | null;
  watch?: boolean | null;
  repair?: boolean | null;
};

export type MomentInspectorWorkspaceFamilyItem = {
  familyId: string;
  label: string;
  title: string;
  verdict: string;
  lane: MomentInspectorWorkspaceLane;

  confidenceScore: number | null;
  readinessScore: number | null;
  repairPriorityScore: number | null;
  driftSeverityScore: number | null;

  riskFlags: string[];
  diagnosticNotes: string[];
  recommendedNextStep: string | null;

  pinned: boolean;
  bookmarked: boolean;
  compared: boolean;

  source: MomentInspectorWorkspaceFamilySource;
};

export type MomentInspectorWorkspaceLaneSummary = {
  lane: MomentInspectorWorkspaceLane;
  label: string;
  count: number;
};

export type MomentInspectorWorkspaceQueue = {
  lane: MomentInspectorWorkspaceLane;
  label: string;
  items: MomentInspectorWorkspaceFamilyItem[];
  count: number;
};

export type MomentInspectorWorkspaceDerivedState = {
  activeLane: MomentInspectorWorkspaceLane;
  searchQuery: string;
  sortMode: MomentInspectorWorkspaceSortMode;

  laneSummaries: MomentInspectorWorkspaceLaneSummary[];
  queues: Record<MomentInspectorWorkspaceLane, MomentInspectorWorkspaceQueue>;
  activeItems: MomentInspectorWorkspaceFamilyItem[];
  totalCount: number;
};

export type MomentInspectorWorkspaceBuildParams = {
  familySources?: MomentInspectorWorkspaceFamilySource[];
  activeLane?: MomentInspectorWorkspaceLane;
  searchQuery?: string;
  sortMode?: MomentInspectorWorkspaceSortMode;
};

export type MomentInspectorWorkspaceStateParams = {
  familySources?: MomentInspectorWorkspaceFamilySource[];
  initialLane?: MomentInspectorWorkspaceLane;
  initialSearchQuery?: string;
  initialSortMode?: MomentInspectorWorkspaceSortMode;
};

export type MomentInspectorWorkspaceBarProps = {
  laneSummaries: MomentInspectorWorkspaceLaneSummary[];
  activeLane: MomentInspectorWorkspaceLane;
  onLaneChange: (lane: MomentInspectorWorkspaceLane) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  totalCount: number;
};

export type MomentInspectorWorkspacePanelProps = {
  familySources?: MomentInspectorWorkspaceFamilySource[];
  initialLane?: MomentInspectorWorkspaceLane;
  initialSearchQuery?: string;
  initialSortMode?: MomentInspectorWorkspaceSortMode;
  title?: string;
  subtitle?: string;
};