"use client";

import type { MomentInspectorActionSummaryRow } from "./momentInspectorActionSummary";
import MomentInspectorDiagnosticsNotes from "./MomentInspectorDiagnosticsNotes";
import type { MomentInspectorHealthResult } from "./momentInspectorHealth";
import MomentInspectorActionSummaryPanel from "./MomentInspectorActionSummaryPanel";
import MomentInspectorHealthPanel from "./MomentInspectorHealthPanel";

export default function MomentInspectorDiagnosticsPanel(props: {
  actionRows: MomentInspectorActionSummaryRow[];
  health: MomentInspectorHealthResult | null | undefined;
}) {
  const { actionRows, health } = props;

  const hasActionRows = !!actionRows?.length;
  const hasHealth = !!health;

  if (!hasActionRows && !hasHealth) return null;

  return (
    <div className="mt-2 space-y-2">
      <MomentInspectorHealthPanel health={health} />
      <MomentInspectorDiagnosticsNotes health={health} />
      <MomentInspectorActionSummaryPanel rows={actionRows} />
    </div>
  );
}