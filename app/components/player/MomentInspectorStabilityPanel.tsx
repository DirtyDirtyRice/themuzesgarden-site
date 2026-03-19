"use client";

import {
  getPhraseStabilityIssueUi,
  getPhraseStabilityLabelUi,
  type InspectorPhraseStabilityFamilyRow,
} from "./momentInspectorPhraseStabilityView";

function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function formatWholePercent(value: number): string {
  return `${Math.round(clamp100(value))}%`;
}

function getStabilityTone(label: string | null | undefined): string {
  if (label === "solid") return "text-emerald-700";
  if (label === "good") return "text-sky-700";
  if (label === "fragile") return "text-amber-700";
  if (label === "unstable") return "text-red-700";
  return "text-zinc-600";
}

function getPanelTone(label: string | null | undefined): string {
  if (label === "unstable") return "border-red-200";
  if (label === "fragile") return "border-amber-200";
  if (label === "good") return "border-sky-200";
  return "border-emerald-200";
}

function getCardTone(label: string | null | undefined): string {
  if (label === "unstable") return "border-red-100 bg-red-50";
  if (label === "fragile") return "border-amber-100 bg-amber-50";
  if (label === "good") return "border-sky-100 bg-sky-50";
  return "border-emerald-100 bg-emerald-50";
}

function getDriftTone(severity: string | null | undefined): string {
  if (severity === "high") return "text-red-700";
  if (severity === "medium") return "text-amber-700";
  if (severity === "low") return "text-yellow-700";
  return "text-emerald-700";
}

function StabilityStatCard(props: {
  label: string;
  value: string;
  cardTone: string;
}) {
  const { label, value, cardTone } = props;

  return (
    <div className={`rounded border px-2 py-1 ${cardTone}`}>
      <div className="text-[9px] uppercase tracking-wide text-emerald-700">
        {label}
      </div>
      <div className="text-[12px] font-medium text-zinc-800">{value}</div>
    </div>
  );
}

export default function MomentInspectorStabilityPanel(props: {
  row: InspectorPhraseStabilityFamilyRow | null;
}) {
  const { row } = props;

  if (!row) return null;

  const panelTone = getPanelTone(row.stabilityLabel);
  const cardTone = getCardTone(row.stabilityLabel);
  const stabilityTone = getStabilityTone(row.stabilityLabel);

  return (
    <div className={`mt-2 rounded border bg-white px-2 py-2 ${panelTone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
          Phrase Stability
        </div>

        <div className={`text-[10px] ${stabilityTone}`}>
          {getPhraseStabilityLabelUi(row.stabilityLabel)}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <StabilityStatCard
          label="Stability Score"
          value={formatWholePercent(row.stabilityScore)}
          cardTone={cardTone}
        />

        <StabilityStatCard
          label="Timing"
          value={formatWholePercent(row.timingConsistency)}
          cardTone={cardTone}
        />

        <StabilityStatCard
          label="Duration"
          value={formatWholePercent(row.durationConsistency)}
          cardTone={cardTone}
        />

        <StabilityStatCard
          label="Coverage"
          value={formatWholePercent(row.repeatCoverage)}
          cardTone={cardTone}
        />

        <StabilityStatCard
          label="Structure"
          value={formatWholePercent(row.structuralConfidence)}
          cardTone={cardTone}
        />
      </div>

      <div className="mt-2 text-[10px] text-zinc-600">
        family {row.familyId} • highest drift{" "}
        <span className={getDriftTone(row.highestDriftSeverity)}>
          {row.highestDriftSeverity}
        </span>
      </div>

      {row.issueFlags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {row.issueFlags.map((flag) => (
            <div
              key={`${row.familyId}:${flag}`}
              className={`rounded border px-2 py-0.5 text-[10px] ${cardTone} ${stabilityTone}`}
            >
              {getPhraseStabilityIssueUi(flag)}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-[10px] text-emerald-700">
          No active stability issues.
        </div>
      )}
    </div>
  );
}