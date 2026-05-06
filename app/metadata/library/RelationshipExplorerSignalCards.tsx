import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";
import type { MapIntelligence } from "./relationshipExplorerMapSummaryTypes";
import { getSignalDistribution } from "./relationshipExplorerMapSummaryIntelligence";
import { ExplorerStatusPill } from "./RelationshipExplorerHeaderBadges";
import {
  clampPercent,
  getConfidenceDetail,
  getConfidenceLabel,
  getIntelligenceRows,
  getMeterToneLabel,
  type ReadoutRow,
} from "./RelationshipExplorerCardHelpers";
import {
  CardShell,
  MiniMeter,
  ReadoutMiniRows,
  SectionEyebrow,
} from "./RelationshipExplorerMetricCardBasics";

function getDistributionRows(stats: RelationshipExplorerStats): ReadoutRow[] {
  const distribution = getSignalDistribution(stats);

  return [
    {
      label: "Shelf",
      value: `${distribution.shelfCount} / ${distribution.shelfPercent}%`,
      detail: "Records sharing shelf placement with the active record.",
    },
    {
      label: "Section",
      value: `${distribution.sectionCount} / ${distribution.sectionPercent}%`,
      detail: "Records sharing section placement with the active record.",
    },
    {
      label: "Language",
      value: `${distribution.languageCount} / ${distribution.languagePercent}%`,
      detail: "Records sharing title, slug, preview, or useful wording.",
    },
  ];
}

function SignalDistributionMeters({ stats }: { stats: RelationshipExplorerStats }) {
  const distribution = getSignalDistribution(stats);

  return (
    <div className="mt-2">
      <MiniMeter
        label="Shelf signal"
        percent={distribution.shelfPercent}
        detail={getMeterToneLabel(distribution.shelfPercent)}
      />
      <MiniMeter
        label="Section signal"
        percent={distribution.sectionPercent}
        detail={getMeterToneLabel(distribution.sectionPercent)}
      />
      <MiniMeter
        label="Language signal"
        percent={distribution.languagePercent}
        detail={getMeterToneLabel(distribution.languagePercent)}
      />
    </div>
  );
}

export function MapIntelligenceCard({
  intelligence,
}: {
  intelligence: MapIntelligence;
}) {
  return (
    <CardShell>
      <SectionEyebrow label="Map intelligence" />

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ExplorerStatusPill label={intelligence.mapType} />
        <ExplorerStatusPill label={intelligence.clusterStrength} />
        <ExplorerStatusPill label={intelligence.dominantSignal} />
      </div>

      <p className="mt-2 text-xs leading-5 text-white/55">
        {intelligence.signalBalance.label}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-white/35">
        {intelligence.signalBalance.detail}
      </p>

      <MiniMeter
        label={getConfidenceLabel(intelligence.confidenceScore)}
        percent={clampPercent(intelligence.confidenceScore)}
        detail={getConfidenceDetail(intelligence.confidenceScore)}
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        <ExplorerStatusPill label={intelligence.explorationMode} />
        <ExplorerStatusPill label={intelligence.signalStrengthTier} />
        <ExplorerStatusPill label={intelligence.clusterDensity} />
      </div>

      <ReadoutMiniRows rows={getIntelligenceRows(intelligence)} />
    </CardShell>
  );
}

export function SignalDistributionCard({
  stats,
}: {
  stats: RelationshipExplorerStats;
}) {
  const rows = getDistributionRows(stats);

  return (
    <CardShell>
      <SectionEyebrow label="Signal distribution" />
      <SignalDistributionMeters stats={stats} />
      <ReadoutMiniRows rows={rows} />
    </CardShell>
  );
}