"use client";

import { useCallback, useEffect, useState } from "react";

import SourceViewer from "./SourceViewer";
import SymbolExplorer from "./SymbolExplorer";
import BuildErrorWorkspace from "./BuildErrorWorkspace";
import ProjectContextInvestigator from "./ProjectContextInvestigator";
import AiCodingAssistant from "./AiCodingAssistant";
import LiveEventTimeline from "./LiveEventTimeline";
import DraftActivationWorkspace from "./DraftActivationWorkspace";
import PreventedErrorWorkspace from "./PreventedErrorWorkspace";
import WorkspaceProjectSelector from "./WorkspaceProjectSelector";
import CodeRootNavigator from "./CodeRootNavigator";
import ArchitecturalHealthDashboard from "./ArchitecturalHealthDashboard";

import type {
  ProjectEntry,
  ProjectIndex,
  ProjectSearchResult,
} from "@/lib/developer-workspace/projectIndex";

type SearchResponse = Pick<
  ProjectIndex,
  "generatedAt" | "root" | "stats" | "truncated"
> & {
  query: string;
  results: ProjectSearchResult[];
};

type ApiError = {
  error: string;
};

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
}

function EntryIcon({ entry }: { entry: ProjectEntry }) {
  return (
    <span aria-hidden="true" className="w-5 shrink-0 text-center">
      {entry.kind === "directory" ? "▸" : "·"}
    </span>
  );
}

function FileButton({
  entry,
  selectedPath,
  onSelect,
}: {
  entry: ProjectEntry;
  selectedPath: string;
  onSelect: (entry: ProjectEntry) => void;
}) {
  const selected = selectedPath === entry.path;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={[
        "flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm",
        selected
          ? "bg-cyan-300 text-black"
          : "text-white/80 hover:bg-white/10 hover:text-white",
      ].join(" ")}
      title={entry.path}
    >
      <EntryIcon entry={entry} />
      <span className="truncate">{entry.name}</span>
    </button>
  );
}

function ProjectTree({
  entries,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  entries: ProjectEntry[];
  selectedPath: string;
  onSelect: (entry: ProjectEntry) => void;
  depth?: number;
}) {
  return entries.map((entry) => {
    if (entry.kind === "file") {
      return (
        <div key={entry.path} style={{ paddingLeft: depth * 14 }}>
          <FileButton entry={entry} selectedPath={selectedPath} onSelect={onSelect} />
        </div>
      );
    }

    return (
      <details key={entry.path} open={depth === 0}>
        <summary
          className="cursor-pointer select-none rounded px-2 py-1 text-sm font-bold text-white/90 hover:bg-white/10"
          style={{ marginLeft: depth * 14 }}
        >
          {entry.name}
          <span className="ml-2 text-xs font-normal text-white/40">
            {entry.children?.length ?? 0}
          </span>
        </summary>
        {entry.children?.length ? (
          <ProjectTree
            entries={entry.children}
            selectedPath={selectedPath}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ) : null}
      </details>
    );
  });
}

export default function DeveloperWorkspace() {
  const [index, setIndex] = useState<ProjectIndex | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProjectSearchResult[]>([]);
  const [selected, setSelected] = useState<ProjectEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const loadIndex = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/developer-workspace/project-index", {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Project index request failed.");
      }

      setIndex(body as ProjectIndex);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Project index request failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIndex();
  }, [loadIndex]);

  useEffect(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError("");

      try {
        const params = new URLSearchParams({ query: cleanQuery, limit: "100" });
        const response = await fetch(
          `/api/developer-workspace/project-index?${params.toString()}`,
          { cache: "no-store", signal: controller.signal }
        );
        const body: unknown = await response.json();
        if (!response.ok || isApiError(body)) {
          throw new Error(isApiError(body) ? body.error : "Project search failed.");
        }

        setResults((body as SearchResponse).results);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") return;
        setError(searchError instanceof Error ? searchError.message : "Project search failed.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-[#071016] p-4 text-white">
      <header className="rounded-xl border border-cyan-300/25 bg-[#0b1720] p-5 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
              AI Developer Workspace
            </div>
            <h1 className="mt-1 text-3xl font-black">Live Project Explorer</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              Browse and search the project currently running this application. Generated output,
              dependencies, reports, and repository internals are excluded automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadIndex()}
            disabled={loading}
            className="rounded-lg border border-cyan-300/50 px-4 py-2 font-bold text-cyan-100 hover:bg-cyan-300/10 disabled:opacity-50"
          >
            {loading ? "Indexing…" : "Refresh index"}
          </button>
        </div>

        {index ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Files", index.stats.fileCount.toLocaleString()],
              ["Folders", index.stats.directoryCount.toLocaleString()],
              ["Indexed size", formatBytes(index.stats.totalBytes)],
              ["Updated", new Date(index.generatedAt).toLocaleTimeString()],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-xs uppercase tracking-wider text-white/45">{label}</div>
                <div className="mt-1 text-xl font-black">{value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <WorkspaceProjectSelector />
      <CodeRootNavigator />
      <ArchitecturalHealthDashboard />

      {error ? (
        <div className="mt-4 rounded-lg border border-red-400/50 bg-red-400/10 p-3 text-red-100">
          {error}
        </div>
      ) : null}

      <BuildErrorWorkspace />
      <LiveEventTimeline />
      <DraftActivationWorkspace />
      <PreventedErrorWorkspace />
      <AiCodingAssistant />
      <ProjectContextInvestigator />

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.4fr)]">
        <div className="rounded-xl border border-white/10 bg-[#0b1720] p-4">
          <label htmlFor="project-search" className="text-sm font-black text-cyan-100">
            Search files and folders
          </label>
          <input
            id="project-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="TimelineEngine, workspace, projectIndex…"
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-3 text-white outline-none focus:border-cyan-300/70"
          />
          <div className="mt-2 text-xs text-white/45">
            {searching
              ? "Searching live index…"
              : query.trim()
                ? `${results.length} ranked result(s)`
                : "Results are ranked by exact name, prefix, filename, then path."}
          </div>

          <div className="mt-3 max-h-[58vh] space-y-1 overflow-y-auto pr-1">
            {results.map(({ entry, score }) => (
              <button
                key={entry.path}
                type="button"
                onClick={() => setSelected(entry)}
                className="w-full rounded-lg border border-white/10 p-3 text-left hover:border-cyan-300/40 hover:bg-cyan-300/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-bold">{entry.name}</span>
                  <span className="text-xs text-cyan-200/60">{score}</span>
                </div>
                <div className="mt-1 truncate text-xs text-white/45">{entry.path}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1720] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-cyan-100">Project tree</h2>
            <span className="truncate text-xs text-white/35">{index?.root ?? "Loading…"}</span>
          </div>

          <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(220px,0.65fr)]">
            <div className="max-h-[64vh] overflow-auto rounded-lg border border-white/10 bg-black/20 p-2">
              {loading && !index ? <div className="p-3 text-white/55">Building live index…</div> : null}
              {index ? (
                <ProjectTree
                  entries={index.entries}
                  selectedPath={selected?.path ?? ""}
                  onSelect={setSelected}
                />
              ) : null}
            </div>

            <aside className="rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="font-black">Selected entry</h3>
              {selected ? (
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-white/40">Name</dt>
                    <dd className="mt-1 break-all font-bold">{selected.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-white/40">Path</dt>
                    <dd className="mt-1 break-all text-cyan-100">{selected.path}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-white/40">Type</dt>
                    <dd className="mt-1">{selected.kind}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-white/40">Size</dt>
                    <dd className="mt-1">{formatBytes(selected.size)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-white/40">Modified</dt>
                    <dd className="mt-1">{new Date(selected.modifiedAt).toLocaleString()}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-white/45">
                  Choose a file from the tree or search results to inspect it.
                </p>
              )}
            </aside>
          </div>

          <SourceViewer entry={selected} />
          <SymbolExplorer />
        </div>
      </section>
    </main>
  );
}
