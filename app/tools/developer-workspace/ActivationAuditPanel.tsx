"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  TimelineActivationAuditEntry,
  TimelineActivationAuditReport,
  TimelineActivationAuditStatus,
} from "@/lib/developer-workspace/timelineActivationAudit";

type StatusFilter = "all" | TimelineActivationAuditStatus;
type ApiError = { error: string };

const statuses: TimelineActivationAuditStatus[] = [
  "authorized", "blocked", "consumed", "expired", "revoked",
];

function isApiError(value: unknown): value is ApiError {
  return Boolean(
    value && typeof value === "object" && "error" in value &&
    typeof value.error === "string",
  );
}

function when(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Pending";
}

function statusColor(status: TimelineActivationAuditStatus): string {
  if (status === "consumed") return "border-emerald-300/50 text-emerald-100";
  if (status === "authorized") return "border-cyan-300/50 text-cyan-100";
  if (status === "blocked") return "border-red-300/50 text-red-100";
  return "border-amber-300/50 text-amber-100";
}

export default function ActivationAuditPanel() {
  const [report, setReport] = useState<TimelineActivationAuditReport | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [workflowQuery, setWorkflowQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/developer-workspace/engine-activations", {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Activation audit request failed.");
      }
      const nextReport = body as TimelineActivationAuditReport;
      setReport(nextReport);
      setSelectedId((current) => current || nextReport.entries[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Activation audit request failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const entries = useMemo(() => {
    const query = workflowQuery.trim().toLowerCase();
    return (report?.entries ?? []).filter((entry) =>
      (status === "all" || entry.status === status) &&
      (!query || entry.workflowId.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query)),
    );
  }, [report, status, workflowQuery]);

  const selected: TimelineActivationAuditEntry | null =
    report?.entries.find((entry) => entry.id === selectedId) ?? null;
  const summary = report?.summary;

  return (
    <section className="mt-4 scroll-mt-28 rounded-xl border border-cyan-300/25 bg-[#09151c] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
            Persistent Activation Ledger
          </div>
          <h2 className="mt-1 text-2xl font-black">Activation audit evidence</h2>
          <p className="mt-2 max-w-4xl text-sm text-white/60">
            Shows every engine activation decision without exposing requester identities.
            Authorized decisions remain single-use and expire automatically.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="rounded border border-cyan-300/50 px-4 py-2 text-sm font-black text-cyan-100 disabled:opacity-40">
          {loading ? "Loading ledger..." : "Refresh audit"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Total", summary?.total ?? 0],
          ["Authorized", summary?.authorized ?? 0],
          ["Consumed", summary?.consumed ?? 0],
          ["Blocked", summary?.blocked ?? 0],
          ["Expired", summary?.expired ?? 0],
          ["Revoked", summary?.revoked ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-bold uppercase text-white/45">{label}</div>
            <div className="mt-1 text-2xl font-black text-cyan-100">{value}</div>
          </div>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-300/40 bg-red-300/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 md:grid-cols-[1fr_220px]">
        <input value={workflowQuery} onChange={(event) => setWorkflowQuery(event.target.value)}
          placeholder="Filter by workflow or authorization ID"
          className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm" />
        <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="rounded border border-white/15 bg-[#071016] px-3 py-2 text-sm">
          <option value="all">All decision statuses</option>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {!loading && !error && !report?.entries.length ? (
        <div className="mt-4 rounded-lg border border-dashed border-cyan-300/30 bg-black/20 p-6">
          <div className="font-black text-cyan-100">No activation decisions recorded yet.</div>
          <p className="mt-1 text-sm text-white/55">
            The first production workflow activation will create durable evidence here.
          </p>
        </div>
      ) : null}

      {report?.entries.length ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(320px,0.85fr)_minmax(420px,1.15fr)]">
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <button key={entry.id} type="button" onClick={() => setSelectedId(entry.id)}
                className={`w-full rounded-lg border p-3 text-left ${
                  selectedId === entry.id
                    ? "border-cyan-300/60 bg-cyan-300/10"
                    : "border-white/10 bg-black/20"
                }`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-black">{entry.workflowId}</span>
                  <span className={`rounded border px-2 py-1 text-[10px] font-black uppercase ${statusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-white/45">{when(entry.requestedAt)}</div>
              </button>
            ))}
            {!entries.length ? (
              <div className="rounded border border-white/10 p-4 text-sm text-white/50">
                No decisions match these filters.
              </div>
            ) : null}
          </div>

          <aside className="rounded-lg border border-white/10 bg-black/20 p-4">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-white/45">{selected.id}</div>
                    <h3 className="mt-1 text-xl font-black">{selected.workflowId}</h3>
                  </div>
                  <span className={`rounded border px-2 py-1 text-xs font-black uppercase ${statusColor(selected.status)}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div><div className="text-[10px] uppercase text-white/40">Requested</div><div className="mt-1 text-sm">{when(selected.requestedAt)}</div></div>
                  <div><div className="text-[10px] uppercase text-white/40">Expires</div><div className="mt-1 text-sm">{when(selected.expiresAt)}</div></div>
                  <div><div className="text-[10px] uppercase text-white/40">Completed</div><div className="mt-1 text-sm">{when(selected.completedAt)}</div></div>
                </div>
                <div className="mt-4 rounded border border-white/10 p-3 text-sm">
                  Registry readiness: <strong>{selected.ready ? "READY" : "BLOCKED"}</strong>
                  {" "}· {selected.healthy}/{selected.required} required engines healthy
                </div>
                <div className="mt-3 rounded border border-white/10 p-3">
                  <div className="text-[10px] font-black uppercase text-white/40">Decision evidence</div>
                  <ul className="mt-2 space-y-1 text-sm text-white/70">
                    {selected.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                  </ul>
                </div>
                <div className="mt-3 break-all font-mono text-[11px] text-white/35">
                  {selected.registryFingerprint}
                </div>
              </>
            ) : <p className="text-sm text-white/50">Select a decision to inspect its evidence.</p>}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
