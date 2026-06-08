
"use client";

import type {
  MultiTrackEngineBridgeDirection,
  MultiTrackEngineBridgeSignal,
  MultiTrackEngineBridgeState,
  MultiTrackEngineBridgeStatus,
} from "./MultiTrackEngineBridgeTypes";
import { DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE } from "./MultiTrackEngineBridgeSeed";

const panelClass =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl";

const cardClass =
  "rounded-2xl border border-white/10 bg-black/40 p-4 text-white";

const rowClass =
  "flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

const pillClass =
  "rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/70";

type BridgeRoute = {
  id: string;
  label: string;
  source: string;
  destination: string;
  direction: MultiTrackEngineBridgeDirection;
  status: MultiTrackEngineBridgeStatus;
  ready: boolean;
  priority: number;
  detail: string;
  safePath: string;
  blockedPath: string;
};

function getStatusLabel(status: MultiTrackEngineBridgeStatus): string {
  if (status === "connected") return "Connected";
  if (status === "warning") return "Warning";
  if (status === "blocked") return "Blocked";
  if (status === "waiting") return "Waiting";
  return "Idle";
}

function getDirectionLabel(direction: MultiTrackEngineBridgeDirection): string {
  if (direction === "engine-to-workspace") return "Engine → Workspace";
  if (direction === "workspace-to-engine") return "Workspace → Engine";
  return "Bidirectional";
}

function getRoutePriority(signal: MultiTrackEngineBridgeSignal, index: number): number {
  if (signal.ready) return index + 1;
  if (signal.status === "blocked") return 90 + index;
  if (signal.status === "warning") return 40 + index;
  return 20 + index;
}

function buildRoutes(state: MultiTrackEngineBridgeState): BridgeRoute[] {
  return state.signals
    .map((signal, index) => ({
      id: `bridge-route-${signal.id}`,
      label: signal.label,
      source: signal.source,
      destination: signal.destination,
      direction: signal.direction,
      status: signal.status,
      ready: signal.ready,
      priority: getRoutePriority(signal, index),
      detail: signal.detail,
      safePath:
        "Display as bridge-readable planning data until the source and destination files are verified.",
      blockedPath:
        "Do not convert this route into live behavior from inside a panel file.",
    }))
    .sort((left, right) => left.priority - right.priority);
}

function getReadyRouteCount(routes: BridgeRoute[]): number {
  return routes.filter((route) => route.ready).length;
}

function getWaitingRouteCount(routes: BridgeRoute[]): number {
  return routes.filter((route) => !route.ready).length;
}

function getHighestPriorityRoute(routes: BridgeRoute[]): BridgeRoute | null {
  return routes[0] ?? null;
}

function BridgeRouteSummary({ routes }: { routes: BridgeRoute[] }) {
  const readyCount = getReadyRouteCount(routes);
  const waitingCount = getWaitingRouteCount(routes);
  const highestPriorityRoute = getHighestPriorityRoute(routes);

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Routes
        </p>
        <p className="mt-2 text-3xl font-black text-white">{routes.length}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Ready
        </p>
        <p className="mt-2 text-3xl font-black text-white">{readyCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          Waiting
        </p>
        <p className="mt-2 text-3xl font-black text-white">{waitingCount}</p>
      </article>

      <article className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
          First Route
        </p>
        <p className="mt-2 text-lg font-black text-white">
          {highestPriorityRoute?.label ?? "No route"}
        </p>
      </article>
    </div>
  );
}

function BridgeRouteCard({ route }: { route: BridgeRoute }) {
  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">
            Priority {route.priority}
          </p>
          <h3 className="mt-2 text-xl font-black text-white">{route.label}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{route.detail}</p>
        </div>

        <span className={pillClass}>{getStatusLabel(route.status)}</span>
      </div>

      <div className="mt-4 grid gap-2">
        <div className={rowClass}>
          <span className="text-sm text-white/70">Source</span>
          <span className="text-right text-sm font-black text-white">{route.source}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Destination</span>
          <span className="text-right text-sm font-black text-white">
            {route.destination}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Direction</span>
          <span className="text-right text-sm font-black text-white">
            {getDirectionLabel(route.direction)}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Ready</span>
          <span className="text-sm font-black text-white">{route.ready ? "Yes" : "No"}</span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Safe Path</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {route.safePath}
          </span>
        </div>

        <div className={rowClass}>
          <span className="text-sm text-white/70">Blocked Path</span>
          <span className="max-w-xl text-right text-sm font-black leading-6 text-white">
            {route.blockedPath}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackEngineBridgeRoutePanel() {
  const bridgeState = DEFAULT_MULTI_TRACK_ENGINE_BRIDGE_STATE;
  const routes = buildRoutes(bridgeState);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
            Bridge Routes
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Engine-to-Workspace Route Map
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            Route planning for how engine intelligence will move into visible
            workstation areas. These routes keep future wiring organized instead
            of letting controller files absorb everything again.
          </p>
        </div>

        <span className={pillClass}>{bridgeState.status}</span>
      </div>

      <BridgeRouteSummary routes={routes} />

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {routes.map((route) => (
          <BridgeRouteCard key={route.id} route={route} />
        ))}
      </div>
    </section>
  );
}