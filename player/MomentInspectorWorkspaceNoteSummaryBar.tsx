"use client";

import MomentInspectorWorkspaceMiniStat from "./MomentInspectorWorkspaceMiniStat";
import type { MomentInspectorWorkspaceNoteSummary } from "./momentInspectorWorkspaceNoteSummary";

type MomentInspectorWorkspaceNoteSummaryBarProps = {
  summary: MomentInspectorWorkspaceNoteSummary;
};

export default function MomentInspectorWorkspaceNoteSummaryBar(
  props: MomentInspectorWorkspaceNoteSummaryBarProps
) {
  return (
    <div className="flex flex-wrap gap-2">
      <MomentInspectorWorkspaceMiniStat
        label="Families With Notes"
        value={props.summary.familyCountWithNotes}
      />
      <MomentInspectorWorkspaceMiniStat
        label="Total Notes"
        value={props.summary.totalNoteCount}
      />
      <MomentInspectorWorkspaceMiniStat
        label="Families With Flags"
        value={props.summary.familyCountWithRiskFlags}
      />
      <MomentInspectorWorkspaceMiniStat
        label="Total Flags"
        value={props.summary.totalRiskFlagCount}
      />
    </div>
  );
}