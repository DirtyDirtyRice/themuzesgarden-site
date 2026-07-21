"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ArchitecturalFinding,
  ArchitecturalHealthReport,
  ArchitecturalRisk,
} from "@/lib/developer-workspace/architecturalHealth";

type ApiError = { error: string };
type RiskFilter = "all" | ArchitecturalRisk;

function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}

function riskStyle(risk: ArchitecturalRisk): string {
  if (risk === "critical") return "border-red-300/40 bg-red-300/10 text-red-100";
  if (risk === "high") return "border-orange-300/40 bg-orange-300/10 text-orange-100";
  if (risk === "moderate") return "border-amber-300/40 bg-amber-300/10 text-amber-100";
  return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
}

function scoreStyle(score: number): string {
  if (score < 40) return "text-red-200";
  if (score < 70) return "text-amber-200";
  return "text-emerald-200";
}

function findingLabel(finding: ArchitecturalFinding): string {
  return finding.kind.replaceAll("-", " ");
}

export default function ArchitecturalHealthDashboard() {
  const [report, setReport] = useState<ArchitecturalHealthReport | null>(null);
  const [filter, setFilter] = useState<RiskFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError("");
    try {
      const parameters = new URLSearchParams({ eventLimit: "1000" });
      if (refresh) parameters.set("refresh", "1");
      const response = await fetch(
        `/api/developer-workspace/architectural-health?${parameters.toString()}`,
        { cache: "no-store" },
      );
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Architectural health analysis failed.");
      }
      setReport(body as ArchitecturalHealthReport);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Architectural health analysis failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const findings = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return (report?.findings ?? []).filter((finding) => {
      if (filter !== "all" && finding.risk !== filter) return false;
      if (!cleanQuery) return true;
      return [finding.path, finding.relatedPath, finding.title, finding.explanation, finding.kind]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery);
    });
  }, [filter, query, report]);

  const cards: Array<[string, string, string]> = [
    ["Health score", report ? `${report.healthScore}/100` : "—", report ? scoreStyle(report.healthScore) : "text-white/35"],
    ["Critical findings", String(report?.criticalCount ?? 0), "text-red-100"],
    ["High findings", String(report?.highCount ?? 0), "text-orange-100"],
    ["Files analyzed", String(report?.indexedFiles ?? 0), "text-cyan-100"],
    ["Relationships", String(report?.indexedRelationships ?? 0), "text-violet-100"],
    ["History events", String(report?.analyzedEvents ?? 0), "text-sky-100"],
  ];

  return (
    <section className="mt-4 rounded-xl border border-fuchsia-300/25 bg-[#0b1720] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-200">
            Architectural Health Engine
          </div>
          <h2 className="mt-1 text-2xl font-black">Proactive maintenance risk</h2>
          <p className="mt-2 max-w-4xl text-sm text-white/60">
            Combines file size, dependency direction, relationship density, downstream consumers,
            tight coupling, and recorded change history before those risks become build errors.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading}
          className="rounded border border-fuchsia-300/50 px-4 py-2 text-sm font-black text-fuchsia-100 disabled:opacity-40"
        >
          {loading ? "Analyzing architecture..." : "Refresh full analysis"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, style]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</div>
            <div className={`mt-1 text-2xl font-black ${style}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-[1fr_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search risky files, explanations, or finding types"
          className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as RiskFilter)}
          className="rounded border border-white/15 bg-[#071016] px-3 py-2 text-sm"
        >
          <option value="all">All risk levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
        </select>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-300/40 bg-red-300/10 p-3 text-sm text-red-100">{error}</div>
      ) : null}

      {!loading && report && findings.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-emerald-300/25 p-8 text-center text-sm text-emerald-100/70">
          No architectural findings match this view.
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {findings.slice(0, 100).map((finding) => (
          <article key={finding.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded border px-2 py-1 text-[10px] font-black uppercase ${riskStyle(finding.risk)}`}>
                    {finding.risk}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-100/60">
                    {findingLabel(finding)}
                  </span>
                  <span className="text-xs text-white/35">risk score {finding.score}</span>
                </div>
                <h3 className="mt-2 text-base font-black">{finding.title}</h3>
                <div className="mt-1 break-all font-mono text-xs text-fuchsia-100/70">
                  {finding.path}{finding.relatedPath ? ` ↔ ${finding.relatedPath}` : ""}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/65">{finding.explanation}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {finding.evidence.map((evidence) => (
                <span key={evidence} className="rounded border border-white/10 px-2 py-1 text-xs text-white/55">
                  {evidence}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {findings.length > 100 ? (
        <div className="mt-3 text-xs text-white/40">Showing the first 100 of {findings.length} ranked findings.</div>
      ) : null}
    </section>
  );
}
