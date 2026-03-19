"use client";

import { buildInspectorFamilyView } from "./momentInspectorFamilyView";
import { buildMomentInspectorSimilarity } from "./momentInspectorSimilarity";
import { formatMomentTime } from "./playerUtils";

type SimilarityState = ReturnType<typeof buildMomentInspectorSimilarity>;

type StableFamilyDiagnosticsRow = NonNullable<
  SimilarityState["stableFamilyDiagnostics"]
>[number];

type RepeatDiagnosticsRow = NonNullable<SimilarityState["repeatDiagnostics"]>[number];

type MomentInspectorFamilyPanelsProps = {
  similarityState: SimilarityState;
  stableFamilyDiagnostics?: SimilarityState["stableFamilyDiagnostics"];
  repeatDiagnostics?: SimilarityState["repeatDiagnostics"];
};

function formatScorePercent(value: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
  return `${pct}%`;
}

function formatDifferencePercent(value: number): string {
  const pct = Math.max(0, Math.round(Number(value) || 0));
  return `${pct}%`;
}

function formatRepeatHint(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return "n/a";
  return `${value.toFixed(2)} sec`;
}

function formatOptionalSeconds(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `${value.toFixed(2)} sec`;
}

function PanelShell(props: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { title, subtitle, children } = props;

  return (
    <div className="mt-2 rounded border border-sky-200 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
          {title}
        </div>
        <div className="text-[10px] text-sky-700">{subtitle}</div>
      </div>

      {children}
    </div>
  );
}

function MiniStat(props: {
  label: string;
  value: string;
}) {
  const { label, value } = props;

  return (
    <div className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
      <div className="text-[9px] uppercase tracking-wide text-sky-700">{label}</div>
      <div className="text-[12px] font-medium text-zinc-800">{value}</div>
    </div>
  );
}

function findStableDiagnostics(
  rows: StableFamilyDiagnosticsRow[],
  familyId: string | null | undefined
): StableFamilyDiagnosticsRow | null {
  if (!familyId) return null;
  return rows.find((row) => row.familyId === familyId) ?? null;
}

function findRepeatDiagnostics(
  rows: RepeatDiagnosticsRow[],
  familyId: string | null | undefined
): RepeatDiagnosticsRow | null {
  if (!familyId) return null;
  return rows.find((row) => row.familyId === familyId) ?? null;
}

export default function MomentInspectorFamilyPanels(
  props: MomentInspectorFamilyPanelsProps
) {
  const { similarityState } = props;

  const stableFamilyDiagnostics: StableFamilyDiagnosticsRow[] =
    props.stableFamilyDiagnostics ?? similarityState.stableFamilyDiagnostics ?? [];

  const repeatDiagnostics: RepeatDiagnosticsRow[] =
    props.repeatDiagnostics ?? similarityState.repeatDiagnostics ?? [];

  const familyView = buildInspectorFamilyView(similarityState.stableFamilies);

  const selectedStableFamily = similarityState.stableSelectedFamily;

  const selectedStableFamilyMembers = selectedStableFamily
    ? familyView.membersByFamily[selectedStableFamily.id] ?? []
    : [];

  const selectedStableFamilyDiagnostics = findStableDiagnostics(
    stableFamilyDiagnostics,
    selectedStableFamily?.id
  );

  const selectedRepeatDiagnostics = findRepeatDiagnostics(
    repeatDiagnostics,
    similarityState.selectedFamily?.anchorId
  );

  const topSimilarityDebugRows = similarityState.similarityDebugRows.slice(0, 3);

  return (
    <>
      {selectedStableFamily ? (
        <PanelShell title="Stable Phrase Family" subtitle={selectedStableFamily.id}>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Members" value={String(selectedStableFamily.size)} />
            <MiniStat
              label="Strongest Match"
              value={formatScorePercent(selectedStableFamily.strongestScore)}
            />
            <MiniStat
              label="Average Match"
              value={formatScorePercent(selectedStableFamily.averageScore)}
            />
            <MiniStat
              label="Repeat Hint"
              value={formatRepeatHint(selectedStableFamily.repeatIntervalHint)}
            />
          </div>

          <div className="mt-2 text-[10px] text-zinc-600">
            anchor {selectedStableFamily.anchorMomentId}
          </div>

          {selectedStableFamilyDiagnostics ? (
            <div className="mt-2 rounded border border-sky-100 bg-sky-50 px-2 py-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
                Family Diagnostics
              </div>
              <div className="mt-1 text-[10px] text-zinc-600">
                confidence {formatScorePercent(selectedStableFamilyDiagnostics.familyConfidence)} •
                avg similarity {formatScorePercent(selectedStableFamilyDiagnostics.avgSimilarity)} •
                timing spread {formatOptionalSeconds(selectedStableFamilyDiagnostics.timingSpread)}
              </div>
              <div className="mt-1 text-[10px] text-zinc-500">
                anchor {selectedStableFamilyDiagnostics.familyAnchorMomentId} • ungrouped risk{" "}
                {formatScorePercent(selectedStableFamilyDiagnostics.ungroupedRisk)}
              </div>
            </div>
          ) : null}

          {selectedStableFamilyMembers.length > 0 ? (
            <div className="mt-2 space-y-1">
              {selectedStableFamilyMembers.map((member) => (
                <div
                  key={`${selectedStableFamily.id}:${member.momentId}`}
                  className="flex items-center justify-between gap-2 text-[10px] text-zinc-700"
                >
                  <div className="min-w-0 truncate">{member.momentId}</div>
                  <div className="shrink-0">
                    anchor match {formatScorePercent(member.similarityToAnchor)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </PanelShell>
      ) : (
        <div className="mt-2 rounded border border-sky-200 bg-white px-2 py-2 text-[10px] text-zinc-600">
          No stable family found for the selected moment yet.
        </div>
      )}

      {similarityState.selectedFamily ? (
        <PanelShell
          title="Legacy Phrase Family"
          subtitle={`avg difference ${Math.round(
            similarityState.selectedFamily.averageDifferencePercent
          )}%`}
        >
          {selectedRepeatDiagnostics ? (
            <div className="mt-2 rounded border border-sky-100 bg-sky-50 px-2 py-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-sky-700">
                Repeat Diagnostics
              </div>
              <div className="mt-1 text-[10px] text-zinc-600">
                observed gaps {selectedRepeatDiagnostics.observedGapCount} • estimated interval{" "}
                {formatRepeatHint(selectedRepeatDiagnostics.estimatedInterval)} • repeat confidence{" "}
                {formatScorePercent(selectedRepeatDiagnostics.repeatConfidence)}
              </div>
            </div>
          ) : null}

          <div className="mt-1 space-y-1">
            {similarityState.selectedFamily.members.map((member, index) => (
              <div
                key={`${member.moment.sectionId}:${index}`}
                className="flex items-center justify-between gap-2 text-[10px] text-zinc-700"
              >
                <div className="min-w-0 truncate">
                  {member.moment.sectionId} — {member.moment.label}
                </div>
                <div className="shrink-0">
                  {formatMomentTime(member.moment.startTime)} • {member.matchKind} •{" "}
                  {member.differencePercentToReference}% off
                </div>
              </div>
            ))}
          </div>
        </PanelShell>
      ) : null}

      {similarityState.similarMoments.length > 0 ? (
        <PanelShell
          title="Closest Related Moments"
          subtitle={`top ${Math.min(6, similarityState.similarMoments.length)}`}
        >
          <div className="mt-1 space-y-1">
            {similarityState.similarMoments.slice(0, 6).map((result, index) => {
              const stableFamilyId =
                similarityState.familyByMomentId[result.candidate.sectionId] ?? null;

              const debugRow =
                similarityState.similarityDebugRows.find(
                  (row) => row.momentId === result.candidate.sectionId
                ) ?? null;

              return (
                <div
                  key={`${result.candidate.sectionId}:${index}`}
                  className="rounded border border-sky-100 bg-sky-50 px-2 py-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-700">
                    <div className="min-w-0 truncate">
                      {result.candidate.sectionId} — {result.candidate.label}
                    </div>
                    <div className="shrink-0">
                      {result.matchKind} • {formatDifferencePercent(result.differencePercent)} off •{" "}
                      {formatMomentTime(result.candidate.startTime)}
                      {stableFamilyId ? ` • ${stableFamilyId}` : ""}
                    </div>
                  </div>

                  {debugRow ? (
                    <div className="mt-1 text-[10px] text-zinc-500">
                      sim {formatScorePercent(debugRow.similarityScore)} • timing{" "}
                      {formatOptionalSeconds(debugRow.timingDistance)} • tags{" "}
                      {formatScorePercent(debugRow.tagOverlap)} • desc{" "}
                      {formatScorePercent(debugRow.descriptionOverlap)} • structural{" "}
                      {formatScorePercent(debugRow.structuralConfidence)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </PanelShell>
      ) : null}

      {similarityState.repeatPlan ? (
        <PanelShell
          title="Repeat Plan"
          subtitle={`every ${similarityState.repeatPlan.rule.every.toFixed(2)} seconds`}
        >
          <div className="mt-1 space-y-1">
            {similarityState.repeatPlan.placements.slice(0, 8).map((placement, index) => (
              <div
                key={`${placement.familyId}:${placement.expectedAt}:${index}`}
                className="flex items-center justify-between gap-2 text-[10px] text-zinc-700"
              >
                <div className="min-w-0 truncate">
                  expected {formatMomentTime(placement.expectedAt)}
                </div>
                <div className="shrink-0">
                  {placement.status}
                  {placement.nearestActualStart !== null
                    ? ` • nearest ${formatMomentTime(placement.nearestActualStart)}`
                    : " • no nearby occurrence"}
                </div>
              </div>
            ))}
          </div>
        </PanelShell>
      ) : null}

      {familyView.rows.length > 0 ? (
        <PanelShell
          title="Track Family Summary"
          subtitle={`${familyView.rows.length} family${familyView.rows.length === 1 ? "" : "ies"}`}
        >
          <div className="mt-1 space-y-1">
            {familyView.rows.slice(0, 6).map((row) => {
              const diagnostics = findStableDiagnostics(stableFamilyDiagnostics, row.familyId);

              return (
                <div key={row.familyId} className="rounded border border-sky-100 bg-sky-50 px-2 py-1">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-700">
                    <div className="min-w-0 truncate">{row.familyId}</div>
                    <div className="shrink-0">
                      members {row.size} • strongest {formatScorePercent(row.strongestScore)} •
                      repeat {formatRepeatHint(row.repeatIntervalHint)}
                    </div>
                  </div>

                  {diagnostics ? (
                    <div className="mt-1 text-[10px] text-zinc-500">
                      confidence {formatScorePercent(diagnostics.familyConfidence)} • avg sim{" "}
                      {formatScorePercent(diagnostics.avgSimilarity)} • spread{" "}
                      {formatOptionalSeconds(diagnostics.timingSpread)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </PanelShell>
      ) : null}

      {topSimilarityDebugRows.length > 0 ? (
        <PanelShell
          title="Similarity Debug Summary"
          subtitle={`top ${Math.min(3, topSimilarityDebugRows.length)}`}
        >
          <div className="mt-1 space-y-1">
            {topSimilarityDebugRows.map((row) => (
              <div
                key={row.momentId}
                className="flex items-center justify-between gap-2 text-[10px] text-zinc-700"
              >
                <div className="min-w-0 truncate">{row.momentId}</div>
                <div className="shrink-0">
                  sim {formatScorePercent(row.similarityScore)} • structural{" "}
                  {formatScorePercent(row.structuralConfidence)}
                </div>
              </div>
            ))}
          </div>
        </PanelShell>
      ) : null}
    </>
  );
}