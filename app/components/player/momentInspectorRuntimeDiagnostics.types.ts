import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { FamilyTrustStateResult } from "./playerMomentFamilyTrustState";

export type MomentInspectorEngineVerdict =
  | "stable"
  | "watch"
  | "repair"
  | "blocked";

export type MomentInspectorScoreBand =
  | "strong"
  | "good"
  | "soft"
  | "weak";

export type MomentInspectorSeverityBand =
  | "low"
  | "moderate"
  | "high"
  | "severe";

export type MomentInspectorRuntimeDiagnostic = {
  familyId: string;

  confidenceScore: number;
  readinessScore: number;
  driftSeverityScore: number;
  repairPriorityScore: number;

  confidenceBand: MomentInspectorScoreBand;
  readinessBand: MomentInspectorScoreBand;
  driftSeverityBand: MomentInspectorSeverityBand;

  riskFlags: string[];
  diagnosticNotes: string[];

  recommendedNextStep: string;

  engineVerdict: MomentInspectorEngineVerdict;

  missingActions: number;
  nearActions: number;
  unstableMembers: number;

  engineVersion: number;

  trustScore: number | null;
  trustLevel: string | null;
  trustStrongestReason: string | null;
  trustStateResult: FamilyTrustStateResult | null;
};

export type BuildMomentInspectorRuntimeDiagnosticParams = {
  familyId: string;
  actionSummaryRow?: InspectorIntendedActionSummaryRow | null;
  driftFamilyRow?: InspectorPhraseDriftFamilyRow | null;
  repairQueueRow?: InspectorRepairQueueRow | null;
  stabilityFamilyRow?: InspectorPhraseStabilityFamilyRow | null;
  trustStateResult?: FamilyTrustStateResult | null;
};

export type BuildMomentInspectorRuntimeDecisionParams = {
  actionSummaryRow?: InspectorIntendedActionSummaryRow | null;
  driftFamilyRow?: InspectorPhraseDriftFamilyRow | null;
  repairQueueRow?: InspectorRepairQueueRow | null;
  stabilityFamilyRow?: InspectorPhraseStabilityFamilyRow | null;

  confidenceScore: number;
  driftSeverityScore: number;
  readinessScore: number;
};

export type BuildMomentInspectorEngineVerdictParams = {
  confidenceScore: number;
  driftSeverityScore: number;
  repairPriorityScore: number;
  readinessScore: number;

  actionSummaryRow?: InspectorIntendedActionSummaryRow | null;
  stabilityFamilyRow?: InspectorPhraseStabilityFamilyRow | null;
};