"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  PreventedErrorEvent,
  PreventionClassification,
  PreventionLedgerSummary,
} from "@/lib/developer-workspace/preventedErrorLedger";

type ApiResponse = {
  events: PreventedErrorEvent[];
  count: number;
  summary: PreventionLedgerSummary;
  snapshotsIncluded: false;
};

type ApiError = { error: string };

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}

function classificationLabel(value: PreventionClassification): string {
  if (value === "confirmed-compiler-error") return "Confirmed compiler error";
  if (value === "confirmed-contract-failure") return "Confirmed contract failure";
  if (value === "architectural-violation") return "Architectural violation";
  return "Predicted risk";
}

function classificationStyle(value: PreventionClassification): string {
  if (value === "confirmed-compiler-error") return "border-red-300/30 bg-red-300/10 text-red-100";
  if (value === "confirmed-contract-failure") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  if (value === "architectural-violation") return "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100";
  return "border-sky-300/30 bg-sky-300/10 text-sky-100";
}

function outcomeStyle(event: PreventedErrorEvent): string {
  if (event.outcome === "activated") return "border-emerald-300/40 text-emerald-100";
  if (event.outcome === "corrected") return "border-cyan-300/40 text-cyan-100";
  if (event.outcome === "abandoned") return "border-white/20 text-white/55";
  return "border-amber-300/40 text-amber-100";
}

export default function PreventedErrorWorkspace() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (search = "") => {
    setLoading(true);
    setError("");
    try {
      const parameters = new URLSearchParams({ limit: "250" });
      if (search.trim()) parameters.set("query", search.trim());
      const request = await fetch(`/api/developer-workspace/prevented-errors?${parameters.toString()}`, {
        cache: "no-store",
      });
      const body: unknown = await request.json();
      if (!request.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Prevented-error evidence could not be loaded.");
      }
      setResponse(body as ApiResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Prevented-error evidence could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const summary = response?.summary;
  const cards: Array<[string, number, string]> = [
    ["Prevented compiler errors", summary?.confirmedCompilerErrorsPrevented ?? 0, "text-red-100"],
    ["Contract failures", summary?.confirmedContractFailures ?? 0, "text-amber-100"],
    ["Architecture violations", summary?.architecturalViolations ?? 0, "text-fuchsia-100"],
    ["Predicted risks", summary?.predictedRisks ?? 0, "text-sky-100"],
    ["Currently held", summary?.currentlyHeld ?? 0, "text-amber-100"],
    ["Safely activated", summary?.activated ?? 0, "text-emerald-100"],
  ];

  return (
    <section className="mt-4 rounded-xl border border-amber-300/25 bg-[#0b1720] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-amber-200">Prevented Error Ledger</div>
          <h2 className="mt-1 text-2xl font-black">Evidence of failures stopped before activation</h2>
          <p className="mt-2 max-w-4xl text-sm text-white/60">
            Confirmed failures remain separate from predicted risks. Candidate hashes and lifecycle evidence are visible;
            stored source snapshots are intentionally excluded from this browser response.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(query)}
          disabled={loading}
          className="rounded border border-amber-300/50 px-4 py-2 text-sm font-black text-amber-100 disabled:opacity-40"
        >
          {loading ? "Loading evidence..." : "Refresh evidence"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, style]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</div>
            <div className={`mt-1 text-2xl font-black ${style}`}>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => { event.preventDefault(); void load(query); }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search attempts, files, symbols, error codes, or messages"
          className="min-w-0 flex-1 rounded border border-white/15 bg-black/30 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={loading} className="rounded border border-white/20 px-4 py-2 text-sm font-bold disabled:opacity-40">
          Search
        </button>
        {query ? (
          <button type="button" onClick={() => { setQuery(""); void load(); }} className="rounded border border-white/10 px-3 py-2 text-sm text-white/60">
            Clear
          </button>
        ) : null}
      </form>

      {error ? <div className="mt-4 rounded border border-red-300/40 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}

      {!loading && !response?.events.length ? (
        <div className="mt-4 rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
          No prevented attempts match this view. Failed capsule validation will add evidence automatically.
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {response?.events.map((event) => (
          <article key={event.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="break-all font-mono text-xs text-amber-100/70">{event.file}</div>
                <div className="mt-1 text-xs text-white/40">
                  Attempt {event.attemptId} · {new Date(event.occurredAt).toLocaleString()}
                </div>
              </div>
              <span className={`rounded border px-2 py-1 text-xs font-black uppercase ${outcomeStyle(event)}`}>
                {event.outcome}
              </span>
            </div>

            {event.note ? <p className="mt-3 text-sm text-white/70">{event.note}</p> : null}

            <div className="mt-3 space-y-2">
              {event.evidence.map((item, index) => (
                <div key={`${event.id}:${item.code}:${item.line ?? 0}:${index}`} className={`rounded border p-3 ${classificationStyle(item.classification)}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-black">{classificationLabel(item.classification)}</span>
                    <span className="font-mono opacity-70">{item.code}</span>
                  </div>
                  <div className="mt-1 text-sm">{item.message}</div>
                  <div className="mt-1 font-mono text-[11px] opacity-60">
                    {item.file}:{item.line ?? "?"}:{item.column ?? "?"} · {item.source}
                  </div>
                </div>
              ))}
            </div>

            {(event.impactedFiles.length || event.impactedSymbols.length) ? (
              <details className="mt-3 text-xs text-white/55">
                <summary className="cursor-pointer font-bold text-white/70">
                  Impact · {event.impactedFiles.length} file(s) · {event.impactedSymbols.length} symbol(s)
                </summary>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <div>{event.impactedFiles.map((file) => <div key={file} className="break-all font-mono">{file}</div>)}</div>
                  <div>{event.impactedSymbols.map((symbol) => <div key={symbol} className="break-all font-mono">{symbol}</div>)}</div>
                </div>
              </details>
            ) : null}

            <details className="mt-3 text-xs text-white/40">
              <summary className="cursor-pointer">Verification identity</summary>
              <div className="mt-1 break-all font-mono">Candidate SHA-256: {event.candidateHash}</div>
              {event.capsuleId ? <div className="mt-1 break-all font-mono">Capsule: {event.capsuleId}</div> : null}
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
