import type { RelationshipClusterSummary } from "./relationshipExplorerTypes";
import { ExplorerStatusPill } from "./RelationshipExplorerHeaderBadges";
import {
  getClusterHealthDetail,
  getClusterHealthLabel,
  getClusterRows,
} from "./RelationshipExplorerCardHelpers";
import {
  CardShell,
  MiniMeter,
  ReadoutMiniRows,
  SectionEyebrow,
} from "./RelationshipExplorerMetricCardBasics";

function getClusterPercent(summary: RelationshipClusterSummary) {
  if (summary.strongestCount <= 0) return 0;
  if (summary.strongestCount >= 10) return 100;
  return Math.round((summary.strongestCount / 10) * 100);
}

function getClusterKindLabel(summary: RelationshipClusterSummary) {
  if (summary.strongestKind === "none") return "no strongest kind yet";
  return `${summary.strongestKind} led`;
}

function ClusterGuidance({ insight }: { insight: string }) {
  return (
    <div className="mt-2 border-t border-white/10 pt-2">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
        Cluster guidance
      </p>
      <p className="mt-1 text-[10px] leading-4 text-white/35">{insight}</p>
    </div>
  );
}

export function ClusterSummaryCard({
  summary,
  insight,
}: {
  summary: RelationshipClusterSummary;
  insight: string;
}) {
  const rows = getClusterRows(summary);

  return (
    <CardShell>
      <SectionEyebrow label="Cluster summary" />

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ExplorerStatusPill label={`shelf: ${summary.shelf}`} />
        <ExplorerStatusPill label={`section: ${summary.section}`} />
        <ExplorerStatusPill label={`language: ${summary.language}`} />
      </div>

      <p className="mt-2 text-xs leading-5 text-white/55">
        Strongest: {summary.strongestLabel}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-white/35">
        {summary.strongestCount} records · {summary.strongestKind}
      </p>

      <MiniMeter
        label={getClusterHealthLabel(summary)}
        percent={getClusterPercent(summary)}
        detail={getClusterHealthDetail(summary)}
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ExplorerStatusPill label={getClusterKindLabel(summary)} />
        <ExplorerStatusPill label={`${summary.strongestCount} strongest`} />
      </div>

      <ReadoutMiniRows rows={rows} />
      <ClusterGuidance insight={insight} />
    </CardShell>
  );
}