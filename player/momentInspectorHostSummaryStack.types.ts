"use client";

import MomentInspectorSummary from "./MomentInspectorSummary";
import MomentInspectorDiscoveryStatus from "./MomentInspectorDiscoveryStatus";
import MomentInspectorSimilarityPanel from "./MomentInspectorSimilarityPanel";
import MomentInspectorTagPanels from "./MomentInspectorTagPanels";
import MomentInspectorDiagnosticsPanel from "./MomentInspectorDiagnosticsPanel";
import type { MomentInspectorHostSummaryStackProps } from "./momentInspectorHostSummaryStack.types";

export default function MomentInspectorHostSummaryStack(
  props: MomentInspectorHostSummaryStackProps
) {
  return (
    <>
      <MomentInspectorSummary {...props.summaryProps} />
      <MomentInspectorDiscoveryStatus {...props.discoveryProps} />
      <MomentInspectorSimilarityPanel {...props.similarityProps} />
      <MomentInspectorTagPanels {...props.tagProps} />
      <MomentInspectorDiagnosticsPanel {...props.diagnosticsProps} />
    </>
  );
}