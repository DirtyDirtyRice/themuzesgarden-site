// app/tools/track-matcher/multi-track/wave-form/MultiTrackBuildDecisionEngineWorkspacePanel.tsx

import {
  InfoCard,
  StatusPill,
  panelClass,
} from "../components/MultiTrackShared";

import {
  getAverageBuildDecisionScore,
  getBuildDecisionOutcomeLabel,
  getBuildDecisionReadinessLabel,
  getPromotionCount,
  getReviewCount,
  getTopBuildDecision,
} from "./MultiTrackBuildDecisionEngineHelpers";

import { multiTrackBuildDecisionWorkspaceSeed } from "./MultiTrackBuildDecisionEngineSeed";

export function MultiTrackBuildDecisionEngineWorkspacePanel() {
  const workspace = multiTrackBuildDecisionWorkspaceSeed;

  const topDecision = getTopBuildDecision(workspace);

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          Build Decision Engine
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          {workspace.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/70">
          {workspace.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill label="Final Routing" />
          <StatusPill label="Promotion Logic" />
          <StatusPill label="Render Preparation" />
          <StatusPill label="Decision Layer" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/20 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Recommended Build
        </p>

        <p className="mt-2 text-xl font-black text-white">
          {topDecision?.title ?? "No recommendation"}
        </p>

        <p className="mt-2 text-sm text-white/70">
          {topDecision?.detail}
        </p>
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
          label="Promotions"
          value={String(getPromotionCount(workspace))}
          detail="Candidates approved."
        />

        <InfoCard
          label="Reviews"
          value={String(getReviewCount(workspace))}
          detail="Manual review queue."
        />

        <InfoCard
          label="Average Score"
          value={String(getAverageBuildDecisionScore(workspace))}
          detail="Average decision score."
        />
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.decisions.map((decision) => (
          <div
            key={decision.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={getBuildDecisionOutcomeLabel(
                  decision.outcome
                )}
              />

              <StatusPill
                label={getBuildDecisionReadinessLabel(
                  decision.readiness
                )}
              />

              <StatusPill label={`${decision.finalScore}%`} />
            </div>

            <h3 className="mt-3 text-lg font-black text-white">
              {decision.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/70">
              {decision.detail}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <InfoCard
                label="Strongest Idea"
                value={decision.strongestIdea}
                detail="Primary musical driver."
              />

              <InfoCard
                label="Keeper Support"
                value={String(decision.keeperSupport)}
                detail="Keeper evidence."
              />

              <InfoCard
                label="Survivor Support"
                value={String(decision.survivorSupport)}
                detail="Survivor evidence."
              />

              <InfoCard
                label="Confidence"
                value={String(decision.confidence)}
                detail="Decision confidence."
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}