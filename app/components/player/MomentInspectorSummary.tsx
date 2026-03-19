import { barWidth, pctLabel } from "./momentInspectorHelpers";
import { getMomentInspectorDiscoveryStatus } from "./momentInspectorSummary.discovery";
import { getMomentInspectorMetadataStatus } from "./momentInspectorSummary.metadata";
import { getMomentInspectorReadinessLabel } from "./momentInspectorSummary.readiness";
import type { MomentInspectorSummaryProps } from "./momentInspectorSummary.types";

function SummaryChip(props: {
  label: string;
  chipClass: string;
  title?: string;
}) {
  const { label, chipClass, title } = props;

  return (
    <div
      className={["rounded-full border px-2 py-0.5 text-[10px]", chipClass].join(" ")}
      title={title}
    >
      {label}
    </div>
  );
}

function SummaryStatCard(props: {
  label: string;
  value: string | number;
}) {
  const { label, value } = props;

  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="text-[12px] font-medium text-zinc-800">{value}</div>
    </div>
  );
}

function SnapshotMetricCard(props: {
  label: string;
  value: string | number;
  cardClass: string;
  labelClass: string;
  valueClass: string;
}) {
  const { label, value, cardClass, labelClass, valueClass } = props;

  return (
    <div className={["rounded border bg-white px-2 py-2", cardClass].join(" ")}>
      <div className={["text-[10px]", labelClass].join(" ")}>{label}</div>
      <div className={["text-[12px] font-medium", valueClass].join(" ")}>{value}</div>
    </div>
  );
}

function CoverageBar(props: {
  label: string;
  ratio: number;
}) {
  const { label, ratio } = props;

  return (
    <div>
      <div className="mb-1 text-[10px] text-zinc-500">{label}</div>
      <div className="h-2 overflow-hidden rounded bg-zinc-100">
        <div className="h-full bg-zinc-700" style={{ width: barWidth(ratio) }} />
      </div>
    </div>
  );
}

function hasDiscoverySummaryValue(summary: MomentInspectorSummaryProps["discoverySummary"]): boolean {
  return Boolean(summary) &&
    ((summary?.matchedMomentCount ?? 0) > 0 ||
      (summary?.clusterCount ?? 0) > 0 ||
      (summary?.primaryHeat ?? 0) > 0 ||
      (summary?.matchedTagCount ?? 0) > 0);
}

function hasMetadataSummaryValue(summary: MomentInspectorSummaryProps["metadataSummary"]): boolean {
  return Boolean(summary) && (summary?.totalLinks ?? 0) > 0;
}

export default function MomentInspectorSummary(props: MomentInspectorSummaryProps) {
  const {
    selectedTrackLabel,
    selectedTrackId,
    selectedTrackPath,
    healthTone,
    healthScore,
    trackTagsCount,
    momentTagsCount,
    descriptionsCount,
    sectionsCount,
    sectionsWithTags,
    sectionsWithDescription,
    sectionsWithStart,
    densityStats,
    dataWarnings,
    discoverySummary,
    metadataSummary,
  } = props;

  const warningCount = dataWarnings.length;

  const readiness = getMomentInspectorReadinessLabel({
    sectionsCount,
    sectionsWithTags,
    sectionsWithDescription,
    sectionsWithStart,
    warningCount,
  });

  const discoveryStatus = getMomentInspectorDiscoveryStatus(discoverySummary);
  const metadataStatus = getMomentInspectorMetadataStatus(metadataSummary);

  const hasDiscoverySummary = hasDiscoverySummaryValue(discoverySummary);
  const hasMetadataSummary = hasMetadataSummaryValue(metadataSummary);

  const scopedLinkCount =
    (metadataSummary?.sectionLinks ?? 0) +
    (metadataSummary?.momentLinks ?? 0) +
    (metadataSummary?.trackLinks ?? 0);

  return (
    <>
      <div className="rounded-lg border bg-white px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-medium text-zinc-700">Selected Track</div>

          <div className="flex flex-wrap items-center gap-1">
            <SummaryChip
              label={`${healthTone.label} • ${healthScore}`}
              chipClass={healthTone.chipClass}
              title={`Inspector health score: ${healthScore}`}
            />

            <SummaryChip
              label={readiness.label}
              chipClass={readiness.chipClass}
              title="General readiness for future discovery/database work"
            />

            <SummaryChip
              label={`Warnings ${warningCount}`}
              chipClass={
                warningCount > 0
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }
              title="Inspector warning count"
            />

            {discoveryStatus ? (
              <SummaryChip
                label={discoveryStatus.label}
                chipClass={discoveryStatus.chipClass}
                title="Discovery engine activity status"
              />
            ) : null}

            {metadataStatus ? (
              <SummaryChip
                label={metadataStatus.label}
                chipClass={metadataStatus.chipClass}
                title="Metadata clarification coverage status"
              />
            ) : null}
          </div>
        </div>

        <div className="mt-1 text-[11px] text-zinc-800">{selectedTrackLabel}</div>
        <div className="mt-1 break-all text-[10px] text-zinc-500">ID: {selectedTrackId}</div>
        <div className="mt-1 break-all text-[10px] text-zinc-500">Path: {selectedTrackPath}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SummaryStatCard label="Track Tags" value={trackTagsCount} />
        <SummaryStatCard label="Moment Tags" value={momentTagsCount} />
        <SummaryStatCard label="Descriptions" value={descriptionsCount} />
        <SummaryStatCard label="Sections" value={sectionsCount} />
        <SummaryStatCard
          label="Tagged Sections"
          value={`${sectionsWithTags} / ${sectionsCount}`}
        />
        <SummaryStatCard
          label="Described Sections"
          value={`${sectionsWithDescription} / ${sectionsCount}`}
        />
        <SummaryStatCard
          label="Started Sections"
          value={`${sectionsWithStart} / ${sectionsCount}`}
        />
        <SummaryStatCard
          label="Avg Moment Tags / Section"
          value={densityStats.averageMomentTagsPerSection.toFixed(2)}
        />
      </div>

      {hasDiscoverySummary ? (
        <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-purple-800">Discovery Snapshot</div>
            <div className="text-[10px] text-purple-700">runtime-backed summary</div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <SnapshotMetricCard
              label="Matched Moments"
              value={discoverySummary?.matchedMomentCount ?? 0}
              cardClass="border-purple-200"
              labelClass="text-purple-700"
              valueClass="text-purple-900"
            />
            <SnapshotMetricCard
              label="Clusters"
              value={discoverySummary?.clusterCount ?? 0}
              cardClass="border-fuchsia-200"
              labelClass="text-fuchsia-700"
              valueClass="text-fuchsia-900"
            />
            <SnapshotMetricCard
              label="Primary Heat"
              value={discoverySummary?.primaryHeat ?? 0}
              cardClass="border-orange-200"
              labelClass="text-orange-700"
              valueClass="text-orange-900"
            />
            <SnapshotMetricCard
              label="Matched Tags"
              value={discoverySummary?.matchedTagCount ?? 0}
              cardClass="border-indigo-200"
              labelClass="text-indigo-700"
              valueClass="text-indigo-900"
            />
          </div>

          <div className="mt-2 text-[10px] text-purple-700">
            This snapshot is used to verify discovery intensity, cluster density, and track-level
            sound activity.
          </div>
        </div>
      ) : null}

      {hasMetadataSummary ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-emerald-800">Metadata Snapshot</div>
            <div className="text-[10px] text-emerald-700">clarification layer coverage</div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <SnapshotMetricCard
              label="Records"
              value={metadataSummary?.totalLinks ?? 0}
              cardClass="border-emerald-200"
              labelClass="text-emerald-700"
              valueClass="text-emerald-900"
            />
            <SnapshotMetricCard
              label="Unresolved"
              value={metadataSummary?.unresolvedCount ?? 0}
              cardClass="border-amber-200"
              labelClass="text-amber-700"
              valueClass="text-amber-900"
            />
            <SnapshotMetricCard
              label="High Priority"
              value={metadataSummary?.highPriorityCount ?? 0}
              cardClass="border-red-200"
              labelClass="text-red-700"
              valueClass="text-red-900"
            />
            <SnapshotMetricCard
              label="Scoped Links"
              value={scopedLinkCount}
              cardClass="border-sky-200"
              labelClass="text-sky-700"
              valueClass="text-sky-900"
            />
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <SnapshotMetricCard
              label="Lyric / Word / Phrase"
              value={metadataSummary?.lyricWordLinks ?? 0}
              cardClass="border-teal-200"
              labelClass="text-teal-700"
              valueClass="text-teal-900"
            />
            <SnapshotMetricCard
              label="Musical Targets"
              value={metadataSummary?.musicalLinks ?? 0}
              cardClass="border-cyan-200"
              labelClass="text-cyan-700"
              valueClass="text-cyan-900"
            />
          </div>

          <div className="mt-2 text-[10px] text-emerald-700">
            This snapshot supports future clarification for lyrics, harmony, instruments, texture,
            timing, and sound intent.
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-medium text-zinc-700">Completeness Coverage</div>
          <div className="text-[10px] text-zinc-500">
            tagged {pctLabel(densityStats.taggedRatio)} • described{" "}
            {pctLabel(densityStats.describedRatio)} • started{" "}
            {pctLabel(densityStats.startRatio)}
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <CoverageBar label="Tagged" ratio={densityStats.taggedRatio} />
          <CoverageBar label="Described" ratio={densityStats.describedRatio} />
          <CoverageBar label="Started" ratio={densityStats.startRatio} />
        </div>
      </div>

      {dataWarnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-amber-800">Inspector Warnings</div>
            <div className="text-[10px] text-amber-800">
              {dataWarnings.length} warning{dataWarnings.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {dataWarnings.map((warning) => (
              <div key={warning} className="text-[10px] text-amber-800">
                {warning}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="text-[11px] font-medium text-emerald-800">Inspector Status</div>
          <div className="mt-1 text-[10px] text-emerald-800">
            No obvious indexing warnings found for this track.
          </div>
        </div>
      )}
    </>
  );
}