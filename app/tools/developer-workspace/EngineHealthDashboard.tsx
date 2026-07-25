"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  TimelineEngineHealthDashboard as EngineHealthReport,
  TimelineEngineHealthRow,
} from "@/lib/developer-workspace/timelineEngineHealth";
import type { TimelineEngineDomain } from "@/lib/timeline/TimelineEngineRegistry";

type ApiError = { error: string };
type DomainFilter = "all" | TimelineEngineDomain;

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}

function matches(engine: TimelineEngineHealthRow, query: string): boolean {
  if (!query) return true;
  return [
    engine.descriptor.id,
    engine.descriptor.name,
    engine.descriptor.module,
    engine.descriptor.domain,
    ...engine.descriptor.capabilities,
    ...engine.descriptor.dependencies,
  ].join(" ").toLowerCase().includes(query);
}

export default function EngineHealthDashboard() {
  const [dashboard, setDashboard] = useState<EngineHealthReport | null>(null);
  const [domain, setDomain] = useState<DomainFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/developer-workspace/engine-health", { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Engine health request failed.");
      }
      const report = body as EngineHealthReport;
      setDashboard(report);
      setSelectedId((current) => current || report.engines[0]?.descriptor.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Engine health request failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const engines = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return (dashboard?.engines ?? []).filter((engine) =>
      (domain === "all" || engine.descriptor.domain === domain) && matches(engine, cleanQuery)
    );
  }, [dashboard, domain, query]);

  const selected = dashboard?.engines.find((engine) => engine.descriptor.id === selectedId) ?? null;
  const cards = [
    ["System readiness", dashboard?.report.ready ? "READY" : "BLOCKED"],
    ["Registered modules", dashboard?.report.registered.toString() ?? "0"],
    ["Healthy probes", dashboard ? `${dashboard.report.healthy}/${dashboard.report.required}` : "0/0"],
    ["Dependency links", dashboard?.dependencyLinks.toString() ?? "0"],
  ];

  return (
    <section className="mt-4 scroll-mt-28 rounded-xl border border-emerald-300/25 bg-[#0b1720] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">Engine Integration Registry</div>
          <h2 className="mt-1 text-2xl font-black">Timeline engine health</h2>
          <p className="mt-2 max-w-4xl text-sm text-white/60">
            Verifies every registered engine source module, dependency, startup position, and
            downstream consumer before the production coordinator activates the system.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="rounded border border-emerald-300/50 px-4 py-2 text-sm font-black text-emerald-100 disabled:opacity-40">
          {loading ? "Probing engines..." : "Run health probes"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</div>
            <div className={`mt-1 text-2xl font-black ${value === "BLOCKED" ? "text-red-200" : "text-emerald-100"}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {(dashboard?.domains ?? []).map((item) => (
          <button key={item.domain} type="button" onClick={() => setDomain(item.domain)}
            className={`rounded-lg border p-3 text-left ${domain === item.domain ? "border-emerald-300/70 bg-emerald-300/10" : "border-white/10 bg-black/20"}`}>
            <div className="text-xs font-black capitalize">{item.domain}</div>
            <div className="mt-1 text-xs text-white/55">{item.healthy}/{item.registered} healthy</div>
          </button>
        ))}
      </div>

      {error ? <div className="mt-4 rounded border border-red-300/40 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
      {dashboard?.report.errors.length ? (
        <div className="mt-4 rounded border border-red-300/40 bg-red-300/10 p-4 text-sm text-red-100">
          {dashboard.report.errors.map((item) => <div key={item}>{item}</div>)}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 md:grid-cols-[1fr_220px]">
        <input value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Search engine, module, capability, or dependency"
          className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm" />
        <select value={domain} onChange={(event) => setDomain(event.target.value as DomainFilter)}
          className="rounded border border-white/15 bg-[#071016] px-3 py-2 text-sm">
          <option value="all">All engine domains</option>
          {(dashboard?.domains ?? []).map((item) => <option key={item.domain} value={item.domain}>{item.domain}</option>)}
        </select>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {engines.map((engine) => (
            <button key={engine.descriptor.id} type="button" onClick={() => setSelectedId(engine.descriptor.id)}
              className={`w-full rounded-lg border p-3 text-left ${selectedId === engine.descriptor.id ? "border-emerald-300/60 bg-emerald-300/10" : "border-white/10 bg-black/20 hover:border-emerald-300/30"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-black">{engine.descriptor.name}</span>
                <span className={engine.healthy ? "text-emerald-200" : "text-red-200"}>{engine.healthy ? "Healthy" : "Missing"}</span>
              </div>
              <div className="mt-1 text-xs text-white/45">
                #{engine.startupPosition} · {engine.descriptor.domain} · {engine.descriptor.dependencies.length} dependencies
              </div>
            </button>
          ))}
        </div>

        <aside className="rounded-lg border border-white/10 bg-black/20 p-4">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-200/70">Startup position #{selected.startupPosition}</div>
                  <h3 className="mt-1 text-xl font-black">{selected.descriptor.name}</h3>
                  <div className="mt-1 font-mono text-xs text-white/45">{selected.descriptor.module}.ts</div>
                </div>
                <span className={`rounded border px-2 py-1 text-xs font-black ${selected.healthy ? "border-emerald-300/40 text-emerald-100" : "border-red-300/40 text-red-100"}`}>
                  {selected.healthy ? "HEALTHY" : "UNHEALTHY"}
                </span>
              </div>
              <p className="mt-4 text-sm text-white/65">{selected.message}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded border border-white/10 p-3">
                  <div className="text-[10px] font-black uppercase text-white/40">Dependencies</div>
                  <div className="mt-2 text-sm text-cyan-100">{selected.descriptor.dependencies.join(", ") || "None"}</div>
                </div>
                <div className="rounded border border-white/10 p-3">
                  <div className="text-[10px] font-black uppercase text-white/40">Direct consumers</div>
                  <div className="mt-2 text-sm text-violet-100">{selected.directDependents.join(", ") || "None"}</div>
                </div>
              </div>
              <div className="mt-3 rounded border border-white/10 p-3">
                <div className="text-[10px] font-black uppercase text-white/40">Full downstream impact · {selected.downstreamImpact.length} modules</div>
                <div className="mt-2 text-sm leading-6 text-amber-100/80">{selected.downstreamImpact.join(" → ") || "No downstream modules"}</div>
              </div>
            </>
          ) : <p className="text-sm text-white/50">Select an engine to inspect its activation evidence.</p>}
        </aside>
      </div>
    </section>
  );
}
