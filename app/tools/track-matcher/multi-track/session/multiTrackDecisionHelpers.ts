import {
  DEFAULT_MULTI_TRACK_DECISION_RECORD,
  MULTI_TRACK_DECISION_OPTIONS,
} from "./multiTrackDecisionSeed";
import type {
  MultiTrackDecisionConfidence,
  MultiTrackDecisionKind,
  MultiTrackDecisionOption,
  MultiTrackDecisionRecord,
  MultiTrackDecisionSnapshot,
} from "./multiTrackDecisionTypes";

export function createDefaultMultiTrackDecisionSnapshot(): MultiTrackDecisionSnapshot {
  return {
    activeDecision: {
      ...DEFAULT_MULTI_TRACK_DECISION_RECORD,
    },
    options: MULTI_TRACK_DECISION_OPTIONS.map((option) => ({
      ...option,
    })),
    history: [
      {
        ...DEFAULT_MULTI_TRACK_DECISION_RECORD,
      },
    ],
  };
}

export function getMultiTrackDecisionOption(
  kind: Exclude<MultiTrackDecisionKind, "undecided">,
): MultiTrackDecisionOption {
  return (
    MULTI_TRACK_DECISION_OPTIONS.find((option) => option.kind === kind) ??
    MULTI_TRACK_DECISION_OPTIONS[0]
  );
}

export function createMultiTrackDecisionRecord({
  confidence,
  kind,
}: {
  confidence?: MultiTrackDecisionConfidence;
  kind: Exclude<MultiTrackDecisionKind, "undecided">;
}): MultiTrackDecisionRecord {
  const option = getMultiTrackDecisionOption(kind);

  return {
    id: `decision-${kind}-${Date.now()}`,
    kind,
    label: option.label,
    detail: option.detail,
    confidence: confidence ?? "medium",
    status: "foundation",
  };
}

export function applyMultiTrackDecision(
  snapshot: MultiTrackDecisionSnapshot,
  kind: Exclude<MultiTrackDecisionKind, "undecided">,
): MultiTrackDecisionSnapshot {
  const nextDecision = createMultiTrackDecisionRecord({
    kind,
  });

  return {
    ...snapshot,
    activeDecision: nextDecision,
    history: [
      nextDecision,
      ...snapshot.history,
    ],
  };
}

export function createDecisionConfidenceLabel(
  confidence: MultiTrackDecisionConfidence,
): string {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  if (confidence === "low") return "Low confidence";
  return "Unknown confidence";
}