import type { RelationshipExplorerStats } from "./relationshipExplorerTypes";
import { ExplorerStatusPill } from "./RelationshipExplorerHeaderBadges";
import {
  RecommendationCard,
  RouteFutureCard,
  SummaryActionCard,
} from "./RelationshipExplorerMapSummaryActionCards";
import {
  ClusterSummaryCard,
  HeaderMetricCard,
  MapIntelligenceCard,
  RelationshipMapPulse,
  SignalDistributionCard,
} from "./RelationshipExplorerMapSummaryMetricCards";
import { buildRelationshipExplorerMapSummaryModel } from "./relationshipExplorerMapSummaryController";

function StatusPillRow({ labels }: { labels: string[] }) {
  if (!labels.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <ExplorerStatusPill key={label} label={label} />
      ))}
    </div>
  );
}

function CompactPillRow({ labels }: { labels: string[] }) {
  if (!labels.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <ExplorerStatusPill key={label} label={label} />
      ))}
    </div>
  );
}

function ConflictWarning({
  conflict,
}: {
  conflict: ReturnType<
    typeof buildRelationshipExplorerMapSummaryModel
  >["conflict"];
}) {
  if (!conflict.show) return null;

  return (
    <div className="mt-3 rounded-lg border border-yellow-400/40 bg-black p-2">
      <p className="text-[10px] uppercase tracking-[0.15em] text-yellow-300">
        {conflict.label}
      </p>
      <p className="text-[10px] text-yellow-200/70">{conflict.detail}</p>
    </div>
  );
}

function MapSummaryOverview({
  overview,
}: {
  overview: ReturnType<
    typeof buildRelationshipExplorerMapSummaryModel
  >["overview"];
}) {
  return (
    <div className="mt-3 rounded-lg border border-white/15 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
        {overview.label}
      </p>

      <p className="mt-1 text-xs font-medium text-white/70">
        {overview.summaryLine}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-white/40">
        {overview.recommendationHint}
      </p>

      <CompactPillRow labels={overview.readinessPills} />
      <CompactPillRow labels={overview.intelligencePills} />
    </div>
  );
}

function MapSummaryFooter({
  footer,
}: {
  footer: ReturnType<typeof buildRelationshipExplorerMapSummaryModel>["footer"];
}) {
  return (
    <div className="mt-3 rounded-lg border border-white/15 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
        {footer.label}
      </p>

      <p className="mt-1 text-xs leading-5 text-white/55">
        {footer.guidance}
      </p>
    </div>
  );
}

export default function RelationshipExplorerMapSummary({
  stats,
}: {
  stats: RelationshipExplorerStats;
}) {
  const model = buildRelationshipExplorerMapSummaryModel(stats);

  return (
    <div className="mt-4 rounded-xl border border-white/25 bg-black p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.16em] text-white/50">
            {model.header.eyebrow}
          </p>

          <h4 className="mt-2 text-sm font-semibold text-white">
            {model.header.title}
          </h4>

          <p className="mt-1 text-xs leading-5 text-white/55">
            {model.header.detail}
          </p>

          <p className="mt-2 text-xs leading-5 text-white/45">
            {model.header.activeRecordInsight}
          </p>

          <p className="mt-2 text-xs text-white/60">
            {model.header.summaryLine}
          </p>
        </div>

        <StatusPillRow labels={model.header.statusPills} />
      </div>

      <ConflictWarning conflict={model.conflict} />
      <MapSummaryOverview overview={model.overview} />

      <div className="mt-3 grid gap-2 md:grid-cols-4">
        {model.metrics.map((metric) => (
          <HeaderMetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <MapIntelligenceCard intelligence={model.intelligence.raw} />
        <SignalDistributionCard stats={stats} />
        <RelationshipMapPulse pulse={model.pulse} />
        <ClusterSummaryCard
          summary={model.cluster.summary}
          insight={model.cluster.insight}
        />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <SummaryActionCard
          label={model.actions.primary.label}
          detail={model.actions.primary.detail}
        />

        <SummaryActionCard
          label={model.actions.inspect.label}
          detail={model.actions.inspect.detail}
        />

        <RecommendationCard intelligence={model.intelligence.raw} />
        <RouteFutureCard />
      </div>

      <MapSummaryFooter footer={model.footer} />
    </div>
  );
}