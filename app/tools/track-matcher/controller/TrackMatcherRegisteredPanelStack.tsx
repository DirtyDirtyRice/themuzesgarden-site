"use client";

import TrackMatcherRegisteredPanelRenderer from "./TrackMatcherRegisteredPanelRenderer";
import { getTrackMatcherPanelDiagnosticTone } from "./trackMatcherPanelDiagnostics";
import {
  createTrackMatcherPanelRegistryDiagnostics,
  createTrackMatcherPanelRegistryRouteMap,
  createTrackMatcherPanelRegistrySummary,
  getTrackMatcherPanelRegistryZoneGroups,
  getTrackMatcherPanelRegistryZoneSummary,
} from "./trackMatcherPanelRegistry";
import {
  getTrackMatcherPanelDisplayModeLabel,
  getTrackMatcherPanelVisibilityLabel,
} from "./trackMatcherPanelRegistryTypes";

function PanelRegistryStatusStrip() {
  const summary = createTrackMatcherPanelRegistrySummary();

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
        Panel Registry
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
          {summary.totalPanels} Total
        </div>

        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
          {summary.activePanels} Active
        </div>

        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100">
          {summary.plannedPanels} Planned
        </div>

        <div className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-purple-100">
          {summary.pluginReadyPanels} Plugin Ready
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
          {summary.visiblePanels} Visible
        </div>
      </div>
    </div>
  );
}

function PanelRegistryDiagnosticsStrip() {
  const validation = createTrackMatcherPanelRegistryDiagnostics();

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            Registry Diagnostics
          </p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            {validation.ok
              ? "Panel route registry is healthy."
              : "Panel route registry needs attention."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {validation.diagnostics.map((diagnostic) => (
          <div
            key={`${diagnostic.level}-${diagnostic.title}`}
            className={`rounded-xl border p-3 ${getTrackMatcherPanelDiagnosticTone(
              diagnostic.level,
            )}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              {diagnostic.title}
            </p>
            <p className="mt-1 text-xs leading-5 opacity-80">
              {diagnostic.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelRegistryMapStrip() {
  const routeMap = createTrackMatcherPanelRegistryRouteMap();
  const zoneSummary = getTrackMatcherPanelRegistryZoneSummary();

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
        Active Panel Route Map
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {zoneSummary.map((zone) => (
          <div
            key={zone.zone}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <p className="text-sm font-bold text-white">{zone.label}</p>
            <p className="mt-1 text-xs leading-5 text-white/55">
              {zone.totalPanels} panels · {zone.activePanels} active · {zone.plannedPanels} planned
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {routeMap.map((panel) => (
          <div
            key={panel.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <p className="text-sm font-bold text-white">{panel.title}</p>

            <p className="mt-1 text-xs leading-5 text-white/55">
              {panel.pluginSlot}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                {panel.zone}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                {getTrackMatcherPanelDisplayModeLabel(panel.displayMode)}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                {getTrackMatcherPanelVisibilityLabel(panel.visibility)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelZoneHeader({
  label,
  description,
  count,
}: {
  label: string;
  description: string;
  count: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            Panel Zone
          </p>
          <h3 className="mt-1 text-lg font-black text-white">{label}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            {description}
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
          {count} Panels
        </div>
      </div>
    </div>
  );
}

export default function TrackMatcherRegisteredPanelStack() {
  const zoneGroups = getTrackMatcherPanelRegistryZoneGroups();

  return (
    <div className="space-y-6">
      <PanelRegistryStatusStrip />

      <PanelRegistryDiagnosticsStrip />

      <PanelRegistryMapStrip />

      {zoneGroups.map((group) => (
        <div key={group.zone} className="space-y-4">
          <PanelZoneHeader
            label={group.label}
            description={group.description}
            count={group.panels.length}
          />

          {group.panels.map((panel) => (
            <TrackMatcherRegisteredPanelRenderer
              key={panel.id}
              panel={panel}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
