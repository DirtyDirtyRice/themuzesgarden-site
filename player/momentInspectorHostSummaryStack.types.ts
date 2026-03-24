import type { ComponentProps } from "react";
import MomentInspectorSummary from "./MomentInspectorSummary";
import MomentInspectorDiscoveryStatus from "./MomentInspectorDiscoveryStatus";
import MomentInspectorSimilarityPanel from "./MomentInspectorSimilarityPanel";
import MomentInspectorTagPanels from "./MomentInspectorTagPanels";
import MomentInspectorDiagnosticsPanel from "./MomentInspectorDiagnosticsPanel";

type MomentInspectorHostSummaryStackProps = {
  summaryProps: ComponentProps<typeof MomentInspectorSummary>;
  discoveryProps: ComponentProps<typeof MomentInspectorDiscoveryStatus>;
  similarityProps: ComponentProps<typeof MomentInspectorSimilarityPanel>;
  tagProps: ComponentProps<typeof MomentInspectorTagPanels>;
  diagnosticsProps: ComponentProps<typeof MomentInspectorDiagnosticsPanel>;
};

export default MomentInspectorHostSummaryStackProps;