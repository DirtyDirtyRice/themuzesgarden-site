import {
  buildMultiTrackVariationEngineCandidateSummaries,
  buildMultiTrackVariationEngineClusterSummaries,
  buildMultiTrackVariationEngineReviewPacket,
  buildMultiTrackVariationEngineVersionRankings,
  formatMultiTrackVariationEngineRange,
  getMultiTrackVariationEngineConfidenceLabel,
  getMultiTrackVariationEngineKindLabel,
  getMultiTrackVariationEngineReadinessLabel,
  validateMultiTrackVariationEngineState,
} from "./MultiTrackVariationEngineHelpers";
import { multiTrackVariationEngineSeed } from "./MultiTrackVariationEngineSeed";
import type {
  MultiTrackVariationEngineCandidateSummary,
  MultiTrackVariationEngineClusterSummary,
  MultiTrackVariationEngineComparison,
  MultiTrackVariationEngineDecision,
  MultiTrackVariationEngineEditPlan,
  MultiTrackVariationEngineLane,
  MultiTrackVariationEngineRenderPlan,
  MultiTrackVariationEngineRisk,
  MultiTrackVariationEngineScore,
  MultiTrackVariationEngineVersionRanking,
  MultiTrackVariationEngineWorkspaceState,
} from "./MultiTrackVariationEngineTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl";
const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
const labelClass = "text-xs uppercase tracking-[0.24em] text-white/70";
const bodyClass = "mt-2 text-sm leading-6 text-white/70";

type MultiTrackVariationEngineWorkspacePanelProps = {
  state?: MultiTrackVariationEngineWorkspaceState;
};

export function MultiTrackVariationEngineWorkspacePanel({
  state = multiTrackVariationEngineSeed,
}: MultiTrackVariationEngineWorkspacePanelProps) {
  const validation = validateMultiTrackVariationEngineState(state);
  const candidateSummaries =
    buildMultiTrackVariationEngineCandidateSummaries(state);
  const clusterSummaries = buildMultiTrackVariationEngineClusterSummaries(state);
  const versionRankings = buildMultiTrackVariationEngineVersionRankings(state);
  const reviewPacket = buildMultiTrackVariationEngineReviewPacket(
    state,
    state.activeClusterId,
    state.activeCandidateId,
  );

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className={labelClass}>Multi Track Variation Engine</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
            {state.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">
            {state.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white">
          <p className="font-semibold">
            {getMultiTrackVariationEngineReadinessLabel(state.readinessStatus)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {validation.isValid ? "No missing seed references" : "Review map"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VariationMetricCard
          label="Candidates"
          value={state.candidates.length.toString()}
          detail="Hook, riff, bass, vocal, and groove options."
        />
        <VariationMetricCard
          label="Clusters"
          value={state.clusters.length.toString()}
          detail="Groups of related musical variations."
        />
        <VariationMetricCard
          label="Ready"
          value={validation.readyCount.toString()}
          detail="Safe to promote as seed choices."
        />
        <VariationMetricCard
          label="Needs Review"
          value={validation.reviewCount.toString()}
          detail="Needs ears, analysis, or future DSP."
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <VariationClusterPanel clusters={clusterSummaries} />
        <VariationActiveReviewPanel
          activeTitle={reviewPacket.activeCandidate?.title ?? "No active candidate"}
          activeDetail={
            reviewPacket.activeCandidate?.summary ??
            "Select a candidate after wiring."
          }
          activeRange={
            reviewPacket.activeCandidate
              ? formatMultiTrackVariationEngineRange(
                  reviewPacket.activeCandidate.timeRange.startSeconds,
                  reviewPacket.activeCandidate.timeRange.endSeconds,
                )
              : "0:00 - 0:00"
          }
          scores={reviewPacket.scores}
          risks={reviewPacket.risks}
          decisions={reviewPacket.decisions}
          editPlans={reviewPacket.editPlans}
          renderPlans={reviewPacket.renderPlans}
          comparisons={reviewPacket.comparisons}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <VariationCandidatePanel candidates={candidateSummaries} />
        <VariationVersionRankingPanel rankings={versionRankings} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <VariationLanePanel lanes={state.lanes} />
        <VariationGuardrailPanel
          notes={state.guardrailNotes}
          validationMessages={validation.messages}
          futureCount={validation.futureCount}
          blockedCount={validation.blockedCount}
        />
      </div>
    </section>
  );
}

function VariationMetricCard({
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

function VariationClusterPanel({
  clusters,
}: {
  clusters: MultiTrackVariationEngineClusterSummary[];
}) {
  return (
    <article className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={labelClass}>Variation Clusters</p>
          <h3 className="mt-2 text-xl font-bold text-white">
            Same idea families
          </h3>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
          {clusters.length} clusters
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {clusters.map((cluster) => (
          <div
            key={cluster.clusterId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{cluster.title}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {getMultiTrackVariationEngineKindLabel(cluster.variationKind)}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/70">
              Winner: {cluster.winningCandidateTitle}
            </p>
            <p className="mt-2 text-xs text-white/70">
              {cluster.candidateCount} candidate
              {cluster.candidateCount === 1 ? "" : "s"} ·{" "}
              {getMultiTrackVariationEngineReadinessLabel(
                cluster.readinessStatus,
              )}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function VariationActiveReviewPanel({
  activeTitle,
  activeDetail,
  activeRange,
  scores,
  risks,
  decisions,
  editPlans,
  renderPlans,
  comparisons,
}: {
  activeTitle: string;
  activeDetail: string;
  activeRange: string;
  scores: MultiTrackVariationEngineScore[];
  risks: MultiTrackVariationEngineRisk[];
  decisions: MultiTrackVariationEngineDecision[];
  editPlans: MultiTrackVariationEngineEditPlan[];
  renderPlans: MultiTrackVariationEngineRenderPlan[];
  comparisons: MultiTrackVariationEngineComparison[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Active Candidate</p>
      <h3 className="mt-2 text-xl font-bold text-white">{activeTitle}</h3>
      <p className={bodyClass}>{activeDetail}</p>
      <p className="mt-3 rounded-full border border-white/15 px-3 py-2 text-xs text-white/70">
        Edit window: {activeRange}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <VariationMiniList
          title="Scores"
          items={scores.map((score) => `${score.label}: ${score.value}`)}
        />
        <VariationMiniList
          title="Decisions"
          items={decisions.map(
            (decision) =>
              `${decision.label} · ${getMultiTrackVariationEngineReadinessLabel(
                decision.readinessStatus,
              )}`,
          )}
        />
        <VariationMiniList
          title="Risks"
          items={risks.map((risk) => `${risk.label} · ${risk.severity}`)}
        />
        <VariationMiniList
          title="Comparisons"
          items={comparisons.map(
            (comparison) =>
              `${comparison.leftCandidateId} / ${comparison.rightCandidateId}: ${comparison.similarityPercent}%`,
          )}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <VariationPlanList
          title="Edit Plans"
          items={editPlans.map(
            (plan) =>
              `${plan.label}: duplicate ${plan.duplicateCount} into ${plan.targetLaneLabel}`,
          )}
        />
        <VariationPlanList
          title="Render Plans"
          items={renderPlans.map(
            (plan) =>
              `${plan.label}: ${plan.outputFormat.toUpperCase()} · ${
                plan.normalizeOutput ? "normalize" : "no normalize"
              }`,
          )}
        />
      </div>
    </article>
  );
}

function VariationMiniList({
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

function VariationPlanList({
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
          <p className="text-xs text-white/70">Future plan not listed yet.</p>
        )}
      </div>
    </div>
  );
}

function VariationCandidatePanel({
  candidates,
}: {
  candidates: MultiTrackVariationEngineCandidateSummary[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Candidate Ranking</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Best takes before editing
      </h3>

      <div className="mt-4 space-y-2">
        {candidates.map((candidate) => (
          <div
            key={candidate.candidateId}
            className="grid gap-2 rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs text-white/70 md:grid-cols-[1fr_auto_auto]"
          >
            <div>
              <p className="font-semibold text-white">{candidate.title}</p>
              <p className="mt-1">
                {candidate.versionId} ·{" "}
                {getMultiTrackVariationEngineKindLabel(
                  candidate.variationKind,
                )}
              </p>
            </div>
            <p className="font-semibold text-white">
              {candidate.averageScore}
            </p>
            <p>
              {getMultiTrackVariationEngineConfidenceLabel(
                candidate.confidenceBucket,
              )}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function VariationVersionRankingPanel({
  rankings,
}: {
  rankings: MultiTrackVariationEngineVersionRanking[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>10 Version Ranking</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Which Suno version has the best material?
      </h3>

      <div className="mt-4 space-y-2">
        {rankings.map((ranking) => (
          <div
            key={ranking.versionId}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{ranking.sourceTitle}</p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {ranking.averageScore}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/70">
              {ranking.strongestCandidateTitle} · {ranking.candidateCount}{" "}
              candidate{ranking.candidateCount === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function VariationLanePanel({
  lanes,
}: {
  lanes: MultiTrackVariationEngineLane[];
}) {
  return (
    <article className={cardClass}>
      <p className={labelClass}>Edit Lanes</p>
      <h3 className="mt-2 text-xl font-bold text-white">
        Where winners go later
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
                {getMultiTrackVariationEngineReadinessLabel(
                  lane.readinessStatus,
                )}
              </span>
            </div>
            <p className={bodyClass}>{lane.detail}</p>
            <p className="mt-3 text-xs text-white/70">
              {lane.candidateIds.length} linked candidate
              {lane.candidateIds.length === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function VariationGuardrailPanel({
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
        No phantom engine wiring
      </h3>

      <div className="mt-4 space-y-2">
        {notes.map((note) => (
          <p key={note} className="text-sm leading-6 text-white/70">
            {note}
          </p>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <VariationMetricCard
          label="Future"
          value={futureCount.toString()}
          detail="Waiting for real engine work."
        />
        <VariationMetricCard
          label="Blocked"
          value={blockedCount.toString()}
          detail="Stopped before unsafe work."
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