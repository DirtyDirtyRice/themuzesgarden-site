"use client";

import { useEffect, useState } from "react";

import CrossReferencePanel from "./CrossReferencePanel";
import ImpactAnalysisPanel from "./ImpactAnalysisPanel";
import SymbolLifecyclePanel from "./SymbolLifecyclePanel";

import type { ProjectFileView } from "@/lib/developer-workspace/projectFile";
import type {
  ProjectSymbol,
  ProjectSymbolKind,
  SymbolSearchResult,
} from "@/lib/developer-workspace/symbolIndex";

type SymbolResponse = {
  generatedAt: string;
  fileCount: number;
  symbolCount: number;
  symbolsByKind: Record<ProjectSymbolKind, number>;
  results: SymbolSearchResult[];
};

type ApiError = {
  error: string;
};

const SYMBOL_KINDS: Array<ProjectSymbolKind | "all"> = [
  "all",
  "class",
  "interface",
  "type",
  "enum",
  "function",
  "constant",
  "method",
];

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function symbolLabel(symbol: ProjectSymbol): string {
  return symbol.containerName ? `${symbol.containerName}.${symbol.name}` : symbol.name;
}

function symbolBadge(kind: ProjectSymbolKind): string {
  const colors: Record<ProjectSymbolKind, string> = {
    class: "border-violet-300/40 text-violet-200",
    interface: "border-blue-300/40 text-blue-200",
    type: "border-sky-300/40 text-sky-200",
    enum: "border-orange-300/40 text-orange-200",
    function: "border-emerald-300/40 text-emerald-200",
    constant: "border-yellow-300/40 text-yellow-100",
    method: "border-pink-300/40 text-pink-200",
  };
  return colors[kind];
}

export default function SymbolExplorer() {
  const [summary, setSummary] = useState<SymbolResponse | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ProjectSymbolKind | "all">("all");
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [selected, setSelected] = useState<ProjectSymbol | null>(null);
  const [preview, setPreview] = useState<ProjectFileView | null>(null);
  const [indexing, setIndexing] = useState(true);
  const [searching, setSearching] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");

  async function loadSummary(refresh = false) {
    setIndexing(true);
    setError("");
    try {
      const suffix = refresh ? "?refresh=1" : "";
      const response = await fetch(`/api/developer-workspace/symbols${suffix}`, {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Symbol index request failed.");
      }
      setSummary(body as SymbolResponse);
    } catch (summaryError) {
      setError(summaryError instanceof Error ? summaryError.message : "Symbol index request failed.");
    } finally {
      setIndexing(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

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
        if (kind !== "all") params.set("kind", kind);

        const response = await fetch(`/api/developer-workspace/symbols?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (!response.ok || isApiError(body)) {
          throw new Error(isApiError(body) ? body.error : "Symbol search failed.");
        }
        const nextResponse = body as SymbolResponse;
        setSummary(nextResponse);
        setResults(nextResponse.results);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") return;
        setError(searchError instanceof Error ? searchError.message : "Symbol search failed.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [kind, query]);

  async function openDefinition(symbol: ProjectSymbol) {
    setSelected(symbol);
    setPreviewing(true);
    setError("");

    try {
      const params = new URLSearchParams({
        path: symbol.path,
        line: String(Math.max(1, symbol.line - 8)),
        count: "40",
      });
      const response = await fetch(`/api/developer-workspace/file?${params.toString()}`, {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Definition preview failed.");
      }
      setPreview(body as ProjectFileView);
    } catch (previewError) {
      setPreview(null);
      setError(previewError instanceof Error ? previewError.message : "Definition preview failed.");
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <section className="mt-4 rounded-xl border border-cyan-300/20 bg-[#0b1720] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            TypeScript intelligence
          </div>
          <h2 className="mt-1 text-2xl font-black">Symbol Explorer</h2>
          <p className="mt-1 text-sm text-white/55">
            Compiler-parsed definitions with exact file, line, column, export, and container data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSummary(true)}
          disabled={indexing}
          className="rounded-lg border border-cyan-300/40 px-4 py-2 text-sm font-black text-cyan-100 disabled:opacity-40"
        >
          {indexing ? "Indexing…" : "Rebuild symbols"}
        </button>
      </div>

      {summary ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <div className="text-lg font-black">{summary.symbolCount.toLocaleString()}</div>
            <div className="text-xs text-white/40">All symbols</div>
          </div>
          {SYMBOL_KINDS.filter((item): item is ProjectSymbolKind => item !== "all").map((item) => (
            <div key={item} className="rounded border border-white/10 bg-black/20 p-2">
              <div className="text-lg font-black">{summary.symbolsByKind[item].toLocaleString()}</div>
              <div className="text-xs capitalize text-white/40">{item}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(300px,0.8fr)_minmax(420px,1.2fr)]">
        <div>
          <div className="flex flex-wrap gap-2">
            {SYMBOL_KINDS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item)}
                className={[
                  "rounded border px-3 py-1.5 text-xs font-bold capitalize",
                  kind === item
                    ? "border-cyan-200 bg-cyan-200 text-black"
                    : "border-white/15 text-white/65",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="TimelineEngine, resetEngine, ProjectEntry…"
            className="mt-3 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-3 outline-none focus:border-cyan-300/70"
          />
          <div className="mt-2 text-xs text-white/40">
            {searching
              ? "Searching compiler index…"
              : query.trim()
                ? `${results.length} ranked definition(s)`
                : "Search by symbol or qualified method name."}
          </div>

          <div className="mt-3 max-h-[56vh] space-y-1 overflow-y-auto pr-1">
            {results.map(({ symbol, score }) => (
              <button
                key={symbol.id}
                type="button"
                onClick={() => void openDefinition(symbol)}
                className={[
                  "w-full rounded-lg border p-3 text-left",
                  selected?.id === symbol.id
                    ? "border-cyan-300/60 bg-cyan-300/10"
                    : "border-white/10 hover:border-white/25",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase ${symbolBadge(symbol.kind)}`}>
                    {symbol.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-bold">{symbolLabel(symbol)}</span>
                  <span className="text-xs text-white/30">{score}</span>
                </div>
                <div className="mt-1 truncate text-xs text-white/40">
                  {symbol.path}:{symbol.line}:{symbol.column}
                </div>
                <div className="mt-1 text-[11px] text-white/35">
                  {symbol.exported ? "exported" : "local"}
                  {symbol.defaultExport ? " · default" : ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-white/10 bg-black/25">
          <div className="border-b border-white/10 p-3">
            <div className="font-black">Definition preview</div>
            <div className="mt-1 truncate text-xs text-cyan-100/60">
              {selected
                ? `${selected.path}:${selected.line}:${selected.column}`
                : "Choose a symbol to open its exact definition."}
            </div>
          </div>

          {preview && selected ? (
            <div className="max-h-[62vh] overflow-auto py-2 font-mono text-[13px] leading-6">
              {preview.lines.map((line) => {
                const target = line.number === selected.line;
                return (
                  <div
                    key={line.number}
                    className={[
                      "grid min-w-max grid-cols-[5rem_1fr]",
                      target ? "bg-yellow-300/15 text-yellow-50" : "text-white/75",
                    ].join(" ")}
                  >
                    <span className="select-none border-r border-white/10 px-3 text-right text-white/30">
                      {line.number}
                    </span>
                    <pre className="min-h-6 whitespace-pre px-4">{line.text || " "}</pre>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-white/40">
              {previewing ? "Opening definition…" : "No definition selected."}
            </div>
          )}
        </div>
      </div>

      <CrossReferencePanel symbol={selected} />
      <ImpactAnalysisPanel symbol={selected} />
      <SymbolLifecyclePanel symbol={selected} />

      {error ? (
        <div className="mt-3 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
    </section>
  );
}
