"use client";

import { useMemo, useState } from "react";
import {
  applyMultiTrackDecision,
  createDecisionConfidenceLabel,
  createDefaultMultiTrackDecisionSnapshot,
} from "../session/multiTrackDecisionHelpers";
import type {
  MultiTrackDecisionKind,
} from "../session/multiTrackDecisionTypes";

type SelectableDecisionKind = Exclude<MultiTrackDecisionKind, "undecided">;

export function useMultiTrackDecision() {
  const [decisionSnapshot, setDecisionSnapshot] = useState(
    createDefaultMultiTrackDecisionSnapshot,
  );

  function selectDecision(kind: SelectableDecisionKind) {
    setDecisionSnapshot((current) =>
      applyMultiTrackDecision(current, kind),
    );
  }

  const activeConfidenceLabel = useMemo(
    () =>
      createDecisionConfidenceLabel(
        decisionSnapshot.activeDecision.confidence,
      ),
    [decisionSnapshot.activeDecision.confidence],
  );

  return {
    activeConfidenceLabel,
    activeDecision: decisionSnapshot.activeDecision,
    decisionHistory: decisionSnapshot.history,
    decisionOptions: decisionSnapshot.options,
    decisionSnapshot,
    selectDecision,
  };
}