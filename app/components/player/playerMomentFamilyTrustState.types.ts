import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { RepairImpactResult } from "./playerMomentRepairImpact";
import type { RepairSimulationResult } from "./playerMomentRepairSimulation";

export type FamilyTrustLevel =
  | "broken"
  | "fragile"
  | "watch"
  | "stable"
  | "strong";

export type FamilyTrustReason =
  | "good-stability"
  | "good-drift-health"
  | "good-action-coverage"
  | "good-structural-confidence"
  | "high-drift"
  | "missing-actions"
  | "low-repeat-coverage"
  | "low-structural-confidence"
  | "high-repair-pressure"
  | "repair-upside-available";

export type FamilyTrustStateResult = {
  familyId: string;
  trustScore: number;
  trustLevel: FamilyTrustLevel;
  recoveryScore: number;
  volatilityScore: number;
  repairOpportunityScore: number;
  strongestReason: FamilyTrustReason | null;
  reasons: FamilyTrustReason[];
  driftHealthScore: number | null;
  stabilityScore: number | null;
  actionCoverageScore: number | null;
  structuralConfidenceScore: number | null;
  repeatCoverageScore: number | null;
};

export type FamilyTrustSummaryRow = {
  familyId: string;
  trustScore: number;
  trustLevel: FamilyTrustLevel;
  recoveryScore: number;
  volatilityScore: number;
  repairOpportunityScore: number;
  strongestReason: FamilyTrustReason | null;
  reasonCount: number;
};

export type BuildFamilyTrustStateParams = {
  familyId: string;
  driftFamilyRow?: InspectorPhraseDriftFamilyRow | null;
  stabilityFamilyRow?: InspectorPhraseStabilityFamilyRow | null;
  actionSummaryRow?: InspectorIntendedActionSummaryRow | null;
  repairQueueRow?: InspectorRepairQueueRow | null;
  repairSimulationResult?: RepairSimulationResult | null;
  repairImpactResult?: RepairImpactResult | null;
};