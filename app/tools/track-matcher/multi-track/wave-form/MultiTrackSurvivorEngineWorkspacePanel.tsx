"use client";

import {
  buildSurvivorEnginePlanningSentence,
  getMultiTrackSurvivorEngineWorkspace,
  getSurvivorEngineAverageFinalScore,
  getSurvivorEngineCandidateSummary,
  getSurvivorEngineCandidateTimeLabel,
  getSurvivorEngineComparisonSummary,
  getSurvivorEngineDecisionLabel,
  getSurvivorEngineEvidenceSummary,
  getSurvivorEngineFindingAction,
  getSurvivorEngineHeldCount,
  getSurvivorEnginePromotedCount,
  getSurvivorEngineReadinessLabel,
  getSurvivorEngineRejectedCount,
  getSurvivorEngineRiskCount,
  getSurvivorEngineRiskLabel,
  getSurvivorEngineScoreWidth,
  getSurvivorEngineStatusLabel,
} from "./MultiTrackSurvivorEngineHelpers";

export default function MultiTrackSurvivorEngineWorkspacePanel() {
  const workspace = getMultiTrackSurvivorEngineWorkspace();

  return (
    <section className="rounded-3xl border border-white/10 bg-black p-5 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
            Real Engine Work
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">{workspace.title}</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-white/70">
            {workspace.summary}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 xl:text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Readiness
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {getSurvivorEngineReadinessLabel(workspace.readiness)}
          </p>
          <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-white/70">
            {workspace.readinessLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Engine goal</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
            {workspace.engineGoal}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Engine boundary</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
            {workspace.engineBoundary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Promote
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getSurvivorEnginePromotedCount(workspace.candidates)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Hold
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getSurvivorEngineHeldCount(workspace.candidates)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Reject
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getSurvivorEngineRejectedCount(workspace.candidates)}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            Avg Score
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {getSurvivorEngineAverageFinalScore(workspace.candidates)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-black text-white">Survivor candidates</h3>
          <p className="rounded-full border border-white/10 bg-black px-3 py-1 text-xs font-black text-white/70">
            Risk flags {getSurvivorEngineRiskCount(workspace.candidates)}
          </p>
        </div>

        <div className="mt-3 grid gap-3">
          {workspace.candidates.map((candidate) => (
            <article
              key={candidate.candidateId}
              className="rounded-3xl border border-white/10 bg-black p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">
                    Rank {candidate.rank} / {candidate.role}
                  </p>
                  <h4 className="mt-2 text-xl font-black text-white">{candidate.title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                    {candidate.recommendation}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 lg:text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                    Decision
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    {getSurvivorEngineDecisionLabel(candidate.decision)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white/70">
                    {getSurvivorEngineCandidateTimeLabel(candidate)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-4">
                <ScoreBar label="Survival" value={candidate.scoreBreakdown.survivalScore} />
                <ScoreBar label="Mutation" value={candidate.scoreBreakdown.mutationScore} />
                <ScoreBar label="Riff Group" value={candidate.scoreBreakdown.riffGroupScore} />
                <ScoreBar label="Similarity" value={candidate.scoreBreakdown.similarityScore} />
                <ScoreBar label="Transient" value={candidate.scoreBreakdown.transientScore} />
                <ScoreBar label="Energy" value={candidate.scoreBreakdown.energyScore} />
                <ScoreBar label="Timing" value={candidate.scoreBreakdown.timingScore} />
                <ScoreBar label="Final" value={candidate.scoreBreakdown.finalScore} />
              </div>

              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getSurvivorEngineCandidateSummary(candidate)} / Risk{" "}
                {getSurvivorEngineRiskLabel(candidate.risk)} /{" "}
                {getSurvivorEngineStatusLabel(candidate.status)}
              </p>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <h5 className="text-base font-black text-white">Evidence</h5>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {candidate.evidence.map((evidence) => (
                    <div
                      key={evidence.evidenceId}
                      className="rounded-2xl border border-white/10 bg-black p-3"
                    >
                      <p className="font-black text-white">{evidence.title}</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                        {evidence.detail}
                      </p>
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                        {getSurvivorEngineEvidenceSummary(evidence)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {candidate.notes.map((note) => (
                  <p
                    key={note}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold leading-5 text-white/70"
                  >
                    {note}
                  </p>
                ))}
              </div>

              <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold leading-6 text-white/70">
                <span className="font-black text-white">Extraction hint:</span>{" "}
                {candidate.extractionHint}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-3 rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-6 text-white/70">
          {buildSurvivorEnginePlanningSentence(workspace)}
        </p>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Candidate comparisons</h3>
        <div className="mt-3 grid gap-2">
          {workspace.comparisons.map((comparison) => (
            <div
              key={comparison.comparisonId}
              className="rounded-2xl border border-white/10 bg-black p-3"
            >
              <p className="font-black text-white">{comparison.title}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                {comparison.detail}
              </p>
              <p className="mt-2 text-sm font-semibold leading-5 text-white/70">
                {comparison.decisionReason}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getSurvivorEngineComparisonSummary(comparison)} / Risk{" "}
                {getSurvivorEngineRiskLabel(comparison.risk)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Findings</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {workspace.findings.map((finding) => (
            <div
              key={finding.findingId}
              className="rounded-2xl border border-white/10 bg-black p-3"
            >
              <p className="font-black text-white">{finding.title}</p>
              <p className="mt-1 text-sm font-semibold leading-5 text-white/70">
                {finding.detail}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
                {getSurvivorEngineFindingAction(finding)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Engine rules</h3>
          <div className="mt-3 grid gap-2">
            {workspace.engineRules.map((rule) => (
              <p
                key={rule}
                className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-5 text-white/70"
              >
                {rule}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <h3 className="text-lg font-black text-white">Next steps</h3>
          <div className="mt-3 grid gap-2">
            {workspace.nextSteps.map((step) => (
              <p
                key={step}
                className="rounded-2xl border border-white/10 bg-black p-3 text-sm font-semibold leading-5 text-white/70"
              >
                {step}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
        {label}
      </p>
      <div className="mt-1 h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-white/50"
          style={{ width: getSurvivorEngineScoreWidth(value) }}
        />
      </div>
      <p className="mt-1 text-xs font-black text-white/70">{value}</p>
    </div>
  );
}
