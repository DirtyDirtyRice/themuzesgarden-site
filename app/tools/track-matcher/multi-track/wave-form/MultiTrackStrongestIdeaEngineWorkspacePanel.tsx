
import {
  createStrongestIdeaEngineReport,
  formatStrongestIdeaTimeRange,
  getStrongestIdeaCandidateDuration,
  getStrongestIdeaCandidateReviewLabel,
  getStrongestIdeaEvidenceLabel,
  getStrongestIdeaPromotionReason,
  getStrongestIdeaReadinessLabel,
  getStrongestIdeaScoreBandLabel,
  getStrongestIdeaSourceLabel,
  getStrongestIdeaVerdictLabel,
} from "./MultiTrackStrongestIdeaEngineHelpers";
import { strongestIdeaEngineSeedState } from "./MultiTrackStrongestIdeaEngineSeed";
import type {
  MultiTrackStrongestIdeaCandidate,
  MultiTrackStrongestIdeaEngineState,
  MultiTrackStrongestIdeaRankedCandidate,
  MultiTrackStrongestIdeaRisk,
  MultiTrackStrongestIdeaSignal,
} from "./MultiTrackStrongestIdeaEngineTypes";

interface MultiTrackStrongestIdeaEngineWorkspacePanelProps {
  state?: MultiTrackStrongestIdeaEngineState;
}

function StrongestIdeaMiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/70">{detail}</p>
    </div>
  );
}

function StrongestIdeaSignalRow({ signal }: { signal: MultiTrackStrongestIdeaSignal }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{signal.label}</p>
        <p className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/70">
          {signal.score}/100
        </p>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/65">{signal.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
        <span className="rounded-full border border-white/10 px-2 py-1">
          Weight {signal.weight}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-1">
          {getStrongestIdeaEvidenceLabel(signal.evidenceLevel)}
        </span>
      </div>
    </div>
  );
}

function StrongestIdeaRiskRow({ risk }: { risk: MultiTrackStrongestIdeaRisk }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{risk.label}</p>
        <p className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/70">
          Severity {risk.severity}
        </p>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/65">{risk.description}</p>
      <p className="mt-3 text-xs text-white/55">
        {risk.isBlocking ? "Blocking risk" : "Non-blocking review risk"}
      </p>
    </div>
  );
}

function StrongestIdeaCandidateCard({
  rankedCandidate,
  sources,
}: {
  rankedCandidate: MultiTrackStrongestIdeaRankedCandidate;
  sources: MultiTrackStrongestIdeaEngineState["sources"];
}) {
  const { candidate, score, rankLabel } = rankedCandidate;
  const sourceLabel = getStrongestIdeaSourceLabel(sources, candidate.sourceId);
  const duration = getStrongestIdeaCandidateDuration(candidate);
  const promotionReason = getStrongestIdeaPromotionReason(rankedCandidate);

  return (
    <article className="rounded-3xl border border-white/15 bg-black p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/55">{rankLabel}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{candidate.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">{candidate.summary}</p>
        </div>

        <div className="rounded-2xl border border-white/15 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Score</p>
          <p className="mt-1 text-2xl font-semibold text-white">{score.finalScore}</p>
          <p className="text-xs text-white/60">{getStrongestIdeaScoreBandLabel(score.scoreBand)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Source</p>
          <p className="mt-2 text-sm text-white">{sourceLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Range</p>
          <p className="mt-2 text-sm text-white">{formatStrongestIdeaTimeRange(candidate)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Duration</p>
          <p className="mt-2 text-sm text-white">{duration}s</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Verdict</p>
          <p className="mt-2 text-sm text-white">{getStrongestIdeaVerdictLabel(candidate.verdict)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white">Promotion reason</p>
        <p className="mt-2 text-sm leading-6 text-white/70">{promotionReason}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-white">Musical reason</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{candidate.musicalReason}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-white">Production reason</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{candidate.productionReason}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-white">Listener reason</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{candidate.listenerReason}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Signals</p>
          <div className="grid gap-3 md:grid-cols-2">
            {candidate.signals.map((signal) => (
              <StrongestIdeaSignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-white">Risks</p>
          <div className="grid gap-3">
            {candidate.risks.length > 0 ? (
              candidate.risks.map((risk) => <StrongestIdeaRiskRow key={risk.id} risk={risk} />)
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm text-white">No risks recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/65">
        <span className="rounded-full border border-white/15 px-3 py-1">
          {getStrongestIdeaReadinessLabel(candidate.readiness)}
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1">
          {getStrongestIdeaCandidateReviewLabel(candidate)}
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1">
          Weighted {score.weightedSignalScore}
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1">
          Risk -{score.riskPenalty}
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1">
          Manual {score.manualAdjustment >= 0 ? "+" : ""}
          {score.manualAdjustment}
        </span>
      </div>
    </article>
  );
}

function StrongestIdeaSelectedPanel({
  candidate,
}: {
  candidate: MultiTrackStrongestIdeaCandidate | null;
}) {
  if (!candidate) {
    return (
      <section className="rounded-3xl border border-white/15 bg-black p-5">
        <h3 className="text-lg font-semibold text-white">Selected strongest idea</h3>
        <p className="mt-2 text-sm leading-6 text-white/70">
          No selected candidate is available in this isolated engine state.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/15 bg-black p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-white/55">Selected Idea</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{candidate.title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/70">{candidate.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Section</p>
          <p className="mt-2 text-sm text-white">{candidate.sectionRole}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Time</p>
          <p className="mt-2 text-sm text-white">{formatStrongestIdeaTimeRange(candidate)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Review</p>
          <p className="mt-2 text-sm text-white">{getStrongestIdeaCandidateReviewLabel(candidate)}</p>
        </div>
      </div>
    </section>
  );
}

export function MultiTrackStrongestIdeaEngineWorkspacePanel({
  state = strongestIdeaEngineSeedState,
}: MultiTrackStrongestIdeaEngineWorkspacePanelProps) {
  const report = createStrongestIdeaEngineReport(state);
  const { summary, rankedCandidates, selectedCandidate } = report;

  return (
    <section className="rounded-3xl border border-white/15 bg-black p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/55">Waveform Engine</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{state.title}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="rounded-2xl border border-white/15 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Status</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {getStrongestIdeaReadinessLabel(state.readiness)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StrongestIdeaMiniStat
          label="Sources"
          value={summary.totalSources}
          detail="Version, keeper, survivor, lineage, or manual source entries."
        />
        <StrongestIdeaMiniStat
          label="Candidates"
          value={summary.totalCandidates}
          detail="Hook, riff, groove, section, or arrangement idea candidates."
        />
        <StrongestIdeaMiniStat
          label="Strongest"
          value={summary.strongestScore}
          detail={`${summary.strongestCandidateTitle} / ${getStrongestIdeaScoreBandLabel(
            summary.strongestBand,
          )}`}
        />
        <StrongestIdeaMiniStat
          label="Review"
          value={summary.needsReviewCount}
          detail="Candidates that need another listening or waveform proof pass."
        />
      </div>

      <div className="mt-6">
        <StrongestIdeaSelectedPanel candidate={selectedCandidate} />
      </div>

      <div className="mt-6 grid gap-4">
        {rankedCandidates.map((rankedCandidate) => (
          <StrongestIdeaCandidateCard
            key={rankedCandidate.candidate.id}
            rankedCandidate={rankedCandidate}
            sources={state.sources}
          />
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/15 bg-white/[0.03] p-5">
        <h3 className="text-lg font-semibold text-white">Engine notes</h3>
        <div className="mt-3 grid gap-2">
          {state.engineNotes.map((note) => (
            <p key={note} className="rounded-2xl border border-white/10 bg-black p-3 text-sm text-white/70">
              {note}
            </p>
          ))}
        </div>
        <p className="mt-4 rounded-2xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/65">
          {state.lockedReason}
        </p>
      </div>
    </section>
  );
}

export default MultiTrackStrongestIdeaEngineWorkspacePanel;