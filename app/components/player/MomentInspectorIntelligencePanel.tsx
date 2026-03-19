"use client";

import MomentInspectorFamilyDecisionStrip from "./MomentInspectorFamilyDecisionStrip";
import MomentInspectorFamilyDetailRow from "./MomentInspectorFamilyDetailRow";
import MomentInspectorFamilyMissingSignalsPanel from "./MomentInspectorFamilyMissingSignalsPanel";
import MomentInspectorFamilyPriorityPanel from "./MomentInspectorFamilyPriorityPanel";
import MomentInspectorFamilyReasoningPanel from "./MomentInspectorFamilyReasoningPanel";
import MomentInspectorFamilyRepairReadinessPanel from "./MomentInspectorFamilyRepairReadinessPanel";
import MomentInspectorFamilyRuntimeHeader from "./MomentInspectorFamilyRuntimeHeader";
import MomentInspectorFamilySelectorBar from "./MomentInspectorFamilySelectorBar";
import MomentInspectorFamilySignalCountsPanel from "./MomentInspectorFamilySignalCountsPanel";
import MomentInspectorFamilyStatusMatrix from "./MomentInspectorFamilyStatusMatrix";
import MomentInspectorFamilySummaryColumns from "./MomentInspectorFamilySummaryColumns";
import MomentInspectorIntelligenceHealthPanel from "./MomentInspectorIntelligenceHealthPanel";
import MomentInspectorRepairSimulationPanel from "./MomentInspectorRepairSimulationPanel";
import MomentInspectorRuntimeLegendPanel from "./MomentInspectorRuntimeLegendPanel";
import MomentInspectorRuntimeMetricsGrid from "./MomentInspectorRuntimeMetricsGrid";
import MomentInspectorRuntimeNextActionsPanel from "./MomentInspectorRuntimeNextActionsPanel";
import MomentInspectorRuntimeScoreBar from "./MomentInspectorRuntimeScoreBar";
import MomentInspectorRuntimeSnapshotPanel from "./MomentInspectorRuntimeSnapshotPanel";
import MomentInspectorRuntimeSummaryChips from "./MomentInspectorRuntimeSummaryChips";
import MomentInspectorSelectedFamilyStack from "./MomentInspectorSelectedFamilyStack";

import type {
  InspectorIntendedActionRow,
  InspectorIntendedActionSummaryRow,
} from "./momentInspectorIntendedActionView";
import type {
  InspectorPhraseDriftFamilyRow,
  InspectorPhraseDriftMemberRow,
} from "./momentInspectorPhraseDriftView";
import type { InspectorRepairQueueRow } from "./momentInspectorRepairQueueView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { ConfidenceHistoryResult } from "./playerMomentConfidenceHistory";
import type { FamilyLineageResult } from "./playerMomentFamilyLineage";
import type { PlayerMomentIntelligenceRuntimeState } from "./playerMomentIntelligenceRuntime";
import type { RepairSimulationResult } from "./playerMomentRepairSimulation.types";
import type { FamilyTrustStateResult } from "./playerMomentFamilyTrustState";

function getStatusTone(active: boolean): string {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-500";
}

function getRuntimeTone(
  healthBand: PlayerMomentIntelligenceRuntimeState["healthBand"]
): string {
  if (healthBand === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (healthBand === "good") return "border-sky-200 bg-sky-50 text-sky-800";
  if (healthBand === "watch") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function getFamilyCountLabel(count: number): string {
  return `${count} phrase famil${count === 1 ? "y" : "ies"}`;
}

function formatPercent(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n <= 0) return "0%";
  if (n >= 100) return "100%";
  return `${Math.round(n)}%`;
}

function getTrustTone(level: string | null | undefined): string {
  if (level === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (level === "stable") return "border-sky-200 bg-sky-50 text-sky-700";
  if (level === "watch") return "border-amber-200 bg-amber-50 text-amber-700";
  if (level === "fragile" || level === "broken") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

export default function MomentInspectorIntelligencePanel(props: {
  hasMomentIntelligence: boolean;
  intelligenceRuntime: PlayerMomentIntelligenceRuntimeState;
  familyOptions: string[];
  selectedPhraseFamilyId: string;
  onChangeSelectedPhraseFamilyId: (value: string) => void;
  selectedRepairQueueRow: InspectorRepairQueueRow | null;
  repairQueueRows: InspectorRepairQueueRow[];
  repairSimulationResult: RepairSimulationResult | null;
  actionSummaryRows: InspectorIntendedActionSummaryRow[];
  driftFamilyRows: InspectorPhraseDriftFamilyRow[];
  stabilityFamilyRows: InspectorPhraseStabilityFamilyRow[];
  selectedActionSummaryRow: InspectorIntendedActionSummaryRow | null;
  selectedActionRows: InspectorIntendedActionRow[];
  selectedDriftFamily: InspectorPhraseDriftFamilyRow | null;
  selectedDriftMembers: InspectorPhraseDriftMemberRow[];
  selectedStabilityFamily: InspectorPhraseStabilityFamilyRow | null;
  selectedTrustStateResult?: FamilyTrustStateResult | null;
  selectedConfidenceHistoryResult?: ConfidenceHistoryResult | null;
  selectedLineageResult?: FamilyLineageResult | null;
}) {
  const {
    hasMomentIntelligence,
    intelligenceRuntime,
    familyOptions,
    selectedPhraseFamilyId,
    onChangeSelectedPhraseFamilyId,
    selectedRepairQueueRow,
    repairQueueRows,
    repairSimulationResult,
    actionSummaryRows,
    driftFamilyRows,
    stabilityFamilyRows,
    selectedActionSummaryRow,
    selectedActionRows,
    selectedDriftFamily,
    selectedDriftMembers,
    selectedStabilityFamily,
    selectedTrustStateResult = null,
    selectedConfidenceHistoryResult = null,
    selectedLineageResult = null,
  } = props;

  const safeFamilyOptions = Array.isArray(familyOptions) ? familyOptions : [];
  const safeRepairQueueRows = Array.isArray(repairQueueRows) ? repairQueueRows : [];
  const safeActionSummaryRows = Array.isArray(actionSummaryRows) ? actionSummaryRows : [];
  const safeDriftFamilyRows = Array.isArray(driftFamilyRows) ? driftFamilyRows : [];
  const safeStabilityFamilyRows = Array.isArray(stabilityFamilyRows)
    ? stabilityFamilyRows
    : [];
  const safeSelectedActionRows = Array.isArray(selectedActionRows)
    ? selectedActionRows
    : [];
  const safeSelectedDriftMembers = Array.isArray(selectedDriftMembers)
    ? selectedDriftMembers
    : [];

  const hasSelectedFamily = Boolean(String(selectedPhraseFamilyId ?? "").trim());
  const hasRepairData = Boolean(selectedRepairQueueRow) || safeRepairQueueRows.length > 0;
  const hasDriftData = Boolean(selectedDriftFamily) || safeDriftFamilyRows.length > 0;
  const hasStabilityData =
    Boolean(selectedStabilityFamily) || safeStabilityFamilyRows.length > 0;
  const hasTrustData = Boolean(selectedTrustStateResult);
  const hasActionData =
    Boolean(selectedActionSummaryRow) ||
    safeActionSummaryRows.length > 0 ||
    safeSelectedActionRows.length > 0;
  const hasRepairSimulation = Boolean(repairSimulationResult);

  return (
    <div className="rounded-lg border border-sky-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-sky-700">
          Moment Intelligence Inspector
        </div>

        <div className="text-[10px] text-sky-600">
          {hasMomentIntelligence
            ? getFamilyCountLabel(safeFamilyOptions.length)
            : "waiting for phrase-engine wiring"}
        </div>
      </div>

      {hasMomentIntelligence ? (
        <div className="mt-2 space-y-3">
          <MomentInspectorIntelligenceHealthPanel runtime={intelligenceRuntime} />

          <div className="grid gap-3 xl:grid-cols-2">
            <MomentInspectorRuntimeSnapshotPanel runtime={intelligenceRuntime} />
            <MomentInspectorFamilyPriorityPanel runtime={intelligenceRuntime} />
          </div>

          <MomentInspectorFamilyDecisionStrip
            hasDrift={hasDriftData}
            hasStability={hasStabilityData}
            hasActions={hasActionData}
            hasRepairQueue={hasRepairData}
            hasSimulation={hasRepairSimulation}
          />

          <div className="grid gap-3 xl:grid-cols-2">
            <MomentInspectorFamilyStatusMatrix
              hasDrift={hasDriftData}
              hasStability={hasStabilityData}
              hasActions={hasActionData}
              hasRepairQueue={hasRepairData}
              hasSimulation={hasRepairSimulation}
              hasTrust={hasTrustData}
            />

            <MomentInspectorFamilyMissingSignalsPanel
              hasDrift={hasDriftData}
              hasStability={hasStabilityData}
              hasActions={hasActionData}
              hasRepairQueue={hasRepairData}
              hasSimulation={hasRepairSimulation}
              hasTrust={hasTrustData}
            />
          </div>

          {selectedTrustStateResult ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-medium text-sky-800">
                    Selected Family Trust
                  </div>
                  <div className="text-[10px] text-sky-700">
                    Real trust-engine output for the selected phrase family
                  </div>
                </div>

                <div
                  className={`rounded border px-2 py-1 text-[10px] font-medium ${getTrustTone(
                    selectedTrustStateResult.trustLevel
                  )}`}
                >
                  {selectedTrustStateResult.trustLevel}
                </div>
              </div>

              <div className="mt-2 grid gap-2 md:grid-cols-4">
                <div className="rounded border border-white bg-white px-2 py-2">
                  <div className="text-[10px] text-zinc-500">Trust</div>
                  <div className="text-sm font-medium text-zinc-900">
                    {formatPercent(selectedTrustStateResult.trustScore)}
                  </div>
                </div>

                <div className="rounded border border-white bg-white px-2 py-2">
                  <div className="text-[10px] text-zinc-500">Recovery</div>
                  <div className="text-sm font-medium text-zinc-900">
                    {formatPercent(selectedTrustStateResult.recoveryScore)}
                  </div>
                </div>

                <div className="rounded border border-white bg-white px-2 py-2">
                  <div className="text-[10px] text-zinc-500">Volatility</div>
                  <div className="text-sm font-medium text-zinc-900">
                    {formatPercent(selectedTrustStateResult.volatilityScore)}
                  </div>
                </div>

                <div className="rounded border border-white bg-white px-2 py-2">
                  <div className="text-[10px] text-zinc-500">Repair Opportunity</div>
                  <div className="text-sm font-medium text-zinc-900">
                    {formatPercent(selectedTrustStateResult.repairOpportunityScore)}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                <div className="rounded border border-sky-200 bg-white px-2 py-1 text-[10px] text-sky-700">
                  strongest reason: {selectedTrustStateResult.strongestReason ?? "—"}
                </div>

                {(selectedTrustStateResult.reasons ?? []).map((reason) => (
                  <div
                    key={reason}
                    className="rounded border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-700"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <MomentInspectorFamilyReasoningPanel
            runtime={intelligenceRuntime}
            hasDrift={hasDriftData}
            hasStability={hasStabilityData}
            hasActions={hasActionData}
            hasRepairQueue={hasRepairData}
            hasSimulation={hasRepairSimulation}
            familyOptionCount={safeFamilyOptions.length}
            actionCount={safeSelectedActionRows.length}
            driftMemberCount={safeSelectedDriftMembers.length}
            repairQueueCount={safeRepairQueueRows.length}
          />

          <div className="grid gap-3 xl:grid-cols-2">
            <MomentInspectorFamilySignalCountsPanel
              familyOptionCount={safeFamilyOptions.length}
              actionCount={safeSelectedActionRows.length}
              driftMemberCount={safeSelectedDriftMembers.length}
              repairQueueCount={safeRepairQueueRows.length}
            />

            <MomentInspectorFamilyRepairReadinessPanel
              hasRepairQueue={hasRepairData}
              hasSimulation={hasRepairSimulation}
            />
          </div>

          <MomentInspectorRuntimeLegendPanel />

          <MomentInspectorRuntimeScoreBar
            outcomeScore={intelligenceRuntime.outcomeScore}
            learningScore={intelligenceRuntime.learningScore}
            optimizationScore={intelligenceRuntime.optimizationScore}
            repairScore={intelligenceRuntime.repairScore}
          />

          <div className="grid gap-3 xl:grid-cols-2">
            <div
              className={`rounded-lg border px-3 py-2 ${getRuntimeTone(
                intelligenceRuntime.healthBand
              )}`}
            >
              <MomentInspectorFamilyRuntimeHeader runtime={intelligenceRuntime} />
              <MomentInspectorRuntimeMetricsGrid runtime={intelligenceRuntime} />
              <MomentInspectorRuntimeSummaryChips runtime={intelligenceRuntime} />
            </div>

            <MomentInspectorRuntimeNextActionsPanel runtime={intelligenceRuntime} />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="flex flex-wrap gap-1">
              <div
                className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
                  hasSelectedFamily
                )}`}
              >
                Family {hasSelectedFamily ? "selected" : "not selected"}
              </div>

              <div
                className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
                  hasActionData
                )}`}
              >
                Actions {hasActionData ? "ready" : "missing"}
              </div>

              <div
                className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
                  hasRepairData
                )}`}
              >
                Repair queue {hasRepairData ? "ready" : "missing"}
              </div>

              <div
                className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
                  hasDriftData
                )}`}
              >
                Drift {hasDriftData ? "ready" : "missing"}
              </div>

              <div
                className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
                  hasStabilityData
                )}`}
              >
                Stability {hasStabilityData ? "ready" : "missing"}
              </div>

              <div
                className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
                  hasTrustData
                )}`}
              >
                Trust {hasTrustData ? "ready" : "missing"}
              </div>

              <div
                className={`rounded border px-2 py-1 text-[10px] ${getStatusTone(
                  hasRepairSimulation
                )}`}
              >
                Simulation {hasRepairSimulation ? "ready" : "missing"}
              </div>
            </div>
          </div>

          <MomentInspectorFamilySelectorBar
            familyOptions={safeFamilyOptions}
            selectedPhraseFamilyId={selectedPhraseFamilyId}
            onChangeSelectedPhraseFamilyId={onChangeSelectedPhraseFamilyId}
          />

          <MomentInspectorSelectedFamilyStack
            selectedPhraseFamilyId={selectedPhraseFamilyId}
            selectedActionSummaryRow={selectedActionSummaryRow}
            selectedRepairQueueRow={selectedRepairQueueRow}
            selectedDriftFamily={selectedDriftFamily}
            selectedStabilityFamily={selectedStabilityFamily}
            selectedTrustStateResult={selectedTrustStateResult}
            selectedConfidenceHistoryResult={selectedConfidenceHistoryResult}
            selectedLineageResult={selectedLineageResult}
          />

          <MomentInspectorFamilySummaryColumns
            selectedRepairQueueRow={selectedRepairQueueRow}
            repairQueueRows={safeRepairQueueRows}
            actionSummaryRows={safeActionSummaryRows}
            driftFamilyRows={safeDriftFamilyRows}
            stabilityFamilyRows={safeStabilityFamilyRows}
            selectedConfidenceHistoryResult={selectedConfidenceHistoryResult}
            selectedLineageResult={selectedLineageResult}
          />

          <MomentInspectorFamilyDetailRow
            selectedActionSummaryRow={selectedActionSummaryRow}
            selectedActionRows={safeSelectedActionRows}
            selectedDriftFamily={selectedDriftFamily}
            selectedDriftMembers={safeSelectedDriftMembers}
            selectedStabilityFamily={selectedStabilityFamily}
          />

          <MomentInspectorRepairSimulationPanel result={repairSimulationResult} />
        </div>
      ) : (
        <div className="mt-2 rounded border border-sky-100 bg-sky-50 px-3 py-2 text-[10px] text-sky-700">
          The new drift, stability, action, repair, and trust panels are wired into this
          inspector host. They will appear automatically as soon as this track runtime or
          track payload exposes phrase-engine results.
        </div>
      )}
    </div>
  );
}