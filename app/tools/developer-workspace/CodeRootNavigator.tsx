"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RootSymbol = { id: string; name: string; kind: string; line: number; exported: boolean };
type CodeRoot = {
  id: string;
  title: string;
  path: string;
  markerLine: number;
  endLine: number;
  lineCount: number;
  symbols: RootSymbol[];
  exportedSymbolCount: number;
};
type RootIssue = {
  code: string;
  severity: "error" | "warning";
  path: string;
  line: number;
  rootId: string | null;
  message: string;
};
type RootEvent = {
  eventId: string;
  rootId: string;
  kind: string;
  occurredAt: string;
  title: string;
  path: string;
  markerLine: number;
  details: string;
};
type RootResponse = {
  index: {
    generatedAt: string;
    scannedFileCount: number;
    rootedFileCount: number;
    rootCount: number;
    symbolCount: number;
    coveragePercent: number;
    roots: CodeRoot[];
    issues: RootIssue[];
  };
  registry: { trackedRootCount: number };
  events: RootEvent[];
};
type SourceResponse = {
  path: string;
  startLine: number;
  endLine: number;
  lines: Array<{ number: number; text: string }>;
};

function apiError(value: unknown, fallback: string): string {
  if (typeof value === "object" && value !== null && "error" in value && typeof value.error === "string") return value.error;
  return fallback;
}

export default function CodeRootNavigator() {
  const [data, setData] = useState<RootResponse | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"attention" | "roots" | "history">("attention");
  const [loading, setLoading] = useState(true);
  const [observing, setObserving] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState<SourceResponse | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/developer-workspace/code-roots?eventLimit=100", { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Code roots could not be loaded."));
      setData(body as RootResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Code roots could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function observe() {
    setObserving(true);
    setError("");
    try {
      const response = await fetch("/api/developer-workspace/code-roots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "observe" }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Code root snapshot could not be recorded."));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Code root snapshot could not be recorded.");
    } finally {
      setObserving(false);
    }
  }

  async function openSource(path: string, line: number) {
    setError("");
    setSelectedLocation(`${path}:${line}`);
    try {
      const params = new URLSearchParams({ path, startLine: String(Math.max(1, line - 8)), lineCount: "70" });
      const response = await fetch(`/api/developer-workspace/file?${params}`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Root source could not be opened."));
      setSource(body as SourceResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Root source could not be opened.");
      setSource(null);
    }
  }

  const normalized = query.trim().toLowerCase();
  const issues = useMemo(() => (data?.index.issues ?? []).filter((item) =>
    !normalized || `${item.path} ${item.code} ${item.rootId ?? ""} ${item.message}`.toLowerCase().includes(normalized)
  ), [data, normalized]);
  const roots = useMemo(() => (data?.index.roots ?? []).filter((item) =>
    !normalized || `${item.id} ${item.title} ${item.path} ${item.symbols.map((symbol) => symbol.name).join(" ")}`.toLowerCase().includes(normalized)
  ), [data, normalized]);
  const events = useMemo(() => (data?.events ?? []).filter((item) =>
    !normalized || `${item.rootId} ${item.title} ${item.path} ${item.kind} ${item.details}`.toLowerCase().includes(normalized)
  ), [data, normalized]);
  const blocking = data?.index.issues.filter((item) => item.severity === "error").length ?? 0;
  const largeUnrooted = data?.index.issues.filter((item) => item.code === "unrooted-large-file").length ?? 0;

  return (
    <section className="mt-4 rounded-xl border border-violet-300/25 bg-[#0b1720] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">Code chapters</div>
          <h2 className="mt-1 text-xl font-black">Root Signatures</h2>
          <p className="mt-1 max-w-3xl text-sm text-white/55">
            Stable chapter markers keep large files navigable and give AI exact context boundaries even when lines move.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} disabled={loading || observing} className="rounded border border-white/20 px-3 py-2 text-sm font-bold text-white/75 disabled:opacity-40">
            {loading ? "Scanning..." : "Rescan"}
          </button>
          <button type="button" onClick={() => void observe()} disabled={loading || observing || blocking > 0} title={blocking ? "Fix blocking signature errors before recording history." : "Record the current root state."} className="rounded border border-violet-300/50 px-3 py-2 text-sm font-black text-violet-100 hover:bg-violet-300/10 disabled:opacity-40">
            {observing ? "Recording..." : "Record snapshot"}
          </button>
        </div>
      </div>

      {data ? <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Roots", data.index.rootCount],
          ["Rooted files", data.index.rootedFileCount],
          ["Coverage", `${data.index.coveragePercent}%`],
          ["Needs chapters", largeUnrooted],
          ["Tracked identities", data.registry.trackedRootCount],
        ].map(([label, value]) => <div key={label} className="rounded border border-white/10 bg-black/20 p-3"><div className="text-xs uppercase tracking-wider text-white/40">{label}</div><div className="mt-1 text-lg font-black">{value}</div></div>)}
      </div> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {(["attention", "roots", "history"] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`rounded px-3 py-1.5 text-sm font-bold ${view === item ? "bg-violet-300 text-black" : "border border-white/15 text-white/65"}`}>{item === "attention" ? `Needs attention (${issues.length})` : item === "roots" ? `Roots (${roots.length})` : `History (${events.length})`}</button>)}
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter roots, files, symbols..." className="min-w-[240px] flex-1 rounded border border-white/15 bg-black/25 px-3 py-1.5 text-sm text-white placeholder:text-white/30" />
      </div>

      {error ? <div className="mt-3 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
        <div className="max-h-[58vh] space-y-2 overflow-auto">
          {view === "attention" ? issues.map((item) => <button key={`${item.path}:${item.line}:${item.code}`} type="button" onClick={() => void openSource(item.path, item.line)} className={`w-full rounded border p-3 text-left ${selectedLocation === `${item.path}:${item.line}` ? "border-violet-300/60 bg-violet-300/10" : item.severity === "error" ? "border-red-300/25 bg-red-300/5" : "border-amber-300/20 bg-amber-300/5"}`}><div className="flex justify-between gap-3"><span className="font-bold">{item.code.replaceAll("-", " ")}</span><span className={`text-xs ${item.severity === "error" ? "text-red-200" : "text-amber-200"}`}>{item.severity}</span></div><div className="mt-1 text-xs text-white/50">{item.path}:{item.line}</div><div className="mt-2 text-sm text-white/65">{item.message}</div></button>) : null}
          {view === "roots" ? roots.map((root) => <button key={`${root.path}:${root.id}`} type="button" onClick={() => void openSource(root.path, root.markerLine)} className={`w-full rounded border p-3 text-left ${selectedLocation === `${root.path}:${root.markerLine}` ? "border-violet-300/60 bg-violet-300/10" : "border-white/10 bg-black/20"}`}><div className="font-black text-violet-100">{root.title}</div><div className="mt-1 font-mono text-xs text-violet-200/60">{root.id}</div><div className="mt-1 text-xs text-white/45">{root.path}:{root.markerLine}-{root.endLine} | {root.lineCount} lines | {root.symbols.length} symbols</div></button>) : null}
          {view === "history" ? events.map((event) => <button key={event.eventId} type="button" onClick={() => void openSource(event.path, event.markerLine)} className="w-full rounded border border-white/10 bg-black/20 p-3 text-left"><div className="flex justify-between gap-3"><span className="font-bold text-violet-100">{event.kind.replaceAll("-", " ")}</span><span className="text-xs text-white/35">{new Date(event.occurredAt).toLocaleString()}</span></div><div className="mt-1 font-mono text-xs text-white/55">{event.rootId}</div><div className="mt-2 text-sm text-white/60">{event.details}</div></button>) : null}
          {!loading && ((view === "attention" && issues.length === 0) || (view === "roots" && roots.length === 0) || (view === "history" && events.length === 0)) ? <div className="rounded border border-white/10 p-8 text-center text-sm text-white/35">No matching records in this view.</div> : null}
        </div>

        <div className="min-w-0 rounded border border-white/10 bg-black/20">
          {source ? <><div className="border-b border-white/10 p-3 text-sm font-bold text-violet-100">{source.path}:{source.startLine}-{source.endLine}</div><div className="max-h-[58vh] overflow-auto py-2 font-mono text-xs">{source.lines.map((line) => <div key={line.number} className={`grid min-w-max grid-cols-[4rem_1fr] ${selectedLocation.endsWith(`:${line.number}`) ? "bg-violet-300/15" : ""}`}><span className="px-2 text-right text-white/30">{line.number}</span><pre className="px-3 text-white/70">{line.text || " "}</pre></div>)}</div></> : <div className="p-10 text-center text-sm text-white/35">Choose a root or attention item to inspect its exact source location.</div>}
        </div>
      </div>
    </section>
  );
}
