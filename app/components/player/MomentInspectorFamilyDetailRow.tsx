"use client";

import MomentInspectorActionPanel from "./MomentInspectorActionPanel";
import MomentInspectorDriftPanel from "./MomentInspectorDriftPanel";
import MomentInspectorStabilityPanel from "./MomentInspectorStabilityPanel";

import type {
  InspectorIntendedActionRow,
  InspectorIntendedActionSummaryRow,
} from "./momentInspectorIntendedActionView";
import type {
  InspectorPhraseDriftFamilyRow,
  InspectorPhraseDriftMemberRow,
} from "./momentInspectorPhraseDriftView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";

function getStatusTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function getCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function MomentInspectorFamilyDetailRow(props: {
  selectedActionSummaryRow: InspectorIntendedActionSummaryRow | null;
  selectedActionRows: InspectorIntendedActionRow[];
  selectedDriftFamily: InspectorPhraseDriftFamilyRow | null;
  selectedDriftMembers: InspectorPhraseDriftMemberRow[];
  selectedStabilityFamily: InspectorPhraseStabilityFamilyRow | null;
}) {
  const {
    selectedActionSummaryRow,
    selectedActionRows,
    selectedDriftFamily,
    selectedDriftMembers,
    selectedStabilityFamily,
  } = props;

  const hasActionDetail = Boolean(selectedActionSummaryRow) || selectedActionRows.length > 0;
  const hasDriftDetail = Boolean(selectedDriftFamily) || selectedDriftMembers.length > 0;
  const hasStabilityDetail = Boolean(selectedStabilityFamily);

  return (
    <div className="space-y-2">
      <div className="rounded border border-sky-100 bg-sky-50 px-2 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          Detail Coverage
        </div>

        <div className="mt-1 flex flex-wrap gap-1">
          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasActionDetail
            )}`}
          >
            Action{" "}
            {hasActionDetail
              ? getCountLabel(selectedActionRows.length, "row", "rows")
              : "missing"}
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasDriftDetail
            )}`}
          >
            Drift{" "}
            {hasDriftDetail
              ? getCountLabel(selectedDriftMembers.length, "member", "members")
              : "missing"}
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
              hasStabilityDetail
            )}`}
          >
            Stability {hasStabilityDetail ? "ready" : "missing"}
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <MomentInspectorActionPanel
          row={
            selectedActionSummaryRow
              ? { familyId: selectedActionSummaryRow.familyId }
              : null
          }
          actions={selectedActionRows}
        />

        <MomentInspectorDriftPanel
          family={selectedDriftFamily}
          members={selectedDriftMembers}
        />

        <MomentInspectorStabilityPanel row={selectedStabilityFamily} />
      </div>
    </div>
  );
}