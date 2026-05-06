"use client";

import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

import {
  WhyThisMatchPanel,
  MatchedWordsPanel,
  ScoreBreakdownPanel,
} from "./RelationshipExplorerDetailPanels";

export function RecordCardPanels({ signal }: { signal: RelatedRecordSignal }) {
  return (
    <>
      <WhyThisMatchPanel signal={signal} />
      <MatchedWordsPanel signal={signal} />
      <ScoreBreakdownPanel signal={signal} />
    </>
  );
}