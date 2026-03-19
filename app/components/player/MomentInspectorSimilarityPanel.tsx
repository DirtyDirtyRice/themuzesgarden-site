"use client";

import MomentInspectorFamilyPanels from "./MomentInspectorFamilyPanels";
import MomentInspectorRepairPanels from "./MomentInspectorRepairPanels";
import MomentInspectorSimilarityOverview from "./MomentInspectorSimilarityOverview";
import { buildMomentInspectorSimilarity } from "./momentInspectorSimilarity";

type SimilarityState = ReturnType<typeof buildMomentInspectorSimilarity>;

export default function MomentInspectorSimilarityPanel(props: {
  similarityState: SimilarityState;
}) {
  const { similarityState } = props;

  if (!similarityState.selectedMoment) return null;

  const {
    similarityDebugRows,
    stableFamilyDiagnostics,
    repeatDiagnostics,
  } = similarityState;

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
      <MomentInspectorSimilarityOverview
        similarityState={similarityState}
        similarityDebugRows={similarityDebugRows}
      />

      <MomentInspectorFamilyPanels
        similarityState={similarityState}
        stableFamilyDiagnostics={stableFamilyDiagnostics}
        repeatDiagnostics={repeatDiagnostics}
      />

      <MomentInspectorRepairPanels similarityState={similarityState} />
    </div>
  );
}