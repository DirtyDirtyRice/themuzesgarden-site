"use client";

import { buildMomentInspectorSimilarity } from "./momentInspectorSimilarity";
import { formatMomentTime } from "./playerUtils";

type SimilarityState = ReturnType<typeof buildMomentInspectorSimilarity>;

function formatPercent01(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0%";
  const pct = Math.round(Math.max(0, Math.min(1, n)) * 100);
  return `${pct}%`;
}

function formatOptionalSeconds(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `${value.toFixed(2)} sec`;
}

function readStringField(
  value: unknown,
  key: "familyId" | "id" | "anchorId"
): string | null {
  if (!value || typeof value !== "object") return null;

  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" && candidate.trim()
    ? candidate
    : null;
}

function getSelectedFamilyKey(value: unknown): string | null {
  return (
    readStringField(value, "familyId") ??
    readStringField(value, "id") ??
    readStringField(value, "anchorId")
  );
}

export default function MomentInspectorSimilarityOverview(props: {
  similarityState: SimilarityState;
  similarityDebugRows?: SimilarityState["similarityDebugRows"];
}) {
  const { similarityState } = props;

  if (!similarityState.selectedMoment) return null;

  const similarityDebugRows =
    props.similarityDebugRows ?? similarityState.similarityDebugRows ?? [];

  const selectedFamilyDiagnostics =
    similarityState.stableSelectedFamily
      ? similarityState.stableFamilyDiagnostics.find(
          (row) => row.familyId === similarityState.stableSelectedFamily?.id
        ) ?? null
      : null;

  const selectedFamilyKey = getSelectedFamilyKey(similarityState.selectedFamily);

  const selectedRepeatDiagnostics = selectedFamilyKey
    ? similarityState.repeatDiagnostics.find(
        (row) => row.familyId === selectedFamilyKey
      ) ?? null
    : null;

  const topDebugRows = similarityDebugRows.slice(0, 3);
  const selectedMoment = similarityState.selectedMoment;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-sky-800">
          Similarity / Repeat Intelligence
        </div>
        <div className="text-[10px] text-sky-700">
          stable families {similarityState.stableFamilies.length} • similar moments{" "}
          {similarityState.similarMoments.length}
        </div>
      </div>

      <div className="mt-2 rounded border border-sky-200 bg-white px-2 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          Focus Moment
        </div>

        <div className="mt-1 text-[12px] font-medium text-zinc-800">
          {selectedMoment.label}
        </div>

        <div className="mt-1 text-[10px] text-zinc-600">
          section {selectedMoment.sectionId} • start{" "}
          {formatMomentTime(selectedMoment.startTime)}
          {selectedMoment.duration !== null
            ? ` • duration ${formatOptionalSeconds(selectedMoment.duration)}`
            : ""}
        </div>

        <div className="mt-1 flex flex-wrap gap-1">
          <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">
            structural {formatPercent01(selectedMoment.structuralStrength)}
          </span>

          <span className="rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700">
            tags {selectedMoment.tagCount}
          </span>

          <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] text-zinc-700">
            {selectedMoment.hasDescription ? "description ok" : "no description"}
          </span>

          <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
            {selectedMoment.repeatCandidate ? "repeat candidate" : "weak repeat signal"}
          </span>

          <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] text-zinc-700">
            {selectedMoment.timingClusterKey}
          </span>
        </div>

        <div className="mt-2 text-[10px] text-zinc-500">
          track families {similarityState.stableFamilies.length} • ungrouped moments{" "}
          {similarityState.ungroupedMomentIds.length} • intended plans{" "}
          {similarityState.intendedRepeatMetadata.plans.length} • action plans{" "}
          {similarityState.intendedActionResult.plans.length}
        </div>
      </div>

      <div className="mt-2 grid gap-2 xl:grid-cols-2">
        <div className="rounded border border-sky-200 bg-white px-2 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
            Similarity Debug
          </div>

          {topDebugRows.length > 0 ? (
            <div className="mt-2 space-y-1">
              {topDebugRows.map((row) => (
                <div
                  key={row.momentId}
                  className="rounded border border-sky-100 bg-sky-50 px-2 py-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <div className="min-w-0 truncate font-medium text-zinc-800">
                      {row.momentId}
                    </div>
                    <div className="text-sky-700">
                      sim {formatPercent01(row.similarityScore)}
                    </div>
                  </div>

                  <div className="mt-1 text-[10px] text-zinc-600">
                    timing {formatOptionalSeconds(row.timingDistance)} • tag overlap{" "}
                    {formatPercent01(row.tagOverlap)} • desc overlap{" "}
                    {formatPercent01(row.descriptionOverlap)}
                  </div>

                  <div className="mt-1 text-[10px] text-zinc-500">
                    structural {formatPercent01(row.structuralConfidence)} •{" "}
                    {row.repeatCandidate ? "repeat candidate" : "weak repeat signal"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-[10px] text-zinc-500">
              No similarity debug rows available.
            </div>
          )}
        </div>

        <div className="rounded border border-sky-200 bg-white px-2 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
            Family / Repeat Diagnostics
          </div>

          <div className="mt-2 space-y-2">
            <div className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
              <div className="text-[10px] font-medium text-zinc-800">
                Stable Family Context
              </div>
              <div className="mt-1 text-[10px] text-zinc-600">
                {selectedFamilyDiagnostics ? (
                  <>
                    family {selectedFamilyDiagnostics.familyId} • size{" "}
                    {selectedFamilyDiagnostics.familySize} • avg sim{" "}
                    {formatPercent01(selectedFamilyDiagnostics.avgSimilarity)} • confidence{" "}
                    {formatPercent01(selectedFamilyDiagnostics.familyConfidence)}
                  </>
                ) : (
                  "No stable family selected."
                )}
              </div>
              {selectedFamilyDiagnostics ? (
                <div className="mt-1 text-[10px] text-zinc-500">
                  anchor {selectedFamilyDiagnostics.familyAnchorMomentId} • timing spread{" "}
                  {formatOptionalSeconds(selectedFamilyDiagnostics.timingSpread)} • ungrouped risk{" "}
                  {formatPercent01(selectedFamilyDiagnostics.ungroupedRisk)}
                </div>
              ) : null}
            </div>

            <div className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
              <div className="text-[10px] font-medium text-zinc-800">
                Repeat Confidence
              </div>
              <div className="mt-1 text-[10px] text-zinc-600">
                {selectedRepeatDiagnostics ? (
                  <>
                    observed gaps {selectedRepeatDiagnostics.observedGapCount} • interval{" "}
                    {formatOptionalSeconds(selectedRepeatDiagnostics.estimatedInterval)} • confidence{" "}
                    {formatPercent01(selectedRepeatDiagnostics.repeatConfidence)}
                  </>
                ) : (
                  "No repeat diagnostics available for the selected family."
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
