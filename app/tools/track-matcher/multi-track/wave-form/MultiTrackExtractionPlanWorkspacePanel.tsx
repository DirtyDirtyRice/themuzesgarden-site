import {
  buildMultiTrackExtractionPlanReviewPacket,
  buildMultiTrackExtractionPlanTargetSummaries,
  buildMultiTrackExtractionPlanVersionCoverage,
  formatMultiTrackExtractionPlanRange,
  getMultiTrackExtractionPlanConfidenceLabel,
  getMultiTrackExtractionPlanReadinessLabel,
  getMultiTrackExtractionPlanTargetKindLabel,
  validateMultiTrackExtractionPlanState,
} from "./MultiTrackExtractionPlanHelpers";
import { multiTrackExtractionPlanSeed } from "./MultiTrackExtractionPlanSeed";
import type {
  MultiTrackExtractionPlanEditInstruction,
  MultiTrackExtractionPlanLane,
  MultiTrackExtractionPlanMarker,
  MultiTrackExtractionPlanRenderInstruction,
  MultiTrackExtractionPlanRisk,
  MultiTrackExtractionPlanSourceClip,
  MultiTrackExtractionPlanStep,
  MultiTrackExtractionPlanTargetSummary,
  MultiTrackExtractionPlanVersionCoverage,
  MultiTrackExtractionPlanWorkspaceState,
} from "./MultiTrackExtractionPlanTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const labelClass = "text-xs uppercase tracking-[0.24em] text-white/70";
const bodyClass = "mt-2 text-sm leading-6 text-white/70";

type MultiTrackExtractionPlanWorkspacePanelProps = {
  state?: MultiTrackExtractionPlanWorkspaceState;
};

export function MultiTrackExtractionPlanWorkspacePanel({
  state = multiTrackExtractionPlanSeed,
}: MultiTrackExtractionPlanWorkspacePanelProps) {
  const validation = validateMultiTrackExtractionPlanState(state);
  const summaries = buildMultiTrackExtractionPlanTargetSummaries(state);
  const coverage = buildMultiTrackExtractionPlanVersionCoverage(state);
  const reviewPacket = buildMultiTrackExtractionPlanReviewPacket(
    state,
    state.activeTargetId,
  );

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className={labelClass}>Multi Track Extraction Plan</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {state.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          <p className="font-semibold">
            {getMultiTrackExtractionPlanReadinessLabel(state.readinessStatus)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {validation.isValid ? "No missing seed references" : "Review map"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ExtractionMetricCard
          label="Targets"
          value={state.targets.length.toString()}
          detail="Ideas prepared for future extraction."
        />
        <ExtractionMetricCard
          label="Markers"
          value={state.markers.length.toString()}
          detail="Color-coded windows for review."
        />
        <ExtractionMetricCard
          label="Ready"
          value={validation.readyCount.toString()}
          detail="Safe planning targets."
        />
        <ExtractionMetricCard
          label="Needs Review"
          value={validation.reviewCount.toString()}
          detail="Requires ears or analyzer confidence."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <ExtractionTargetPanel summaries={summaries} />
        <ExtractionActivePlanPanel
          activeTitle={reviewPacket.activeTarget?.title ?? "No active target"}
          activeSummary={
            reviewPacket.activeTarget?.summary ??
            "Select an extraction target after wiring."
          }
          clips={reviewPacket.sourceClips}
          markers={reviewPacket.markers}
          steps={reviewPacket.steps}
          editInstructions={reviewPacket.editInstructions}
          renderInstructions={reviewPacket.renderInstructions}
          risks={reviewPacket.risks}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ExtractionVersionCoveragePanel coverage={coverage} />
        <ExtractionLanePanel lanes={state.lanes} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ExtractionGuardrailPanel
          notes={state.guardrailNotes}
          validationMessages={validation.messages}
        />
        <ExtractionFuturePanel
          futureCount={validation.futureCount}
          blockedCount={validation.blockedCount}
          editInstructionCount={state.editInstructions.length}
          renderInstructionCount={state.renderInstructions.length}
        />
      </div>
    </section>
  );
}

function ExtractionMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className={bodyClass}>{detail}</p>
    </article>
  );
}

function ExtractionTargetPanel({
  summaries,
}: {
  summaries: MultiTrackExtractionPlanTargetSummary[];
}) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={labelClass}>Extraction Targets</p>
          <h3 className="mt-2 text-xl font-bold text-white">
            Color-code to render path
          </h3>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
          {summaries.length} targets
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {summaries.map((summary) => (
          <div
            key={summary.targetId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{summary.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackExtractionPlanTargetKindLabel(
                  summary.targetKind,
                )}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
              <p>{summary.clipCount} clips</p>
              <p>{summary.stepCount} steps</p>
              <p>
                {getMultiTrackExtractionPlanConfidenceLabel(
                  summary.confidenceBucket,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ExtractionActivePlanPanel({
  activeTitle,
  activeSummary,
  clips,
  markers,
  steps,
  editInstructions,
  renderInstructions,
  risks,
}: {
  activeTitle: string;
  activeSummary: string;
  clips: MultiTrackExtractionPlanSourceClip[];
  markers: MultiTrackExtractionPlanMarker[];
  steps: MultiTrackExtractionPlanStep[];
  editInstructions: MultiTrackExtractionPlanEditInstruction[];
  renderInstructions: MultiTrackExtractionPlanRenderInstruction[];
  risks: MultiTrackExtractionPlanRisk[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Active Extraction Plan</p>
      <h3 className="mt-2 text-xl font-bold text-white">{activeTitle}</h3>
      <p className={bodyClass}>{activeSummary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ExtractionMiniList
          title="Source Clips"
          items={clips.map(
            (clip) =>
              `${clip.title}: ${formatMultiTrackExtractionPlanRange(
                clip.timeRange.startSeconds,
                clip.timeRange.endSeconds,
              )}`,
          )}
        />
        <ExtractionMiniList
          title="Markers"
          items={markers.map((marker) => `${marker.label} · ${marker.color}`)}
        />
        <ExtractionMiniList
          title="Steps"
          items={steps.map(
            (step) =>
              `${step.stepNumber}. ${step.label} · ${getMultiTrackExtractionPlanReadinessLabel(
                step.readinessStatus,
              )}`,
          )}
        />
        <ExtractionMiniList
          title="Risks"
          items={risks.map((risk) => `${risk.label} · ${risk.severity}`)}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ExtractionMiniList
          title="Edit Instructions"
          items={editInstructions.map(
            (instruction) =>
              `${instruction.label}: duplicate ${instruction.duplicateCount} into ${instruction.targetLaneLabel}`,
          )}
        />
        <ExtractionMiniList
          title="Render Instructions"
          items={renderInstructions.map(
            (instruction) =>
              `${instruction.label}: ${instruction.outputKind} · ${
                instruction.normalizeOutput ? "normalize" : "no normalize"
              }`,
          )}
        />
      </div>
    </article>
  );
}

function ExtractionMiniList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-xs leading-5 text-white/70">
              {item}
            </p>
          ))
        ) : (
          <p className="text-xs text-white/70">Nothing listed yet.</p>
        )}
      </div>
    </div>
  );
}

function ExtractionVersionCoveragePanel({
  coverage,
}: {
  coverage: MultiTrackExtractionPlanVersionCoverage[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>10 Version Coverage</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Where extractable ideas exist
      </h3>

      <div className="mt-4 space-y-2">
        {coverage.map((item) => (
          <div
            key={item.versionId}
            className="grid gap-2 rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs text-white/70 md:grid-cols-[auto_1fr_auto]"
          >
            <p className="font-semibold text-white">{item.versionId}</p>
            <p>{item.strongestTargetTitle}</p>
            <p>
              {item.clipCount} clip{item.clipCount === 1 ? "" : "s"} /{" "}
              {item.markerCount} marker{item.markerCount === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function ExtractionLanePanel({
  lanes,
}: {
  lanes: MultiTrackExtractionPlanLane[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Extraction Lanes</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Future edit destination map
      </h3>

      <div className="mt-4 space-y-3">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{lane.label}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackExtractionPlanReadinessLabel(
                  lane.readinessStatus,
                )}
              </span>
            </div>
            <p className={bodyClass}>{lane.detail}</p>
            <p className="mt-3 text-xs text-white/70">
              {lane.targetIds.length} target
              {lane.targetIds.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function ExtractionGuardrailPanel({
  notes,
  validationMessages,
}: {
  notes: string[];
  validationMessages: string[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Guardrails</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Safe extraction foundation
      </h3>

      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <p key={note} className="text-sm leading-6 text-white/70">
            {note}
          </p>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">Validation</p>
        <div className="mt-3 space-y-2">
          {validationMessages.length === 0 ? (
            <p className="text-sm text-white/70">No missing seed references.</p>
          ) : (
            validationMessages.map((message) => (
              <p key={message} className="text-sm text-white/70">
                {message}
              </p>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

function ExtractionFuturePanel({
  futureCount,
  blockedCount,
  editInstructionCount,
  renderInstructionCount,
}: {
  futureCount: number;
  blockedCount: number;
  editInstructionCount: number;
  renderInstructionCount: number;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Future Engine Bridge</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Ready for later wiring
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ExtractionMetricCard
          label="Future Targets"
          value={futureCount.toString()}
          detail="Waiting for real DSP/render work."
        />
        <ExtractionMetricCard
          label="Blocked"
          value={blockedCount.toString()}
          detail="Stopped before unsafe work."
        />
        <ExtractionMetricCard
          label="Edit Plans"
          value={editInstructionCount.toString()}
          detail="Trim and duplicate instructions."
        />
        <ExtractionMetricCard
          label="Render Plans"
          value={renderInstructionCount.toString()}
          detail="WAV/stem output placeholders."
        />
      </div>
    </article>
  );
}