import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { MomentInspectorRuntimeDiagnostic } from "./momentInspectorRuntimeDiagnostics";

export type RepairSimulationScenarioType =
  | "fill-missing-actions"
  | "tighten-near-actions"
  | "reduce-drift"
  | "improve-repeat-coverage"
  | "confidence-reinforcement"
  | "combined-first-pass";

export type RepairSimulationScenario = {
  familyId: string;
  scenarioType: RepairSimulationScenarioType;
  label: string;
  estimatedConfidenceGain: number;
  estimatedReadinessGain: number;
  estimatedRepairPressureDrop: number;
  estimatedDriftReduction: number;
  estimatedStabilityGain: number;
  projectedConfidenceScore: number;
  projectedReadinessScore: number;
  projectedRepairPriorityScore: number;
  projectedDriftSeverityScore: number;
  projectedStabilityScore: number | null;
  payoffScore: number;
  impactScore: number;
  priorityScore: number;
  summary: string;
};

export type RepairSimulationResult = {
  familyId: string;
  baselineConfidenceScore: number;
  baselineReadinessScore: number;
  baselineRepairPriorityScore: number;
  baselineDriftSeverityScore: number;
  baselineStabilityScore: number | null;
  scenarios: RepairSimulationScenario[];
  bestScenario: RepairSimulationScenario | null;
  bestPriorityScore: number;
  totalScenarioCount: number;
};

export type BuildRepairSimulationParams = {
  familyId: string;
  runtimeDiagnostic?: MomentInspectorRuntimeDiagnostic | null;
  actionSummaryRow?: InspectorIntendedActionSummaryRow | null;
  driftFamilyRow?: InspectorPhraseDriftFamilyRow | null;
  repairQueueRow?: InspectorRepairQueueRow | null;
  stabilityFamilyRow?: InspectorPhraseStabilityFamilyRow | null;
};