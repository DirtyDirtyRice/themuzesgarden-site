import { buildRepairSimulationViewModel } from "./playerMomentRepairSimulationViewBridge";
import type { RepairSimulationResult } from "./playerMomentRepairSimulation.types";

function clampNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function formatPercent(value: unknown): string {
  return `${clampNumber(value)}%`;
}

function formatWhole(value: unknown): string {
  return `${clampNumber(value)}`;
}

function getRiskTone(risk: number): string {
  if (risk >= 70) return "text-red-700";
  if (risk >= 40) return "text-amber-700";
  return "text-emerald-700";
}

function getConfidenceTone(confidence: number): string {
  if (confidence >= 70) return "text-emerald-700";
  if (confidence >= 40) return "text-sky-700";
  return "text-zinc-600";
}

function getImprovementTone(improvement: number): string {
  if (improvement >= 70) return "text-emerald-700";
  if (improvement >= 40) return "text-sky-700";
  return "text-zinc-600";
}

function getStatusTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

export default function MomentInspectorRepairSimulationPanel(props: {
  result: RepairSimulationResult | null | undefined;
}) {
  const { result } = props;

  if (!result) return null;

  const view = buildRepairSimulationViewModel({ result });
  const familySummaries = Array.isArray(view.familySummaries) ? view.familySummaries : [];
  const rows = Array.isArray(view.rows) ? view.rows : [];

  if (!rows.length) {
    return (
      <div className="mt-2 rounded border border-zinc-200 bg-white px-3 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          Repair Simulation
        </div>
        <div className="mt-1 text-[12px] text-zinc-600">
          No repair simulation scenarios available.
        </div>
      </div>
    );
  }

  const hasFamilySummaries = familySummaries.length > 0;
  const hasScenarioRows = rows.length > 0;

  return (
    <div className="mt-2 rounded border border-violet-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-violet-700">
          Repair Simulation
        </div>
        <div className="text-[10px] text-violet-700">
          {rows.length} scenario{rows.length === 1 ? "" : "s"} /{" "}
          {familySummaries.length} famil
          {familySummaries.length === 1 ? "y" : "ies"}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            hasFamilySummaries
          )}`}
        >
          Family summaries {hasFamilySummaries ? "ready" : "missing"}
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
            hasScenarioRows
          )}`}
        >
          Scenario rows {hasScenarioRows ? "ready" : "missing"}
        </div>
      </div>

      <div className="mt-2 rounded border border-violet-100 bg-violet-50/50 px-2 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-violet-700">
          Family Summary
        </div>

        <div className="mt-2 space-y-1">
          {familySummaries.map((summary) => (
            <div
              key={summary.familyId}
              className="rounded border border-violet-100 bg-white px-2 py-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-medium text-zinc-800">
                  {summary.familyId}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {summary.totalScenarios} scenario
                  {summary.totalScenarios === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                <div className={getImprovementTone(summary.bestImprovement)}>
                  Best improvement {formatWhole(summary.bestImprovement)}
                </div>
                <div className={getConfidenceTone(summary.highestConfidence)}>
                  Confidence {formatPercent(summary.highestConfidence)}
                </div>
                <div className={getRiskTone(summary.highestRisk)}>
                  Risk {formatWhole(summary.highestRisk)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 rounded border border-zinc-200 bg-zinc-50 px-2 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          Scenario Rows
        </div>

        <div className="mt-2 space-y-1">
          {rows.map((row, idx) => (
            <div
              key={`${row.familyId}:${row.scenarioType}:${row.label}:${idx}`}
              className="rounded border border-zinc-200 bg-white px-2 py-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-medium text-zinc-800">
                  {row.label}
                </div>
                <div className="text-[10px] text-zinc-500">{row.familyId}</div>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                <div className={getConfidenceTone(row.confidence)}>
                  Confidence {formatPercent(row.confidence)}
                </div>
                <div className={getImprovementTone(row.expectedImprovement)}>
                  Improvement {formatWhole(row.expectedImprovement)}
                </div>
                <div className={getRiskTone(row.risk)}>
                  Risk {formatWhole(row.risk)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}