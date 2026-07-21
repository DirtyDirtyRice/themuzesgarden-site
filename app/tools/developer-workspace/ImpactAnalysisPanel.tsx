"use client";

import { useEffect, useState } from "react";

import type {
  ImpactAnalysisReport,
  ImpactPathStep,
  ImpactRisk,
} from "@/lib/developer-workspace/impactAnalysis";
import type { ProjectFileView } from "@/lib/developer-workspace/projectFile";
import type { ProjectSymbol } from "@/lib/developer-workspace/symbolIndex";

type Props = { symbol: ProjectSymbol | null };
type ApiError = { error: string };

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}

function riskStyle(risk: ImpactRisk): string {
  if (risk === "high") return "border-red-300/40 bg-red-300/10 text-red-100";
  if (risk === "medium") return "border-amber-300/40 bg-amber-300/10 text-amber-100";
  return "border-sky-300/30 bg-sky-300/10 text-sky-100";
}

export default function ImpactAnalysisPanel({ symbol }: Props) {
  const [report, setReport] = useState<ImpactAnalysisReport | null>(null);
  const [selectedStep, setSelectedStep] = useState<ImpactPathStep | null>(null);
  const [preview, setPreview] = useState<ProjectFileView | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) {
      setReport(null);
      setSelectedStep(null);
      setPreview(null);
      return;
    }

    const selectedSymbol = symbol;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      setReport(null);
      setSelectedStep(null);
      setPreview(null);
      try {
        const params = new URLSearchParams({
          path: selectedSymbol.path,
          name: selectedSymbol.name,
          line: String(selectedSymbol.line),
          depth: "6",
          limit: "500",
        });
        const response = await fetch(`/api/developer-workspace/impact?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (!response.ok || isApiError(body)) {
          throw new Error(isApiError(body) ? body.error : "Dependency impact analysis failed.");
        }
        setReport(body as ImpactAnalysisReport);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Dependency impact analysis failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [symbol]);

  async function openStep(step: ImpactPathStep) {
    setSelectedStep(step);
    setPreviewing(true);
    setError("");
    try {
      const params = new URLSearchParams({
        path: step.toPath,
        line: String(Math.max(1, step.sourceLine - 6)),
        count: "28",
      });
      const response = await fetch(`/api/developer-workspace/file?${params.toString()}`, {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Impact source preview failed.");
      }
      setPreview(body as ProjectFileView);
    } catch (previewError) {
      setPreview(null);
      setError(previewError instanceof Error ? previewError.message : "Impact source preview failed.");
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <section className="mt-4 rounded-lg border border-orange-300/20 bg-orange-300/5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-orange-200">
            Dependency impact analysis
          </div>
          <h3 className="mt-1 text-xl font-black">
            {symbol ? `What could ${symbol.name} break?` : "Select a symbol"}
          </h3>
          <p className="mt-1 text-xs text-white/50">
            {loading
              ? "Tracing direct and downstream dependency paths…"
              : report
                ? `${report.directCount} direct and ${Math.max(0, report.totalCount - report.directCount)} downstream files across ${report.maxDepth} levels`
                : "Impact paths will appear after a symbol is selected."}
          </p>
        </div>
        {report ? (
          <div className="flex gap-2 text-xs">
            <span className="rounded border border-red-300/30 px-2 py-1 text-red-100">{report.directCount} high risk</span>
            <span className="rounded border border-white/15 px-2 py-1">{report.totalCount} total</span>
          </div>
        ) : null}
      </div>

      <div className="grid min-h-72 lg:grid-cols-[minmax(340px,0.9fr)_minmax(420px,1.1fr)]">
        <div className="max-h-[62vh] overflow-y-auto border-b border-white/10 p-3 lg:border-b-0 lg:border-r">
          {report?.impacts.map((impact) => (
            <details key={impact.path} className="mb-2 rounded border border-white/10 bg-black/20">
              <summary className="cursor-pointer list-none p-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-black uppercase ${riskStyle(impact.risk)}`}>
                    {impact.risk}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{impact.path}</span>
                  <span className="text-xs text-white/40">depth {impact.depth}</span>
                </div>
              </summary>
              <div className="space-y-1 border-t border-white/10 p-2">
                {impact.pathSteps.map((step, index) => (
                  <button
                    key={`${step.fromPath}:${step.toPath}:${step.sourceLine}:${index}`}
                    type="button"
                    onClick={() => void openStep(step)}
                    className="w-full rounded border border-white/10 px-3 py-2 text-left hover:border-orange-300/40"
                  >
                    <div className="truncate text-xs font-bold text-orange-100">
                      {index + 1}. {step.fromPath} → {step.toPath}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-white/45">
                      {step.kind} {step.symbolName} at {step.toPath}:{step.sourceLine}:{step.sourceColumn}
                    </div>
                  </button>
                ))}
              </div>
            </details>
          ))}
          {report && report.totalCount === 0 ? (
            <div className="p-8 text-center text-sm text-emerald-100/65">
              No downstream project files currently depend on this symbol.
            </div>
          ) : null}
          {report?.truncated ? (
            <div className="rounded border border-amber-300/30 bg-amber-300/10 p-3 text-xs text-amber-100">
              More impact exists beyond the current depth or result safety limit.
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="border-b border-white/10 p-3 text-xs text-orange-100/65">
            {selectedStep
              ? `${selectedStep.toPath}:${selectedStep.sourceLine}:${selectedStep.sourceColumn}`
              : "Open a breadcrumb step to inspect the exact dependency location."}
          </div>
          {preview && selectedStep ? (
            <div className="max-h-[62vh] overflow-auto py-2 font-mono text-[13px] leading-6">
              {preview.lines.map((line) => (
                <div
                  key={line.number}
                  className={`grid min-w-max grid-cols-[5rem_1fr] ${line.number === selectedStep.sourceLine ? "bg-orange-300/15 text-orange-50" : "text-white/70"}`}
                >
                  <span className="border-r border-white/10 px-3 text-right text-white/30">{line.number}</span>
                  <pre className="min-h-6 whitespace-pre px-4">{line.text || " "}</pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-white/35">
              {previewing ? "Opening dependency source…" : "No impact breadcrumb selected."}
            </div>
          )}
        </div>
      </div>

      {error ? <div className="border-t border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
    </section>
  );
}
