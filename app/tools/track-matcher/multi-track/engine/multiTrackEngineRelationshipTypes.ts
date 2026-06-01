import type {
  MultiTrackEngineReadinessLevel,
  MultiTrackEngineSignalPolarity,
  MultiTrackEngineTrackSlotId,
} from "./multiTrackEngineTypes";

export type MultiTrackEngineRelationshipKind =
  | "tempo"
  | "key"
  | "energy"
  | "genre"
  | "instrument"
  | "vocal"
  | "section"
  | "confidence";

export type MultiTrackEngineRelationshipStrength =
  | "unknown"
  | "weak"
  | "usable"
  | "strong"
  | "excellent";

export type MultiTrackEngineRelationshipItem = {
  id: string;
  kind: MultiTrackEngineRelationshipKind;
  label: string;
  trackALabel: string;
  trackBLabel: string;
  detail: string;
  score: number;
  confidence: number;
  strength: MultiTrackEngineRelationshipStrength;
  polarity: MultiTrackEngineSignalPolarity;
  ready: boolean;
};

export type MultiTrackEngineRelationshipFocus = {
  id: string;
  label: string;
  detail: string;
  trackSlotId: MultiTrackEngineTrackSlotId | "both";
  priority: number;
};

export type MultiTrackEngineRelationshipState = {
  readiness: MultiTrackEngineReadinessLevel;
  summary: string;
  strongestRelationshipLabel: string;
  weakestRelationshipLabel: string;
  averageScore: number;
  averageConfidence: number;
  relationships: MultiTrackEngineRelationshipItem[];
  focusItems: MultiTrackEngineRelationshipFocus[];
};