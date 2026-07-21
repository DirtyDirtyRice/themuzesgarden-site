"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import GitHistoryImporterPanel from "./GitHistoryImporterPanel";

import type { CodeEvent, CodeEventKind } from "@/lib/developer-workspace/codeEventLedger";
import type { LiveWatcherStatus } from "@/lib/developer-workspace/liveCodeWatcher";
import type { WorkspaceRuntimeSupervisorStatus } from "@/lib/developer-workspace/workspaceRuntimeSupervisor";
import type { ProjectFileView } from "@/lib/developer-workspace/projectFile";

type WatcherResponse = LiveWatcherStatus & { supervisor: WorkspaceRuntimeSupervisorStatus };
type ApiError = { error: string };
function isApiError(value: unknown): value is ApiError { return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"; }
const KINDS: Array<CodeEventKind | "all"> = ["all", "symbol-observed", "symbol-changed", "symbol-moved", "symbol-renamed", "symbol-restored", "symbol-removed", "import-added", "import-removed", "export-added", "export-removed", "reference-added", "reference-removed", "git-symbol-created", "git-symbol-changed", "git-symbol-moved", "git-symbol-removed", "build-error-observed", "build-error-resolved"];

export default function LiveEventTimeline() {
  const [events, setEvents] = useState<CodeEvent[]>([]);
  const [watcher, setWatcher] = useState<WatcherResponse | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<CodeEventKind | "all">("all");
  const [selected, setSelected] = useState<CodeEvent | null>(null);
  const [source, setSource] = useState<ProjectFileView | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const eventParameters = new URLSearchParams({ limit: "500" });
      if (query.trim()) eventParameters.set("query", query.trim());
      const [eventsResponse, watcherResponse] = await Promise.all([fetch(`/api/developer-workspace/events?${eventParameters}`, { cache: "no-store" }), fetch("/api/developer-workspace/events/watch", { cache: "no-store" })]);
      const eventBody: unknown = await eventsResponse.json(), watcherBody: unknown = await watcherResponse.json();
      if (!eventsResponse.ok || isApiError(eventBody)) throw new Error(isApiError(eventBody) ? eventBody.error : "Timeline refresh failed.");
      if (!watcherResponse.ok || isApiError(watcherBody)) throw new Error(isApiError(watcherBody) ? watcherBody.error : "Watcher status failed.");
      setEvents((eventBody as { events: CodeEvent[] }).events); setWatcher(watcherBody as WatcherResponse); setError("");
    } catch (refreshError) { setError(refreshError instanceof Error ? refreshError.message : "Timeline refresh failed."); }
  }, [query]);

  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 3_000); return () => window.clearInterval(timer); }, [refresh]);
  const visible = useMemo(() => { const clean = query.trim().toLowerCase(); return events.filter((event) => kind === "all" || event.kind === kind).filter((event) => !clean || `${event.symbolName} ${event.path} ${event.details}`.toLowerCase().includes(clean)); }, [events, kind, query]);

  async function openEvent(event: CodeEvent) {
    setSelected(event); setSource(null);
    try {
      const params = new URLSearchParams({ path: event.path, line: String(Math.max(1, event.line - 8)), count: "32" });
      const response = await fetch(`/api/developer-workspace/file?${params}`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Event source could not be opened.");
      setSource(body as ProjectFileView);
    } catch (sourceError) { setError(sourceError instanceof Error ? sourceError.message : "Event source could not be opened."); }
  }

  async function control(action: "start" | "stop") {
    const response = await fetch("/api/developer-workspace/events/watch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const body: unknown = await response.json();
    if (!response.ok || isApiError(body)) { setError(isApiError(body) ? body.error : "Watcher control failed."); return; }
    setWatcher(body as WatcherResponse);
  }

  return <section className="mt-4 rounded-xl border border-sky-300/25 bg-[#0b1720] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[0.28em] text-sky-300">Project memory</div><h2 className="mt-1 text-2xl font-black">Live Code Event Timeline</h2><p className="mt-2 text-sm text-white/60">Timestamped symbol history updates automatically after source files are saved.</p></div><div className="flex items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${watcher?.running ? "border-emerald-300/40 text-emerald-100" : "border-white/20 text-white/50"}`}>{watcher?.running ? "Watching live" : "Watcher stopped"}</span><button type="button" onClick={() => void control(watcher?.running ? "stop" : "start")} className="rounded border border-sky-300/40 px-3 py-1 text-xs font-bold text-sky-100">{watcher?.running ? "Stop" : "Start"}</button></div></div>
    <GitHistoryImporterPanel onComplete={() => void refresh()} />
    {watcher?.supervisor ? <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45"><span className="rounded border border-emerald-300/20 px-2 py-1 text-emerald-100/70">Server managed</span><span className="rounded border border-white/10 px-2 py-1">Last healthy {watcher.supervisor.lastHealthyAt ? new Date(watcher.supervisor.lastHealthyAt).toLocaleTimeString() : "starting"}</span><span className="rounded border border-white/10 px-2 py-1">{watcher.supervisor.startAttempts} recovery start(s)</span></div> : null}
    {watcher?.pendingFiles.length ? <div className="mt-3 text-xs text-amber-100">Indexing {watcher.pendingFiles.length} changed file(s)…</div> : null}
    {error ? <div className="mt-3 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_220px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search symbol or file…" className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none focus:border-sky-300/70" /><select value={kind} onChange={(event) => setKind(event.target.value as CodeEventKind | "all")} className="rounded-lg border border-white/15 bg-[#071016] px-3 py-2">{KINDS.map((value) => <option key={value} value={value}>{value.replaceAll("-", " ")}</option>)}</select></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]"><div className="max-h-[60vh] space-y-2 overflow-auto">{visible.map((event) => <button key={event.id} type="button" onClick={() => void openEvent(event)} className={`w-full rounded-lg border p-3 text-left ${selected?.id === event.id ? "border-sky-300/60 bg-sky-300/10" : "border-white/10 bg-black/20"}`}><div className="flex justify-between gap-3"><span className="font-bold">{event.symbolName}</span><span className="text-xs text-white/35">{new Date(event.occurredAt).toLocaleString()}</span></div><div className="mt-1 text-xs text-sky-100/60">{event.kind} · {event.path}:{event.line}</div>{event.gitCommit ? <div className="mt-1 truncate text-xs text-indigo-100/55">{event.gitCommit.slice(0, 8)} · {event.gitAuthor} · {event.gitSubject}</div> : null}</button>)}</div><div className="min-w-0 rounded-lg border border-white/10 bg-black/20">{source && selected ? <><div className="border-b border-white/10 p-3 text-sm font-bold text-sky-100">{selected.path}:{selected.line}</div><div className="max-h-[60vh] overflow-auto py-2 font-mono text-xs">{source.lines.map((line) => <div key={line.number} className={`grid min-w-max grid-cols-[4rem_1fr] ${line.number === selected.line ? "bg-sky-300/15" : ""}`}><span className="px-2 text-right text-white/30">{line.number}</span><pre className="px-3 text-white/70">{line.text || " "}</pre></div>)}</div></> : <div className="p-10 text-center text-sm text-white/35">Choose an event to open its exact source.</div>}</div></div>
  </section>;
}
