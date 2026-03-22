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
  const LegendAny = MomentInspectorWorkspaceLegend as any;
  const summary = (props.summary ?? {}) as any;

  return (
    <div className="space-y-3">
      <MomentInspectorWorkspaceSummaryBar metrics={summary?.metrics ?? []} />
      <LegendAny lanes={summary?.lanes ?? []} />
    </div>
  );
}
