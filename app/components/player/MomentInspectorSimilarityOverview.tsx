"use client";

import { buildMomentInspectorSimilarity } from "./momentInspectorSimilarity";

type SimilarityState = ReturnType<typeof buildMomentInspectorSimilarity>;

export default function MomentInspectorSimilarityOverview(props: {
  similarityState: SimilarityState;
}) {
  const { similarityState } = props;

  const selectedRepeatDiagnostics =
    similarityState.selectedFamily
      ? similarityState.repeatDiagnostics.find(
          (row) => row.familyId === similarityState.selectedFamily?.id
        ) ?? null
      : null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-sm font-semibold text-zinc-900">
        Similarity Overview
      </div>

      <div className="mt-2 text-xs text-zinc-500">
        Selected Family:
      </div>

      <div className="text-sm text-zinc-800">
        {similarityState.selectedFamily?.id ?? "None"}
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        Repeat Diagnostics:
      </div>

      <div className="text-sm text-zinc-800">
        {selectedRepeatDiagnostics
          ? JSON.stringify(selectedRepeatDiagnostics)
          : "No diagnostics available"}
      </div>
    </div>
  );
}
