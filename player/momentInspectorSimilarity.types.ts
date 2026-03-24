import type { AnyTrack, TrackSection } from "./playerTypes";
import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";
import type {
  IntendedActionPlan,
  IntendedActionResult,
} from "./playerMomentIntendedActions";
import type {
  IntendedRepeatFamilyPlan,
  IntendedRepeatResult,
} from "./playerMomentIntendedRepeat";
import type {
  PhraseDriftEngineResult,
  PhraseDriftFamilyResult,
} from "./playerMomentPhraseDrift";
import type {
  MomentFamily,
  MomentSimilarityComparable,
  MomentSimilarityResult,
  RepeatPlan,
} from "./playerMomentSimilarityTypes";

type PhraseStabilityLabel = "solid" | "good" | "fragile" | "unstable";

type PhraseStabilityIssueFlag =
  | "missing-repeats"
  | "near-repeats"
  | "timing-drift"
  | "duration-drift"
  | "high-severity-drift"
  | "low-confidence";

export type PhraseStabilityFamilyResult = {
  familyId: string;
  anchorMomentId: string;
  stabilityScore: number;
  stabilityLabel: PhraseStabilityLabel;
  timingConsistency: number;
  durationConsistency: number;
  repeatCoverage: number;
  structuralConfidence: number;
  highestDriftSeverity: "none" | "low" | "medium" | "high";
  issueFlags: PhraseStabilityIssueFlag[];
};

export type PhraseStabilityEngineResult = {
  families: PhraseStabilityFamilyResult[];
  byFamilyId: Record<string, PhraseStabilityFamilyResult>;
};

export type InspectorComparableMoment = MomentSimilarityComparable & {
  momentId: string;
  duration: number | null;
  hasDescription: boolean;
  tagCount: number;
  structuralStrength: number;
  repeatCandidate: boolean;
  timingClusterKey: string;
};

export type InspectorSimilarityDebugRow = {
  momentId: string;
  similarityScore: number;
  timingDistance: number;
  tagOverlap: number;
  descriptionOverlap: number;
  structuralConfidence: number;
  repeatCandidate: boolean;
};

export type InspectorStableFamilyDiagnostics = {
  familyId: string;
  familySize: number;
  avgSimilarity: number;
  timingSpread: number;
  familyConfidence: number;
  familyAnchorMomentId: string;
  ungroupedRisk: number;
};

export type InspectorRepeatDiagnostics = {
  familyId: string;
  estimatedInterval: number | null;
  observedGapCount: number;
  repeatConfidence: number;
};

export type BuildMomentInspectorSimilarityResult = {
  moments: InspectorComparableMoment[];
  selectedMoment: InspectorComparableMoment | null;
  similarMoments: MomentSimilarityResult[];
  similarityDebugRows: InspectorSimilarityDebugRow[];
  families: MomentFamily[];
  selectedFamily: MomentFamily | null;
  repeatPlan: RepeatPlan | null;
  stableFamilies: MomentFamilyEngineFamily[];
  stableSelectedFamily: MomentFamilyEngineFamily | null;
  familyByMomentId: Record<string, string>;
  ungroupedMomentIds: string[];
  stableFamilyDiagnostics: InspectorStableFamilyDiagnostics[];
  repeatDiagnostics: InspectorRepeatDiagnostics[];
  intendedRepeatMetadata: IntendedRepeatResult;
  selectedIntendedPlan: IntendedRepeatFamilyPlan | null;
  intendedActionResult: IntendedActionResult;
  selectedIntendedActionPlan: IntendedActionPlan | null;
  phraseDriftResult: PhraseDriftEngineResult;
  selectedPhraseDriftFamily: PhraseDriftFamilyResult | null;
  phraseStabilityResult: PhraseStabilityEngineResult;
  selectedPhraseStabilityFamily: PhraseStabilityFamilyResult | null;
};

export type BuildMomentInspectorSimilarityParams = {
  track: AnyTrack | null;
  sections: TrackSection[];
  selectedSectionId: string;
};

export type InspectorSimilarityFamilyIdMap = Record<string, string>;
