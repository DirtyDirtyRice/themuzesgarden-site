import type { AnyTrack } from "./playerTypes";
import type { IntendedActionPlan } from "./playerMomentIntendedActions";
import type { PhraseDriftEngineResult } from "./playerMomentPhraseDrift";
import type { PhraseStabilityEngineResult } from "./playerMomentPhraseStability";
import type { RepairSimulationResult } from "./playerMomentRepairSimulation";

import type {
  FamilyTrustStateResult,
  FamilyTrustSummaryRow,
} from "./playerMomentFamilyTrustState";
import type { FamilyLineageResult } from "./playerMomentFamilyLineage";
import type { ConfidenceHistoryResult } from "./playerMomentConfidenceHistory";
import type { MetadataClarificationResult } from "./metadataClarification";

export function normalizeInspectorText(value: unknown): string {
  return String(value ?? "").trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readPath(source: unknown, path: string[]): unknown {
  let current: unknown = source;

  for (const key of path) {
    const obj = asRecord(current);

    if (!obj || !(key in obj)) return null;

    current = obj[key];
  }

  return current;
}

function readFirstCandidate(sourceList: unknown[], paths: string[][]): unknown {
  for (const source of sourceList) {
    for (const path of paths) {
      const value = readPath(source, path);

      if (value !== null && value !== undefined) {
        return value;
      }
    }
  }

  return null;
}

export function getOptionalPhraseDriftResult(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): PhraseDriftEngineResult | null {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["phraseDriftResult"],
      ["momentIntelligence", "phraseDriftResult"],
      ["inspector", "phraseDriftResult"],
      ["runtime", "phraseDriftResult"],
    ]
  );

  return (value as PhraseDriftEngineResult | null) ?? null;
}

export function getOptionalPhraseStabilityResult(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): PhraseStabilityEngineResult | null {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["phraseStabilityResult"],
      ["momentIntelligence", "phraseStabilityResult"],
      ["inspector", "phraseStabilityResult"],
      ["runtime", "phraseStabilityResult"],
    ]
  );

  return (value as PhraseStabilityEngineResult | null) ?? null;
}

export function getOptionalRepairSimulationResult(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): RepairSimulationResult | null {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["repairSimulationResult"],
      ["momentIntelligence", "repairSimulationResult"],
      ["inspector", "repairSimulationResult"],
      ["runtime", "repairSimulationResult"],
    ]
  );

  return (value as RepairSimulationResult | null) ?? null;
}

export function getOptionalIntendedActionPlans(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): IntendedActionPlan[] {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["intendedActionPlans"],
      ["momentIntelligence", "intendedActionPlans"],
      ["intendedActionResult", "plans"],
      ["momentIntelligence", "intendedActionResult", "plans"],
      ["inspector", "intendedActionPlans"],
      ["runtime", "intendedActionPlans"],
    ]
  );

  return Array.isArray(value) ? (value as IntendedActionPlan[]) : [];
}

export function getOptionalFamilyTrustStateResult(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): FamilyTrustStateResult | null {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["familyTrustStateResult"],
      ["momentIntelligence", "familyTrustStateResult"],
      ["inspector", "familyTrustStateResult"],
      ["runtime", "familyTrustStateResult"],
    ]
  );

  return (value as FamilyTrustStateResult | null) ?? null;
}

export function getOptionalFamilyTrustStateByFamilyId(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): Record<string, FamilyTrustStateResult> {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["trustStateByFamilyId"],
      ["momentIntelligence", "trustStateByFamilyId"],
      ["inspector", "trustStateByFamilyId"],
      ["runtime", "trustStateByFamilyId"],
    ]
  );

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, FamilyTrustStateResult>;
}

export function getOptionalFamilyTrustSummaryRows(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): FamilyTrustSummaryRow[] {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["trustSummaryRows"],
      ["momentIntelligence", "trustSummaryRows"],
      ["inspector", "trustSummaryRows"],
      ["runtime", "trustSummaryRows"],
    ]
  );

  return Array.isArray(value) ? (value as FamilyTrustSummaryRow[]) : [];
}

export function getOptionalFamilyLineageResult(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): FamilyLineageResult | null {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["familyLineageResult"],
      ["momentIntelligence", "familyLineageResult"],
      ["inspector", "familyLineageResult"],
      ["runtime", "familyLineageResult"],
    ]
  );

  return (value as FamilyLineageResult | null) ?? null;
}

export function getOptionalConfidenceHistoryResult(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): ConfidenceHistoryResult | null {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["confidenceHistoryResult"],
      ["momentIntelligence", "confidenceHistoryResult"],
      ["inspector", "confidenceHistoryResult"],
      ["runtime", "confidenceHistoryResult"],
    ]
  );

  return (value as ConfidenceHistoryResult | null) ?? null;
}

export function getOptionalMetadataClarificationResult(params: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: unknown;
}): MetadataClarificationResult | null {
  const value = readFirstCandidate(
    [params.selectedTrack, params.discoverySnapshot],
    [
      ["metadataClarificationResult"],
      ["momentIntelligence", "metadataClarificationResult"],
      ["inspector", "metadataClarificationResult"],
      ["runtime", "metadataClarificationResult"],
    ]
  );

  return (value as MetadataClarificationResult | null) ?? null;
}