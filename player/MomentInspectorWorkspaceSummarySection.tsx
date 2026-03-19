"use client";

import MomentInspectorWorkspaceLegend from "./MomentInspectorWorkspaceLegend";
import MomentInspectorWorkspaceSummaryBar from "./MomentInspectorWorkspaceSummaryBar";
import type { MomentInspectorWorkspaceSummary } from "./momentInspectorWorkspaceSummary";

type MomentInspectorWorkspaceSummarySectionProps = {
  summary: MomentInspectorWorkspaceSummary;
};

export default function MomentInspectorWorkspaceSummarySection(
  props: MomentInspectorWorkspaceSummarySectionProps
) {
  return (
    <div className="space-y-3">
      <MomentInspectorWorkspaceSummaryBar metrics={props.summary.metrics} />
      <MomentInspectorWorkspaceLegend />
    </div>
  );
}