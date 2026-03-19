"use client";

import MomentInspectorDiagnosticsPanel from "./MomentInspectorDiagnosticsPanel";
import MomentInspectorDiscoveryStatus from "./MomentInspectorDiscoveryStatus";
import MomentInspectorSimilarityPanel from "./MomentInspectorSimilarityPanel";
import MomentInspectorSummary from "./MomentInspectorSummary";
import MomentInspectorTagPanels from "./MomentInspectorTagPanels";

export default function MomentInspectorHostSummaryStack(props: any) {
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