import type { MultiTrackEngineFindingSeverity } from "../../engine/multiTrackEngineTypes";

export type MultiTrackInsightV2Severity = MultiTrackEngineFindingSeverity;

export type MultiTrackInsightV2Category =
  | "track"
  | "comparison"
  | "timeline"
  | "decision"
  | "snapshot"
  | "workflow";

export type MultiTrackInsightV2Card = {
  id: string;
  category: MultiTrackInsightV2Category;
  severity: MultiTrackInsightV2Severity;
  title: string;
  detail: string;
  recommendation: string;
  actionLabel: string;
};