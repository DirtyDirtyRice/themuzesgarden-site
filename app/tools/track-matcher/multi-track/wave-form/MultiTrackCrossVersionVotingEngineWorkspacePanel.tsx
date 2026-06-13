
import {
  calculateMultiTrackCrossVersionVotingScore,
  getMultiTrackCrossVersionVotingKindLabel,
  getMultiTrackCrossVersionVotingReadinessLabel,
  getMultiTrackCrossVersionVotingRecommendedKind,
  getMultiTrackCrossVersionVotingRiskLabel,
  getMultiTrackCrossVersionVotingStrengthLabel,
  getMultiTrackCrossVersionVotingWorkspaceSummary,
  sortMultiTrackCrossVersionVotingCandidatesByScore,
} from "./MultiTrackCrossVersionVotingEngineHelpers";
import { multiTrackCrossVersionVotingWorkspaceState } from "./MultiTrackCrossVersionVotingEngineSeed";
import type { MultiTrackCrossVersionVotingCandidate } from "./MultiTrackCrossVersionVotingEngineTypes";

const panelClass =
  "rounded-3xl border border-white/15 bg-black p-5 text-white shadow-2xl shadow-black/40";

const cardClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white";

const innerCardClass = "rounded-2xl border border-white/10 bg-black p-4 text-white";

const pillClass =
  "rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80";

export function MultiTrackCrossVersionVotingEngineWorkspacePanel() {
  const state = multiTrackCrossVersionVotingWorkspaceState;
  const summary = getMultiTrackCrossVersionVotingWorkspaceSummary(state);
  const sortedCandidates = sortMultiTrackCrossVersionVotingCandidatesByScore(state.candidates);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            Multi Track Cross Version Voting Engine
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{state.title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">{state.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={pillClass}>
            {getMultiTrackCrossVersionVotingReadinessLabel(state.readiness)}
          </span>
          <span className={pillClass}>Preserved</span>
          <span className={pillClass}>No Wiring</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Candidates" value={String(summary.candidateCount)} />
        <SummaryCard label="Votes" value={String(summary.voteCount)} />
        <SummaryCard label="Ready" value={String(summary.readyCount)} />
        <SummaryCard label="Review" value={String(summary.reviewCount)} />
        <SummaryCard label="Winner" value={summary.winnerTitle} />
        <SummaryCard label="Score" value={String(summary.winnerScore)} />
      </div>

      <div className="mt-5 grid gap-4">
        {sortedCandidates.map((candidate) => (
          <CrossVersionVotingCandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-lg font-bold text-white">Next Actions</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {state.nextActions.map((action) => (
            <div key={action} className="rounded-xl border border-white/10 bg-black p-3 text-sm text-white/70">
              {action}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-lg font-bold text-white">Validation Lock</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <ValidationCard
            title="1. Syntax / TypeScript"
            body="All readiness, vote kind, source kind, strength, risk, vote, candidate, and workspace values are declared here."
          />
          <ValidationCard
            title="2. Imports / Exports"
            body="Seed imports only cross-version voting types. Panel imports only cross-version voting helpers, seed, and types."
          />
          <ValidationCard
            title="3. Integration"
            body="Seed feeds workspace state. Helpers score and sort voting candidates. Panel renders preserved voting data only."
          />
        </div>
      </div>
    </section>
  );
}

function CrossVersionVotingCandidateCard({
  candidate,
}: {
  candidate: MultiTrackCrossVersionVotingCandidate;
}) {
  const score = calculateMultiTrackCrossVersionVotingScore(candidate);
  const recommendedKind = getMultiTrackCrossVersionVotingRecommendedKind(candidate);

  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
            {candidate.sectionLabel} · bars {candidate.startBar}-{candidate.endBar}
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">{candidate.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Vote Target: {getMultiTrackCrossVersionVotingKindLabel(candidate.voteKind)}
          </p>
        </div>

        <div className="text-4xl font-black text-white">{score}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={pillClass}>
          {getMultiTrackCrossVersionVotingReadinessLabel(candidate.readiness)}
        </span>
        <span className={pillClass}>
          Recommended {getMultiTrackCrossVersionVotingKindLabel(recommendedKind)}
        </span>
        <span className={pillClass}>{candidate.votes.length} Votes</span>
      </div>

      <div className="mt-4 grid gap-3">
        {candidate.votes.map((vote) => (
          <div key={vote.id} className={innerCardClass}>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-white">{vote.versionLabel}</p>
                <p className="mt-1 text-sm leading-6 text-white/70">{vote.detail}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={pillClass}>{getMultiTrackCrossVersionVotingKindLabel(vote.voteKind)}</span>
                <span className={pillClass}>{getMultiTrackCrossVersionVotingStrengthLabel(vote.strength)}</span>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <MetricCard label="Confidence" value={vote.confidence} />
              <MetricCard label="Weight" value={vote.weight} />
              <MetricCard label="Source" value={vote.sourceKind} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.risks.map((risk) => (
          <span key={risk} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
            {getMultiTrackCrossVersionVotingRiskLabel(risk)}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {candidate.notes.map((note) => (
          <div key={note} className="rounded-xl border border-white/10 bg-black p-3 text-sm leading-6 text-white/70">
            {note}
          </div>
        ))}
      </div>
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function ValidationCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-white/70">{body}</p>
    </div>
  );
}