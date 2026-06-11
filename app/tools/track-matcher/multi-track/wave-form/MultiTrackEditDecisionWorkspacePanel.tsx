import {
  buildMultiTrackEditDecisionReviewPacket,
  buildMultiTrackEditDecisionSummaries,
  formatMultiTrackEditDecisionRange,
  getMultiTrackEditDecisionChoiceLabel,
  getMultiTrackEditDecisionConfidenceLabel,
  getMultiTrackEditDecisionReadinessLabel,
  getMultiTrackEditDecisionTargetKindLabel,
  validateMultiTrackEditDecisionState,
} from "./MultiTrackEditDecisionHelpers";
import { multiTrackEditDecisionSeed } from "./MultiTrackEditDecisionSeed";
import type {
  MultiTrackEditDecisionLane,
  MultiTrackEditDecisionRisk,
  MultiTrackEditDecisionScore,
  MultiTrackEditDecisionSummary,
  MultiTrackEditDecisionWorkspaceState,
} from "./MultiTrackEditDecisionTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const labelClass = "text-xs uppercase tracking-[0.24em] text-white/70";
const bodyClass = "mt-2 text-sm leading-6 text-white/70";

type MultiTrackEditDecisionWorkspacePanelProps = {
  state?: MultiTrackEditDecisionWorkspaceState;
};

export function MultiTrackEditDecisionWorkspacePanel({
  state = multiTrackEditDecisionSeed,
}: MultiTrackEditDecisionWorkspacePanelProps) {
  const validation = validateMultiTrackEditDecisionState(state);
  const summaries = buildMultiTrackEditDecisionSummaries(state);
  const reviewPacket = buildMultiTrackEditDecisionReviewPacket(
    state,
    state.activeDecisionId,
  );

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className={labelClass}>Multi Track Edit Decision</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {state.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          <p className="font-semibold">
            {getMultiTrackEditDecisionReadinessLabel(state.readinessStatus)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {validation.isValid ? "No missing seed references" : "Review map"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DecisionMetricCard
          label="Decisions"
          value={state.decisions.length.toString()}
          detail="Keep, edit, duplicate, render, hold, or reject."
        />
        <DecisionMetricCard
          label="Candidates"
          value={state.candidates.length.toString()}
          detail="Musical ideas waiting for approval."
        />
        <DecisionMetricCard
          label="Ready"
          value={validation.readyCount.toString()}
          detail="Safe planning decisions."
        />
        <DecisionMetricCard
          label="Review"
          value={validation.reviewCount.toString()}
          detail="Needs user or analyzer confidence."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <DecisionSummaryPanel summaries={summaries} />
        <DecisionActivePanel
          title={reviewPacket.activeDecision?.label ?? "No active decision"}
          detail={reviewPacket.activeDecision?.detail ?? "Select later."}
          reason={reviewPacket.activeDecision?.reason ?? "No reason listed."}
          candidateTitle={reviewPacket.candidate?.title ?? "No candidate"}
          candidateRange={
            reviewPacket.candidate
              ? formatMultiTrackEditDecisionRange(
                  reviewPacket.candidate.timeRange.startSeconds,
                  reviewPacket.candidate.timeRange.endSeconds,
                )
              : "0:00 - 0:00"
          }
          confidenceLabel={
            reviewPacket.candidate
              ? getMultiTrackEditDecisionConfidenceLabel(
                  reviewPacket.candidate.confidenceBucket,
                )
              : "Unknown"
          }
          scores={reviewPacket.scores}
          risks={reviewPacket.risks}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <DecisionLanePanel lanes={state.lanes} />
        <DecisionGuardrailPanel
          notes={state.guardrailNotes}
          validationMessages={validation.messages}
          futureCount={validation.futureCount}
          blockedCount={validation.blockedCount}
        />
      </div>
    </section>
  );
}

function DecisionMetricCard({
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

function DecisionSummaryPanel({
  summaries,
}: {
  summaries: MultiTrackEditDecisionSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Decision List</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        What happens to each idea?
      </h3>

      <div className="mt-4 space-y-3">
        {summaries.map((summary) => (
          <div
            key={summary.decisionId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">
                {summary.candidateTitle}
              </p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackEditDecisionChoiceLabel(summary.choice)}
              </span>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
              <p>
                {getMultiTrackEditDecisionTargetKindLabel(summary.targetKind)}
              </p>
              <p>Score {summary.averageScore}</p>
              <p>
                {getMultiTrackEditDecisionReadinessLabel(
                  summary.readinessStatus,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function DecisionActivePanel({
  title,
  detail,
  reason,
  candidateTitle,
  candidateRange,
  confidenceLabel,
  scores,
  risks,
}: {
  title: string;
  detail: string;
  reason: string;
  candidateTitle: string;
  candidateRange: string;
  confidenceLabel: string;
  scores: MultiTrackEditDecisionScore[];
  risks: MultiTrackEditDecisionRisk[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Active Decision</p>
      <h3 className="mt-2 text-xl font-bold text-white">{title}</h3>
      <p className={bodyClass}>{detail}</p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">{candidateTitle}</p>
        <p className="mt-2 text-xs text-white/70">{candidateRange}</p>
        <p className="mt-2 text-xs text-white/70">
          Confidence: {confidenceLabel}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">Reason</p>
        <p className="mt-2 text-sm leading-6 text-white/70">{reason}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <DecisionMiniList
          title="Scores"
          items={scores.map((score) => `${score.label}: ${score.value}`)}
        />
        <DecisionMiniList
          title="Risks"
          items={risks.map((risk) => `${risk.label} · ${risk.severity}`)}
        />
      </div>
    </article>
  );
}

function DecisionMiniList({
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

function DecisionLanePanel({
  lanes,
}: {
  lanes: MultiTrackEditDecisionLane[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Decision Lanes</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Keep / edit / review paths
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
                {getMultiTrackEditDecisionReadinessLabel(lane.readinessStatus)}
              </span>
            </div>
            <p className={bodyClass}>{lane.detail}</p>
            <p className="mt-3 text-xs text-white/70">
              {lane.decisionIds.length} decision
              {lane.decisionIds.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function DecisionGuardrailPanel({
  notes,
  validationMessages,
  futureCount,
  blockedCount,
}: {
  notes: string[];
  validationMessages: string[];
  futureCount: number;
  blockedCount: number;
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Guardrails</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        No destructive edit wiring
      </h3>

      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <p key={note} className="text-sm leading-6 text-white/70">
            {note}
          </p>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <DecisionMetricCard
          label="Future"
          value={futureCount.toString()}
          detail="Waiting for engine wiring."
        />
        <DecisionMetricCard
          label="Blocked"
          value={blockedCount.toString()}
          detail="Stopped decisions."
        />
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