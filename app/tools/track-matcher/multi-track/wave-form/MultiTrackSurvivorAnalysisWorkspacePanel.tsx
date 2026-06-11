import {
  buildMultiTrackSurvivorAnalysisCandidateSummaries,
  buildMultiTrackSurvivorAnalysisGroupSummaries,
  buildMultiTrackSurvivorAnalysisReviewPacket,
  formatMultiTrackSurvivorAnalysisRange,
  getMultiTrackSurvivorAnalysisConfidenceLabel,
  getMultiTrackSurvivorAnalysisKindLabel,
  getMultiTrackSurvivorAnalysisOutcomeLabel,
  getMultiTrackSurvivorAnalysisReadinessLabel,
  getMultiTrackSurvivorAnalysisTotalScore,
  validateMultiTrackSurvivorAnalysisState,
} from "./MultiTrackSurvivorAnalysisHelpers";
import { multiTrackSurvivorAnalysisSeed } from "./MultiTrackSurvivorAnalysisSeed";
import type {
  MultiTrackSurvivorAnalysisCandidate,
  MultiTrackSurvivorAnalysisCandidateSummary,
  MultiTrackSurvivorAnalysisGroupSummary,
  MultiTrackSurvivorAnalysisLane,
  MultiTrackSurvivorAnalysisReason,
  MultiTrackSurvivorAnalysisRisk,
  MultiTrackSurvivorAnalysisWorkspaceState,
} from "./MultiTrackSurvivorAnalysisTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const labelClass = "text-xs uppercase tracking-[0.24em] text-white/70";
const bodyClass = "mt-2 text-sm leading-6 text-white/70";

type MultiTrackSurvivorAnalysisWorkspacePanelProps = {
  state?: MultiTrackSurvivorAnalysisWorkspaceState;
};

export function MultiTrackSurvivorAnalysisWorkspacePanel({
  state = multiTrackSurvivorAnalysisSeed,
}: MultiTrackSurvivorAnalysisWorkspacePanelProps) {
  const validation = validateMultiTrackSurvivorAnalysisState(state);
  const candidateSummaries =
    buildMultiTrackSurvivorAnalysisCandidateSummaries(state);
  const groupSummaries = buildMultiTrackSurvivorAnalysisGroupSummaries(state);
  const reviewPacket = buildMultiTrackSurvivorAnalysisReviewPacket(
    state,
    state.activeGroupId,
    state.activeCandidateId,
  );

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className={labelClass}>Multi Track Survivor Analysis</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {state.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          <p className="font-semibold">
            {getMultiTrackSurvivorAnalysisReadinessLabel(
              state.readinessStatus,
            )}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {validation.isValid ? "No missing seed references" : "Review map"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SurvivorMetricCard
          label="Candidates"
          value={state.candidates.length.toString()}
          detail="Possible surviving ideas."
        />
        <SurvivorMetricCard
          label="Groups"
          value={state.groups.length.toString()}
          detail="Survivor comparison sets."
        />
        <SurvivorMetricCard
          label="Winners"
          value={validation.winnerCount.toString()}
          detail="Best seed survivor picks."
        />
        <SurvivorMetricCard
          label="Review"
          value={validation.reviewCount.toString()}
          detail="Needs user or analyzer confidence."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <SurvivorGroupPanel groups={groupSummaries} />
        <SurvivorActivePanel
          activeCandidate={reviewPacket.activeCandidate}
          groupCandidates={reviewPacket.groupCandidates}
          reasons={reviewPacket.reasons}
          risks={reviewPacket.risks}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <SurvivorCandidatePanel candidates={candidateSummaries} />
        <SurvivorLanePanel lanes={state.lanes} />
      </div>

      <div className="mt-6">
        <SurvivorGuardrailPanel
          notes={state.guardrailNotes}
          validationMessages={validation.messages}
          futureCount={validation.futureCount}
          blockedCount={validation.blockedCount}
        />
      </div>
    </section>
  );
}

function SurvivorMetricCard({
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

function SurvivorGroupPanel({
  groups,
}: {
  groups: MultiTrackSurvivorAnalysisGroupSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Survivor Groups</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Winner comparison sets
      </h3>

      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <div
            key={group.groupId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{group.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {group.candidateCount} candidates
              </span>
            </div>
            <p className="mt-2 text-xs text-white/70">
              Winner: {group.winnerTitle}
            </p>
            <p className="mt-2 text-xs text-white/70">
              Runner up: {group.runnerUpTitle}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SurvivorActivePanel({
  activeCandidate,
  groupCandidates,
  reasons,
  risks,
}: {
  activeCandidate: MultiTrackSurvivorAnalysisCandidate | null;
  groupCandidates: MultiTrackSurvivorAnalysisCandidate[];
  reasons: MultiTrackSurvivorAnalysisReason[];
  risks: MultiTrackSurvivorAnalysisRisk[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Active Survivor</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        {activeCandidate?.title ?? "No active survivor"}
      </h3>
      <p className={bodyClass}>
        {activeCandidate?.summary ?? "Select a survivor after wiring."}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <SurvivorMetricCard
          label="Identity"
          value={(activeCandidate?.identityScore ?? 0).toString()}
          detail="Same idea strength."
        />
        <SurvivorMetricCard
          label="Edit"
          value={(activeCandidate?.editScore ?? 0).toString()}
          detail="Clip usefulness."
        />
        <SurvivorMetricCard
          label="Render"
          value={(activeCandidate?.renderScore ?? 0).toString()}
          detail="Output readiness."
        />
        <SurvivorMetricCard
          label="Total"
          value={
            activeCandidate
              ? getMultiTrackSurvivorAnalysisTotalScore(
                  activeCandidate,
                ).toString()
              : "0"
          }
          detail="Average score."
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-white">Window</p>
        <p className="mt-2 text-xs text-white/70">
          {activeCandidate
            ? formatMultiTrackSurvivorAnalysisRange(
                activeCandidate.timeRange.startSeconds,
                activeCandidate.timeRange.endSeconds,
              )
            : "0:00 - 0:00"}
        </p>
        <p className="mt-2 text-xs text-white/70">
          Outcome:{" "}
          {activeCandidate
            ? getMultiTrackSurvivorAnalysisOutcomeLabel(
                activeCandidate.outcome,
              )
            : "None"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SurvivorMiniList
          title="Group Candidates"
          items={groupCandidates.map(
            (candidate) =>
              `${candidate.versionId}: ${candidate.title} · ${getMultiTrackSurvivorAnalysisOutcomeLabel(
                candidate.outcome,
              )}`,
          )}
        />
        <SurvivorMiniList
          title="Reasons"
          items={reasons.map((reason) => `${reason.label}: ${reason.weight}`)}
        />
        <SurvivorMiniList
          title="Risks"
          items={risks.map((risk) => `${risk.label} · ${risk.severity}`)}
        />
        <SurvivorMiniList
          title="Confidence"
          items={
            activeCandidate
              ? [
                  getMultiTrackSurvivorAnalysisConfidenceLabel(
                    activeCandidate.confidenceBucket,
                  ),
                ]
              : []
          }
        />
      </div>
    </article>
  );
}

function SurvivorMiniList({
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

function SurvivorCandidatePanel({
  candidates,
}: {
  candidates: MultiTrackSurvivorAnalysisCandidateSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Candidate Scores</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Winner / runner-up / review
      </h3>

      <div className="mt-4 space-y-3">
        {candidates.map((candidate) => (
          <div
            key={candidate.candidateId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{candidate.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {candidate.totalScore}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
              <p>{getMultiTrackSurvivorAnalysisKindLabel(candidate.candidateKind)}</p>
              <p>{getMultiTrackSurvivorAnalysisOutcomeLabel(candidate.outcome)}</p>
              <p>
                {getMultiTrackSurvivorAnalysisConfidenceLabel(
                  candidate.confidenceBucket,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function SurvivorLanePanel({
  lanes,
}: {
  lanes: MultiTrackSurvivorAnalysisLane[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Survivor Lanes</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Winners, runners, support, review
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
                {getMultiTrackSurvivorAnalysisReadinessLabel(
                  lane.readinessStatus,
                )}
              </span>
            </div>
            <p className={bodyClass}>{lane.detail}</p>
            <p className="mt-3 text-xs text-white/70">
              {lane.candidateIds.length} candidate
              {lane.candidateIds.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SurvivorGuardrailPanel({
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
        Survivor map only, no render claims
      </h3>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          {notes.map((note) => (
            <p key={note} className="text-sm leading-6 text-white/70">
              {note}
            </p>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SurvivorMetricCard
            label="Future"
            value={futureCount.toString()}
            detail="Waiting for analyzer wiring."
          />
          <SurvivorMetricCard
            label="Blocked"
            value={blockedCount.toString()}
            detail="Stopped survivor claims."
          />
        </div>
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