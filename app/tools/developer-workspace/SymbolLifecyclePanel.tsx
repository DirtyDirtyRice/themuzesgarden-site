"use client";

import { useEffect, useMemo, useState } from "react";

import type { CodeEvent } from "@/lib/developer-workspace/codeEventLedger";
import type { StableSymbolRecord } from "@/lib/developer-workspace/stableSymbolIdentity";
import type { ProjectSymbol } from "@/lib/developer-workspace/symbolIndex";

type Props = { symbol: ProjectSymbol | null };
type ApiError = { error: string };
type StableResponse = {
  total: number;
  present: number;
  removed: number;
  results: StableSymbolRecord[];
};

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}

export default function SymbolLifecyclePanel({ symbol }: Props) {
  const [record, setRecord] = useState<StableSymbolRecord | null>(null);
  const [events, setEvents] = useState<CodeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) {
      setRecord(null);
      setEvents([]);
      setError("");
      return;
    }
    const selected = symbol;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const stableParameters = new URLSearchParams({
          path: selected.path,
          name: selected.name,
          kind: selected.kind,
          limit: "10",
        });
        const stableResponse = await fetch(
          `/api/developer-workspace/stable-symbols?${stableParameters.toString()}`,
          { cache: "no-store", signal: controller.signal }
        );
        const stableBody: unknown = await stableResponse.json();
        if (!stableResponse.ok || isApiError(stableBody)) {
          throw new Error(isApiError(stableBody) ? stableBody.error : "Stable identity lookup failed.");
        }
        const stableRecord = (stableBody as StableResponse).results[0] ?? null;
        setRecord(stableRecord);

        const eventParameters = new URLSearchParams({ query: selected.name, limit: "300" });
        const eventResponse = await fetch(
          `/api/developer-workspace/events?${eventParameters.toString()}`,
          { cache: "no-store", signal: controller.signal }
        );
        const eventBody: unknown = await eventResponse.json();
        if (!eventResponse.ok || isApiError(eventBody)) {
          throw new Error(isApiError(eventBody) ? eventBody.error : "Lifecycle events could not be read.");
        }
        setEvents((eventBody as { events: CodeEvent[] }).events);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Symbol lifecycle lookup failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [symbol]);

  const lifecycle = useMemo(() => {
    if (!record) return [];
    const names = new Set(record.nameHistory.map((name) => name.toLowerCase()));
    return events
      .filter(
        (event) =>
          event.symbolKey === record.stableId ||
          (names.has(event.symbolName.toLowerCase()) && record.pathHistory.includes(event.path))
      )
      .sort(
        (left, right) =>
          new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()
      );
  }, [events, record]);

  const historicalBirth = lifecycle.find((event) => event.kind === "git-symbol-created");

  return (
    <section className="mt-4 rounded-lg border border-indigo-300/20 bg-indigo-300/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-indigo-200">
            Stable identity and lifecycle
          </div>
          <h3 className="mt-1 text-xl font-black">
            {symbol ? symbol.name : "Select a symbol"}
          </h3>
          <p className="mt-1 text-sm text-white/50">
            One durable identity across line shifts, moves, renames, removal, and restoration.
          </p>
        </div>
        {record ? (
          <span
            className={`rounded border px-3 py-1 text-xs font-black uppercase ${record.present ? "border-emerald-300/40 text-emerald-100" : "border-red-300/40 text-red-100"}`}
          >
            {record.present ? "Active in source" : "Removed from source"}
          </span>
        ) : null}
      </div>

      {loading ? <div className="mt-4 text-sm text-indigo-100/60">Resolving durable identity…</div> : null}
      {record ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(280px,0.75fr)_minmax(360px,1.25fr)]">
          <dl className="space-y-3 rounded border border-white/10 bg-black/20 p-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/40">Stable ID</dt>
              <dd className="mt-1 break-all font-mono text-indigo-100">{record.stableId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/40">First observed</dt>
              <dd className="mt-1">{new Date(record.firstObservedAt).toLocaleString()}</dd>
            </div>
            {historicalBirth ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/40">Git birth</dt>
                <dd className="mt-1">{new Date(historicalBirth.occurredAt).toLocaleString()}</dd>
                <dd className="text-xs text-white/45">{historicalBirth.gitCommit?.slice(0, 8)} · {historicalBirth.gitSubject}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/40">Known names</dt>
              <dd className="mt-1 break-words">{record.nameHistory.join(" → ")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/40">Known paths</dt>
              <dd className="mt-1 space-y-1 text-xs text-white/65">
                {record.pathHistory.map((projectPath) => <div key={projectPath}>{projectPath}</div>)}
              </dd>
            </div>
          </dl>

          <div className="rounded border border-white/10 bg-black/20 p-3">
            <div className="text-sm font-black text-indigo-100">Lifecycle transitions · {lifecycle.length}</div>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {lifecycle.slice(-30).map((event) => (
                <div key={event.id} className="rounded border border-white/10 px-3 py-2">
                  <div className="flex flex-wrap justify-between gap-2 text-xs">
                    <span className="font-black text-indigo-100">{event.kind}</span>
                    <span className="text-white/35">{new Date(event.occurredAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/55">{event.path}:{event.line}</div>
                  <div className="mt-1 text-xs text-white/40">{event.details}</div>
                </div>
              ))}
              {!lifecycle.length ? (
                <div className="p-6 text-center text-sm text-white/35">
                  The stable identity exists; no matching transition events have been recorded yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {!loading && symbol && !record ? (
        <div className="mt-4 text-sm text-amber-100/65">This symbol has not reached the stable registry yet.</div>
      ) : null}
      {error ? <div className="mt-3 rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
    </section>
  );
}
