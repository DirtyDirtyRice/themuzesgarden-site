import type {
  RelationshipTypeSummary,
  ResolvedRelationship,
} from "./metadataRecordRelationshipTypes";

type DashboardProps = {
  totalCount: number;
  primaryRelationship: ResolvedRelationship | null;
  typeSummaries: RelationshipTypeSummary[];
  activeType: string | null;
  filteredCount: number;
  onTypeFilterChange: (type: string) => void;
  onClearTypeFilter: () => void;
};

type DashboardTone = "strong" | "steady" | "quiet";

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  href: string;
  tone: DashboardTone;
};

function getDashboardToneClass(tone: DashboardTone) {
  if (tone === "strong") {
    return "border-white/35 bg-white/[0.08] hover:border-white/55 hover:bg-white/[0.11]";
  }

  if (tone === "steady") {
    return "border-white/25 bg-white/[0.055] hover:border-white/45 hover:bg-white/[0.09]";
  }

  return "border-white/15 bg-white/[0.035] hover:border-white/35 hover:bg-white/[0.07]";
}

function getTopSummary(typeSummaries: RelationshipTypeSummary[]) {
  return typeSummaries.reduce<RelationshipTypeSummary | null>(
    (currentTopSummary, summary) => {
      if (!currentTopSummary || summary.count > currentTopSummary.count) {
        return summary;
      }

      return currentTopSummary;
    },
    null,
  );
}

function getCoverageLabel(totalCount: number, groupCount: number) {
  if (totalCount === 0) {
    return "No saved map yet";
  }

  if (groupCount <= 1) {
    return "Focused map";
  }

  if (groupCount <= 3) {
    return "Balanced map";
  }

  return "Wide map";
}

function getDashboardMetrics({
  totalCount,
  primaryRelationship,
  typeSummaries,
}: Pick<
  DashboardProps,
  "totalCount" | "primaryRelationship" | "typeSummaries"
>): DashboardMetric[] {
  const topSummary = getTopSummary(typeSummaries);
  const groupCount = typeSummaries.length;
  const coverageLabel = getCoverageLabel(totalCount, groupCount);

  return [
    {
      label: "Total",
      value: String(totalCount),
      detail:
        totalCount === 1
          ? "1 saved connection"
          : `${totalCount} saved connections`,
      href: "#relationship-list",
      tone: totalCount > 0 ? "strong" : "quiet",
    },
    {
      label: "Primary",
      value: primaryRelationship?.displayTarget ?? "None",
      detail: primaryRelationship?.displayType ?? "No connection yet",
      href: "#relationship-list",
      tone: primaryRelationship ? "steady" : "quiet",
    },
    {
      label: "Top group",
      value: topSummary?.type ?? "None",
      detail: topSummary ? `${topSummary.count} in this group` : coverageLabel,
      href: topSummary ? `#${topSummary.anchor}` : "#relationship-types",
      tone: topSummary ? "steady" : "quiet",
    },
  ];
}

function RelationshipDashboardButton({ metric }: { metric: DashboardMetric }) {
  return (
    <a
      href={metric.href}
      className={`rounded-xl border px-3 py-2 text-left transition ${getDashboardToneClass(
        metric.tone,
      )}`}
    >
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
        {metric.label}
      </span>

      <span className="mt-1 block truncate text-sm font-black text-white">
        {metric.value}
      </span>

      <span className="mt-1 block text-xs leading-5 text-white/80">
        {metric.detail}
      </span>
    </a>
  );
}

function RelationshipTypeJumpLink({
  summary,
  activeType,
  isTopSummary,
  onTypeFilterChange,
}: {
  summary: RelationshipTypeSummary;
  activeType: string | null;
  isTopSummary: boolean;
  onTypeFilterChange: (type: string) => void;
}) {
  const isActive = activeType === summary.type;

  return (
    <button
      type="button"
      onClick={() => onTypeFilterChange(summary.type)}
      className={`rounded-full border px-3 py-1 text-xs font-black transition ${
        isActive
          ? "border-white bg-white text-black"
          : isTopSummary
            ? "border-white/45 bg-white/[0.1] text-white"
            : "border-white/20 text-white/90 hover:border-white/40 hover:bg-white/[0.06]"
      }`}
      title={
        isActive
          ? `Clear ${summary.type} relationship filter`
          : `Filter to ${summary.type} relationships`
      }
    >
      {summary.type} · {summary.count}
      {isActive ? " · showing" : isTopSummary ? " · top" : ""}
    </button>
  );
}

function RelationshipTypeJumpStrip({
  typeSummaries,
  activeType,
  filteredCount,
  totalCount,
  onTypeFilterChange,
  onClearTypeFilter,
}: {
  typeSummaries: RelationshipTypeSummary[];
  activeType: string | null;
  filteredCount: number;
  totalCount: number;
  onTypeFilterChange: (type: string) => void;
  onClearTypeFilter: () => void;
}) {
  const topSummary = getTopSummary(typeSummaries);

  if (typeSummaries.length === 0) {
    return (
      <div
        id="relationship-types"
        className="rounded-xl border border-white/20 bg-white/[0.04] px-3 py-2"
      >
        <p className="text-xs font-bold text-white/90">
          Relationship filters appear here after this record has saved
          connections.
        </p>
      </div>
    );
  }

  return (
    <div
      id="relationship-types"
      className="rounded-xl border border-white/15 bg-white/[0.025] p-2"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
          Filter by relationship group
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-bold text-white/70">
            {activeType
              ? `${filteredCount} of ${totalCount} shown`
              : `${typeSummaries.length} groups · click to filter`}
          </p>

          {activeType ? (
            <button
              type="button"
              onClick={onClearTypeFilter}
              className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-black text-white/85 transition hover:border-white/40 hover:bg-white/[0.08]"
            >
              Show all
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {typeSummaries.map((summary) => (
          <RelationshipTypeJumpLink
            key={summary.anchor}
            summary={summary}
            activeType={activeType}
            isTopSummary={summary.anchor === topSummary?.anchor}
            onTypeFilterChange={onTypeFilterChange}
          />
        ))}
      </div>
    </div>
  );
}

export default function MetadataRecordRelationshipDashboard({
  totalCount,
  primaryRelationship,
  typeSummaries,
  activeType,
  filteredCount,
  onTypeFilterChange,
  onClearTypeFilter,
}: DashboardProps) {
  const dashboardMetrics = getDashboardMetrics({
    totalCount,
    primaryRelationship,
    typeSummaries,
  });

  return (
    <>
      <div
        id="relationship-dashboard"
        className="mb-2 grid gap-2 md:grid-cols-3"
      >
        {dashboardMetrics.map((metric) => (
          <RelationshipDashboardButton key={metric.label} metric={metric} />
        ))}
      </div>

      <RelationshipTypeJumpStrip
        typeSummaries={typeSummaries}
        activeType={activeType}
        filteredCount={filteredCount}
        totalCount={totalCount}
        onTypeFilterChange={onTypeFilterChange}
        onClearTypeFilter={onClearTypeFilter}
      />
    </>
  );
}