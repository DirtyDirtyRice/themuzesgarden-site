// app/tools/track-matcher/multi-track/wave-form/MultiTrackCandidateRankingEngineWorkspacePanel.tsx

import {
  InfoCard,
  StatusPill,
  panelClass,
} from "../components/MultiTrackShared";

import {
  getAverageRankingScore,
  getCandidateRankingReadinessLabel,
  getCandidateRankingTierLabel,
  getEliteRankingCount,
  getPromotionReadyCount,
  getTopRankedCandidate,
} from "./MultiTrackCandidateRankingEngineHelpers";

import { multiTrackCandidateRankingWorkspaceSeed } from "./MultiTrackCandidateRankingEngineSeed";

export function MultiTrackCandidateRankingEngineWorkspacePanel() {
  const workspace = multiTrackCandidateRankingWorkspaceSeed;

  const topCandidate = getTopRankedCandidate(workspace);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Candidate Ranking Engine
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {workspace.title}
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/70">
            {workspace.summary}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label="Ranking" />
          <StatusPill label="Promotion Routing" />
          <StatusPill label="Evidence Scoring" />
          <StatusPill label="Comparison Ready" />
        </div>

        <div className="rounded-2xl border border-white/20 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Top Ranked Candidate
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {topCandidate?.title ?? "No candidate"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {workspace.metrics.map((metric) => (
          <InfoCard
            key={metric.label}
            label={metric.label}
            value={String(metric.value)}
            detail={metric.detail}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoCard
          label="Promotion Ready"
          value={String(getPromotionReadyCount(workspace))}
          detail="Ready for comparison stage."
        />

        <InfoCard
          label="Elite"
          value={String(getEliteRankingCount(workspace))}
          detail="Elite ranked candidates."
        />

        <InfoCard
          label="Average Score"
          value={String(getAverageRankingScore(workspace))}
          detail="Average ranking score."
        />
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.rankings.map((candidate) => (
          <div
            key={candidate.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-wrap gap-2">
              <StatusPill label={`#${candidate.rank}`} />

              <StatusPill
                label={getCandidateRankingTierLabel(candidate.tier)}
              />

              <StatusPill
                label={getCandidateRankingReadinessLabel(
                  candidate.readiness
                )}
              />

              <StatusPill label={`${candidate.score}%`} />
            </div>

            <h3 className="mt-3 text-lg font-black text-white">
              {candidate.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/70">
              {candidate.detail}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <InfoCard
                label="Strongest Idea"
                value={candidate.strongestIdea}
                detail="Primary musical driver."
              />

              <InfoCard
                label="Evidence Sources"
                value={String(candidate.evidenceSources)}
                detail="Systems supporting this ranking."
              />

              <InfoCard
                label="Confidence"
                value={String(candidate.confidence)}
                detail="Overall confidence score."
              />

              <InfoCard
                label="Promotion"
                value={candidate.promotionReady ? "READY" : "HOLD"}
                detail="Promotion status."
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}