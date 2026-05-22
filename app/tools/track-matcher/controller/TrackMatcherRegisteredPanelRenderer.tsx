"use client";

import type { ReactNode } from "react";
import { DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS } from "./trackMatcherControllerConstants";
import TrackMatcherDynamicLanePanel from "./TrackMatcherDynamicLanePanel";
import TrackMatcherLaneGraphPanel from "./TrackMatcherLaneGraphPanel";
import TrackMatcherLaneIntelligenceSummaryPanel from "./TrackMatcherLaneIntelligenceSummaryPanel";
import TrackMatcherLaneRegistryPanel from "./TrackMatcherLaneRegistryPanel";
import TrackMatcherLaneRegistrySummary from "./TrackMatcherLaneRegistrySummary";
import TrackMatcherLaneRelationshipSection from "./TrackMatcherLaneRelationshipSection";
import {
  getTrackMatcherPanelDisplayMode,
  getTrackMatcherPanelVisibility,
  shouldRenderTrackMatcherPanelBody,
} from "./trackMatcherPanelVisibilityHelpers";
import {
  getTrackMatcherPanelSourceLabel,
  getTrackMatcherPanelVisibilityLabel,
  type TrackMatcherPanelRegistryItem,
} from "./trackMatcherPanelRegistryTypes";

function RegisteredPanelMetaStrip({
  panel,
}: {
  panel: TrackMatcherPanelRegistryItem;
}) {
  const visibility = getTrackMatcherPanelVisibility(panel);

  if (panel.displayMode === "compact") {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2 px-3 pt-3">
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
        {getTrackMatcherPanelSourceLabel(panel.source)}
      </span>

      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
        {getTrackMatcherPanelVisibilityLabel(visibility)}
      </span>

      {panel.pluginSlot ? (
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
          {panel.pluginSlot}
        </span>
      ) : null}
    </div>
  );
}

function RegisteredPanelShell({
  panel,
  children,
}: {
  panel: TrackMatcherPanelRegistryItem;
  children: ReactNode;
}) {
  const displayMode = getTrackMatcherPanelDisplayMode(panel);

  if (displayMode === "compact") {
    return <div>{children}</div>;
  }

  if (displayMode === "collapsed") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-bold text-white">{panel.title}</p>
        <p className="mt-1 text-xs leading-5 text-white/55">
          {panel.description}
        </p>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
          Collapsed panel route preserved
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-1">
      <RegisteredPanelMetaStrip panel={panel} />
      {children}
    </div>
  );
}

function renderTrackMatcherRegisteredPanelContent(
  panel: TrackMatcherPanelRegistryItem,
) {
  if (!shouldRenderTrackMatcherPanelBody(panel)) {
    return null;
  }

  switch (panel.id) {
    case "lane-registry-summary":
      return <TrackMatcherLaneRegistrySummary />;

    case "lane-relationships":
      return (
        <TrackMatcherLaneRelationshipSection
          title={panel.title}
          subtitle={panel.subtitle}
          relationships={DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS}
        />
      );

    case "lane-registry":
      return <TrackMatcherLaneRegistryPanel />;

    case "lane-intelligence":
      return <TrackMatcherLaneIntelligenceSummaryPanel />;

    case "dynamic-lanes":
      return <TrackMatcherDynamicLanePanel />;

    case "lane-graph":
      return <TrackMatcherLaneGraphPanel />;

    default:
      return null;
  }
}

export default function TrackMatcherRegisteredPanelRenderer({
  panel,
}: {
  panel: TrackMatcherPanelRegistryItem;
}) {
  const content = renderTrackMatcherRegisteredPanelContent(panel);

  if (!content && getTrackMatcherPanelDisplayMode(panel) !== "collapsed") {
    return null;
  }

  return <RegisteredPanelShell panel={panel}>{content}</RegisteredPanelShell>;
}
