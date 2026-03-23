"use client";

import type { MomentInspectorWorkspaceSummaryMetric } from "./momentInspectorWorkspaceSummary";

type MomentInspectorWorkspaceSummaryBarProps = {
  metrics: MomentInspectorWorkspaceSummaryMetric[];
};

type SummaryMetricTileProps = Omit<
  MomentInspectorWorkspaceSummaryMetric,
  "key"
>;

function SummaryMetricTile(props: SummaryMetricTileProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">
        {props.label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-900">
        {props.value}
      </div>
    </div>
  );
}

export default function MomentInspectorWorkspaceSummaryBar(
  props: MomentInspectorWorkspaceSummaryBarProps
) {
  if (props.metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      {props.metrics.map((metric) => {
        const { key, ...tileProps } = metric;

        return <SummaryMetricTile key={key} {...tileProps} />;
      })}
    </div>
  );
}