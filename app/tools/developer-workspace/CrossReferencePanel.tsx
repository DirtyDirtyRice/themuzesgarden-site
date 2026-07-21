"use client";

import { useEffect, useState } from "react";

import type {
  CrossReferenceKind,
  CrossReferenceLocation,
  CrossReferenceReport,
} from "@/lib/developer-workspace/crossReferences";
import type { ProjectFileView } from "@/lib/developer-workspace/projectFile";
import type { ProjectSymbol } from "@/lib/developer-workspace/symbolIndex";

type Props = {
  symbol: ProjectSymbol | null;
};

type CrossReferenceResponse = CrossReferenceReport & {
  indexedFiles: number;
};

type ApiError = {
  error: string;
};

type ReferenceTab = CrossReferenceKind | "dependent";

const TABS: ReferenceTab[] = ["definition", "import", "export", "usage", "dependent"];

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function locationsForTab(
  report: CrossReferenceResponse,
  tab: Exclude<ReferenceTab, "dependent">
): CrossReferenceLocation[] {
  if (tab === "definition") return report.definitions;
  if (tab === "import") return report.imports;
  if (tab === "export") return report.exports;
  return report.usages;
}

export default function CrossReferencePanel({ symbol }: Props) {
  const [report, setReport] = useState<CrossReferenceResponse | null>(null);
  const [tab, setTab] = useState<ReferenceTab>("usage");
  const [selectedLocation, setSelectedLocation] = useState<CrossReferenceLocation | null>(null);
  const [preview, setPreview] = useState<ProjectFileView | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) {
      setReport(null);
      setSelectedLocation(null);
      setPreview(null);
      return;
    }

    const selectedSymbol = symbol;
    const controller = new AbortController();

    async function loadReport() {
      setLoading(true);
      setError("");
      setReport(null);
      setSelectedLocation(null);
      setPreview(null);

      try {
        const params = new URLSearchParams({
          path: selectedSymbol.path,
          name: selectedSymbol.name,
          line: String(selectedSymbol.line),
        });
        const response = await fetch(
          `/api/developer-workspace/cross-references?${params.toString()}`,
          { cache: "no-store", signal: controller.signal }
        );
        const body: unknown = await response.json();
        if (!response.ok || isApiError(body)) {
          throw new Error(isApiError(body) ? body.error : "Cross-reference lookup failed.");
        }
        const nextReport = body as CrossReferenceResponse;
        setReport(nextReport);
        const firstUsefulTab: ReferenceTab = nextReport.usages.length
          ? "usage"
          : nextReport.imports.length
            ? "import"
            : nextReport.exports.length
              ? "export"
              : "definition";
        setTab(firstUsefulTab);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Cross-reference lookup failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadReport();
    return () => controller.abort();
  }, [symbol]);

  async function openLocation(location: CrossReferenceLocation) {
    setSelectedLocation(location);
    setPreviewing(true);
    setError("");

    try {
      const params = new URLSearchParams({
        path: location.path,
        line: String(Math.max(1, location.line - 6)),
        count: "28",
      });
      const response = await fetch(`/api/developer-workspace/file?${params.toString()}`, {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Reference preview failed.");
      }
      setPreview(body as ProjectFileView);
    } catch (previewError) {
      setPreview(null);
      setError(previewError instanceof Error ? previewError.message : "Reference preview failed.");
    } finally {
      setPreviewing(false);
    }
  }

  const tabCounts: Record<ReferenceTab, number> = {
    definition: report?.definitions.length ?? 0,
    import: report?.imports.length ?? 0,
    export: report?.exports.length ?? 0,
    usage: report?.usages.length ?? 0,
    dependent: report?.dependentFiles.length ?? 0,
  };

  const activeLocations =
    report && tab !== "dependent" ? locationsForTab(report, tab) : [];

  return (
    <section className="mt-4 rounded-lg border border-fuchsia-300/20 bg-black/25">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">
            Cross-reference intelligence
          </div>
          <h3 className="mt-1 text-xl font-black">
            {symbol ? symbol.name : "Select a symbol"}
          </h3>
          <p className="mt-1 text-xs text-white/45">
            {report
              ? `${report.referenceCount} locations across ${report.indexedFiles.toLocaleString()} indexed files`
              : loading
                ? "Resolving canonical symbol and scanning project references…"
                : "Definitions, imports, exports, usages, and dependent files will appear here."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            disabled={!report}
            className={[
              "rounded border px-3 py-2 text-xs font-black capitalize disabled:opacity-35",
              tab === item
                ? "border-fuchsia-200 bg-fuchsia-200 text-black"
                : "border-white/15 text-white/60",
            ].join(" ")}
          >
            {item} · {tabCounts[item]}
          </button>
        ))}
      </div>

      <div className="grid min-h-72 gap-0 lg:grid-cols-[minmax(300px,0.8fr)_minmax(420px,1.2fr)]">
        <div className="max-h-[58vh] overflow-y-auto border-b border-white/10 p-3 lg:border-b-0 lg:border-r">
          {tab === "dependent" && report
            ? report.dependentFiles.map((filePath) => (
                <div
                  key={filePath}
                  className="mb-1 rounded border border-white/10 px-3 py-2 text-sm text-white/70"
                >
                  {filePath}
                </div>
              ))
            : null}

          {tab !== "dependent"
            ? activeLocations.map((location) => (
                <button
                  key={`${location.kind}:${location.path}:${location.line}:${location.column}`}
                  type="button"
                  onClick={() => void openLocation(location)}
                  className={[
                    "mb-1 w-full rounded border p-3 text-left",
                    selectedLocation?.path === location.path &&
                    selectedLocation.line === location.line &&
                    selectedLocation.column === location.column
                      ? "border-fuchsia-300/50 bg-fuchsia-300/10"
                      : "border-white/10 hover:border-white/25",
                  ].join(" ")}
                >
                  <div className="truncate text-sm font-bold">
                    {location.path}:{location.line}:{location.column}
                  </div>
                  <div className="mt-1 truncate font-mono text-xs text-white/40">
                    {location.context || "[blank line]"}
                  </div>
                </button>
              ))
            : null}

          {report && tabCounts[tab] === 0 ? (
            <div className="p-6 text-center text-sm text-white/35">
              No {tab} locations found for this symbol.
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="border-b border-white/10 p-3 text-xs text-cyan-100/60">
            {selectedLocation
              ? `${selectedLocation.path}:${selectedLocation.line}:${selectedLocation.column}`
              : "Select a reference location to open its source context."}
          </div>
          {preview && selectedLocation ? (
            <div className="max-h-[58vh] overflow-auto py-2 font-mono text-[13px] leading-6">
              {preview.lines.map((line) => {
                const target = line.number === selectedLocation.line;
                return (
                  <div
                    key={line.number}
                    className={[
                      "grid min-w-max grid-cols-[5rem_1fr]",
                      target ? "bg-fuchsia-300/15 text-fuchsia-50" : "text-white/70",
                    ].join(" ")}
                  >
                    <span className="border-r border-white/10 px-3 text-right text-white/30">
                      {line.number}
                    </span>
                    <pre className="min-h-6 whitespace-pre px-4">{line.text || " "}</pre>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-white/35">
              {previewing ? "Opening reference…" : "No reference location selected."}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="border-t border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
    </section>
  );
}
