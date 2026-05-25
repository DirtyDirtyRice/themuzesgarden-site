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

function RegistryDisclosure({
  children,
  count,
  defaultOpen = false,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  count?: string;
  defaultOpen?: boolean;
  subtitle: string;
  title: string;
}) {
  return (
    <details
      className="group rounded-3xl border border-white/10 bg-black/40 p-4"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-2xl p-1 transition-transform duration-150 hover:-translate-y-0.5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black text-lg font-black text-white transition-transform duration-150 group-open:rotate-90">
            ›
          </span>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
              Registry Branch
            </p>
            <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {count ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
              {count}
            </span>
          ) : null}

          <span className="rounded-full border border-white/10 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 group-open:hidden">
            Open
          </span>

          <span className="hidden rounded-full border border-white/10 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 group-open:inline-flex">
            Close
          </span>
        </div>
      </summary>

      <div className="mt-4 border-t border-white/10 pt-4">{children}</div>
    </details>
  );
}

function PanelRegistryStatusStrip() {
  const summary = createTrackMatcherPanelRegistrySummary();

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          Total Panels
        </p>
        <div className="mt-2 text-3xl font-black text-white">
          {summary.totalPanels}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/70">
          Active
        </p>
        <div className="mt-2 text-3xl font-black text-emerald-100">
          {summary.activePanels}
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100/70">
          Planned
        </p>
        <div className="mt-2 text-3xl font-black text-cyan-100">
          {summary.plannedPanels}
        </div>
      </div>

      <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-100/70">
          Plugin Ready
        </p>
        <div className="mt-2 text-3xl font-black text-purple-100">
          {summary.pluginReadyPanels}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          Visible
        </p>
        <div className="mt-2 text-3xl font-black text-white/80">
          {summary.visiblePanels}
        </div>
      </div>
    </div>
  );
}

function PanelRegistryDiagnosticsStrip() {
  const validation = createTrackMatcherPanelRegistryDiagnostics();

  return (
    <RegistryDisclosure
      count={`${validation.diagnostics.length} Checks`}
      defaultOpen={false}
      title="Registry Diagnostics"
      subtitle={
        validation.ok
          ? "Panel route registry is healthy. Open only when you need diagnostics."
          : "Panel route registry needs attention. Open this branch to inspect it."
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
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
    </RegistryDisclosure>
  );
}

function PanelRegistryMapStrip() {
  const routeMap = createTrackMatcherPanelRegistryRouteMap();
  const zoneSummary = getTrackMatcherPanelRegistryZoneSummary();

  return (
    <RegistryDisclosure
      count={`${routeMap.length} Routes`}
      defaultOpen={false}
      title="Active Panel Route Map"
      subtitle="Open this branch when you need the panel route map, zones, display modes, and visibility labels."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
    </RegistryDisclosure>
  );
}

function PanelZoneBranch({
  description,
  label,
  panels,
}: {
  description: string;
  label: string;
  panels: ReturnType<typeof getTrackMatcherPanelRegistryZoneGroups>[number]["panels"];
}) {
  return (
    <RegistryDisclosure
      count={`${panels.length} Panels`}
      defaultOpen={false}
      title={label}
      subtitle={description}
    >
      <div className="space-y-4">
        {panels.map((panel) => (
          <TrackMatcherRegisteredPanelRenderer key={panel.id} panel={panel} />
        ))}
      </div>
    </RegistryDisclosure>
  );
}

export default function TrackMatcherRegisteredPanelStack() {
  const zoneGroups = getTrackMatcherPanelRegistryZoneGroups();

  return (
    <div className="space-y-4">
      <PanelRegistryStatusStrip />
      <PanelRegistryDiagnosticsStrip />
      <PanelRegistryMapStrip />

      {zoneGroups.map((group) => (
        <PanelZoneBranch
          key={group.zone}
          label={group.label}
          description={group.description}
          panels={group.panels}
        />
      ))}
    </div>
  );
}
